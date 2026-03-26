// Supabase Edge Function: gemini-proxy
// Actúa como proxy para Google Gemini AI — la API key nunca sale del servidor
//
// DEPLOY:
//   1. supabase functions deploy gemini-proxy
//   2. supabase secrets set GEMINI_API_KEY=tu-clave-aqui
//
// La clave de Gemini se almacena como secret en Supabase y NUNCA llega al navegador.

import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM_PROMPT = `Eres "Shams AI Stylist", un asistente de moda de alta gama y futurista para Shams.
Vendemos marcas premium como Perramus, Hunter, Nautica, Las Oreiro, Vitamina, Armesto, Blaque y Allo Martinez.
Tu objetivo es recomendar outfits basados en el humor, eventos o preferencias del usuario.
Manten un tono elegante, moderno e inspirador. Usa terminología de moda.
Si preguntan por precios, recuerda que somos un outlet con descuentos exclusivos.
Responde siempre en ESPAÑOL. Sé conciso pero con estilo.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { history, userInput } = await req.json();

    const contents = [
      ...(history || []).map((m: { role: string; text: string }) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }],
      })),
      { role: 'user', parts: [{ text: userInput }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error('Gemini API error:', geminiRes.status, JSON.stringify(data));
      return new Response(JSON.stringify({ error: `Gemini error ${geminiRes.status}`, detail: data }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      // Log para debug — se puede ver en Supabase Dashboard > Functions > Logs
      console.error('Gemini response sin texto:', JSON.stringify(data));
      return new Response(JSON.stringify({ text: 'Sin respuesta.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
