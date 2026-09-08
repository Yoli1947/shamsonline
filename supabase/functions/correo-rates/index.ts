// Supabase Edge Function: correo-rates
// Cotiza un envío real contra la API de MiCorreo (Correo Argentino).
//
// DEPLOY:
//   supabase functions deploy correo-rates --no-verify-jwt
//   supabase secrets set CA_USER=... CA_PASS=... CA_CUSTOMER_ID=... CA_ORIGIN_POSTAL_CODE=... [CA_ENV=prod]

import { getCorsHeaders } from '../_shared/cors.ts';
import { micorreoRequest, getCaCustomerId, getCaOriginPostalCode, MicorreoError } from '../_shared/micorreo.ts';

// El catálogo todavía no trackea peso por producto, así que cotizamos con un
// paquete estándar salvo que el llamador mande un peso real.
const DEFAULT_WEIGHT_GRAMS = 1000;
const PACKAGE_DIMENSIONS = { height: 20, width: 30, length: 15 };

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const postalCode = String(body.postalCode || '').trim();
    const weight = Number(body.weight) || DEFAULT_WEIGHT_GRAMS;
    const deliveredType = body.deliveredType === 'S' ? 'S' : 'D';

    if (!postalCode || postalCode.length < 4) {
      return new Response(JSON.stringify({ error: 'postalCode requerido (mínimo 4 caracteres)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await micorreoRequest('POST', '/rates', {
      body: {
        customerId: getCaCustomerId(),
        postalCodeOrigin: getCaOriginPostalCode(),
        postalCodeDestination: postalCode,
        deliveredType,
        dimensions: { weight, ...PACKAGE_DIMENSIONS },
      },
    });

    const rate = data.rates?.[0];
    if (!rate) {
      return new Response(JSON.stringify({ error: 'MiCorreo no devolvió cotización para ese destino' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      price: rate.price,
      productName: rate.productName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('correo-rates error:', err);
    const status = err instanceof MicorreoError ? err.status : 500;
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
