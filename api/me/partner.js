import { createClient } from "@supabase/supabase-js";
import { whopSdk } from "../../lib/whop-sdk.js";

async function getUserIdFromRequest(req) {
  // Token mode (inside Whop): header is automatically included on requests to your app’s own domain
  const token = req.headers["x-whop-user-token"];
  if (token) {
    const result = await whopsdk.verifyUserToken(req.headers, { dontThrow: true });
    if (result?.userId) return result.userId;
  }

  // Manual mode (outside Whop): allow ?user_id=user_xxx for testing
  const url = new URL(req.url, `https://${req.headers.host}`);
  const userId = url.searchParams.get("user_id");
  if (userId) return userId;

  return null;
}

export default async function handler(req, res) {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "missing_whop_user_token",
        hint: "Inside Whop, call this endpoint as a RELATIVE URL: fetch('/api/me/partner')",
      });
    }

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

    // Otherwise: get user from Whop token via Whop API
    if (!userId) {
      const token =
        req.headers["x-whop-user-token"] ||
        req.headers["X-Whop-User-Token"];
    
      if (!token) {
        return res.status(401).json({ ok: false, error: "missing_whop_user_token" });
      }
    
      const meRes = await fetch("https://api.whop.com/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
    
      if (!meRes.ok) {
        return res.status(401).json({ ok: false, error: "invalid_whop_user_token" });
      }
    
      const me = await meRes.json();
      userId = me?.id || me?.user?.id;
    
      if (!userId) {
        return res.status(401).json({ ok: false, error: "whop_me_missing_user_id" });
      }
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
