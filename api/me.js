import { makeUserTokenVerifier } from "@whop/api";

const verifyUserToken = makeUserTokenVerifier({
  appId: process.env.WHOP_APP_ID || process.env.NEXT_PUBLIC_WHOP_APP_ID,
  dontThrow: true,
});

export default async function handler(req, res) {
  const headers = req.headers;

  const result = await verifyUserToken(headers);

  if (!result?.userId) {
    return res.status(401).json({
      ok: false,
      reason: "token_invalid_or_missing",
      hasTokenHeader: Boolean(headers["x-whop-user-token"]),
      appIdPresent: Boolean(process.env.WHOP_APP_ID || process.env.NEXT_PUBLIC_WHOP_APP_ID),
    });
  }

  return res.status(200).json({ ok: true, userId: result.userId });
}
