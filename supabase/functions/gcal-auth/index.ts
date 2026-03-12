import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const CLIENT_ID = Deno.env.get("GCAL_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("GCAL_CLIENT_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { code, redirect_uri, refresh_token } = await req.json();

    let body: Record<string, string>;

    if (refresh_token) {
      // Refresh an expired access token
      body = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
      };
    } else if (code) {
      // Exchange auth code for tokens
      body = {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri,
        grant_type: "authorization_code",
      };
    } else {
      return new Response(JSON.stringify({ error: "Missing code or refresh_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Google token error:", data);
      return new Response(JSON.stringify({ error: data.error_description || data.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("gcal-auth error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
