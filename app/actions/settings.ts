"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  connectedCalendar,
  contact,
  notificationPreference,
  user,
  usernameRedirect,
  userProfile,
  videoConnection,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { requireSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ActionResult<T = {}> = { error: string } | ({ ok: true } & T);

const RESERVED = new Set([
  "orbit",
  "api",
  "admin",
  "dashboard",
  "settings",
  "login",
  "signup",
  "post-auth",
  "onboarding",
  "privacy",
  "terms",
  "cookies",
  "cancel",
  "reschedule",
  "help",
  "support",
  "about",
  "pricing",
]);

function validateUsername(raw: string): string | null {
  const u = raw.toLowerCase().trim();
  if (u.length < 3) {
    return "Username must be at least 3 characters";
  }
  if (u.length > 30) {
    return "Username must be 30 characters or less";
  }
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(u)) {
    return "Only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.";
  }
  if (RESERVED.has(u)) {
    return "That username is reserved. Please choose another.";
  }
  return null;
}

// ── Branding ──────────────────────────────────────────────────────────────────

export async function updateBranding(data: {
  displayName: string;
}): Promise<ActionResult> {
  try {
    const session = await requireSession();
    const displayName = data.displayName.trim();
    if (!displayName) {
      return { error: "Display name is required" };
    }
    if (displayName.length > 64) {
      return { error: "Display name must be 64 characters or less" };
    }

    // Upsert userProfile row
    const [existing] = await db
      .select({ id: userProfile.id })
      .from(userProfile)
      .where(eq(userProfile.userId, session.user.id))
      .limit(1);

    if (existing) {
      await db
        .update(userProfile)
        .set({ displayName, updatedAt: new Date() })
        .where(eq(userProfile.userId, session.user.id));
    } else {
      await db.insert(userProfile).values({
        userId: session.user.id,
        displayName,
      });
    }

    // Also keep user.name in sync
    await db
      .update(user)
      .set({ name: displayName, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    await audit({
      action: "user.branding_updated",
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: "user",
      entityId: session.user.id,
      description: "Updated display name",
    });

    revalidatePath("/settings/branding");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ── My Link ───────────────────────────────────────────────────────────────────

export async function changeUsername(data: {
  username: string;
}): Promise<ActionResult<{ username: string }>> {
  try {
    const session = await requireSession();
    const username = data.username.toLowerCase().trim();

    const usernameError = validateUsername(username);
    if (usernameError) {
      return { error: usernameError };
    }

    // Check availability
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    if (existing && existing.id !== session.user.id) {
      return {
        error: "That username is already taken. Please choose another.",
      };
    }

    // Get current username for redirect record
    const [currentUser] = await db
      .select({ username: user.username })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const oldUsername = currentUser?.username;

    await db
      .update(user)
      .set({ username, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    // Record redirect for old username (30-day TTL)
    if (oldUsername && oldUsername !== username) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      await db.insert(usernameRedirect).values({
        userId: session.user.id,
        oldUsername,
        newUsername: username,
        expiresAt,
      });
    }

    await audit({
      action: "user.username_changed",
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: "user",
      entityId: session.user.id,
      description: `Changed username from "${oldUsername}" to "${username}"`,
      metadata: { oldUsername, newUsername: username },
    });

    revalidatePath("/settings/my-link");
    return { ok: true, username };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Communication Preferences ─────────────────────────────────────────────────

export interface CommPrefs {
  bookingConfirmationEmail: boolean;
  bookingNotificationEmail: boolean;
  cancellationEmail: boolean;
  fromName: string;
  reminderEmail1h: boolean;
  reminderEmail24h: boolean;
  replyToEmail: string;
  rescheduleEmail: boolean;
}

export async function updateCommunicationPrefs(
  data: CommPrefs
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const fromName = data.fromName.trim();
    const replyTo = data.replyToEmail.trim();

    if (replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) {
      return { error: "Reply-to email is not valid" };
    }

    const [existing] = await db
      .select({ id: notificationPreference.id })
      .from(notificationPreference)
      .where(eq(notificationPreference.userId, session.user.id))
      .limit(1);

    const values = {
      bookingConfirmationEmail: data.bookingConfirmationEmail,
      bookingNotificationEmail: data.bookingNotificationEmail,
      reminderEmail24h: data.reminderEmail24h,
      reminderEmail1h: data.reminderEmail1h,
      cancellationEmail: data.cancellationEmail,
      rescheduleEmail: data.rescheduleEmail,
      fromName: fromName || null,
      replyToEmail: replyTo || null,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(notificationPreference)
        .set(values)
        .where(eq(notificationPreference.userId, session.user.id));
    } else {
      await db.insert(notificationPreference).values({
        userId: session.user.id,
        ...values,
      });
    }

    revalidatePath("/settings/communication");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Calendars ─────────────────────────────────────────────────────────────────

export async function disconnectCalendar(
  calendarId: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const [cal] = await db
      .select({
        id: connectedCalendar.id,
        accountEmail: connectedCalendar.accountEmail,
      })
      .from(connectedCalendar)
      .where(
        and(
          eq(connectedCalendar.id, calendarId),
          eq(connectedCalendar.userId, session.user.id)
        )
      )
      .limit(1);

    if (!cal) {
      return { error: "Calendar not found" };
    }

    await db
      .update(connectedCalendar)
      .set({ status: "disconnected", disconnectedAt: new Date() })
      .where(eq(connectedCalendar.id, calendarId));

    await audit({
      action: "calendar.disconnected",
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: "connected_calendar",
      entityId: calendarId,
      description: "Disconnected Google Calendar",
      metadata: { accountEmail: cal.accountEmail },
    });

    revalidatePath("/settings/calendars");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function reconnectCalendar(): Promise<
  ActionResult<{ redirectUrl: string }>
> {
  try {
    await requireSession();
    const redirectUrl = `${env.NEXT_PUBLIC_APP_URL}/api/integrations/google?returnTo=/settings/calendars`;
    return { ok: true, redirectUrl };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Video conferencing (Zoom) ──────────────────────────────────────────────────

export async function disconnectZoom(): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const [conn] = await db
      .select({
        id: videoConnection.id,
        accountEmail: videoConnection.accountEmail,
      })
      .from(videoConnection)
      .where(
        and(
          eq(videoConnection.userId, session.user.id),
          eq(videoConnection.provider, "zoom")
        )
      )
      .limit(1);

    if (!conn) {
      return { error: "Zoom is not connected" };
    }

    await db.delete(videoConnection).where(eq(videoConnection.id, conn.id));

    await audit({
      action: "video.disconnected",
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: "video_connection",
      entityId: conn.id,
      description: "Disconnected Zoom",
      metadata: { provider: "zoom", accountEmail: conn.accountEmail },
    });

    revalidatePath("/settings/integrations");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function upsertContactNote(
  email: string,
  name: string,
  notes: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    const [existing] = await db
      .select({ id: contact.id })
      .from(contact)
      .where(
        and(eq(contact.hostUserId, session.user.id), eq(contact.email, email))
      )
      .limit(1);

    if (existing) {
      await db
        .update(contact)
        .set({ notes: notes || null, updatedAt: new Date() })
        .where(eq(contact.id, existing.id));
    } else {
      await db.insert(contact).values({
        hostUserId: session.user.id,
        email,
        name,
        notes: notes || null,
      });
    }

    revalidatePath("/settings/contacts");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function archiveContact(
  email: string,
  name: string
): Promise<ActionResult> {
  try {
    const session = await requireSession();

    await db
      .insert(contact)
      .values({
        hostUserId: session.user.id,
        email,
        name: name || email,
        isArchived: true,
      })
      .onConflictDoUpdate({
        target: [contact.hostUserId, contact.email],
        set: { isArchived: true, updatedAt: new Date() },
      });

    revalidatePath("/settings/contacts");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function unarchiveContact(email: string): Promise<ActionResult> {
  try {
    const session = await requireSession();

    await db
      .update(contact)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(
        and(eq(contact.hostUserId, session.user.id), eq(contact.email, email))
      );

    revalidatePath("/settings/contacts");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function deleteContact(email: string): Promise<ActionResult> {
  try {
    const session = await requireSession();

    await db
      .delete(contact)
      .where(
        and(eq(contact.hostUserId, session.user.id), eq(contact.email, email))
      );

    revalidatePath("/settings/contacts");
    return { ok: true };
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

// ── Contacts: paginated query helper (called from page) ───────────────────────

export async function getContacts({
  userId,
  page = 1,
  pageSize = 20,
  search = "",
  archived = false,
}: {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  archived?: boolean;
}) {
  const offset = (page - 1) * pageSize;

  // Aggregate from booking table, left-join contact for metadata
  const rows = await db.execute(sql`
    SELECT
      b.invitee_email   AS email,
      MAX(b.invitee_name) AS name,
      COUNT(b.id)::int  AS booking_count,
      MAX(b.start_time) AS last_booked_at,
      c.notes,
      c.is_archived,
      c.id              AS contact_id
    FROM booking b
    LEFT JOIN contact c
      ON c.host_user_id = b.host_user_id
      AND c.email = b.invitee_email
    WHERE b.host_user_id = ${userId}
      AND (c.is_archived IS NULL OR c.is_archived = ${archived})
      ${search ? sql`AND (b.invitee_email ILIKE ${"%" + search + "%"} OR b.invitee_name ILIKE ${"%" + search + "%"})` : sql``}
    GROUP BY b.invitee_email, c.notes, c.is_archived, c.id
    ORDER BY MAX(b.start_time) DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const countRow = await db.execute(sql`
    SELECT COUNT(DISTINCT b.invitee_email)::int AS total
    FROM booking b
    LEFT JOIN contact c
      ON c.host_user_id = b.host_user_id
      AND c.email = b.invitee_email
    WHERE b.host_user_id = ${userId}
      AND (c.is_archived IS NULL OR c.is_archived = ${archived})
      ${search ? sql`AND (b.invitee_email ILIKE ${"%" + search + "%"} OR b.invitee_name ILIKE ${"%" + search + "%"})` : sql``}
  `);

  return {
    contacts: rows as unknown as {
      email: string;
      name: string;
      booking_count: number;
      last_booked_at: string | null;
      notes: string | null;
      is_archived: boolean | null;
      contact_id: string | null;
    }[],
    total: (countRow as unknown as { total: number }[])[0]?.total ?? 0,
  };
}
