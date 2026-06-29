import { subHours } from "date-fns";
import type { Job } from "pg-boss";
import { createNotification } from "@/lib/notifications/create";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";
import type { BookingApprovedPayload } from "@/lib/worker/job-types";
import { loadBookingForLifecycle } from "./booking-lifecycle-data";

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

  const startUtc = new Date(b.startTime);

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

  // Generate meeting link for approval-gated bookings (was skipped at booking-time)
  if (b.etLocationType === "zoom" || b.etLocationType === "google_meet") {
    reminders.push(enqueueJob(JOB_NAMES.VIDEO_LINK_GENERATE, { bookingId: b.id }));
  }

  // Send the invitee "approved" email via a delayed job so CALENDAR_WRITE and
  // VIDEO_LINK_GENERATE have time to populate the meet link before the template
  // is rendered (the email is built at job-fire time, not here).
  reminders.push(
    enqueueJob(
      JOB_NAMES.BOOKING_APPROVED_NOTIFY,
      { bookingId: b.id },
      {
        startAfter: (b.etLocationType === "zoom" || b.etLocationType === "google_meet")
          ? new Date(Date.now() + 30_000)
          : undefined,
      }
    )
  );

  await Promise.allSettled(reminders);

  console.log(`[booking-approved] processed booking ${bookingId}`);
}
