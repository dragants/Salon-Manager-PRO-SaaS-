import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session-cookie";

const AUTH_ROUTES = new Set(["/login", "/register"]);

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/calendar",
  "/shifts",
  "/clients",
  "/services",
  "/finances",
  "/settings",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Next.js 16+: `proxy` zamenjuje `middleware` (isti matcher i NextResponse). */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(SESSION_COOKIE_NAME)?.value === "1";
  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const needsAuth = isProtectedPath(pathname);

  if (needsAuth && !hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
