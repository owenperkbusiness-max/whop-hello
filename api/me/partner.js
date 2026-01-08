import { createClient } from "@supabase/supabase-js";
import { whopSdk } from "../../lib/whop-sdk.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "https://whop.com");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "x-whop-user-token,content-type");
  
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ ok: false, error: "missing_supabase_env" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Allow browser testing: /api/me/partner?user_id=user_...
    let userId = req.query.user_id;

    // Otherwise: try Whop header
    if (!userId) {
      const hasTokenHeader =
        !!req.headers["x-whop-user-token"] || !!req.headers["X-Whop-User-Token"] || !!req.headers["x-whop-user-token".toLowerCase()];

      if (!hasTokenHeader) {
        return res.status(401).json({
          ok: false,
          error: "missing_whop_user_token",
          hint: "Inside Whop iframe this should exist. Outside Whop, use ?user_id=user_..."
        });
      }

      let verified;
      try {
        const token =
          req.headers["x-whop-user-token"] ||
          req.headers["X-Whop-User-Token"] ||
          req.query.token;
        
        if (!token) {
          return res.status(401).json({ ok: false, error: "missing_whop_user_token" });
        }
        
        verified = await whopSdk.verifyUserToken({ "x-whop-user-token": token });
      } catch (e) {
        return res.status(401).json({ ok: false, error: "invalid_whop_user_token" });
      }

      userId =
        verified?.user?.id ||
        verified?.userId ||
        verified?.user_id ||
        verified?.id;
      
      if (!userId) {
        return res.status(401).json({
          ok: false,
          error: "token_verified_but_no_user_id",
          verified_keys: Object.keys(verified || {}),
        });
      }
    }

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
