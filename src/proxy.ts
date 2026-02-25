import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "__session";

function isPublicRoute(pathname: string): boolean {
  if (pathname === "/") return true;
  if (/^\/login(\/.*)?$/.test(pathname)) return true;
  if (/^\/register(\/.*)?$/.test(pathname)) return true;
  if (pathname === "/api/health") return true;
  if (pathname === "/api/plans") return true;
  if (pathname === "/api/auth/session") return true;
  if (pathname === "/api/auth/logout") return true;
  if (/^\/api\/invites\/token\/[^/]+\/preview$/.test(pathname)) return true;
  if (pathname === "/webhook/asaas") return true;
  return false;
}

function hasSessionCookie(request: NextRequest): boolean {
  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  return Boolean(cookie?.value);
}

export function proxy(request: NextRequest) {
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Sessão inválida" } }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)"],
};
