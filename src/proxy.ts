import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, type SessionPayload } from "@/lib/auth/session";

const PROTECTED_PREFIXES = ["/dashboard", "/leave", "/admin"];

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("lms_session")?.value;

  let session: SessionPayload | null = null;
  if (token) {
    session = await verifySessionToken(token);
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  const isAdminArea =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && isAdminArea && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/leave/:path*", "/admin/:path*", "/login"],
};