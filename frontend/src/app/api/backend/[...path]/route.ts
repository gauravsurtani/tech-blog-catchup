import { auth, authEnabled } from "@/lib/auth";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
const allowed = {
  GET: [
    /^users\/me$/,
    /^jobs(?:\/\d+)?$/,
    /^posts\/\d+$/,
    /^audio\/jobs\/\d+-\d+\/episode\.mp3$/,
  ],
  POST: [
    /^generate$/,
    /^posts\/submit$/,
    /^jobs\/\d+\/(cancel|publish)$/,
    /^posts\/\d+\/withdraw$/,
  ],
  PATCH: [/^users\/me$/],
};
async function gateway(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  const method = req.method as keyof typeof allowed;
  if (!allowed[method]?.some((p) => p.test(path)))
    return Response.json({ detail: "Not found" }, { status: 404 });
  const site = process.env.AUTH_URL || "https://blog2podcast.com";
  if (method !== "GET" && req.headers.get("origin") !== new URL(site).origin)
    return Response.json({ detail: "Invalid origin" }, { status: 403 });
  const session = authEnabled ? await auth() : null;
  if (!session?.user?.providerSubject || !session.user.verifiedEmail)
    return Response.json({ detail: "Sign in required" }, { status: 401 });
  const secret = process.env.API_SIGNING_SECRET;
  if (!secret || secret.length < 32)
    return Response.json(
      { detail: "Member access is not configured" },
      { status: 503 },
    );
  const now = Math.floor(Date.now() / 1000);
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const unsigned =
    encode({ alg: "HS256", typ: "JWT" }) +
    "." +
    encode({
      sub: session.user.providerSubject,
      email: session.user.email,
      email_verified: true,
      iss: "blog2podcast-web",
      aud: "blog2podcast-api",
      iat: now,
      exp: now + 60,
    });
  const token =
    unsigned +
    "." +
    createHmac("sha256", secret).update(unsigned).digest("base64url");
  const base =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  for (const name of ["content-type", "idempotency-key", "range"]) {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  }
  try {
    const body = method === "GET" ? undefined : await req.text();
    if (body && body.length > 60000)
      return Response.json({ detail: "Request too large" }, { status: 413 });
    const response = await fetch(
      `${base}/${path.startsWith("audio/") ? path : "api/" + path}${req.nextUrl.search}`,
      {
        method,
        headers,
        body,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    const out = new Headers({ "Cache-Control": "no-store", Vary: "Cookie" });
    for (const name of [
      "content-type",
      "content-range",
      "accept-ranges",
      "content-length",
    ]) {
      const v = response.headers.get(name);
      if (v) out.set(name, v);
    }
    return new Response(response.body, {
      status: response.status,
      headers: out,
    });
  } catch {
    return Response.json(
      { detail: "Service unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
export { gateway as GET, gateway as POST, gateway as PATCH };
