import { formatInTimeZone } from "date-fns-tz";
import type { Job } from "pg-boss";
import { enqueueEmail } from "@/lib/email";
import { bookingEmail } from "@/lib/email/templates/booking-emails";
import { createNotification } from "@/lib/notifications/create";
import type { BookingRescheduleNotifyPayload } from "@/lib/worker/job-types";
import {
  loadBookingForLifecycle,
  loadHostPrefs,
  resolveLocationLabel,
  resolveMeetButtonLabel,
} from "./booking-lifecycle-data";

export async function handleBookingRescheduleNotify(
  jobs: Job<BookingRescheduleNotifyPayload>[]
) {
  for (const job of jobs) {
    await processOne(job.data.bookingId, job.data.previousStartUtc);
  }
}

async function processOne(bookingId: string, previousStartUtc: string) {
  const b = await loadBookingForLifecycle(bookingId);
  if (!b) {
    console.warn(`[booking-reschedule-notify] booking ${bookingId} not found`);
    return;
  }
  if (b.status !== "confirmed") {
    console.log(
      `[booking-reschedule-notify] booking ${bookingId} is ${b.status} — skipping`
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
    variant: "reschedule" as const,
    eventName: b.etName,
    startUtc: new Date(b.startTime),
    previousStartUtc: new Date(previousStartUtc),
    hostTimezone,
    inviteeTimezone: b.inviteeTimezone,
    locationLabel,
    cancelToken: b.cancelToken,
    rescheduleToken: b.rescheduleToken,
    reason: null,
  };

  // Invitee
  {
    const mail = await bookingEmail({
      ...base,
      audience: "invitee",
      recipientName: b.inviteeName,
      otherPartyName: b.hostName ?? "your host",
      meetLink: b.videoLinkInvitee,
      meetLabel,
    });
    await enqueueEmail({
      to: b.inviteeEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  }

  // Host
  if (b.hostEmail && prefs?.rescheduleEmail !== false) {
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

  const whenLabel = formatInTimeZone(
    new Date(b.startTime),
    hostTimezone,
    "MMM d 'at' h:mm a"
  );
  await createNotification({
    userId: b.hostUserId,
    type: "booking_rescheduled",
    title: `Booking rescheduled: ${b.etName}`,
    body: `${b.inviteeName}'s booking moved to ${whenLabel}`,
    bookingId: b.id,
  });

  console.log(`[booking-reschedule-notify] processed booking ${bookingId}`);
}
