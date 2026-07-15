"use server";

import { revalidatePath } from "next/cache";
import { audit } from "@/lib/audit";
import { requireAdmin, requireOwner } from "@/lib/authz";
import {
  type SignInMethods,
  getStoredSignInMethods,
  setSignInMethods,
  signInMethodAvailability,
} from "@/lib/settings/sign-in-methods";
import {
  type WorkspaceBranding,
  getWorkspaceBranding,
  setWorkspaceBranding,
} from "@/lib/settings/workspace";

type ActionResult = { error: string } | { ok: true };

// Instance-critical config stays owner-only — a manager can run the day-to-day
// Admin Center but shouldn't be able to change how anyone signs in
// (docs/self-hosting/boss-employee-flow.md §4.2, footnote 3).
export async function updateSignInMethodsAction(
  next: SignInMethods
): Promise<ActionResult> {
  const admin = await requireOwner();

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

  revalidatePath("/orbit/settings");
  return { ok: true };
}

export async function updateWorkspaceBrandingAction(
  next: WorkspaceBranding
): Promise<ActionResult> {
  const admin = await requireAdmin();

  const name = next.name.trim();
  if (!name) return { error: "Workspace name is required." };
  if (name.length > 80) return { error: "Workspace name is too long (max 80 characters)." };

  const previous = await getWorkspaceBranding();
  const nextBranding: WorkspaceBranding = { name, logoUrl: next.logoUrl?.trim() || null };

  await setWorkspaceBranding(nextBranding);

  await audit({
    action: "settings.workspace_branding_updated",
    actorEmail: admin.user.email,
    actorId: admin.user.id,
    description: `Workspace branding updated — name: "${nextBranding.name}"`,
    entityType: "setting",
    metadata: { previous, next: nextBranding },
  });

  revalidatePath("/orbit/settings");
  return { ok: true };
}
