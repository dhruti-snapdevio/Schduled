import { eq } from "drizzle-orm";
import { booking, eventType, notificationPreference, user } from "@/db/schema";
import { db } from "@/lib/db";

export interface BookingLifecycleRow {
  approvalToken: string | null;
  cancellationReason: string | null;
  cancelToken: string;
  endTime: Date;
  etLocationType: string;
  etLocationValue: string | null;
  etName: string;
  hostEmail: string | null;
  hostName: string | null;
  hostTimezone: string | null;
  hostUserId: string;
  id: string;
  inviteeEmail: string;
  inviteeName: string;
  inviteeTimezone: string;
  rejectionReason: string | null;
  rescheduleToken: string;
  startTime: Date;
  status: string;
  videoLinkHost: string | null;
  videoLinkInvitee: string | null;
}

export async function loadBookingForLifecycle(
  bookingId: string
): Promise<BookingLifecycleRow | null> {
  const [b] = await db
    .select({
      id: booking.id,
      inviteeName: booking.inviteeName,
      inviteeEmail: booking.inviteeEmail,
      inviteeTimezone: booking.inviteeTimezone,
      startTime: booking.startTime,
      endTime: booking.endTime,
      videoLinkInvitee: booking.videoLinkInvitee,
      videoLinkHost: booking.videoLinkHost,
      cancelToken: booking.cancelToken,
      rescheduleToken: booking.rescheduleToken,
      approvalToken: booking.approvalToken,
      status: booking.status,
      cancellationReason: booking.cancellationReason,
      rejectionReason: booking.rejectionReason,
      etName: eventType.name,
      etLocationType: eventType.locationType,
      etLocationValue: eventType.locationValue,
      hostUserId: user.id,
      hostName: user.name,
      hostEmail: user.email,
      hostTimezone: user.timezone,
    })
    .from(booking)
    .innerJoin(eventType, eq(eventType.id, booking.eventTypeId))
    .innerJoin(user, eq(user.id, booking.hostUserId))
    .where(eq(booking.id, bookingId))
    .limit(1);

  return b ?? null;
}

export async function loadHostPrefs(userId: string) {
  const [prefs] = await db
    .select()
    .from(notificationPreference)
    .where(eq(notificationPreference.userId, userId))
    .limit(1);
  return prefs ?? null;
}

export function resolveLocationLabel(
  locationType: string,
  locationValue: string | null
): string {
  switch (locationType) {
    case "google_meet":
      return "Google Meet";
    case "zoom":
      return "Zoom";
    case "phone_host_calls":
      return "Phone (host will call you)";
    case "phone_invitee_calls":
      return locationValue ? `Call: ${locationValue}` : "Phone (you call host)";
    case "in_person":
      return locationValue ?? "In person (see invite for address)";
    case "custom":
      return locationValue ?? "See invite for details";
    default:
      return locationValue ?? "See invite for details";
  }
}

/** Provider-specific label for the "Join …" button in lifecycle emails. */
export function resolveMeetButtonLabel(locationType: string): string {
  switch (locationType) {
    case "google_meet":
      return "Join Google Meet";
    case "zoom":
      return "Join Zoom Meeting";
    default:
      return "Join Meeting";
  }
}
