import type { Job } from "pg-boss";
import { createNotification } from "@/lib/notifications/create";
import { enqueueEmail } from "@/lib/email";
import { approvalRequestTemplate } from "@/lib/email/templates/approval-request";
import type { BookingApprovalRequestPayload } from "@/lib/worker/job-types";
import {
  loadBookingForLifecycle,
  resolveLocationLabel,
} from "./booking-lifecycle-data";

export async function handleBookingApprovalRequest(
  jobs: Job<BookingApprovalRequestPayload>[]
) {
  for (const job of jobs) {
    await processOne(job.data.bookingId);
  }
}

async function processOne(bookingId: string) {
  const b = await loadBookingForLifecycle(bookingId);
  if (!b) {
    console.warn(`[booking-approval-request] booking ${bookingId} not found`);
    return;
  }
  if (b.status !== "pending") {
    console.log(
      `[booking-approval-request] booking ${bookingId} is ${b.status} — skipping`
    );
    return;
  }
  if (!b.approvalToken) {
    console.warn(`[booking-approval-request] booking ${bookingId} has no approvalToken`);
    return;
  }

  const hostTimezone = b.hostTimezone ?? "UTC";
  const locationLabel = resolveLocationLabel(b.etLocationType, b.etLocationValue);

  if (b.hostEmail) {
    const mail = await approvalRequestTemplate({
      approvalToken: b.approvalToken,
      eventName: b.etName,
      hostName: b.hostName ?? "there",
      hostTimezone,
      inviteeEmail: b.inviteeEmail,
      inviteeName: b.inviteeName,
      locationLabel,
      startUtc: new Date(b.startTime),
    });

    await enqueueEmail({
      to: b.hostEmail,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
  }

  await createNotification({
    userId: b.hostUserId,
    type: "booking_pending_approval",
    title: `Booking request: ${b.etName}`,
    body: `${b.inviteeName} requested a booking — awaiting your approval`,
    bookingId: b.id,
  });

  console.log(`[booking-approval-request] processed booking ${bookingId}`);
}
