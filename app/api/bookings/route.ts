import { createId } from "@paralleldrive/cuid2";
import { addMinutes, addHours, subHours } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { and, eq, gt, gte, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  availabilitySchedule,
  booking,
  bookingAnswer,
  eventType,
  idempotencyKey,
  user,
} from "@/db/schema";
import { db } from "@/lib/db";
import { checkRateLimit, jsonError, rateLimitKey } from "@/lib/api/helpers";
import { isValidTimezone, sanitizeText, validateEmail } from "@/lib/validators";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";

interface BookingBody {
  answers?: {
    questionId: string | null;
    questionLabel: string;
    answer: string;
  }[];
  duration?: number;
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
    // ── Rate limit: 10 bookings/minute per IP ────────────────────────────────
    if (!checkRateLimit(rateLimitKey("POST:/api/bookings", request), 10, 60_000)) {
      return jsonError("Too many requests. Please wait a moment and try again.", 429);
    }

    const body: BookingBody = await request.json();
    const {
      username,
      eventSlug,
      startUtc,
      timezone,
      answers = [],
    } = body;

    // ── Sanitize user-supplied text before any use ───────────────────────────
    const name = sanitizeText(String(body.name ?? ""));
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = body.phone ? sanitizeText(body.phone) : undefined;

    // ── Input validation ─────────────────────────────────────────────────────
    if (!username || !eventSlug || !startUtc || !name || !email || !timezone) {
      return jsonError("Missing required fields", 400);
    }

    const emailError = validateEmail(email);
    if (emailError) return jsonError(emailError, 400);

    if (!isValidTimezone(timezone)) {
      return jsonError("Invalid timezone", 400);
    }

    const startTime = new Date(startUtc);
    if (isNaN(startTime.getTime())) {
      return jsonError("Invalid start time", 400);
    }

    const nowMs = Date.now();

    if (startTime.getTime() <= nowMs) {
      return jsonError("Cannot book a time in the past.", 400);
    }

    // ── Load host + event type (read-only, outside transaction) ──────────────
    const [host] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    if (!host) return jsonError("Host not found", 404);

    const et = await db.query.eventType.findFirst({
      where: and(eq(eventType.userId, host.id), eq(eventType.slug, eventSlug), eq(eventType.isActive, true)),
      with: { durations: true },
    });

    if (!et) return jsonError("Event type not found", 404);

    // Enforce minimum notice
    const minimumNoticeMs = (et.minimumNotice ?? 0) * 60_000;
    if (minimumNoticeMs > 0 && startTime.getTime() - nowMs < minimumNoticeMs) {
      const mins = et.minimumNotice ?? 0;
      const label = mins >= 60 ? `${mins / 60} hour${mins / 60 === 1 ? "" : "s"}` : `${mins} minute${mins === 1 ? "" : "s"}`;
      return jsonError(`This event type requires at least ${label} notice before booking.`, 400);
    }

    // Enforce booking window
    const bookingWindowDays = et.bookingWindow ?? 60;
    const maxBookableMs = nowMs + bookingWindowDays * 86_400_000;
    if (startTime.getTime() > maxBookableMs) {
      return jsonError(`Bookings can only be made up to ${bookingWindowDays} days in advance.`, 400);
    }

    const defaultDuration =
      et.durations.find((d) => d.isDefault)?.duration ?? et.durations[0]?.duration ?? 30;
    // Use client-supplied duration only if it's a valid option for this event type
    const requestedDuration = body.duration ? Number(body.duration) : null;
    const duration =
      requestedDuration && et.durations.some((d) => d.duration === requestedDuration)
        ? requestedDuration
        : defaultDuration;

    const endTime      = addMinutes(startTime, duration);
    const bufferStart  = et.bufferBefore  ? addMinutes(startTime, -et.bufferBefore) : startTime;
    const bufferEnd    = et.bufferAfter   ? addMinutes(endTime,    et.bufferAfter)  : endTime;

    const schedule = await db.query.availabilitySchedule.findFirst({
      where: et.availabilityScheduleId
        ? and(eq(availabilitySchedule.id, et.availabilityScheduleId), eq(availabilitySchedule.userId, host.id))
        : and(eq(availabilitySchedule.userId, host.id), eq(availabilitySchedule.isDefault, true)),
    });

    const hostTz    = schedule?.timezone ?? "UTC";
    const date      = formatInTimeZone(startTime, hostTz, "yyyy-MM-dd");
    const dayStartUtc = fromZonedTime(`${date}T00:00:00`, hostTz);
    const dayEndUtc   = fromZonedTime(`${date}T23:59:59`, hostTz);

    // ── Idempotency check ────────────────────────────────────────────────────
    // Key is deterministic for the same (invitee, host, event, slot) combination.
    // A 2nd submit of the same form returns the already-created booking instantly.
    const idemKey = `booking:${email.toLowerCase().trim()}:${et.id}:${startTime.toISOString()}`;
    const now = new Date();

