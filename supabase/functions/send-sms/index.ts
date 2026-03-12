import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { to_user_id, text } = await req.json();

    if (!to_user_id || !text) {
      return new Response(JSON.stringify({ error: "Missing to_user_id or text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up recipient's phone number
    const { data: contact, error: contactErr } = await supabase
      .from("contacts")
      .select("phone")
      .eq("user_id", to_user_id)
      .single();

    if (contactErr || !contact?.phone) {
      return new Response(JSON.stringify({ error: "No phone number for this user", detail: contactErr?.message }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send SMS via Telnyx
    const telnyxRes = await fetch("https://api.telnyx.com/v2/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("TELNYX_API_KEY")}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("TELNYX_PHONE_NUMBER"),
        to: contact.phone,
        text,
      }),
    });

    if (!telnyxRes.ok) {
      const err = await telnyxRes.text();
      console.error("Telnyx send failed:", err);
      return new Response(JSON.stringify({ error: "Failed to send SMS", detail: err }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-sms error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
