import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order, items } = await req.json();

    if (!order || !items) {
      throw new Error("Faltan datos del pedido o items");
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY no configurada");
      return new Response(
        JSON.stringify({ error: "Configuración de email incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Formatear items para el email
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.product_image || ''}" alt="${item.product_name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px; margin-right: 10px; vertical-align: middle;">
          <span style="vertical-align: middle;">${item.product_name} (${item.size}${item.color ? ` / ${item.color}` : ''})</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${Number(item.subtotal).toLocaleString()}</td>
      </tr>
    `).join('');

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">

        <!-- HEADER -->
        <div style="background-color: #000000; padding: 40px 30px; text-align: center;">
          <div style="letter-spacing: 12px; font-size: 22px; font-weight: 900; color: #ffffff; text-transform: uppercase; margin-bottom: 8px;">SHAMS</div>
          <div style="letter-spacing: 6px; font-size: 10px; font-weight: 400; color: #999999; text-transform: uppercase;">ONLINE STORE</div>
          <div style="width: 40px; height: 1px; background-color: #444; margin: 20px auto 0;"></div>
          <div style="letter-spacing: 4px; font-size: 9px; font-weight: 700; color: #888888; text-transform: uppercase; margin-top: 16px;">CONFIRMACIÓN DE PEDIDO</div>
        </div>

        <!-- BODY -->
        <div style="padding: 40px 36px; background-color: #ffffff;">

          <p style="font-size: 13px; color: #333333; margin: 0 0 6px 0; letter-spacing: 0.5px;">Hola <strong>${order.customer_first_name}</strong>,</p>
          <p style="font-size: 13px; color: #666666; margin: 0 0 32px 0; line-height: 1.7;">Recibimos tu pedido con éxito. A continuación encontrás el resumen de tu compra.</p>

          <!-- ORDER INFO -->
          <div style="border: 1px solid #e8e8e8; padding: 20px 24px; margin-bottom: 32px; background-color: #fafafa;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="color: #999999; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0;">N° de Pedido</td>
                <td style="color: #000000; font-weight: 700; text-align: right; letter-spacing: 1px;">#${order.order_number}</td>
              </tr>
              <tr>
                <td style="color: #999999; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0;">Fecha</td>
                <td style="color: #333333; text-align: right;">${new Date(order.created_at).toLocaleDateString('es-AR')}</td>
              </tr>
              <tr>
                <td style="color: #999999; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0;">Método de Pago</td>
                <td style="color: #333333; text-align: right; text-transform: uppercase; letter-spacing: 1px;">${order.payment_method}</td>
              </tr>
              <tr>
                <td style="color: #999999; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0;">Entrega</td>
                <td style="color: #333333; text-align: right;">${order.shipping_method === 'retiro' ? 'Retiro en local' : `${order.shipping_address} ${order.shipping_number}, ${order.shipping_city}`}</td>
              </tr>
            </table>
          </div>

          <!-- PRODUCTS TITLE -->
          <div style="border-top: 2px solid #000000; border-bottom: 1px solid #e0e0e0; padding: 10px 0; margin-bottom: 0;">
            <span style="font-size: 9px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #000000;">Detalle de Productos</span>
          </div>

          <!-- PRODUCTS TABLE -->
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 0;">
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- TOTALS -->
          <div style="border-top: 1px solid #e0e0e0; margin-top: 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
              <tr>
                <td style="padding: 10px 0; color: #999999; letter-spacing: 1px; text-transform: uppercase;">Subtotal</td>
                <td style="padding: 10px 0; text-align: right; color: #333333;">$${Number(order.subtotal).toLocaleString('es-AR')}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td style="padding: 6px 0; color: #555555; letter-spacing: 1px; text-transform: uppercase;">Descuento</td>
                <td style="padding: 6px 0; text-align: right; color: #555555;">-$${Number(order.discount).toLocaleString('es-AR')}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 6px 0; color: #999999; letter-spacing: 1px; text-transform: uppercase;">Envío</td>
                <td style="padding: 6px 0; text-align: right; color: #333333;">${order.shipping_cost > 0 ? `$${Number(order.shipping_cost).toLocaleString('es-AR')}` : 'Sin cargo'}</td>
              </tr>
              <tr style="border-top: 2px solid #000000;">
                <td style="padding: 16px 0 8px; font-size: 13px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #000000;">TOTAL</td>
                <td style="padding: 16px 0 8px; text-align: right; font-size: 20px; font-weight: 900; color: #000000;">$${Number(order.total).toLocaleString('es-AR')}</td>
              </tr>
            </table>
          </div>

        </div>

        <!-- FOOTER -->
        <div style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0; padding: 28px 36px; text-align: center;">
          <p style="font-size: 11px; color: #666666; margin: 0 0 6px 0; letter-spacing: 0.5px;">¿Tenés alguna duda? Contactanos por WhatsApp</p>
          <p style="font-size: 13px; font-weight: 700; color: #000000; margin: 0 0 20px 0; letter-spacing: 1px;">341 217-5258</p>
          <div style="width: 30px; height: 1px; background-color: #cccccc; margin: 0 auto 16px;"></div>
          <p style="font-size: 9px; color: #aaaaaa; margin: 0; letter-spacing: 3px; text-transform: uppercase;">SHAMS ONLINE &copy; 2026 — Rosario, Argentina</p>
        </div>

      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Shams Online <tienda@shamsonline.com.ar>",
        to: [order.customer_email, "admteruzyolanda@gmail.com"],
        subject: `Confirmación de Pedido #${order.order_number} - Shams Online`,
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error("Error al enviar el email vía Resend");
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error en send-order-email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
