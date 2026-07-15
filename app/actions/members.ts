"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { MANAGER_ROLE, MEMBER_ROLE, OWNER_ROLE } from "@/config/platform";
import { booking, bookingGuest, contact, invitation, user } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin, requireOwner } from "@/lib/authz";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { invitationTemplate } from "@/lib/email/templates/invitation";
import { env } from "@/lib/env";
import {
  createInvitation,
  findPendingInvitationByEmail,
  isValidInvitationRole,
  revokeInvitation,
  type InvitationRole,
} from "@/lib/invitations";
import { createNotification } from "@/lib/notifications/create";
import { getWorkspaceBranding } from "@/lib/settings/workspace";
import { validateEmail } from "@/lib/validators";

type ActionResult<T = Record<never, never>> =
  | { error: string }
  | ({ ok: true } & T);

async function sendInviteEmail(input: {
  email: string;
  role: InvitationRole;
  token: string;
  inviterName: string;
}) {
  const branding = await getWorkspaceBranding();
  const acceptUrl = `${env.NEXT_PUBLIC_APP_URL}/invite/${input.token}`;
  const { html, text } = await invitationTemplate({
    inviteeEmail: input.email,
    inviterName: input.inviterName,
    role: input.role,
    acceptUrl,
    workspaceName: branding.name,
    logoUrl: branding.logoUrl,
  });

  await enqueueEmail({
    to: input.email,
    subject: `You're invited to ${branding.name}`,
    html,
    text,
  });
}

// ── Invite a new member ─────────────────────────────────────────────────────

