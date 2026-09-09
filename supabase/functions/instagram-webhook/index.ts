// Supabase Edge Function: instagram-webhook
// Recibe los DM de Instagram (@perramusrosario) vía la API de Meta, busca en el
// catálogo real de Supabase y responde automáticamente con stock/precio reales.
//
// DEPLOY:
//   supabase functions deploy instagram-webhook --no-verify-jwt
//   supabase secrets set IG_VERIFY_TOKEN=... IG_APP_SECRET=... IG_PAGE_ACCESS_TOKEN=...
//   (opcional) supabase secrets set GEMINI_API_KEY=...  — si no está, responde con un
//   listado simple de los productos encontrados en vez de una respuesta redactada por IA.
//
// Configurar en Meta for Developers → tu app → Instagram → Webhooks:
//   Callback URL: https://<project-ref>.supabase.co/functions/v1/instagram-webhook
//   Verify token: el mismo valor que pongas en IG_VERIFY_TOKEN
//   Suscribirse al campo: messages

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GRAPH_API = 'https://graph.facebook.com/v21.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ── Verificación de firma de Meta (HMAC-SHA256 sobre el body crudo) ─────────
async function isValidSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  const appSecret = Deno.env.get('IG_APP_SECRET');
  if (!appSecret || !signatureHeader) return false;

  const expected = signatureHeader.replace('sha256=', '');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
  const computed = Array.from(new Uint8Array(sigBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  // Comparación en tiempo constante
  if (computed.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// ── Busca productos publicados que coincidan con palabras del mensaje ──────
async function searchCatalog(userText: string) {
  const stopwords = new Set(['hola', 'quiero', 'tienen', 'tenes', 'hay', 'buenas', 'buenos', 'para', 'con', 'los', 'las', 'del', 'una', 'como', 'esta', 'este']);
  const terms = userText
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // saca acentos
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !stopwords.has(t));

  if (terms.length === 0) return [];

  // "brand" y "category" no son columnas de products: son relaciones a otras
  // tablas (brand_id -> brands, category_id -> categories). Buscamos primero
  // los ids de marca que matchean, para poder filtrar products por brand_id.
  const brandOr = terms.map(t => `name.ilike.%${t}%`).join(',');
  const { data: matchingBrands } = await supabase.from('brands').select('id').or(brandOr);
  const brandIds = (matchingBrands || []).map((b: any) => b.id);

  const nameOr = terms.map(t => `name.ilike.%${t}%,description.ilike.%${t}%`).join(',');
  const orFilter = brandIds.length > 0
    ? `${nameOr},brand_id.in.(${brandIds.join(',')})`
    : nameOr;

  const { data, error } = await supabase
    .from('products')
    .select(`
      id, name, price, compare_at_price, is_published, is_active,
      brand:brands(name),
      variants:product_variants(size, stock, has_defect)
    `)
    .eq('is_published', true)
    .eq('is_active', true)
    .or(orFilter)
    .limit(5);

  if (error) {
    console.error('searchCatalog error:', error.message);
    return [];
  }

  return (data || []).filter((p: any) =>
    (p.variants || []).some((v: any) => !v.has_defect && (v.stock || 0) > 0)
  );
}

function formatCatalogContext(products: any[]): string {
  if (products.length === 0) return 'No se encontraron productos con stock que coincidan con la consulta.';
  return products.map((p: any) => {
    const sizes = (p.variants || [])
      .filter((v: any) => !v.has_defect && (v.stock || 0) > 0)
      .map((v: any) => `${v.size} (${v.stock})`)
      .join(', ');
    const price = p.compare_at_price > p.price
      ? `$${p.price.toLocaleString('es-AR')} (antes $${p.compare_at_price.toLocaleString('es-AR')})`
      : `$${p.price.toLocaleString('es-AR')}`;
    const brandName = p.brand?.name || '';
    return `- ${brandName} ${p.name}: ${price}. Talles con stock: ${sizes}.`;
  }).join('\n');
}

// ── Redacta la respuesta: con Gemini si hay API key, si no un listado simple ─
async function buildReply(userText: string, products: any[]): Promise<string> {
  const context = formatCatalogContext(products);
  const geminiKey = Deno.env.get('GEMINI_API_KEY');

  if (!geminiKey) {
    return products.length > 0
      ? `¡Hola! Esto encontramos en la tienda:\n\n${context}\n\nMás info y compra en https://multibrandrosario.com`
      : 'Por ahora no encontramos ese producto con stock. Contanos un poco más o mirá el catálogo completo en https://multibrandrosario.com';
  }

  const systemPrompt = `Sos el asistente de Instagram de Multibrand Rosario (Perramus, Hunter, Nautica y más).
Respondé el mensaje del cliente usando SOLO esta información real del catálogo (no inventes precios ni stock):
${context}

Si no hay productos que coincidan, decilo con honestidad y sugerí escribir por WhatsApp o mirar https://multibrandrosario.com.
Respondé en español, tono cercano y breve (2-4 líneas), como para un DM de Instagram.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: { temperature: 0.6 },
        }),
      },
    );
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) return text;
  } catch (err) {
    console.error('Gemini error en instagram-webhook:', err);
  }

  // Fallback si Gemini falla
  return products.length > 0
    ? `¡Hola! Esto encontramos en la tienda:\n\n${context}\n\nMás info y compra en https://multibrandrosario.com`
    : 'Por ahora no encontramos ese producto con stock. Contanos un poco más o mirá el catálogo completo en https://multibrandrosario.com';
}

async function sendInstagramReply(recipientId: string, text: string) {
  const token = Deno.env.get('IG_PAGE_ACCESS_TOKEN');
  if (!token) {
    console.error('Falta el secret IG_PAGE_ACCESS_TOKEN, no se puede responder.');
    return;
  }

  const res = await fetch(`${GRAPH_API}/me/messages?access_token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text },
    }),
  });

  if (!res.ok) {
    console.error('Error enviando respuesta a Instagram:', res.status, await res.text());
  }
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ── Verificación del webhook (Meta la llama una vez al configurarlo) ─────
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === Deno.env.get('IG_VERIFY_TOKEN')) {
      return new Response(challenge || '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── Mensajes entrantes ────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256');

    if (!(await isValidSignature(rawBody, signature))) {
      console.error('Firma inválida en webhook de Instagram — se ignora.');
      return new Response('Invalid signature', { status: 401 });
    }

    try {
      const payload = JSON.parse(rawBody);

      for (const entry of payload.entry || []) {
        for (const event of entry.messaging || []) {
          const senderId = event.sender?.id;
          const text = event.message?.text;

          // Ignoramos eco de nuestros propios mensajes y eventos sin texto
          if (!senderId || !text || event.message?.is_echo) continue;

          const products = await searchCatalog(text);
          const reply = await buildReply(text, products);
          await sendInstagramReply(senderId, reply);
        }
      }
    } catch (err) {
      console.error('instagram-webhook error:', err);
    }

    // Meta necesita un 200 rápido, siempre — igual que el webhook de Mercado Pago.
    return new Response('EVENT_RECEIVED', { status: 200 });
  }

  return new Response('Method not allowed', { status: 405 });
});
