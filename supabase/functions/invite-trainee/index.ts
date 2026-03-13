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
    const body = await req.json();
    const action = body.action || "create"; // "create" | "invite"

    // Verify caller is authenticated
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: { user: caller }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized", detail: authErr?.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin
    const { data: callerProfile, error: profileErr } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (profileErr || !callerProfile) {
      return new Response(JSON.stringify({ error: `Profile lookup failed: ${profileErr?.message || "not found"}`, caller_id: caller.id }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (callerProfile.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required", role: callerProfile.role }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SEND INVITE (email) to existing user ──
    if (action === "invite") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Get user email
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", user_id).single();
      if (!profile) {
        return new Response(JSON.stringify({ error: "Trainee not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Send invite email via magic link
      const { error: invErr } = await supabase.auth.admin.inviteUserByEmail(profile.email);
      if (invErr) {
        // If already confirmed, generate a magic link instead
        const { data: link, error: linkErr } = await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: profile.email,
        });
        if (linkErr) {
          return new Response(JSON.stringify({ error: linkErr.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      // Mark invite as sent
      await supabase.from("profiles").update({ invite_sent_at: new Date().toISOString() }).eq("id", user_id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── CREATE trainee (no email sent) ──
    const { name, email, cohort, photo, onboarding_steps } = body;

    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Name and email are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create auth user WITHOUT sending invite email
    const tempPw = crypto.randomUUID() + crypto.randomUUID();
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: tempPw,
      email_confirm: false,
      user_metadata: {
        name,
        role: "resident",
      },
    });

    if (createErr) {
      // If user already exists, try to find them and return their profile
      if (createErr.message?.includes("already been registered") || createErr.message?.includes("already exists")) {
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existing = users?.find((u: any) => u.email === email);
        if (existing) {
          const { data: existingProfile } = await supabase
            .from("profiles")
            .select("id, name, email, cohort, photo, role")
            .eq("id", existing.id)
            .single();
          if (existingProfile) {
            return new Response(JSON.stringify({ profile: existingProfile, note: "User already existed" }), {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      }
      return new Response(JSON.stringify({ error: createErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The trigger auto-creates the profile. Update with cohort/photo/onboarding config.
    const userId = created.user.id;
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
