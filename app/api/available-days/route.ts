import { eachDayOfInterval } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { and, eq, gte, lte } from "drizzle-orm";
import { NextResponse } from "next/server";
import {
  availabilityOverride,
  availabilitySchedule,
  booking,
  eventType,
  user,
} from "@/db/schema";
import { generateSlots } from "@/lib/calendar/slots";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");
  const slug = searchParams.get("slug");
  const month = searchParams.get("month"); // YYYY-MM

  if (!username || !slug || !month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Missing required params" },
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
      eq(eventType.slug, slug),
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

  const defaultDuration =
    et.durations.find((d) => d.isDefault)?.duration ??
    et.durations[0]?.duration ??
    30;

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
    with: { windows: true },
  });

  if (!schedule) {
    return NextResponse.json({ availableDates: [] });
  }

  const hostTz = schedule.timezone;
  const now = new Date();
  const today = formatInTimeZone(now, hostTz, "yyyy-MM-dd");
  const maxDate = formatInTimeZone(
    new Date(now.getTime() + (et.bookingWindow ?? 60) * 24 * 60 * 60 * 1000),
    hostTz,
    "yyyy-MM-dd"
  );

  // Build day list for the requested month
  const [year, mon] = month.split("-").map(Number);
  const monthStart = new Date(year, mon - 1, 1);
  const monthEnd = new Date(year, mon - 1 + 1, 0); // last day of month
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pre-fetch overrides for the whole month
  const monthFirstDate = `${month}-01`;
  const monthLastDate = formatInTimeZone(monthEnd, "UTC", "yyyy-MM-dd");

  const overrideRows = await db
    .select()
    .from(availabilityOverride)
    .where(
      and(
        eq(availabilityOverride.userId, host.id),
        gte(availabilityOverride.date, monthFirstDate),
        lte(availabilityOverride.date, monthLastDate)
      )
    );

  const blockedDates = new Set(
    overrideRows.filter((o) => o.isBlocked).map((o) => o.date)
  );
  const overridesByDate = new Map<
    string,
    { startTime: string; endTime: string }[]
  >();
  for (const o of overrideRows) {
    if (!o.isBlocked && o.startTime && o.endTime) {
      const existing = overridesByDate.get(o.date) ?? [];
      existing.push({ startTime: o.startTime, endTime: o.endTime });
      overridesByDate.set(o.date, existing);
    }
  }

  // Pre-fetch bookings for the whole month range
  const monthStartUtc = fromZonedTime(`${monthFirstDate}T00:00:00`, hostTz);
  const monthEndUtc = fromZonedTime(`${monthLastDate}T23:59:59`, hostTz);

  const monthBookings = await db
    .select({ startTime: booking.startTime, endTime: booking.endTime })
    .from(booking)
    .where(
      and(
        eq(booking.hostUserId, host.id),
        eq(booking.status, "confirmed"),
        lte(booking.startTime, monthEndUtc),
        gte(booking.endTime, monthStartUtc)
      )
    );

  const availableDates: string[] = [];

  for (const day of daysInMonth) {
    const dateStr = formatInTimeZone(day, "UTC", "yyyy-MM-dd");

    if (dateStr < today || dateStr > maxDate) {
      continue;
    }
    if (blockedDates.has(dateStr)) {
      continue;
    }

    // Determine availability windows for this day
    let windows: { startTime: string; endTime: string }[];

    if (overridesByDate.has(dateStr)) {
      windows = overridesByDate.get(dateStr)!;
    } else {
      const dayName = formatInTimeZone(
        new Date(`${dateStr}T12:00:00Z`),
        hostTz,
        "EEEE"
      ).toLowerCase();
      windows = schedule.windows
        .filter((w) => w.dayOfWeek === dayName)
        .map((w) => ({ startTime: w.startTime, endTime: w.endTime }));
    }

    if (windows.length === 0) {
      continue;
    }

    // Filter existing bookings to this day
    const dayStartUtc = fromZonedTime(`${dateStr}T00:00:00`, hostTz);
    const dayEndUtc = fromZonedTime(`${dateStr}T23:59:59`, hostTz);

    const dayBookings = monthBookings.filter(
      (b) =>
        new Date(b.startTime) <= dayEndUtc && new Date(b.endTime) >= dayStartUtc
    );

    // Check maxBookingsPerDay
    if (
      et.maxBookingsPerDay !== null &&
      et.maxBookingsPerDay !== undefined &&
      dayBookings.length >= et.maxBookingsPerDay
    ) {
      continue;
    }

    // Check if at least one slot exists
    const slots = generateSlots({
      date: dateStr,
      timezone: hostTz,
      windows,
      durationMinutes: defaultDuration,
      bufferBefore: et.bufferBefore ?? 0,
      bufferAfter: et.bufferAfter ?? 0,
      increment: et.startTimeIncrement ?? 30,
      existingBookings: dayBookings.map((b) => ({
        startTime: new Date(b.startTime),
        endTime: new Date(b.endTime),
      })),
      minimumNoticeMinutes: et.minimumNotice ?? 60,
      nowUtc: now,
    });

    if (slots.length > 0) {
      availableDates.push(dateStr);
    }
  }

  return NextResponse.json({ availableDates });
}
