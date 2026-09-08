// Supabase Edge Function: correo-import
// Crea un envío real en Correo Argentino (MiCorreo) al confirmar un pedido.
// Contrato: "Correo Argentino - API MiCorreo.md" — POST /shipping/import.
//
// DEPLOY:
//   supabase functions deploy correo-import --no-verify-jwt
//   supabase secrets set CA_USER=... CA_PASS=... CA_CUSTOMER_ID=... CA_ORIGIN_POSTAL_CODE=... [CA_ENV=prod]
//
// Las credenciales NUNCA van hardcodeadas acá — viven solo como secrets de
// Supabase (Project Settings → Edge Functions → Secrets, o vía `supabase secrets set`).

import { getCorsHeaders } from '../_shared/cors.ts';
import { micorreoRequest, getCaCustomerId, toProvinceCode, MicorreoError } from '../_shared/micorreo.ts';

// El catálogo todavía no trackea peso por producto: usamos un peso estimado
// por unidad y un paquete estándar, igual que hace correo-rates al cotizar.
const DEFAULT_ITEM_WEIGHT_GRAMS = 700;
const PACKAGE_DIMENSIONS = { height: 20, length: 30, width: 15 };

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order_id, order_number, customer, shipping, items } = await req.json();

    if (!order_id || !customer?.email || !customer?.firstName || !shipping?.postalCode || !shipping?.address) {
      return new Response(JSON.stringify({ error: 'Faltan datos del pedido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orderItems = Array.isArray(items) ? items : [];
    const totalQuantity = orderItems.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0) || 1;
    const declaredValue = orderItems.reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    const weight = Math.max(totalQuantity * DEFAULT_ITEM_WEIGHT_GRAMS, 1);

    const importData = await micorreoRequest('POST', '/shipping/import', {
      body: {
        customerId: getCaCustomerId(),
        extOrderId: String(order_id),
        orderNumber: String(order_number ?? order_id),
        recipient: {
          name: `${customer.firstName} ${customer.lastName || ''}`.trim(),
          email: customer.email,
          phone: customer.phone || '',
        },
        shipping: {
          deliveryType: 'D',
          address: {
            streetName: shipping.address,
            streetNumber: shipping.addressNumber || 'S/N',
            floor: shipping.floor || '',
            apartment: shipping.apartment || '',
            city: shipping.city,
            provinceCode: toProvinceCode(shipping.province),
            postalCode: String(shipping.postalCode),
          },
          weight,
          declaredValue,
          ...PACKAGE_DIMENSIONS,
        },
      },
    });

    return new Response(JSON.stringify(importData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('correo-import error:', err);
    const status = err instanceof MicorreoError ? err.status : 500;
    const detail = err instanceof MicorreoError ? err.detail : undefined;
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err), detail }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