export async function inviteMemberAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const rawRole = String(formData.get("role") ?? "member");

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };
  if (!isValidInvitationRole(rawRole)) return { error: "Invalid role." };

  try {
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    if (existing) return { error: "That email already has an account." };

    const pending = await findPendingInvitationByEmail(email);
    if (pending) return { error: "There's already a pending invite for that email." };

    const created = await createInvitation({ email, role: rawRole, invitedBy: admin.user.id });

    await sendInviteEmail({
      email,
      role: rawRole,
      token: created.token,
      inviterName: admin.user.name ?? admin.user.email,
    });

    await audit({
      action: "invitation.sent",
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      description: `Invited ${email} as ${rawRole}`,
      entityId: created.id,
      entityType: "invitation",
      metadata: { email, role: rawRole },
    });

    revalidatePath("/orbit/users");
    return { ok: true };
  } catch (err) {
    console.error("[members] inviteMemberAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Resend a pending invite (rotates the token) ─────────────────────────────

export async function resendInviteAction(invitationId: string): Promise<ActionResult> {
  const admin = await requireAdmin();

  try {
    const [existing] = await db
      .select()
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    if (!existing || existing.status !== "pending") {
      return { error: "That invite is no longer pending." };
    }

    await revokeInvitation(existing.id);
    const created = await createInvitation({
      email: existing.email,
      role: existing.role,
      invitedBy: admin.user.id,
    });

    await sendInviteEmail({
      email: created.email,
      role: created.role,
      token: created.token,
      inviterName: admin.user.name ?? admin.user.email,
    });

    await audit({
      action: "invitation.resent",
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      description: `Resent invite to ${created.email}`,
      entityId: created.id,
      entityType: "invitation",
      metadata: { email: created.email, role: created.role },
    });

    revalidatePath("/orbit/users");
    return { ok: true };
  } catch (err) {
    console.error("[members] resendInviteAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Revoke a pending invite ──────────────────────────────────────────────────

export async function revokeInviteAction(invitationId: string): Promise<ActionResult> {
  const admin = await requireAdmin();

  try {
    const [existing] = await db
      .select({ id: invitation.id, email: invitation.email, status: invitation.status })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .limit(1);

    if (!existing || existing.status !== "pending") {
      return { error: "That invite is no longer pending." };
    }

    await revokeInvitation(existing.id);

    await audit({
      action: "invitation.revoked",
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      description: `Revoked invite to ${existing.email}`,
      entityId: existing.id,
      entityType: "invitation",
    });

    revalidatePath("/orbit/users");
    return { ok: true };
  } catch (err) {
    console.error("[members] revokeInviteAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Change an existing member's role (owner only) ───────────────────────────

export async function changeRoleAction(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const userId = String(formData.get("userId") ?? "");
  const rawRole = String(formData.get("role") ?? "");

  if (!isValidInvitationRole(rawRole)) return { error: "Invalid role." };
  if (userId === owner.user.id) return { error: "Use ownership transfer to change your own role." };

  try {
    const [target] = await db
      .select({ id: user.id, role: user.role, email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!target) return { error: "User not found." };
    if (target.role === OWNER_ROLE) {
      return { error: "Use ownership transfer to change the owner's role." };
    }
    if (target.role === rawRole) return { ok: true };

    await db
      .update(user)
      .set({ role: rawRole, updatedAt: new Date() })
      .where(eq(user.id, userId));

    await audit({
      action: "user.role_changed",
      actorId: owner.user.id,
      actorEmail: owner.user.email,
      description: `${target.email} role changed from ${target.role} to ${rawRole}`,
      entityId: userId,
      entityType: "user",
      metadata: { from: target.role, to: rawRole },
    });

    const gainedPanelAccess = rawRole === MANAGER_ROLE && target.role === MEMBER_ROLE;
    const lostPanelAccess = rawRole === MEMBER_ROLE && target.role === MANAGER_ROLE;
    await createNotification({
      userId,
      type: "role_changed",
      title: `Your role is now ${rawRole === MANAGER_ROLE ? "Manager" : "Member"}`,
      body: gainedPanelAccess
        ? "You now have access to the Admin Center."
        : lostPanelAccess
          ? "You no longer have access to the Admin Center."
          : null,
    });

    revalidatePath("/orbit/users");
    return { ok: true };
  } catch (err) {
    console.error("[members] changeRoleAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Transfer ownership (owner only) ─────────────────────────────────────────

export async function transferOwnershipAction(formData: FormData): Promise<ActionResult> {
  const owner = await requireOwner();
  const newOwnerId = String(formData.get("userId") ?? "");

  if (!newOwnerId || newOwnerId === owner.user.id) {
    return { error: "Choose a different account to transfer ownership to." };
  }

  try {
    const [target] = await db
      .select({ id: user.id, name: user.name, email: user.email, banned: user.banned })
      .from(user)
      .where(eq(user.id, newOwnerId))
      .limit(1);

    if (!target) return { error: "User not found." };
    if (target.banned) return { error: "Can't transfer ownership to a suspended account." };

    await db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({ role: OWNER_ROLE, updatedAt: new Date() })
        .where(eq(user.id, newOwnerId));
      await tx
        .update(user)
        .set({ role: MANAGER_ROLE, updatedAt: new Date() })
        .where(eq(user.id, owner.user.id));
    });

    await audit({
      action: "ownership.transferred",
      actorId: owner.user.id,
      actorEmail: owner.user.email,
      description: `Ownership transferred from ${owner.user.email} to ${target.email}`,
      entityId: newOwnerId,
      entityType: "user",
      metadata: { previousOwner: owner.user.id, newOwner: newOwnerId },
    });

    await createNotification({
      userId: newOwnerId,
      type: "ownership_transferred",
      title: "You are now the workspace owner",
      body: `${owner.user.name ?? owner.user.email} transferred ownership to you.`,
    });
    await createNotification({
      userId: owner.user.id,
      type: "ownership_transferred",
      title: "You are no longer the workspace owner",
      body: `Ownership was transferred to ${target.name ?? target.email}. You're now a Manager.`,
    });

    revalidatePath("/orbit/users");
    return { ok: true };
  } catch (err) {
    console.error("[members] transferOwnershipAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Export members / pending invites as CSV ─────────────────────────────────

export async function exportMembersCsvAction(
  filter: "active" | "pending"
): Promise<ActionResult<{ csv: string; filename: string }>> {
  await requireAdmin();

  try {
    if (filter === "pending") {
      const rows = await db
        .select({
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.createdAt,
          expiresAt: invitation.expiresAt,
        })
        .from(invitation)
        .where(eq(invitation.status, "pending"));

      const csv = toCsv(
        ["Email", "Role", "Invited", "Expires"],
        rows.map((r) => [r.email, r.role, r.createdAt.toISOString(), r.expiresAt.toISOString()])
      );
      return { ok: true, csv, filename: "pending-invites.csv" };
    }

    const rows = await db
      .select({
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user);

    const csv = toCsv(
      ["Name", "Email", "Role", "Status", "Joined"],
      rows.map((r) => [
        r.name ?? "",
        r.email,
        r.role ?? MEMBER_ROLE,
        r.banned ? "Suspended" : "Active",
        r.createdAt.toISOString(),
      ])
    );
    return { ok: true, csv, filename: "members.csv" };
  } catch (err) {
    console.error("[members] exportMembersCsvAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Delete an invitee's personal data (GDPR/CCPA-style request) ────────────
// Redacts identifying fields on their booking history and removes any
// contact-book entries with that email, instance-wide. Booking *records*
// stay (for host accounting) but carry no PII after this.

export async function deleteInviteeDataAction(formData: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();

  const emailError = validateEmail(email);
  if (emailError) return { error: emailError };

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(booking)
        .set({
          inviteeName: "Redacted",
          inviteeEmail: `redacted-${Date.now()}@deleted.invalid`,
          inviteePhone: null,
        })
        .where(eq(booking.inviteeEmail, email));

      await tx.delete(bookingGuest).where(eq(bookingGuest.guestEmail, email));
      await tx.delete(contact).where(eq(contact.email, email));
    });

    await audit({
      action: "invitee.data_deleted",
      actorId: admin.user.id,
      actorEmail: admin.user.email,
      description: `Deleted personal data for ${email}`,
      entityType: "invitee",
      metadata: { email },
    });

    revalidatePath("/orbit/settings");
    return { ok: true };
  } catch (err) {
    console.error("[members] deleteInviteeDataAction", err);
    return { error: "Something went wrong. Please try again." };
  }
}
