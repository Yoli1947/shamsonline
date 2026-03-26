// Supabase Edge Function: create-nave-preference
// Crea una intención de pago en Nave (Banco Galicia / NaranjaX)
//
// DEPLOY:
//   supabase functions deploy create-nave-preference --no-verify-jwt
// Secrets: NAVE_CLIENT_ID, NAVE_CLIENT_SECRET, NAVE_AUDIENCE, NAVE_POS_ID, NAVE_STORE_ID

import { getCorsHeaders } from '../_shared/cors.ts';

const AUTH_URL = 'https://homoservices.apinaranja.com/security-ms/api/security/auth0/b2b/m2msPrivate';
const PAYMENT_URL = 'https://api-sandbox.ranty.io/api/payment_request/ecommerce';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('NAVE_CLIENT_ID');
    const clientSecret = Deno.env.get('NAVE_CLIENT_SECRET');
    const audience = Deno.env.get('NAVE_AUDIENCE');
    const posId = Deno.env.get('NAVE_POS_ID');

    if (!clientId || !clientSecret || !audience || !posId) {
      return new Response(
        JSON.stringify({ error: 'Credenciales de Nave no configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, order_number, customer, total, items } = await req.json();

    if (!order_id || !order_number || !customer || !total) {
      return new Response(
        JSON.stringify({ error: 'Faltan datos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Paso 1: Obtener Bearer Token
    const authRes = await fetch(AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, audience, cache: true }),
    });

    if (!authRes.ok) {
      const err = await authRes.text();
      console.error('Nave auth error:', authRes.status, err);
      return new Response(
        JSON.stringify({ error: 'Error al autenticarse con Nave' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await authRes.json();

    // Paso 2: Armar productos
    const products = (items || []).map((item: any) => ({
      id: String(item.productId || item.id || 'PROD'),
      name: item.name || 'Producto',
      description: `${item.name}${item.size ? ` - T:${item.size}` : ''}`,
      quantity: Number(item.quantity || 1),
      unit_price: {
        currency: 'ARS',
        value: Number(item.price).toFixed(2),
      },
    }));

    if (products.length === 0) {
      products.push({
        id: String(order_number),
        name: 'Compra en Shams',
        description: `Pedido ${order_number}`,
        quantity: 1,
        unit_price: { currency: 'ARS', value: Number(total).toFixed(2) },
      });
    }

    // Paso 3: Crear intención de pago — estructura según documentación oficial de Nave
    const paymentBody = {
      external_payment_id: String(order_number),
      seller: {
        pos_id: posId,
      },
      transactions: [
        {
          amount: {
            currency: 'ARS',
            value: Number(total).toFixed(2),
          },
          products,
        },
      ],
    };

    console.log('Nave payload:', JSON.stringify(paymentBody));

    const paymentRes = await fetch(PAYMENT_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentBody),
    });

    const paymentData = await paymentRes.json();

    if (!paymentRes.ok) {
      console.error('Nave payment error:', paymentRes.status, JSON.stringify(paymentData));
      return new Response(
        JSON.stringify({ error: 'Error al crear intención de pago en Nave', status: paymentRes.status, detail: paymentData }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Nave response:', JSON.stringify(paymentData));

    return new Response(
      JSON.stringify({
        checkout_url: paymentData.checkout_url,
        payment_request_id: paymentData.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('create-nave-preference error:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
