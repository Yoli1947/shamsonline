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
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #000; color: #fff; padding: 30px; text-align: center;">
          <h1 style="margin: 0; letter-spacing: 5px; font-size: 24px;">SHAMS <span style="color: #00D1FF;">ONLINE</span></h1>
          <p style="margin: 10px 0 0; color: #00D1FF; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Confirmación de Pedido</p>
        </div>
        
        <div style="padding: 30px;">
          <p>Hola <strong>${order.customer_first_name}</strong>,</p>
          <p>¡Gracias por tu compra! Hemos recibido tu pedido con éxito y ya estamos trabajando en él.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Número de Pedido:</strong> #${order.order_number}</p>
            <p style="margin: 5px 0 0; font-size: 14px;"><strong>Fecha:</strong> ${new Date(order.created_at).toLocaleDateString('es-AR')}</p>
            <p style="margin: 5px 0 0; font-size: 14px;"><strong>Método de Pago:</strong> ${order.payment_method.toUpperCase()}</p>
          </div>
          
          <h3 style="border-bottom: 2px solid #00D1FF; padding-bottom: 10px; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Detalle de productos</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background-color: #f4f4f4;">
                <th style="padding: 10px; text-align: left;">Producto</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 10px; text-align: right;">$${Number(order.subtotal).toLocaleString()}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; color: #e4405f; font-weight: bold;">Descuento:</td>
                <td style="padding: 10px; text-align: right; color: #e4405f;">-$${Number(order.discount).toLocaleString()}</td>
              </tr>
              ` : ''}
              ${order.shipping_cost > 0 ? `
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Envío:</td>
                <td style="padding: 10px; text-align: right;">$${Number(order.shipping_cost).toLocaleString()}</td>
              </tr>
              ` : `
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; color: #00D1FF; font-weight: bold;">Envío:</td>
                <td style="padding: 10px; text-align: right; color: #00D1FF;">GRATIS</td>
              </tr>
              `}
              <tr style="font-size: 18px; font-weight: bold; background-color: #f9f9f9;">
                <td colspan="2" style="padding: 15px; text-align: right;">TOTAL:</td>
                <td style="padding: 15px; text-align: right; color: #00D1FF;">$${Number(order.total).toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          
          <div style="margin-top: 30px; font-size: 14px; line-height: 1.6;">
            <p><strong>Información de Entrega:</strong></p>
            <p style="margin: 0; color: #666;">
              ${order.shipping_method === 'retiro' 
                ? 'Retiro por local seleccionado.' 
                : `Envío a: ${order.shipping_address} ${order.shipping_number}, ${order.shipping_city}, ${order.shipping_province}`}
            </p>
          </div>
          
          <div style="margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="font-size: 12px; color: #999;">Si tenés alguna duda, contactanos por WhatsApp al 3412175258</p>
            <p style="font-size: 10px; color: #ccc; margin-top: 10px;">SHAMS ONLINE &copy; 2026 - Rosario, Argentina</p>
          </div>
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
