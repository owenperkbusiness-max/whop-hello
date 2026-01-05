import Whop from "@whop/sdk";

const whop = new Whop({
  apiKey: process.env.WHOP_API_KEY,
  appID: process.env.WHOP_APP_ID,
});

export default async function handler(req, res) {
  console.log("ENV", {
    hasKey: !!process.env.WHOP_API_KEY,
    hasApp: !!process.env.WHOP_APP_ID
  });
  try {
    const result = await whop.verifyUserToken(req.headers, { dontThrow: true });

    if (!result?.userId) {
      return res.status(401).json({
        ok: false,
        reason: "token_invalid_or_missing",
        hasTokenHeader: Boolean(req.headers["x-whop-user-token"]),
        appIdPresent: Boolean(process.env.WHOP_APP_ID),
        apiKeyPresent: Boolean(process.env.WHOP_API_KEY)
      });
    }

    return res.status(200).json({ ok: true, userId: result.userId });
  } catch (e) {
    return res.status(500).json({ ok: false, reason: "server_error" });
  }
}
