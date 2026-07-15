import "server-only";

import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { INVITE_TTL_HOURS } from "@/config/platform";
import { invitation } from "@/db/schema";
import { db } from "@/lib/db";

export type InvitationRole = "member" | "manager";

// Owner is never invited — assigned only at setup or via ownership transfer
// (see config/platform.ts OWNER_ROLE and app/actions/members.ts
// transferOwnershipAction). Every invite-role input funnels through this
// guard first.
export function isValidInvitationRole(role: string): role is InvitationRole {
  return role === "member" || role === "manager";
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: InvitationRole;
  token: string;
  invitedBy: string;
  expiresAt: Date;
}

/** The one pending, unexpired invitation for this email, if any. Auto-expires
 * a stale row on read so a token from 8 days ago never sneaks through the
 * signup gate. */
export async function findPendingInvitationByEmail(
  email: string
): Promise<PendingInvitation | null> {
  const normalized = email.toLowerCase().trim();
  const [row] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.email, normalized), eq(invitation.status, "pending")))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .update(invitation)
      .set({ status: "expired" })
      .where(eq(invitation.id, row.id));
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedBy: row.invitedBy,
    expiresAt: row.expiresAt,
  };
}

/** Same lookup, keyed by the token from the accept-invite link. */
export async function findPendingInvitationByToken(
  token: string
): Promise<PendingInvitation | null> {
  const [row] = await db
    .select()
    .from(invitation)
    .where(and(eq(invitation.token, token), eq(invitation.status, "pending")))
    .limit(1);

  if (!row) return null;

  if (row.expiresAt.getTime() < Date.now()) {
    await db
      .update(invitation)
      .set({ status: "expired" })
      .where(eq(invitation.id, row.id));
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    invitedBy: row.invitedBy,
    expiresAt: row.expiresAt,
  };
}

export async function createInvitation(input: {
  email: string;
  role: InvitationRole;
  invitedBy: string;
}) {
  const email = input.email.toLowerCase().trim();
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);

  const [row] = await db
    .insert(invitation)
    .values({
      email,
      role: input.role,
      token,
      invitedBy: input.invitedBy,
      expiresAt,
    })
    .returning();

  return row;
}

export async function markInvitationAccepted(invitationId: string, userId: string) {
  await db
    .update(invitation)
    .set({ status: "accepted", acceptedBy: userId, acceptedAt: new Date() })
    .where(eq(invitation.id, invitationId));
}

export async function revokeInvitation(invitationId: string) {
  await db
    .update(invitation)
    .set({ status: "revoked" })
    .where(and(eq(invitation.id, invitationId), eq(invitation.status, "pending")));
}
