import { OWNER_ROLE, PANEL_ROLES } from "@/config/platform";

/** Owner or Manager — anyone who can reach the /orbit Admin Center. */
export function isPanelRole(role: string | null | undefined): boolean {
  return PANEL_ROLES.includes(role as (typeof PANEL_ROLES)[number]);
}

/**
 * A manager can act on members only. The owner can act on managers and
 * members, but never on the owner (there's only one) — see
 * docs/self-hosting/boss-employee-flow.md §4.2. Callers still need their own
 * self-action guard (this doesn't know who "self" is).
 */
export function canActOnRole(actorRole: string | null | undefined, targetRole: string | null | undefined): boolean {
  if (targetRole === OWNER_ROLE) return false;
  if (isPanelRole(targetRole) && actorRole !== OWNER_ROLE) return false;
  return true;
}
