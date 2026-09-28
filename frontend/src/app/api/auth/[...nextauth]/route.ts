import type { NextRequest } from "next/server";
import { authEnabled, handlers } from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!authEnabled) {
    const action = new URL(request.url).pathname.split("/").pop();
    if (action === "session") return Response.json(null);
    if (action === "providers") return Response.json({});
    return Response.json({ error: "Sign-in is not configured" }, { status: 503 });
  }
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  if (!authEnabled)
    return Response.json({ error: "Sign-in is not configured" }, { status: 503 });
  return handlers.POST(request);
}
