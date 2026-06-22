"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth";

export async function logoutAction() {
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

  const isAdmin = session?.user?.role === "admin";
  redirect(isAdmin ? "/orbit/login" : "/login");
}
