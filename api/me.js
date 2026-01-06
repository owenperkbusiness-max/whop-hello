import { WhopServerSdk } from "@whop/sdk";

export default async function handler(req, res) {
  try {
    // Whop embedded apps pass a JWT in this header
    const whopToken =
      req.headers["x-whop-user-token"] ||
      req.headers["X-Whop-User-Token"];

    // Fallback if you ever call it manually with Authorization
    const authorization = req.headers.authorization || "";

    const authHeader = authorization || (whopToken ? `Bearer ${whopToken}` : "");

    if (!authHeader) {
      return res.status(401).json({
        ok: false,
        reason: "missing_auth",
        expected: "x-whop-user-token header (in iframe) or Authorization header (manual)",
      });
    }

    const appId = process.env.WHOP_APP_ID;
    const apiKey = process.env.WHOP_API_KEY;

    if (!appId || !apiKey) {
      return res.status(500).json({
        ok: false,
        reason: "missing_env",
        hasAppId: !!appId,
        hasApiKey: !!apiKey,
      });
    }

    const sdk = new WhopServerSdk({
      appId,
      apiKey,
      headers: { authorization: authHeader },
    });

    const me = await sdk.me.getMe();
    return res.status(200).json({ ok: true, me });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
