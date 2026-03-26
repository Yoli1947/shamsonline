// Supabase Edge Function: correo-import
// Crea un envío en Correo Argentino MiCorreo al confirmar un pedido
//
// DEPLOY:
//   supabase functions deploy correo-import --no-verify-jwt
//   supabase secrets set CA_USER=YTeruzAPI CA_PASS=Carteles44+

import { getCorsHeaders } from '../_shared/cors.ts';

const CA_BASE = 'https://api.correoargentino.com.ar/micorreo/v1';

async function getToken(): Promise<{ token: string; customerId?: string }> {
  const caUser = Deno.env.get('CA_USER');
  const caPass = Deno.env.get('CA_PASS');
  const basic = btoa(`${caUser}:${caPass}`);

  const res = await fetch(`${CA_BASE}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CA token error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const token = data.accessToken || data.token || data.access_token || data.jwt;
  const customerId = data.customerId || data.customer_id || data.id;
  return { token, customerId };
}

async function getCustomerId(token: string): Promise<string> {
  const caUser = Deno.env.get('CA_USER');
  const caPass = Deno.env.get('CA_PASS');

  const res = await fetch(`${CA_BASE}/users/validate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userToken: caUser, passwordToken: caPass }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`CA validate error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.customerId || data.customer_id || data.id;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order_id, order_number, customer, shipping } = await req.json();

    if (!order_id || !customer || !shipping) {
      return new Response(JSON.stringify({ error: 'Faltan datos del pedido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Obtener token
    const { token, customerId: tokenCustomerId } = await getToken();

    // 2. Obtener customerId
    let customerId = tokenCustomerId;
    if (!customerId) {
      customerId = await getCustomerId(token);
    }

    // 3. Crear envío
    const importRes = await fetch(`${CA_BASE}/shipping/import`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerId,
        shipments: [{
          internalCode: String(order_number),
          deliveredType: 'D',
          productType: 'CP',
          dimensions: { weight: 500, height: 10, width: 20, length: 30 },
          recipient: {
            name: `${customer.firstName} ${customer.lastName}`,
            documentType: 'DNI',
            documentId: customer.dni || '00000000',
            email: customer.email,
            phone: customer.phone || '',
            address: {
              streetName: shipping.address,
              streetNumber: shipping.addressNumber || 'S/N',
              floor: shipping.floor || '',
              apartment: shipping.apartment || '',
              locality: shipping.city,
              city: shipping.city,
              provinceCode: 'S', // Santa Fe por defecto
              postalCode: String(shipping.postalCode),
            },
          },
        }],
      }),
    });

    const importData = await importRes.json();

    if (!importRes.ok) {
      console.error('CA import error:', JSON.stringify(importData));
      return new Response(JSON.stringify({ error: 'Error al crear envío', detail: importData }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(importData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('correo-import error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
