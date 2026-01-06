import { WhopServerSdk } from "@whop/sdk";

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || "";

    if (!auth) {
      return res.status(401).json({ ok: false, reason: "missing_authorization_header" });
    }

    const appId = process.env.WHOP_APP_ID;
    const apiKey = process.env.WHOP_API_KEY;

    if (!appId || !apiKey) {
      return res.status(500).json({
        ok: false,
        reason: "missing_env",
        hasAppId: !!appId,
        hasApiKey: !!apiKey
      });
    }

    const sdk = new WhopServerSdk({
      appId,
      apiKey,
      headers: { authorization: auth }
    });

    const me = await sdk.me.getMe();

    return res.status(200).json({ ok: true, me });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
