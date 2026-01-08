export default async function handler(req, res) {
  try {
    // Forward the Whop user token to your real API on the same Vercel domain
    const token =
      req.headers["x-whop-user-token"] ||
      req.headers["X-Whop-User-Token"] ||
      req.headers["x-whop-user-token".toLowerCase()];

    if (!token) return res.status(401).json({ ok: false, error: "missing_whop_user_token" });

    // Call the real endpoint internally (server-to-server, no CORS)
    const r = await fetch(`${process.env.VERCEL_URL ? "https://" + process.env.VERCEL_URL : ""}/api/me/partner`, {
      headers: { "x-whop-user-token": token }
    });

    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
