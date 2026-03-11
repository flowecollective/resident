import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.11.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("Stripe event:", event.type);

  // Handle checkout completion (one-time or first subscription payment)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const email = session.customer_email || session.customer_details?.email;

    if (!userId) {
      console.error("No client_reference_id on session");
      return new Response("No user ID", { status: 200 });
    }

    const amount = (session.amount_total || 0) / 100;
    const plan = session.mode === "subscription" ? "monthly" : "full";
    const total = plan === "full" ? 4500 : 4950;

    // Upsert tuition record
    await supabase.from("tuition").upsert(
      { user_id: userId, plan, total },
      { onConflict: "user_id" }
    );

    // Insert payment record
    await supabase.from("payments").insert({
      user_id: userId,
      amount,
      date: new Date().toISOString().split("T")[0],
      note: plan === "full" ? "Paid in full" : "Month 1",
      stripe_payment_id: session.payment_intent as string || session.subscription as string,
    });

    // Mark enrollment completed on profile
    await supabase.from("profiles").update({
      enrollment_completed: true,
      enrollment_date: new Date().toISOString().split("T")[0],
      enrollment_plan: plan,
      enrollment_stripe_session: session.id,
    }).eq("id", userId);

    console.log(`Checkout completed for user ${userId}: $${amount} (${plan})`);
  }

  // Handle recurring subscription payments
  if (event.type === "invoice.paid") {
    const invoice = event.data.object as Stripe.Invoice;

    // Skip the first invoice (already handled by checkout.session.completed)
    if (invoice.billing_reason === "subscription_create") {
      return new Response("OK", { status: 200 });
    }

    const customerId = invoice.customer as string;
    const amount = (invoice.amount_paid || 0) / 100;

    // Look up user by Stripe customer ID via existing payment
    const { data: existingPayment } = await supabase
      .from("payments")
      .select("user_id")
      .like("stripe_payment_id", `sub_%`)
      .limit(1);

    // Alternative: look up by customer email
    const customerEmail = invoice.customer_email;
    let userId: string | null = null;

    if (customerEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();
      userId = profile?.id || null;
    }

    if (!userId) {
      console.error("Could not find user for invoice", invoice.id);
      return new Response("OK", { status: 200 });
    }

    // Count existing payments to determine month number
    const { count } = await supabase
      .from("payments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const monthNum = (count || 0) + 1;

    await supabase.from("payments").insert({
      user_id: userId,
      amount,
      date: new Date().toISOString().split("T")[0],
      note: `Month ${monthNum}`,
      stripe_payment_id: invoice.payment_intent as string || invoice.id,
    });

    console.log(`Invoice paid for user ${userId}: $${amount} (Month ${monthNum})`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
