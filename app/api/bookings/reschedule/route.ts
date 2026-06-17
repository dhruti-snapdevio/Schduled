import { addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { and, eq, gte, lte, ne } from "drizzle-orm";
import { NextResponse } from "next/server";
import { availabilitySchedule, booking, eventType } from "@/db/schema";
import { db } from "@/lib/db";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";

interface RescheduleBody {
  startUtc: string;
  token: string;
}

export async function POST(request: Request) {
  try {
    const body: RescheduleBody = await request.json();
    const { token, startUtc } = body;

    if (!token || !startUtc) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newStart = new Date(startUtc);
    if (isNaN(newStart.getTime())) {
      return NextResponse.json(
        { error: "Invalid start time" },
        { status: 400 }
      );
    }

    const [b] = await db
      .select({
        id: booking.id,
        status: booking.status,
        startTime: booking.startTime,
        duration: booking.duration,
        hostUserId: booking.hostUserId,
        rescheduleCount: booking.rescheduleCount,
        eventTypeId: booking.eventTypeId,
      })
      .from(booking)
      .where(eq(booking.rescheduleToken, token))
      .limit(1);

    if (!b) {
      return NextResponse.json(
        { error: "This reschedule link is invalid." },
        { status: 404 }
      );
    }

    if (b.status === "cancelled") {
      return NextResponse.json(
        { error: "This booking has been cancelled." },
        { status: 409 }
      );
    }

    const previousStartUtc = new Date(b.startTime).toISOString();
    const newEnd = addMinutes(newStart, b.duration);

    // Load event type for buffers + host timezone
    const et = await db.query.eventType.findFirst({
      where: eq(eventType.id, b.eventTypeId),
    });
    if (!et) {
      return NextResponse.json(
        { error: "Event type not found" },
        { status: 404 }
      );
    }

    const schedule = await db.query.availabilitySchedule.findFirst({
      where: et.availabilityScheduleId
        ? and(
            eq(availabilitySchedule.id, et.availabilityScheduleId),
            eq(availabilitySchedule.userId, b.hostUserId)
          )
        : and(
            eq(availabilitySchedule.userId, b.hostUserId),
            eq(availabilitySchedule.isDefault, true)
          ),
    });
    const hostTz = schedule?.timezone ?? "UTC";

    const bufferStart = et.bufferBefore
      ? addMinutes(newStart, -et.bufferBefore)
      : newStart;
    const bufferEnd = et.bufferAfter
      ? addMinutes(newEnd, et.bufferAfter)
      : newEnd;

    // Conflict check against other confirmed bookings (exclude this one)
    const date = formatInTimeZone(newStart, hostTz, "yyyy-MM-dd");
    const dayStartUtc = fromZonedTime(`${date}T00:00:00`, hostTz);
    const dayEndUtc = fromZonedTime(`${date}T23:59:59`, hostTz);

    const existing = await db
      .select({ startTime: booking.startTime, endTime: booking.endTime })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, b.hostUserId),
          eq(booking.status, "confirmed"),
          ne(booking.id, b.id),
          lte(booking.startTime, dayEndUtc),
          gte(booking.endTime, dayStartUtc)
        )
      );

    const hasConflict = existing.some(
      (e) =>
        bufferStart < new Date(e.endTime) && bufferEnd > new Date(e.startTime)
    );
    if (hasConflict) {
      return NextResponse.json(
        { error: "That time is no longer available. Please pick another." },
        { status: 409 }
      );
    }

    await db
      .update(booking)
      .set({
        startTime: newStart,
        endTime: newEnd,
        status: "confirmed",
        rescheduleCount: b.rescheduleCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(booking.id, b.id));

    await Promise.allSettled([
      enqueueJob(JOB_NAMES.BOOKING_RESCHEDULE_NOTIFY, {
        bookingId: b.id,
        previousStartUtc,
      }),
      enqueueJob(JOB_NAMES.CALENDAR_UPDATE, { bookingId: b.id }),
      enqueueJob(JOB_NAMES.BOOKING_RESCHEDULE_REMINDERS, {
        bookingId: b.id,
        newStartTime: newStart.toISOString(),
        newEndTime: newEnd.toISOString(),
      }),
    ]);

    return NextResponse.json({
      ok: true,
      startUtc: newStart.toISOString(),
      endUtc: newEnd.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/bookings/reschedule]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
