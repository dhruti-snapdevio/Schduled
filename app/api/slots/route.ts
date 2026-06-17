import { NextResponse } from 'next/server'
import { and, eq, gte, lte } from 'drizzle-orm'
import { addDays } from 'date-fns'
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import { db } from '@/lib/db'
import {
  user,
  eventType,
  availabilitySchedule,
  availabilityOverride,
  booking,
} from '@/db/schema'
import { generateSlots } from '@/lib/calendar/slots'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const slug = searchParams.get('slug')
  const date = searchParams.get('date') // YYYY-MM-DD in host TZ

  if (!username || !slug || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Missing required params' }, { status: 400 })
  }

  const [host] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.username, username))
    .limit(1)

  if (!host) return NextResponse.json({ error: 'Host not found' }, { status: 404 })

  const et = await db.query.eventType.findFirst({
    where: and(
      eq(eventType.userId, host.id),
      eq(eventType.slug, slug),
      eq(eventType.isActive, true),
    ),
    with: { durations: true },
  })

  if (!et) return NextResponse.json({ error: 'Event type not found' }, { status: 404 })

  const defaultDuration =
    et.durations.find((d) => d.isDefault)?.duration ??
    et.durations[0]?.duration ??
    30

  const now = new Date()

  const schedule = await db.query.availabilitySchedule.findFirst({
    where: et.availabilityScheduleId
      ? and(
          eq(availabilitySchedule.id, et.availabilityScheduleId),
          eq(availabilitySchedule.userId, host.id),
        )
      : and(
          eq(availabilitySchedule.userId, host.id),
          eq(availabilitySchedule.isDefault, true),
        ),
    with: { windows: true },
  })

  if (!schedule) return NextResponse.json({ slots: [] })

  const hostTz = schedule.timezone
  const today = formatInTimeZone(now, hostTz, 'yyyy-MM-dd')
  const maxDate = formatInTimeZone(addDays(now, et.bookingWindow ?? 60), hostTz, 'yyyy-MM-dd')

  if (date < today || date > maxDate) return NextResponse.json({ slots: [] })

  // Check overrides for this exact date
  const overrideRows = await db
    .select()
    .from(availabilityOverride)
    .where(and(
      eq(availabilityOverride.userId, host.id),
      eq(availabilityOverride.date, date),
    ))

  if (overrideRows.some((o) => o.isBlocked)) return NextResponse.json({ slots: [] })

  let windows: { startTime: string; endTime: string }[]

  if (overrideRows.length > 0) {
    // Use override windows if present
    windows = overrideRows
      .filter((o) => !o.isBlocked && o.startTime && o.endTime)
      .map((o) => ({ startTime: o.startTime!, endTime: o.endTime! }))
  } else {
    // Get day of week for this date in the host's timezone
    const dayName = formatInTimeZone(new Date(`${date}T12:00:00Z`), hostTz, 'EEEE').toLowerCase()
    windows = schedule.windows
      .filter((w) => w.dayOfWeek === dayName)
      .map((w) => ({ startTime: w.startTime, endTime: w.endTime }))
  }

  // Deduplicate windows — DB has no unique constraint on (scheduleId, dayOfWeek, startTime, endTime)
  windows = Array.from(
    new Map(windows.map((w) => [`${w.startTime}-${w.endTime}`, w])).values()
  )

  if (windows.length === 0) return NextResponse.json({ slots: [] })

  // Load existing bookings that overlap this calendar day in host TZ
  const dayStartUtc = fromZonedTime(`${date}T00:00:00`, hostTz)
  const dayEndUtc = fromZonedTime(`${date}T23:59:59`, hostTz)

  const existingBookings = await db
    .select({ startTime: booking.startTime, endTime: booking.endTime })
    .from(booking)
    .where(and(
      eq(booking.hostUserId, host.id),
      eq(booking.status, 'confirmed'),
      lte(booking.startTime, dayEndUtc),
      gte(booking.endTime, dayStartUtc),
    ))

  if (
    et.maxBookingsPerDay !== null &&
    et.maxBookingsPerDay !== undefined &&
    existingBookings.length >= et.maxBookingsPerDay
  ) {
    return NextResponse.json({ slots: [] })
  }

  const slots = generateSlots({
    date,
    timezone: hostTz,
    windows,
    durationMinutes: defaultDuration,
    bufferBefore: et.bufferBefore ?? 0,
    bufferAfter: et.bufferAfter ?? 0,
    increment: et.startTimeIncrement ?? 30,
    existingBookings: existingBookings.map((b) => ({
      startTime: new Date(b.startTime),
      endTime: new Date(b.endTime),
    })),
    minimumNoticeMinutes: et.minimumNotice ?? 60,
    nowUtc: now,
  })

  // Final guard: deduplicate by startUtc before sending to client
  const uniqueSlots = Array.from(new Map(slots.map((s) => [s.startUtc, s])).values())

  return NextResponse.json({ slots: uniqueSlots, hostTimezone: hostTz })
}
