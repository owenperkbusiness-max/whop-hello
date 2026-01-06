export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    // Log-like response so you can see it worked
    const event = req.body; // Vercel parses JSON by default for serverless functions
    return res.status(200).json({ ok: true, received: true, type: event?.type || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
