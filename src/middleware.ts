import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protected paths that require authentication
  const protectedPrefixes = ["/dashboard", "/workspace", "/roadmap", "/admin"];
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = req.cookies.get("auth_token")?.value;

  // 1. Mandatory login check: If no token, redirect to login page
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Role-based check for Admin paths: Students must NOT have access to Admin
  if (pathname.startsWith("/admin")) {
    try {
      // Decode JWT payload without external heavy crypto
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadJson = Buffer.from(parts[1], "base64").toString("utf-8");
        const payload = JSON.parse(payloadJson);

        if (payload.role !== "ADMIN") {
          // Student is not permitted to access Admin area
          const dashboardUrl = new URL("/dashboard", req.url);
          dashboardUrl.searchParams.set("error", "Access Denied: Admin role required");
          return NextResponse.redirect(dashboardUrl);
        }
      } else {
        const loginUrl = new URL("/login", req.url);
        return NextResponse.redirect(loginUrl);
      }
    } catch {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/workspace/:path*", "/roadmap/:path*", "/admin/:path*"],
};
