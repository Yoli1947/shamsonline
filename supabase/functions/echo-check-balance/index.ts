// Supabase Edge Function: echo-check-balance
// Verifica el saldo de una Gift Card consultando la API de EchoGiftCard.

import { getCorsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const echoApiUrl = Deno.env.get('ECHO_API_URL');
    const echoApiKey = Deno.env.get('ECHO_API_KEY');

    if (!echoApiUrl || !echoApiKey) {
      return new Response(
        JSON.stringify({ error: 'Variables ECHO_API no configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { code, hash } = await req.json();

    if (!code && !hash) {
      return new Response(
        JSON.stringify({ error: 'Parámetro code o hash requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const params = new URLSearchParams();
    if (code) params.set('code', code);
    if (hash) params.set('hash', hash);

    const echoRes = await fetch(`${echoApiUrl}/api/external/balance?${params.toString()}`, {
      headers: { 'X-Api-Key': echoApiKey },
    });

    const echoData = await echoRes.json();

    if (!echoRes.ok) {
      return new Response(
        JSON.stringify({ error: echoData.error || 'Gift card no encontrada' }),
        { status: echoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(JSON.stringify(echoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('echo-check-balance error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