    const [existing] = await db
      .select({ result: idempotencyKey.result })
      .from(idempotencyKey)
      .where(and(eq(idempotencyKey.key, idemKey), gt(idempotencyKey.expiresAt, now)))
      .limit(1);

    if (existing?.result) {
      return NextResponse.json(JSON.parse(existing.result));
    }

    // ── Transaction: advisory lock → conflict check → INSERT ─────────────────
    const result = await db.transaction(async (tx) => {
      // Serialise concurrent requests targeting the same host + slot.
      // pg_advisory_xact_lock is released automatically on COMMIT/ROLLBACK.
      const lockKey = `${host.id}:${startTime.toISOString()}`;
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`);

      // Re-check conflicts inside the locked transaction
      const existingBookings = await tx
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
        (b) => bufferStart < new Date(b.endTime) && bufferEnd > new Date(b.startTime)
      );

      if (hasConflict) return { conflict: true } as const;

      if (
        et.maxBookingsPerDay != null &&
        existingBookings.length >= et.maxBookingsPerDay
      ) {
        return { dailyLimit: true } as const;
      }

      const cancelToken    = createId();
      const rescheduleToken = createId();

      const [newBooking] = await tx
        .insert(booking)
        .values({
          eventTypeId:      et.id,
          hostUserId:       host.id,
          inviteeName:      name.trim(),
          inviteeEmail:     email.toLowerCase().trim(),
          inviteePhone:     phone?.trim() || null,
          inviteeTimezone:  timezone,
          startTime,
          endTime,
          duration,
          locationValue:    et.locationValue,
          status:           "confirmed",
          cancelToken,
          rescheduleToken,
        })
        .returning();

      if (answers.length > 0) {
        await tx.insert(bookingAnswer).values(
          answers.map((a) => ({
            bookingId:     newBooking.id,
            questionId:    a.questionId,
            questionLabel: a.questionLabel,
            answer:        a.answer,
          }))
        );
      }

      // Persist idempotency result (expires in 24h — same as min booking window)
      // Compute the "effective" location value shown to the invitee after booking:
      // – phone_invitee_calls → host's phone number (they need to call)
      // – in_person / custom  → locationValue (address / custom link)
      const locationValue =
        et.locationType === 'phone_invitee_calls' ? (et.hostPhoneNumber ?? null) :
        (et.locationType === 'in_person' || et.locationType === 'custom') ? (et.locationValue ?? null) :
        null;

      const responsePayload = {
        ok: true,
        bookingId:      newBooking.id,
        cancelToken,
        rescheduleToken,
        eventName:      et.name,
        duration,
        startUtc:       startTime.toISOString(),
        endUtc:         endTime.toISOString(),
        locationValue,
      };

      await tx
        .insert(idempotencyKey)
        .values({
          key:       idemKey,
          result:    JSON.stringify(responsePayload),
          expiresAt: addHours(now, 24),
        })
        .onConflictDoNothing();

      return { ok: true, data: responsePayload } as const;
    });

    if ("conflict" in result && result.conflict) {
      return jsonError("This time slot is no longer available. Please pick another time.", 409);
    }

    if ("dailyLimit" in result && result.dailyLimit) {
      return jsonError("No more bookings available for this day.", 409);
    }

    const { data } = result;

    // ── Fire async booking lifecycle jobs ────────────────────────────────────
    await enqueueBookingJobs({
      bookingId:    data.bookingId,
      startTime,
      locationType: et.locationType,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("[POST /api/bookings]", err);
    return jsonError("Something went wrong. Please try again.", 500);
  }
}

async function enqueueBookingJobs(opts: {
  bookingId:    string;
  startTime:    Date;
  locationType: string;
}) {
  const { bookingId, startTime, locationType } = opts;
  const startUtcIso = startTime.toISOString();
  const now = Date.now();

  const jobs: Promise<unknown>[] = [];

  const needsVideoLink = locationType === "google_meet" || locationType === "zoom";

  // Calendar event (no-op if host has no connected write-target calendar)
  jobs.push(enqueueJob(JOB_NAMES.CALENDAR_WRITE, { bookingId }));

  // Confirmation emails + in-app notification
  // For video events, delay 20 s so CALENDAR_WRITE can create the Meet link first
  jobs.push(
    enqueueJob(
      JOB_NAMES.BOOKING_CONFIRMATION,
      { bookingId },
      needsVideoLink ? { startAfter: 20 } : undefined
    )
  );

  if (needsVideoLink) {
    jobs.push(enqueueJob(JOB_NAMES.VIDEO_LINK_GENERATE, { bookingId }));
  }

  // 24 h reminder
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

  // 1 h reminder
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
      console.error(`[enqueueBookingJobs] job enqueue failed for booking ${bookingId}:`, r.reason);
    }
  }
}
