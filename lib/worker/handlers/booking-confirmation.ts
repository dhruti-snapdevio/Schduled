import { formatInTimeZone } from "date-fns-tz";
import type { Job } from "pg-boss";
import { contact } from "@/db/schema";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { bookingEmail } from "@/lib/email/templates/booking-emails";
import { generateBookingICS } from "@/lib/calendar/ics";
import { createNotification } from "@/lib/notifications/create";
import type { BookingConfirmationPayload } from "@/lib/worker/job-types";
import {
  loadBookingForLifecycle,
  loadHostPrefs,
  resolveLocationLabel,
  resolveMeetButtonLabel,
} from "./booking-lifecycle-data";

export async function handleBookingConfirmation(
  jobs: Job<BookingConfirmationPayload>[]
) {
  for (const job of jobs) {
    await processOne(job.data.bookingId);
  }
}

async function processOne(bookingId: string) {
  const b = await loadBookingForLifecycle(bookingId);
  if (!b) {
    console.warn(`[booking-confirmation] booking ${bookingId} not found`);
    return;
  }
  if (b.status !== "confirmed") {
    console.log(
      `[booking-confirmation] booking ${bookingId} is ${b.status} — skipping`
    );
    return;
  }

  const prefs = await loadHostPrefs(b.hostUserId);
  const hostTimezone = b.hostTimezone ?? "UTC";
  const locationLabel = resolveLocationLabel(
    b.etLocationType,
    b.etLocationValue
  );
  const meetLabel = resolveMeetButtonLabel(b.etLocationType);

  const base = {
    variant: "confirmation" as const,
    eventName: b.etName,
    startUtc: new Date(b.startTime),
    previousStartUtc: null,
    hostTimezone,
    inviteeTimezone: b.inviteeTimezone,
    locationLabel,
    cancelToken: b.cancelToken,
    rescheduleToken: b.rescheduleToken,
    reason: null,
  };

  // Invitee confirmation (with ICS calendar attachment)
  if (prefs?.bookingConfirmationEmail !== false) {
    const mail = await bookingEmail({
      ...base,
      audience: "invitee",
      recipientName: b.inviteeName,
      otherPartyName: b.hostName ?? "your host",
      meetLink: b.videoLinkInvitee,
      meetLabel,
    });

    const icsAttachment = generateBookingICS({
      uid: b.id,
      title: `${b.etName} with ${b.hostName ?? "your host"}`,
      description: `${b.etName} meeting via Schduled`,
      startUtc: new Date(b.startTime),
      durationMinutes: Math.round(
        (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 60000
      ),
      organizerName: b.hostName ?? "Your host",
      organizerEmail: b.hostEmail ?? "",
      attendeeEmail: b.inviteeEmail,
      attendeeName: b.inviteeName,
      location: resolveLocationLabel(b.etLocationType, b.etLocationValue),
      meetUrl: b.videoLinkInvitee ?? undefined,
    });

    await enqueueEmail({
      to: b.inviteeEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: [icsAttachment],
    });
  }

  // Host notification
  if (b.hostEmail && prefs?.bookingNotificationEmail !== false) {
    const mail = await bookingEmail({
      ...base,
      audience: "host",
      recipientName: b.hostName ?? "there",
      otherPartyName: b.inviteeName,
      meetLink: b.videoLinkHost,
      meetLabel,
    });
    await enqueueEmail({
      to: b.hostEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  }

  // In-app notification for host
  const whenLabel = formatInTimeZone(
    new Date(b.startTime),
    hostTimezone,
    "MMM d 'at' h:mm a"
  );
  await createNotification({
    userId: b.hostUserId,
    type: "booking_created",
    title: `New booking: ${b.etName}`,
    body: `${b.inviteeName} booked for ${whenLabel}`,
    bookingId: b.id,
  });

  // Auto-save invitee as a contact for the host.
  // Unique index on (hostUserId, email) prevents duplicates silently.
  await db
    .insert(contact)
    .values({
      hostUserId: b.hostUserId,
      email: b.inviteeEmail,
      name: b.inviteeName,
    })
    .onConflictDoNothing();

  console.log(`[booking-confirmation] processed booking ${bookingId}`);
}
