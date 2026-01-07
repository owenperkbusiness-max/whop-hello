import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Whop user id from header (works inside Whop iframe)
    const token = req.headers["x-whop-user-token"] || req.headers["X-Whop-User-Token"];
    if (!token) return res.status(401).json({ ok: false, error: "missing_whop_user_token" });

    // For now: you already store whop_user_id in whop_memberships from webhook,
    // but you don’t have token→user lookup here yet, so we do a TEMP hack:
    // allow passing ?user_id=user_... for testing outside Whop
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ ok: false, error: "pass ?user_id=user_... for now" });

    // Get latest week pairing for this user
    const { data, error } = await supabase
      .from("partner_pairs")
      .select("week_start, user_id, partner_user_id")
      .eq("user_id", userId)
      .order("week_start", { ascending: false })
      .limit(1);

    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data || data.length === 0) return res.status(200).json({ ok: true, hasPartner: false });

    return res.status(200).json({ ok: true, hasPartner: true, pairing: data[0] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
