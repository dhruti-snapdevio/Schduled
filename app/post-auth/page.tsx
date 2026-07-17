import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/authz";
import { redirectToSetupIfNeeded } from "@/lib/setup";

// /post-auth is the landing target after login (/login), reached after
// both Google OAuth and magic link. Everyone — including admins — lands
// on the same dashboard here; admin-only screens live inside /settings,
// gated by role, not by a separate login flow.
export default async function PostAuthPage() {
  await redirectToSetupIfNeeded();
  const session = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  redirect("/dashboard");
}
