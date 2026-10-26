import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth-token";

const PUBLIC_PATHS = ["/login", "/api/metrics"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const sessionPayload = token ? await verifySessionToken(token) : null;

  if (!sessionPayload && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete(SESSION_COOKIE_NAME);
    }
    return response;
  }

  if (sessionPayload && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Rota /equipe restrita exclusivamente ao SUPER_ADMIN
  if (
    sessionPayload &&
    (pathname === "/equipe" || pathname.startsWith("/equipe/")) &&
    sessionPayload.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
