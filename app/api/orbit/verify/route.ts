import { type NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLE } from "@/config/platform";
import { auth } from "@/lib/auth";

// After Google OAuth, Better Auth redirects here so we can verify admin role
// before granting access to /orbit. Non-admins are signed out immediately.
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });

  const base = new URL("/", request.url);
  const loginUrl = new URL("/orbit/login", base);
  const orbitUrl = new URL("/orbit", base);

  if (!session) {
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.role === ADMIN_ROLE) {
    return NextResponse.redirect(orbitUrl);
  }

  // Non-admin signed in via Google — sign them out and show error
  loginUrl.searchParams.set("error", "not_admin");
  const response = NextResponse.redirect(loginUrl);

  // Clear session cookies so the user is fully signed out
  response.cookies.delete("better-auth.session_token");
  response.cookies.delete("__Secure-better-auth.session_token");

  return response;
}
