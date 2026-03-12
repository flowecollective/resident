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
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
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
    const discount = ((session as any).total_details?.amount_discount || 0) / 100;
    const plan = session.mode === "subscription" ? "monthly" : "full";
    const fullPrice = plan === "full" ? 4500 : 4950;

    // If discounted, adjust tuition total to what they actually owe
    // For subscriptions, discount applies per payment so adjust total proportionally
    let total = fullPrice;
    if (discount > 0) {
      if (plan === "full") {
        total = amount; // They owe exactly what Stripe charged
      } else {
        // Monthly: discount per installment × 3 payments
        total = amount * 3;
      }
    }

    // Upsert tuition record
    await supabase.from("tuition").upsert(
      { user_id: userId, plan, total },
      { onConflict: "user_id" }
    );

    // Insert payment record (only if amount > 0)
    if (amount > 0) {
      // Fetch receipt URL from the charge
      let receiptUrl: string | null = null;
      const piId = session.payment_intent as string;
      if (piId) {
        try {
          const pi = await stripe.paymentIntents.retrieve(piId);
          if (pi.latest_charge) {
            const charge = await stripe.charges.retrieve(pi.latest_charge as string);
            receiptUrl = charge.receipt_url || null;
          }
        } catch (e) { console.error("Receipt fetch error:", e); }
      }

      await supabase.from("payments").insert({
        user_id: userId,
        amount,
        date: new Date().toISOString().split("T")[0],
        note: discount > 0
          ? `${plan === "full" ? "Paid in full" : "Month 1"} (promo: -$${discount.toLocaleString()})`
          : (plan === "full" ? "Paid in full" : "Month 1"),
        stripe_payment_id: piId || session.subscription as string,
        receipt_url: receiptUrl,
      });
    } else {
      // 100% discount — mark as fully paid with $0 tuition
      await supabase.from("tuition").upsert(
        { user_id: userId, plan, total: 0 },
        { onConflict: "user_id" }
      );
    }

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

    const amount = (invoice.amount_paid || 0) / 100;

    // Skip $0 invoices (fully discounted)
    if (amount <= 0) {
      console.log("Skipping $0 invoice");
      return new Response("OK", { status: 200 });
    }

    // Look up user by customer email
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

    // Fetch receipt URL from the charge
    let receiptUrl: string | null = null;
    const invPiId = invoice.payment_intent as string;
    if (invPiId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(invPiId);
        if (pi.latest_charge) {
          const charge = await stripe.charges.retrieve(pi.latest_charge as string);
          receiptUrl = charge.receipt_url || null;
        }
      } catch (e) { console.error("Receipt fetch error:", e); }
    }

    await supabase.from("payments").insert({
      user_id: userId,
      amount,
      date: new Date().toISOString().split("T")[0],
      note: `Month ${monthNum}`,
      stripe_payment_id: invPiId || invoice.id,
      receipt_url: receiptUrl,
    });

    console.log(`Invoice paid for user ${userId}: $${amount} (Month ${monthNum})`);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
