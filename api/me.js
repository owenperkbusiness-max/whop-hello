import Whop from "@whop/sdk";

export async function GET(request) {
  try {
    const whopUserToken = request.headers.get("x-whop-user-token");
    const authorization = request.headers.get("authorization");

    const token = authorization || (whopUserToken ? `Bearer ${whopUserToken}` : "");

    if (!token) {
      return Response.json(
        { ok: false, reason: "missing_auth", expected: "x-whop-user-token or authorization" },
        { status: 401 }
      );
    }

    const apiKey = process.env.WHOP_API_KEY;

    if (!apiKey) {
      return Response.json(
        { ok: false, reason: "missing_env", hasApiKey: false },
        { status: 500 }
      );
    }

    const client = new Whop({ apiKey, headers: { authorization: token } });

    // Minimal “does auth work” call
    const me = await client.me.getMe();

    return Response.json({ ok: true, me }, { status: 200 });
  } catch (e) {
    return Response.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
