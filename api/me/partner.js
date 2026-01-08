import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // If these are missing, we return JSON instead of crashing
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        ok: false,
        error: "missing_supabase_env",
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ ok: false, error: "missing_user_id", example: "?user_id=user_123" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase.rpc("get_partner_with_name", {
      input_user_id: userId
    });

    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!data || data.length === 0) return res.status(200).json({ ok: true, hasPartner: false });

    return res.status(200).json({ ok: true, hasPartner: true, pairing: data[0] });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
