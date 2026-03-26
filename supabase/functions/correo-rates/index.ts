// Supabase Edge Function: correo-rates
// Cotiza envío usando precios fijos PAQ.AR CLÁSICO (vigente 01/02/2026)
// Origen: Rosario, Santa Fe (CP 2000)
//
// DEPLOY:
//   supabase functions deploy correo-rates --no-verify-jwt

import { getCorsHeaders } from '../_shared/cors.ts';

// ── Precios PAQ.AR CLÁSICO sin IVA (vigente 01/02/2026) ──────────────────────
// Filas: [pesoMaxGramos, zona1, zona2, zona3, zona4]
const DOMICILIO: [number, number, number, number, number][] = [
  [500,   5704.13,  6586.78,  7171.07,  7214.05],
  [1000,  5918.18,  7096.69,  7729.75,  7786.78],
  [2000,  6494.21,  7306.61,  7983.47,  8441.32],
  [3000,  6689.26,  7714.88,  8701.65,  9284.30],
  [5000,  8841.32, 11737.19, 13151.24, 14508.26],
  [10000, 11000.83, 15697.52, 18699.17, 22484.30],
  [15000, 14370.25, 24323.14, 29475.21, 35491.74],
  [20000, 15287.60, 29257.85, 36129.75, 44156.20],
  [25000, 17691.74, 34195.87, 42785.12, 52814.88],
  [30000, 18554.55, 39133.88, 49438.84, 61478.51],
];

const SUCURSAL: [number, number, number, number, number][] = [
  [500,   3390.08,  4109.09,  4513.22,  4665.29],
  [1000,  3442.15,  4273.55,  4701.65,  4910.74],
  [2000,  3687.60,  5026.45,  5476.86,  5904.96],
  [3000,  3799.17,  5559.50,  6306.61,  7148.76],
  [5000,  5021.49,  8909.09, 10733.06, 12747.93],
  [10000, 7286.78, 13843.80, 17085.95, 20868.60],
  [15000, 10962.81, 22720.66, 27876.03, 33896.69],
  [20000, 12441.32, 27707.44, 34579.34, 42604.13],
  [25000, 13919.83, 32691.74, 41280.17, 51311.57],
  [30000, 15400.00, 37675.21, 47982.64, 60020.66],
];

// ── Determina zona desde Rosario (Santa Fe) según CP destino ─────────────────
// Basado en tabla oficial de zonas PAQ.AR (Hoja 4 del PDF de precios)
function getZone(postalCode: string): number {
  const cp = parseInt(postalCode.replace(/\D/g, ''));
  if (isNaN(cp)) return 3;

  // Zona 1: Rosario (mismo CP origen)
  if (cp === 2000) return 1;

  // Zona 4: Patagonia (Neuquén, Río Negro, Chubut, Santa Cruz, Tierra del Fuego)
  if (cp >= 8100) return 4;

  // Zona 3: NOA + Cuyo + La Pampa + Misiones
  if (cp >= 4000 && cp <= 4999) return 3; // Tucumán, Salta, Jujuy, Catamarca, Sgo del Estero, La Rioja
  if (cp >= 5300 && cp <= 5699) return 3; // La Rioja, San Juan, Mendoza
  if (cp >= 6300 && cp <= 6499) return 3; // La Pampa
  if (cp >= 3300 && cp <= 3399) return 3; // Misiones

  // Zona 2: Buenos Aires, GBA, Santa Fe, Córdoba, Entre Ríos, Corrientes, Chaco, Formosa, San Luis
  return 2;
}

function getPrice(weightGrams: number, zone: number, toSucursal: boolean): number {
  const table = toSucursal ? SUCURSAL : DOMICILIO;
  for (const [maxW, z1, z2, z3, z4] of table) {
    if (weightGrams <= maxW) {
      return [0, z1, z2, z3, z4][zone];
    }
  }
  // Sobre 30 kg: precio del último tramo
  const last = table[table.length - 1];
  return [0, last[1], last[2], last[3], last[4]][zone];
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const postalCode = String(body.postalCode || '').trim();
    const weight     = Number(body.weight) || 500; // gramos
    const toSucursal = body.deliveredType === 'S';

    if (!postalCode || postalCode.length < 4) {
      return new Response(JSON.stringify({ error: 'postalCode requerido (mínimo 4 caracteres)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const zone  = getZone(postalCode);
    const price = getPrice(weight, zone, toSucursal);

    return new Response(JSON.stringify({
      price,
      deliveryTime: zone === 1 ? '1-2 días' : zone <= 2 ? '3-5 días' : zone === 3 ? '5-7 días' : '7-10 días',
      productName: toSucursal ? 'PAQ.AR Clásico a Sucursal' : 'PAQ.AR Clásico a Domicilio',
      zone,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('correo-rates error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
