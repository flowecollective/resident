import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const event = req.body?.data;
  if (!event || event.event_type !== "message.received") {
    return res.status(200).json({ ok: true });
  }

  const payload = event.payload;
  const fromPhone = payload.from?.phone_number;
  const text = payload.text;

  if (!fromPhone || !text) {
    return res.status(200).json({ ok: true, note: "missing data" });
  }

  // Normalize phone to E.164 (strip anything non-numeric, ensure +1 prefix)
  const normalized = fromPhone.replace(/\D/g, "").replace(/^1/, "");
  const e164 = `+1${normalized}`;

  // Look up user by phone number
  const { data: contact } = await supabase
    .from("contacts")
    .select("user_id, name")
    .eq("phone", e164)
    .single();

  const senderId = contact?.user_id || "unknown";

  // Look up admin user
  const { data: admin } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  const adminId = admin?.id || "unknown";

  // Store the message
  await supabase.from("messages").insert({
    from_id: senderId,
    to_id: adminId,
    text: text.trim(),
    channel: "sms",
    read: false,
  });

  return res.status(200).json({ ok: true, from: senderId });
}
