import { makeUserTokenVerifier } from "@whop/api";

const verifyUserToken = makeUserTokenVerifier({
  appId: process.env.WHOP_APP_ID,
  dontThrow: true,
});

export default async function handler(req, res) {
  const token = req.headers["x-whop-user-token"];

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Missing x-whop-user-token header",
    });
  }

  const result = await verifyUserToken(req.headers);

  if (!result?.userId) {
    return res.status(401).json({ ok: false });
  }

  return res.status(200).json({ ok: true, userId: result.userId });
}
