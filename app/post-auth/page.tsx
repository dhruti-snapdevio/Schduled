import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/authz";

// /post-auth is the landing target for the regular USER login (/login),
// reached after both Google OAuth and magic link. Everyone — including
// admins — lands on the user dashboard here. The admin panel is reached
// ONLY through /orbit/login (which routes via /api/orbit/verify). Keeping
// this redirect role-agnostic is what stops user login from opening Orbit.
export default async function PostAuthPage() {
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  redirect("/dashboard");
}
