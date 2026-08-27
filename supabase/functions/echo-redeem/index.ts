// Supabase Edge Function: echo-redeem
// Canjea (descuenta saldo de) una Gift Card en el checkout.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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

    const { hash_token, amount, order_id } = await req.json();

    if (!hash_token || typeof hash_token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'hash_token requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Monto inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!order_id || typeof order_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'order_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const idempotencyKey = `shams-redeem-${order_id}-${hash_token}`;

    const echoRes = await fetch(`${echoApiUrl}/api/external/redeem`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': echoApiKey,
      },
      body: JSON.stringify({
        hash_token,
        amount,
        external_order_id: order_id,
        idempotency_key: idempotencyKey,
      }),
    });

    const echoData = await echoRes.json();

    if (!echoRes.ok) {
      return new Response(
        JSON.stringify({ error: echoData.error || 'Error al canjear gift card' }),
        { status: echoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY')!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('gift_card_redemptions').insert({
        order_id,
        public_code: echoData.public_code || null,
        hash_token,
        amount_applied: echoData.amount_charged || amount,
        balance_before: null,
        balance_after: echoData.new_balance,
        idempotency_key: idempotencyKey,
        status: 'applied',
      });
    }

    return new Response(JSON.stringify(echoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('echo-redeem error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
