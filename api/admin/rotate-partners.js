import { createClient } from "@supabase/supabase-js";

function mondayOfThisWeek(d = new Date()) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0 Sun, 1 Mon...
  const diff = (day + 6) % 7;   // days since Monday
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  // Simple protection so random people can’t rotate your users
  const adminKey = process.env.ADMIN_ROTATE_KEY;
  const provided =
  req.headers["x-admin-key"] ||
  req.headers["X-Admin-Key"] ||
  req.headers["X-ADMIN-KEY"];
  if (!adminKey || provided !== adminKey) return res.status(401).json({ ok: false });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const weekStart = mondayOfThisWeek();

  // Get unique Whop users we’ve seen
  const { data: members, error: memErr } = await supabase
    .from("whop_memberships")
    .select("whop_user_id")
    .not("whop_user_id", "is", null);

  if (memErr) return res.status(500).json({ ok: false, error: String(memErr.message) });

  const users = Array.from(new Set(members.map(m => m.whop_user_id)));

  if (users.length < 2) return res.status(200).json({ ok: true, message: "Not enough users" });

  shuffle(users);

  // Pair in a ring so odd counts still work (last pairs with first)
  const pairs = users.map((user, i) => ({
    week_start: weekStart,
    user_id: user,
    partner_user_id: users[(i + 1) % users.length],
  }));

  const { error: insErr } = await supabase.from("partner_pairs").insert(pairs);

  if (insErr && !String(insErr.message || "").toLowerCase().includes("duplicate")) {
    return res.status(500).json({ ok: false, error: String(insErr.message || insErr) });
  }

  return res.status(200).json({ ok: true, week_start: weekStart, count: pairs.length });
}
