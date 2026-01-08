import { createClient } from "@supabase/supabase-js";
import { whopsdk } from "../../lib/whop-sdk.js";

function mondayOfThisWeekUTC() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1) - day; // move to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function sendJson(res, status, obj) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, x-whop-user-token");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.end(JSON.stringify(obj));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 200, { ok: true });

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1) Determine user_id
    const url = new URL(req.url, `https://${req.headers.host}`);
    const testUserId = url.searchParams.get("user_id");

    let userId = testUserId;

    if (!userId) {
      // Token mode (inside Whop)
      const verified = await whopsdk.verifyUserToken(req.headers, { dontThrow: true });
      userId = verified?.userId;

      if (!userId) {
        return sendJson(res, 401, {
          ok: false,
          error: "missing_whop_user_token",
          hint: "Inside Whop this should exist. Outside Whop, test with ?user_id=user_...",
        });
      }
    }

    const weekStart = mondayOfThisWeekUTC();

    // 2) Optional: get current user's name (from memberships table)
    const { data: selfMem } = await supabase
      .from("whop_memberships")
      .select("user_name")
      .eq("whop_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle?.() ?? await supabase
        .from("whop_memberships")
        .select("user_name")
        .eq("whop_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
        .catch(() => ({ data: null }));

    const userName = selfMem?.user_name ?? null;

    // 3) Find pairing for this week
    const pairingRes = await supabase
      .from("partner_pairs")
      .select("week_start,user_id,partner_user_id")
      .eq("week_start", weekStart)
      .eq("user_id", userId)
      .limit(1);

    const pairingRow = pairingRes.data?.[0] ?? null;

    if (!pairingRow?.partner_user_id) {
      return sendJson(res, 200, {
        ok: true,
        hasPartner: false,
        pairing: null,
        week_start: weekStart,
        user_id: userId,
        user_name: userName,
      });
    }

    // 4) Get partner name
    const partnerId = pairingRow.partner_user_id;

    const partnerNameRes = await supabase
      .from("whop_memberships")
      .select("user_name")
      .eq("whop_user_id", partnerId)
      .order("created_at", { ascending: false })
      .limit(1);

    const partnerName = partnerNameRes.data?.[0]?.user_name ?? partnerId;

    return sendJson(res, 200, {
      ok: true,
      hasPartner: true,
      pairing: {
        week_start: pairingRow.week_start,
        user_id: pairingRow.user_id,
        partner_user_id: partnerId,
        partner_name: partnerName,
      },
      user_id: userId,
      user_name: userName,
    });
  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      error: "server_error",
      message: String(err?.message || err),
    });
  }
}
