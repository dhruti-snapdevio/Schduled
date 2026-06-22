"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { account, booking, eventType, session as sessionTable, user } from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export async function toggleUserBanAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const banned = String(formData.get("banned") ?? "false") === "true";

  if (userId === admin.user.id && banned) {
    return;
  }

  await db
    .update(user)
    .set({
      banReason: banned ? "Disabled by Orbit admin" : null,
      banned,
      updatedAt: new Date(),
    })
    .where(eq(user.id, userId));

  // Kill all active sessions so the suspension takes effect immediately
  // instead of waiting for the existing session to expire.
  if (banned) {
    await db.delete(sessionTable).where(eq(sessionTable.userId, userId));
  }

  await audit({
    action: banned ? "orbit.user_suspended" : "orbit.user_reactivated",
    actorEmail: admin.user.email,
    actorId: admin.user.id,
    description: banned ? "Suspended user" : "Reactivated user",
    entityId: userId,
    entityType: "user",
  });

  revalidatePath("/orbit/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  // An admin cannot delete their own account from here
  if (!userId || userId === admin.user.id) {
    return;
  }

  const [target] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) {
    redirect("/orbit/users");
  }

  // Audit BEFORE deletion (audit_logs.actor_id has no FK, so it survives)
  await audit({
    action: "orbit.user_deleted",
    actorEmail: admin.user.email,
    actorId: admin.user.id,
    description: `Permanently deleted user: ${target.email}`,
    entityId: userId,
    entityType: "user",
    metadata: { email: target.email },
  });

  // Same safe ordering as the user self-delete in profile.ts:
  // booking has NO ACTION on the user FK, so it must be removed before the
  // user row. Everything else cascades from user/booking.
  await db.transaction(async (tx) => {
    await tx.delete(sessionTable).where(eq(sessionTable.userId, userId));
    await tx.delete(account).where(eq(account.userId, userId));
    await tx.delete(booking).where(eq(booking.hostUserId, userId));
    await tx.delete(user).where(eq(user.id, userId));
  });

  revalidatePath("/orbit/users");
  redirect("/orbit/users");
}

// ── Cancel a single booking (admin) ─────────────────────────────────────────

export async function cancelBookingAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const bookingId  = String(formData.get("bookingId")  ?? "");
  const hostUserId = String(formData.get("hostUserId") ?? "");
  if (!bookingId) return;

  const [b] = await db
    .select({ id: booking.id, status: booking.status, inviteeName: booking.inviteeName })
    .from(booking)
    .where(eq(booking.id, bookingId))
    .limit(1);

  if (!b || b.status === "cancelled") return;

  await db.update(booking).set({
    status:             "cancelled",
    cancelledBy:        "admin",
    cancelledAt:        new Date(),
    cancellationReason: "Cancelled by admin",
    updatedAt:          new Date(),
  }).where(eq(booking.id, bookingId));

  await audit({
    action:      "orbit.booking_cancelled",
    actorEmail:  admin.user.email,
    actorId:     admin.user.id,
    description: `Admin cancelled booking for ${b.inviteeName}`,
    entityId:    bookingId,
    entityType:  "booking",
  });

  revalidatePath(`/orbit/users/${hostUserId}`);
}

// ── Delete a single event type (admin) ──────────────────────────────────────

export async function deleteEventTypeAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const eventTypeId = String(formData.get("eventTypeId") ?? "");
  const hostUserId  = String(formData.get("hostUserId")  ?? "");
  if (!eventTypeId) return;

  const [et] = await db
    .select({ id: eventType.id, name: eventType.name })
    .from(eventType)
    .where(eq(eventType.id, eventTypeId))
    .limit(1);

  if (!et) return;

  await audit({
    action:      "orbit.event_type_deleted",
    actorEmail:  admin.user.email,
    actorId:     admin.user.id,
    description: `Admin deleted event type "${et.name}"`,
    entityId:    eventTypeId,
    entityType:  "event_type",
  });

  await db.delete(booking).where(eq(booking.eventTypeId, eventTypeId));
  await db.delete(eventType).where(eq(eventType.id, eventTypeId));

  revalidatePath(`/orbit/users/${hostUserId}`);
}

// ── Bulk suspend users ───────────────────────────────────────────────────────

export async function bulkBanUsersAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const ids = formData.getAll("userId").map(String).filter((id) => id && id !== admin.user.id);
  if (ids.length === 0) return;

  await db.update(user).set({
    banned:     true,
    banReason:  "Bulk suspended by Orbit admin",
    updatedAt:  new Date(),
  }).where(inArray(user.id, ids));

  await db.delete(sessionTable).where(inArray(sessionTable.userId, ids));

  await audit({
    action:      "orbit.bulk_suspend",
    actorEmail:  admin.user.email,
    actorId:     admin.user.id,
    description: `Bulk suspended ${ids.length} user(s)`,
    entityId:    admin.user.id,
    entityType:  "user",
    metadata:    { count: ids.length },
  });

  revalidatePath("/orbit/users");
}

// ── Bulk delete users ────────────────────────────────────────────────────────

export async function bulkDeleteUsersAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const ids = formData.getAll("userId").map(String).filter((id) => id && id !== admin.user.id);
  if (ids.length === 0) return;

  const targets = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(inArray(user.id, ids));

  for (const target of targets) {
    await audit({
      action:      "orbit.user_deleted",
      actorEmail:  admin.user.email,
      actorId:     admin.user.id,
      description: `Bulk deleted user: ${target.email}`,
      entityId:    target.id,
      entityType:  "user",
      metadata:    { email: target.email },
    });
  }

  await db.transaction(async (tx) => {
    await tx.delete(sessionTable).where(inArray(sessionTable.userId, ids));
    await tx.delete(account).where(inArray(account.userId, ids));
    await tx.delete(booking).where(inArray(booking.hostUserId, ids));
    await tx.delete(user).where(inArray(user.id, ids));
  });

  revalidatePath("/orbit/users");
}
