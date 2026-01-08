export default async function handler(req, res) {
  const token =
    req.headers["x-whop-user-token"] ||
    req.headers["X-Whop-User-Token"] ||
    null;

  return res.status(200).json({
    ok: true,
    origin: req.headers.origin || null,
    host: req.headers.host || null,
    has_token: !!token,
    token_length: token ? token.length : 0,
    token_start: token ? token.slice(0, 12) : null
  });
}
