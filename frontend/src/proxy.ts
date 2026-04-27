import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/profile", "/settings", "/library", "/submit", "/admin"];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/profile/:path*", "/settings/:path*", "/library/:path*", "/submit/:path*", "/admin/:path*"],
};
