import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/api/auth",     // Better Auth handler
  "/_next",        // Next.js internals
  "/favicon",
  "/cancel/",      // public booking cancel
  "/reschedule/",  // public booking reschedule
];

const AUTH_PATHS = ["/login"];  // redirect to /dashboard if already signed in

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/event-types",
  "/availability",
  "/bookings",
  "/settings",
  "/post-auth",
  "/onboarding",
];

const ADMIN_PREFIXES = ["/orbit"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always public
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p)))
    return NextResponse.next();

  // Static assets
  if (/\.(svg|png|jpg|jpeg|gif|webp|ico|woff2?)$/.test(pathname))
    return NextResponse.next();

  // Landing + legal pages
  if (["/", "/privacy", "/terms", "/cookies"].includes(pathname))
    return NextResponse.next();

  // Public booking pages: /{username}, /{username}/{slug}
  // These are NOT protected — anyone can view a booking page
  // (They look like /<word> or /<word>/<word>, not matching any protected prefix)

  const session =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");
  const hasSession = Boolean(session?.value);

  // Auth pages: signed-in users → go to dashboard
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    return hasSession
      ? NextResponse.redirect(new URL("/post-auth", request.url))
      : NextResponse.next();
  }

  // Protected app routes
  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Admin routes (role check happens in layout via requireAdmin())
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Default: public (booking pages, etc.)
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
