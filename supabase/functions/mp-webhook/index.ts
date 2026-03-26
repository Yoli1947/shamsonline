// Supabase Edge Function: mp-webhook
// Recibe notificaciones de pago de Mercado Pago y actualiza el estado del pedido
//
// DEPLOY:
//   supabase functions deploy mp-webhook --no-verify-jwt
//   (sin verificación JWT porque MP llama desde sus servidores sin credentials)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // MP espera 200 rápido — siempre responder 200
  const ok = () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  // MP también hace GET para validar el endpoint
  if (req.method === 'GET') return ok();
  if (req.method !== 'POST') return ok();

  try {
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // Supabase inyecta SUPABASE_SERVICE_ROLE_KEY automáticamente en Edge Functions
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY')!;

    if (!mpAccessToken || !supabaseUrl || !supabaseServiceKey) {
      console.error('Variables de entorno faltantes');
      return ok(); // 200 para que MP no reintente
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return ok();
    }

    console.log('MP Webhook recibido:', JSON.stringify(body));

    // Solo procesar eventos de pago
    if (body.type !== 'payment' || !body.data) return ok();

    const paymentId = (body.data as Record<string, unknown>).id;
    if (!paymentId) return ok();

    // Obtener detalles del pago desde MP
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${mpAccessToken}` },
    });

    if (!paymentRes.ok) {
      console.error('Error obteniendo pago MP:', paymentRes.status);
      return ok();
    }

    const payment = await paymentRes.json();
    const orderNumber: string = payment.external_reference;
    const mpStatus: string = payment.status; // 'approved' | 'pending' | 'rejected' | 'cancelled' | 'refunded'

    if (!orderNumber) {
      console.error('Sin external_reference en el pago');
      return ok();
    }

    // Mapear estado MP → estado interno
    let paymentStatus: string;
    let orderStatus: string;
    let paidAt: string | null = null;

    switch (mpStatus) {
      case 'approved':
        paymentStatus = 'paid';
        orderStatus = 'processing';
        paidAt = new Date().toISOString();
        break;
      case 'rejected':
      case 'cancelled':
        paymentStatus = 'failed';
        orderStatus = 'pending';
        break;
      case 'refunded':
        paymentStatus = 'refunded';
        orderStatus = 'refunded';
        break;
      default:
        // in_process, authorized, etc.
        paymentStatus = 'pending';
        orderStatus = 'pending';
    }

    // Actualizar pedido en Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        payment_id: String(paymentId),
        status: orderStatus,
        paid_at: paidAt,
      })
      .eq('order_number', orderNumber);

    if (error) {
      console.error('Error actualizando pedido:', error);
    } else {
      console.log(`Pedido ${orderNumber} actualizado: payment_status=${paymentStatus}, status=${orderStatus}`);
    }

    return ok();
  } catch (err) {
    console.error('mp-webhook error:', err);
    return ok(); // 200 siempre para evitar reintentos de MP
  }
});
