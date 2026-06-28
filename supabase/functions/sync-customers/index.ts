import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Usar service role para bypassear RLS
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Traer todos los pedidos con datos del cliente
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("customer_email, customer_first_name, customer_last_name, customer_phone, customer_dni")
      .not("customer_email", "is", null);

    if (ordersError) throw ordersError;

    // Deduplicar por email
    const byEmail: Record<string, any> = {};
    for (const o of orders || []) {
      if (o.customer_email) byEmail[o.customer_email] = o;
    }
    const unique = Object.values(byEmail);

    // Upsert en lotes
    let synced = 0;
    const BATCH = 50;
    for (let i = 0; i < unique.length; i += BATCH) {
      const batch = unique.slice(i, i + BATCH).map((o: any) => ({
        email: o.customer_email,
        first_name: o.customer_first_name || "",
        last_name: o.customer_last_name || "",
        phone: o.customer_phone || null,
        dni: o.customer_dni || null,
      }));
      const { error } = await supabase
        .from("customers")
        .upsert(batch, { onConflict: "email", ignoreDuplicates: true });
      if (error) throw error;
      synced += batch.length;
    }

    return new Response(JSON.stringify({ success: true, synced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
