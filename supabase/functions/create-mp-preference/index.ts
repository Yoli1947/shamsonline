// Supabase Edge Function: create-mp-preference
// Crea una preferencia de Mercado Pago Checkout Pro
//
// DEPLOY:
//   supabase functions deploy create-mp-preference
//   supabase secrets set MP_ACCESS_TOKEN=<tu_access_token>
//   supabase secrets set APP_URL=https://shamsonline.com.ar

import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const mpAccessToken = Deno.env.get('MP_ACCESS_TOKEN');
    if (!mpAccessToken) {
      return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN no configurado' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { order_id, order_number, customer, total } = await req.json();

    if (!order_id || !order_number || !customer || !total) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://shamsonline.com.ar';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';

    const preference = {
      items: [
        {
          id: order_id,
          title: 'Compra en Shams Online',
          description: `Pedido ${order_number}`,
          quantity: 1,
          unit_price: Number(total),
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: customer.firstName || '',
        surname: customer.lastName || '',
        email: customer.email,
        phone: { area_code: '', number: customer.phone || '' },
        identification: { type: 'DNI', number: customer.dni || '' },
      },
      back_urls: {
        success: `${appUrl}/orden/exito?oid=${order_id}`,
        failure: `${appUrl}/?pago=fallido`,
        pending: `${appUrl}/orden/pendiente?oid=${order_id}`,
      },
      auto_return: 'approved',
      external_reference: order_number,
      notification_url: `${supabaseUrl}/functions/v1/mp-webhook`,
      statement_descriptor: 'SHAMS ONLINE',
      expires: false,
    };

    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpAccessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': order_id,
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error('MP API error:', mpRes.status, JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Error al crear preferencia en Mercado Pago', detail: data }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point,
        preference_id: data.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-mp-preference error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
