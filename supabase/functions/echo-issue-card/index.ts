// Supabase Edge Function: echo-issue-card
// Emite una Gift Card en EchoGiftCard después de que el cliente paga en ShamsOnline/ShamsOutlet.

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
        JSON.stringify({ error: 'Variables ECHO_API_URL o ECHO_API_KEY no configuradas' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const {
      amount,
      recipient_name,
      recipient_phone,
      recipient_email,
      sender_name,
      message,
      is_gift,
      design_id,
      order_id,
    } = await req.json();

    if (!amount || typeof amount !== 'number' || amount < 100000) {
      return new Response(
        JSON.stringify({ error: 'Monto requerido (mínimo $100.000)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const echoRes = await fetch(`${echoApiUrl}/api/external/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': echoApiKey,
      },
      body: JSON.stringify({
        amount,
        recipient_name: recipient_name || undefined,
        recipient_phone: recipient_phone || undefined,
        recipient_email: recipient_email || undefined,
        sender_name: sender_name || undefined,
        message: message || undefined,
        is_gift: is_gift ?? false,
        design_id: design_id || undefined,
        external_order_id: order_id,
        idempotency_key: `shams-issue-${order_id}`,
      }),
    });

    const echoData = await echoRes.json();

    if (!echoRes.ok) {
      console.error('EchoGiftCard API error:', echoRes.status, JSON.stringify(echoData));
      return new Response(
        JSON.stringify({ error: echoData.error || 'Error al emitir gift card', detail: echoData }),
        { status: echoRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SERVICE_KEY')!;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from('gift_card_purchases').upsert(
        {
          order_id,
          echo_card_id: echoData.card_id,
          public_code: echoData.public_code,
          hash_token: echoData.hash_token,
          card_url: echoData.card_url,
          image_url: echoData.image_url,
          amount,
          recipient_name: recipient_name || null,
          recipient_phone: recipient_phone || null,
          recipient_email: recipient_email || null,
          is_gift: is_gift ?? false,
          status: 'issued',
        },
        { onConflict: 'order_id' },
      );
    }

    return new Response(JSON.stringify(echoData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('echo-issue-card error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
