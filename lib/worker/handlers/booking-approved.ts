import { subHours } from "date-fns";
import type { Job } from "pg-boss";
import { createNotification } from "@/lib/notifications/create";
import { generateBookingICS } from "@/lib/calendar/ics";
import { enqueueEmail } from "@/lib/email";
import { approvalApprovedTemplate } from "@/lib/email/templates/approval-approved";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";
import type { BookingApprovedPayload } from "@/lib/worker/job-types";
import {
  loadBookingForLifecycle,
  resolveLocationLabel,
  resolveMeetButtonLabel,
} from "./booking-lifecycle-data";

export async function handleBookingApproved(jobs: Job<BookingApprovedPayload>[]) {
  for (const job of jobs) {
    await processOne(job.data.bookingId);
  }
}

async function processOne(bookingId: string) {
  const b = await loadBookingForLifecycle(bookingId);
  if (!b) {
    console.warn(`[booking-approved] booking ${bookingId} not found`);
    return;
  }
  if (b.status !== "confirmed") {
    console.log(
      `[booking-approved] booking ${bookingId} is ${b.status} — skipping`
    );
    return;
  }

  const hostTimezone = b.hostTimezone ?? "UTC";
  const locationLabel = resolveLocationLabel(b.etLocationType, b.etLocationValue);
  const meetLabel = resolveMeetButtonLabel(b.etLocationType);
  const startUtc = new Date(b.startTime);

  // Invitee approval confirmation email with ICS attachment
  const mail = await approvalApprovedTemplate({
    cancelToken: b.cancelToken,
    eventName: b.etName,
    hostName: b.hostName ?? "your host",
    hostTimezone,
    inviteeName: b.inviteeName,
    inviteeTimezone: b.inviteeTimezone,
    locationLabel,
    meetLabel,
    meetLink: b.videoLinkInvitee,
    rescheduleToken: b.rescheduleToken,
    startUtc,
  });

  const icsAttachment = generateBookingICS({
    uid: b.id,
    title: `${b.etName} with ${b.hostName ?? "your host"}`,
    description: `${b.etName} meeting via Schduled`,
    startUtc,
    durationMinutes: Math.round(
      (new Date(b.endTime).getTime() - startUtc.getTime()) / 60000
    ),
    organizerName: b.hostName ?? "Your host",
    organizerEmail: b.hostEmail ?? "",
    attendeeEmail: b.inviteeEmail,
    attendeeName: b.inviteeName,
    location: locationLabel,
    meetUrl: b.videoLinkInvitee ?? undefined,
  });

  // For Zoom events delay 20 s so VIDEO_LINK_GENERATE can populate the link first
  const emailStartAfter =
    b.etLocationType === "zoom"
      ? new Date(Date.now() + 20_000)
      : undefined;

  await enqueueEmail(
    {
      to: b.inviteeEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: [icsAttachment],
    },
    { startAfter: emailStartAfter, idempotencyKey: `approved:${b.id}:invitee` }
  );

  // In-app notification to host
  await createNotification({
    userId: b.hostUserId,
    type: "booking_created",
    title: `Booking approved: ${b.etName}`,
    body: `You approved ${b.inviteeName}'s booking`,
    bookingId: b.id,
  });

  // Schedule reminder jobs
  const now = Date.now();
  const startUtcIso = startUtc.toISOString();
  const reminders: Promise<unknown>[] = [];

  const remind24h = subHours(startUtc, 24);
  if (remind24h.getTime() > now) {
    reminders.push(
      enqueueJob(
        JOB_NAMES.BOOKING_REMINDER_24H,
        { bookingId: b.id, bookingStartUtc: startUtcIso },
        { singletonKey: `reminder-24h-${b.id}`, startAfter: remind24h }
      )
    );
  }

  const remind1h = subHours(startUtc, 1);
  if (remind1h.getTime() > now) {
    reminders.push(
      enqueueJob(
        JOB_NAMES.BOOKING_REMINDER_1H,
        { bookingId: b.id, bookingStartUtc: startUtcIso },
        { singletonKey: `reminder-1h-${b.id}`, startAfter: remind1h }
      )
    );
  }

  // Calendar write (no-op if no connected calendar)
  reminders.push(enqueueJob(JOB_NAMES.CALENDAR_WRITE, { bookingId: b.id }));

  // Zoom: generate meeting link (was not created at booking-time for approval-gated bookings)
  if (b.etLocationType === "zoom") {
    reminders.push(enqueueJob(JOB_NAMES.VIDEO_LINK_GENERATE, { bookingId: b.id }));
  }

  await Promise.allSettled(reminders);

  console.log(`[booking-approved] processed booking ${bookingId}`);
}
