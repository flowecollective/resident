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
    const { name, email, cohort, photo, onboarding_steps } = await req.json();

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is an admin
    const authHeader = req.headers.get("authorization") || "";
    const callerClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role, tenant_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user with invite (sends magic link email)
    const { data: invite, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        role: "resident",
        tenant_id: callerProfile.tenant_id,
      },
    });

    if (inviteErr) {
      return new Response(JSON.stringify({ error: inviteErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The trigger auto-creates the profile. Now update it with cohort/photo/onboarding config.
    const userId = invite.user.id;
    const updates: Record<string, unknown> = {};
    if (cohort) updates.cohort = cohort;
    if (photo) updates.photo = photo;
    if (onboarding_steps) updates.onboarding_steps = onboarding_steps;
    // Auto-mark disabled onboarding steps as completed
    const allSteps = ["agreement", "enrollment", "gusto"];
    const enabled = onboarding_steps || allSteps;
    if (!enabled.includes("agreement")) { updates.agreement_signed = true; updates.agreement_date = new Date().toISOString().split("T")[0]; }
    if (!enabled.includes("enrollment")) { updates.enrollment_completed = true; updates.enrollment_date = new Date().toISOString().split("T")[0]; }
    if (!enabled.includes("gusto")) { updates.gusto_completed = true; updates.gusto_date = new Date().toISOString().split("T")[0]; }
    if (Object.keys(updates).length > 0) {
      await supabase.from("profiles").update(updates).eq("id", userId);
    }

    // Return the created profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, name, email, cohort, photo, role")
      .eq("id", userId)
      .single();

    return new Response(JSON.stringify({ profile }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
