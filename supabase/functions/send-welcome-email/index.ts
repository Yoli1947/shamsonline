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
    const { email } = await req.json();

    if (!email) {
      throw new Error("Falta el email del suscriptor");
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY no configurada");
      return new Response(
        JSON.stringify({ error: "Configuración de email incompleta" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #000; color: #fff; padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; letter-spacing: 5px; font-size: 28px;">SHAMS <span style="color: #00D1FF;">ONLINE</span></h1>
          <p style="margin: 15px 0 0; color: #00D1FF; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">¡BIENVENIDO/A AL CLUB PREMIUM!</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #fff;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">Hola,</p>
          <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 30px;">
            Gracias por suscribirte a nuestro newsletter. A partir de ahora vas a ser el primero en enterarte de las mejores tendencias ingresadas a la tienda de **Mujer** y **Hombre**, rebajas exclusivas y beneficios sorpresa.
          </p>
          
          <div style="background-color: #f9f9f9; padding: 25px; border-radius: 12px; border-left: 5px solid #00D1FF; margin: 30px 0; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; font-weight: bold;">Tu regalo de bienvenida:</p>
            <h2 style="margin: 0; font-size: 32px; color: #000; font-weight: 900; letter-spacing: 1px;">10% OFF</h2>
            <p style="margin: 10px 0 0; font-size: 14px; color: #666;">En tu primera compra aplicándose automáticamente en el carrito de la tienda online.</p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://shamsonline.com.ar" style="display: inline-block; padding: 15px 35px; background-color: #00D1FF; color: #000; text-decoration: none; font-weight: bold; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; border-radius: 5px;">
              IR A LA TIENDA
            </a>
          </div>
          
          <div style="margin-top: 50px; text-align: center; border-top: 1px solid #eee; padding-top: 30px;">
            <p style="font-size: 12px; color: #999; margin: 0;">Si tenés alguna duda, contactanos por WhatsApp al 3412175258</p>
            <p style="font-size: 10px; color: #ccc; margin-top: 15px; letter-spacing: 1px;">SHAMS ONLINE &copy; ${new Date().getFullYear()} - Rosario, Argentina</p>
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
        to: [email],
        subject: "🎉 ¡Bienvenido a Shams Online! Acá tenés tu beneficio.",
        html: emailHtml,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error("Resend API error: " + JSON.stringify(data));
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error en send-welcome-email:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
