// Supabase Edge Function: mp-webhook
// Recibe notificaciones de pago de Mercado Pago y actualiza el estado del pedido
//
// DEPLOY:
//   supabase functions deploy mp-webhook --no-verify-jwt
//   (sin verificación JWT porque MP llama desde sus servidores sin credentials)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Emite en EchoGiftCard las gift cards compradas en este pedido (order_items con
// type/product_type = 'gift_card'), y registra el resultado en gift_card_purchases.
// Idempotente: el idempotency_key evita emitir dos veces si MP reintenta el webhook.
async function issueGiftCards(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  // deno-lint-ignore no-explicit-any
  order: any,
) {
  const echoApiUrl = Deno.env.get('ECHO_API_URL');
  const echoApiKey = Deno.env.get('ECHO_API_KEY');
  if (!echoApiUrl || !echoApiKey) {
    console.warn('ECHO_API_URL/ECHO_API_KEY no configurados: se omite emisión de gift cards');
    return;
  }

  // deno-lint-ignore no-explicit-any
  const items = (order.items || []) as any[];
  const giftCardItems = items.filter((item) => item.type === 'gift_card' || item.product_type === 'gift_card');
  if (giftCardItems.length === 0) return;

  // MP puede reintentar el webhook para el mismo pago: si ya procesamos esta orden, no repetir.
  const { data: existing } = await supabase
    .from('gift_card_purchases')
    .select('id')
    .eq('order_id', order.id)
    .limit(1);
  if (existing && existing.length > 0) {
    console.log(`Gift card(s) de orden ${order.order_number} ya procesadas, se omite (reintento de webhook).`);
    return;
  }

  for (const item of giftCardItems) {
    const gcAmount = Number(item.unit_price ?? item.price ?? item.subtotal);
    if (!gcAmount || gcAmount < 100000) {
      console.warn(`Item de gift card con monto inválido en orden ${order.order_number}:`, gcAmount);
      continue;
    }

    try {
      const echoRes = await fetch(`${echoApiUrl}/api/external/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': echoApiKey,
        },
        body: JSON.stringify({
          amount: gcAmount,
          recipient_name: item.recipient_name || undefined,
          recipient_phone: item.recipient_phone || undefined,
          recipient_email: item.recipient_email || order.customer_email || undefined,
          sender_name: item.sender_name || order.customer_first_name || undefined,
          message: item.message || undefined,
          is_gift: Boolean(item.is_gift),
          external_order_id: order.id,
          idempotency_key: `order-${order.id}-item-${item.id}-issue`,
        }),
      });

      const echoData = await echoRes.json();

      if (echoRes.ok) {
        await supabase.from('gift_card_purchases').insert({
          order_id: order.id,
          echo_card_id: echoData.card_id,
          public_code: echoData.public_code,
          hash_token: echoData.hash_token,
          card_url: echoData.card_url,
          image_url: echoData.image_url,
          amount: gcAmount,
          recipient_name: item.recipient_name || null,
          recipient_phone: item.recipient_phone || null,
          is_gift: Boolean(item.is_gift),
          status: 'issued',
        });
        console.log(`Gift card emitida para orden ${order.order_number}: ${echoData.public_code} por $${gcAmount}`);
      } else {
        console.error(`Error emitiendo gift card para orden ${order.order_number}:`, echoData);
        await supabase.from('gift_card_purchases').insert({
          order_id: order.id,
          amount: gcAmount,
          status: 'failed',
          error_message: echoData.error || `HTTP ${echoRes.status}`,
        });
      }
    } catch (err) {
      console.error(`Excepción emitiendo gift card para orden ${order.order_number}:`, err);
      await supabase.from('gift_card_purchases').insert({
        order_id: order.id,
        amount: gcAmount,
        status: 'failed',
        error_message: String(err),
      }).catch(() => {});
    }
  }
}

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
      return ok();
    }

    console.log(`Pedido ${orderNumber} actualizado: payment_status=${paymentStatus}, status=${orderStatus}`);

    // Si el pago fue aprobado, enviar email de confirmación y emitir gift cards compradas
    if (paymentStatus === 'paid') {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('order_number', orderNumber)
        .single();

      if (orderData) {
        await supabase.functions.invoke('send-order-email', {
          body: { order: orderData, items: orderData.items, payment_confirmed: true }
        }).catch(e => console.error('Error enviando email de pago confirmado:', e));

        await issueGiftCards(supabase, orderData);
      }
    }

    return ok();
  } catch (err) {
    console.error('mp-webhook error:', err);
    return ok(); // 200 siempre para evitar reintentos de MP
  }
});
