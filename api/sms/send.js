import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { to_user_id, text } = req.body;

  if (!to_user_id || !text) {
    return res.status(400).json({ error: "Missing to_user_id or text" });
  }

  // Look up recipient's phone number
  const { data: contact } = await supabase
    .from("contacts")
    .select("phone")
    .eq("user_id", to_user_id)
    .single();

  if (!contact?.phone) {
    return res.status(404).json({ error: "No phone number for this user" });
  }

  // Send SMS via Telnyx
  const telnyxRes = await fetch("https://api.telnyx.com/v2/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
    },
    body: JSON.stringify({
      from: process.env.TELNYX_PHONE_NUMBER,
      to: contact.phone,
      text,
    }),
  });

  if (!telnyxRes.ok) {
    const err = await telnyxRes.text();
    console.error("Telnyx send failed:", err);
    return res.status(500).json({ error: "Failed to send SMS" });
  }

  return res.status(200).json({ ok: true });
}
