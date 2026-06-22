"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";

// `redirectTo` is bound per call-site so sign-out returns to the surface the
// user signed out from — the user dashboard goes to /login, the Orbit admin
// panel goes to /orbit/login — instead of branching on the user's role.
export async function logoutAction(
  redirectTo: string = "/login",
  _formData?: FormData,
) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  await auth.api.signOut({ headers: requestHeaders });

  // Manually clear session cookies — server action responses don't forward
  // Set-Cookie headers from auth.api.signOut automatically
  const cookieStore = await cookies();
  cookieStore.delete("better-auth.session_token");
  cookieStore.delete("__Secure-better-auth.session_token");

  if (session) {
    await audit({
      action: "auth.logout",
      actorEmail: session.user.email,
      actorId: session.user.id,
      description: `User logged out: ${session.user.email}`,
      entityId: session.user.id,
      entityType: "user",
    });
  }

  // Only allow internal paths to avoid an open-redirect
  redirect(redirectTo.startsWith("/") ? redirectTo : "/login");
}
