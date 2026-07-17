"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { safeReturnTo } from "@/lib/api/helpers";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";
import { userHasPassword } from "@/lib/auth-password";

// `redirectTo` is bound per call-site so sign-out returns to the surface the
// user signed out from, defaulting to /login.
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

  // Only allow same-origin internal paths — safeReturnTo also rejects
  // protocol-relative ("//evil.com") and backslash targets that startsWith("/")
  // would let through.
  redirect(safeReturnTo(redirectTo, "/login"));
}

/**
 * Set a password for a user who signed up via magic link or Google and has none
 * yet. Better Auth's `setPassword` is a server-only endpoint, so it can't be
 * called from `authClient`. Changing an EXISTING password goes through
 * `authClient.changePassword`, which requires the current password.
 */
export async function setPasswordAction(
  newPassword: string,
): Promise<{ ok: true } | { error: string }> {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return { error: "Unauthorized" };

  // Guard: never let this overwrite an existing password without proving
  // knowledge of the old one — that's what changePassword is for.
  if (await userHasPassword(session.user.id)) {
    return { error: "A password is already set. Use Change password instead." };
  }

  try {
    await auth.api.setPassword({
      body: { newPassword },
      headers: requestHeaders,
    });
  } catch {
    return { error: "Could not set the password. Please try again." };
  }

  await audit({
    action: "auth.password_set",
    actorEmail: session.user.email,
    actorId: session.user.id,
    description: `Password set for ${session.user.email}`,
    entityId: session.user.id,
    entityType: "user",
  });

  return { ok: true };
}
