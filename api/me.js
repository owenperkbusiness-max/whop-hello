import { WhopServerSdk } from "@whop/sdk";

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization || "";

    if (!auth) {
      return res.status(401).json({ ok: false, reason: "missing_authorization_header" });
    }

    const sdk = new WhopServerSdk({
      appId: process.env.WHOP_APP_ID,
      apiKey: process.env.WHOP_API_KEY,
      headers: { authorization: auth }
    });

    const me = await sdk.me.getMe();

    return res.status(200).json({ ok: true, me });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: String(e?.message || e)
    });
  }
}
