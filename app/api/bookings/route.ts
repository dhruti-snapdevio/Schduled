import { createId } from "@paralleldrive/cuid2";
import { addMinutes, subHours } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  availabilitySchedule,
  booking,
  bookingAnswer,
  eventType,
  user,
} from "@/db/schema";
import { db } from "@/lib/db";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";

interface BookingBody {
  answers?: {
    questionId: string | null;
    questionLabel: string;
    answer: string;
  }[];
  email: string;
  eventSlug: string;
  name: string;
  phone?: string;
  startUtc: string;
  timezone: string;
  username: string;
}

export async function POST(request: Request) {
  try {
    const body: BookingBody = await request.json();
    const {
      username,
      eventSlug,
      startUtc,
      name,
      email,
      phone,
      timezone,
      answers = [],
    } = body;

    if (
      !username ||
      !eventSlug ||
      !startUtc ||
      !name?.trim() ||
      !email?.trim() ||
      !timezone
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const startTime = new Date(startUtc);
    if (isNaN(startTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid start time" },
        { status: 400 }
      );
    }

    const [host] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    if (!host) {
      return NextResponse.json({ error: "Host not found" }, { status: 404 });
    }

    const et = await db.query.eventType.findFirst({
      where: and(
        eq(eventType.userId, host.id),
        eq(eventType.slug, eventSlug),
        eq(eventType.isActive, true)
      ),
      with: { durations: true },
    });

    if (!et) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 }
      );
    }

    const duration =
      et.durations.find((d) => d.isDefault)?.duration ??
      et.durations[0]?.duration ??
      30;

    const endTime = addMinutes(startTime, duration);
    const bufferStart = et.bufferBefore
      ? addMinutes(startTime, -et.bufferBefore)
      : startTime;
    const bufferEnd = et.bufferAfter
      ? addMinutes(endTime, et.bufferAfter)
      : endTime;

    // Load schedule to get host timezone
    const schedule = await db.query.availabilitySchedule.findFirst({
      where: et.availabilityScheduleId
        ? and(
            eq(availabilitySchedule.id, et.availabilityScheduleId),
            eq(availabilitySchedule.userId, host.id)
          )
        : and(
            eq(availabilitySchedule.userId, host.id),
            eq(availabilitySchedule.isDefault, true)
          ),
    });

    const hostTz = schedule?.timezone ?? "UTC";
    const date = formatInTimeZone(startTime, hostTz, "yyyy-MM-dd");
    const dayStartUtc = fromZonedTime(`${date}T00:00:00`, hostTz);
    const dayEndUtc = fromZonedTime(`${date}T23:59:59`, hostTz);

    // Check for conflicts with existing confirmed bookings only
    const existingBookings = await db
      .select({ startTime: booking.startTime, endTime: booking.endTime })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, host.id),
          eq(booking.status, "confirmed"),
          lte(booking.startTime, dayEndUtc),
          gte(booking.endTime, dayStartUtc)
        )
      );

    const hasConflict = existingBookings.some(
      (b) =>
        bufferStart < new Date(b.endTime) && bufferEnd > new Date(b.startTime)
    );

    if (hasConflict) {
      return NextResponse.json(
        {
          error:
            "This time slot is no longer available. Please pick another time.",
        },
        { status: 409 }
      );
    }

    if (
      et.maxBookingsPerDay !== null &&
      et.maxBookingsPerDay !== undefined &&
      existingBookings.length >= et.maxBookingsPerDay
    ) {
      return NextResponse.json(
        { error: "No more bookings available for this day." },
        { status: 409 }
      );
    }

    const cancelToken = createId();
    const rescheduleToken = createId();

    const [newBooking] = await db
      .insert(booking)
      .values({
        eventTypeId: et.id,
        hostUserId: host.id,
        inviteeName: name.trim(),
        inviteeEmail: email.toLowerCase().trim(),
        inviteePhone: phone?.trim() || null,
        inviteeTimezone: timezone,
        startTime,
        endTime,
        duration,
        locationValue: et.locationValue,
        status: "confirmed",
        cancelToken,
        rescheduleToken,
      })
      .returning();

    if (answers.length > 0) {
      await db.insert(bookingAnswer).values(
        answers.map((a) => ({
          bookingId: newBooking.id,
          questionId: a.questionId,
          questionLabel: a.questionLabel,
          answer: a.answer,
        }))
      );
    }

    // ── Fire the booking lifecycle pipeline ──────────────────────────────────
    // Enqueue confirmation emails + host notification, calendar event, video
    // link, and 24h/1h reminders. These run async in pg-boss; a failure to
    // enqueue must never fail the booking itself.
    await enqueueBookingJobs({
      bookingId: newBooking.id,
      startTime,
      locationType: et.locationType,
    });

    return NextResponse.json({
      ok: true,
      bookingId: newBooking.id,
      cancelToken,
      rescheduleToken,
      eventName: et.name,
      duration,
      startUtc: startTime.toISOString(),
      endUtc: endTime.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

async function enqueueBookingJobs(opts: {
  bookingId: string;
  startTime: Date;
  locationType: string;
}) {
  const { bookingId, startTime, locationType } = opts;
  const startUtcIso = startTime.toISOString();
  const now = Date.now();

  const jobs: Promise<unknown>[] = [];

  // For video-call events the Meet link is created by CALENDAR_WRITE and then
  // read by BOOKING_CONFIRMATION for the email button. Both jobs are enqueued
  // here and run concurrently, but the email is fast and the calendar write is
  // slow (waits on Google), so without a head start the confirmation email
  // would send before the link exists. Give CALENDAR_WRITE a short lead so the
  // link is populated first. Non-video events send the email immediately.
  const needsVideoLink =
    locationType === "google_meet" || locationType === "zoom";

  // Calendar event (no-op if host has no connected write-target calendar)
  jobs.push(enqueueJob(JOB_NAMES.CALENDAR_WRITE, { bookingId }));

  // Confirmation (invitee + host emails + in-app notification)
  jobs.push(
    enqueueJob(
      JOB_NAMES.BOOKING_CONFIRMATION,
      { bookingId },
      needsVideoLink ? { startAfter: 20 } : undefined
    )
  );

  // Video link for conferencing location types
  if (needsVideoLink) {
    jobs.push(enqueueJob(JOB_NAMES.VIDEO_LINK_GENERATE, { bookingId }));
  }

  // 24h reminder — only if the fire time is still in the future
  const remind24h = subHours(startTime, 24);
  if (remind24h.getTime() > now) {
    jobs.push(
      enqueueJob(
        JOB_NAMES.BOOKING_REMINDER_24H,
        { bookingId, bookingStartUtc: startUtcIso },
        { singletonKey: `reminder-24h-${bookingId}`, startAfter: remind24h }
      )
    );
  }

  // 1h reminder
  const remind1h = subHours(startTime, 1);
  if (remind1h.getTime() > now) {
    jobs.push(
      enqueueJob(
        JOB_NAMES.BOOKING_REMINDER_1H,
        { bookingId, bookingStartUtc: startUtcIso },
        { singletonKey: `reminder-1h-${bookingId}`, startAfter: remind1h }
      )
    );
  }

  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error(
        `[enqueueBookingJobs] job enqueue failed for booking ${bookingId}:`,
        r.reason
      );
    }
  }
}
