import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const event = req.body;
    const eventType = event?.type || null;
    const eventId = event?.id || event?.event_id || null;

    const whopUserId =
      event?.data?.user?.id ||
      event?.data?.user_id ||
      event?.data?.membership?.user_id ||
      null;

    const membershipId =
      event?.data?.membership?.id ||
      event?.data?.membership_id ||
      null;

    const productId =
      event?.data?.product?.id ||
      event?.data?.product_id ||
      event?.data?.membership?.product_id ||
      null;

    const { error } = await supabase.from("whop_memberships").insert({
      event_id: eventId,
      event_type: eventType,
      whop_user_id: whopUserId,
      membership_id: membershipId,
      product_id: productId,
      payload: event,
    });

    if (error && !String(error.message || "").toLowerCase().includes("duplicate")) {
      return res.status(500).json({ ok: false, error: String(error.message || error) });
    }

    return res.status(200).json({ ok: true, stored: true, type: eventType });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
