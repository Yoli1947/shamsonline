// Supabase Edge Function: nave-webhook
// Recibe notificaciones de pago de Nave y actualiza el estado del pedido
//
// DEPLOY:
//   supabase functions deploy nave-webhook --no-verify-jwt
//
// URL a informar a Nave como notification_url:
//   https://REEMPLAZAR.supabase.co/functions/v1/nave-webhook

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Nave espera siempre 200 — si no recibe 200 reintenta hasta 5 veces
  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  if (req.method === 'GET') return ok();
  if (req.method !== 'POST') return ok();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno faltantes');
      return ok();
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return ok();
    }

    console.log('Nave Webhook recibido:', JSON.stringify(body));

    // Nave envía: { status: "APPROVED"|"REJECTED", order_id, amount, payment_method, happened_at }
    const naveStatus = body.status as string;
    const orderId = body.order_id; // Este es el order_number que enviamos al crear el pago

    if (!naveStatus || !orderId) {
      console.error('Webhook sin status u order_id');
      return ok();
    }

    // Mapear estado Nave → estado interno
    let paymentStatus: string;
    let orderStatus: string;
    let paidAt: string | null = null;

    switch (naveStatus.toUpperCase()) {
      case 'APPROVED':
        paymentStatus = 'paid';
        orderStatus = 'processing';
        paidAt = new Date().toISOString();
        break;
      case 'REJECTED':
        paymentStatus = 'failed';
        orderStatus = 'pending';
        break;
      default:
        paymentStatus = 'pending';
        orderStatus = 'pending';
    }

    // Actualizar pedido en Supabase por order_number
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        paid_at: paidAt,
      })
      .eq('order_number', Number(orderId));

    if (error) {
      console.error('Error actualizando pedido:', error);
    } else {
      console.log(`Pedido ${orderId} actualizado: payment_status=${paymentStatus}`);
    }

    return ok();
  } catch (err) {
    console.error('nave-webhook error:', err);
    return ok(); // 200 siempre para evitar reintentos innecesarios
  }
});
