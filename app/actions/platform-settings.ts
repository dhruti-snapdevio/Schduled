"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import {
  type SignInMethods,
  getStoredSignInMethods,
  setSignInMethods,
  signInMethodAvailability,
} from "@/lib/settings/sign-in-methods";

type ActionResult = { error: string } | { ok: true };

export async function updateSignInMethodsAction(
  next: SignInMethods
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const previous = await getStoredSignInMethods();

  // The toggles only govern methods the deployment can actually offer. For an
  // unavailable method, preserve the stored intent instead of forcing it off —
  // so enabling it in the env later (e.g. adding Google OAuth creds) restores
  // the admin's earlier choice rather than silently leaving it disabled.
  const nextStored: SignInMethods = {
    password: signInMethodAvailability.password ? next.password : previous.password,
    magicLink: signInMethodAvailability.magicLink ? next.magicLink : previous.magicLink,
    google: signInMethodAvailability.google ? next.google : previous.google,
  };

  // At least one *effective* method (available AND enabled) must remain, or the
  // deployment would have no working way to sign in.
  const anyEffective =
    (signInMethodAvailability.password && nextStored.password) ||
    (signInMethodAvailability.magicLink && nextStored.magicLink) ||
    (signInMethodAvailability.google && nextStored.google);
  if (!anyEffective) {
    return { error: "At least one sign-in method must stay enabled." };
  }

  await setSignInMethods(nextStored);

  await audit({
    action: "settings.signin_methods_updated",
    actorEmail: admin.user.email,
    actorId: admin.user.id,
    description: `Sign-in methods updated — password: ${nextStored.password}, magic link: ${nextStored.magicLink}, Google: ${nextStored.google}`,
    entityType: "setting",
    metadata: { previous, next: nextStored },
  });

  revalidatePath("/settings/platform");
  return { ok: true };
}
