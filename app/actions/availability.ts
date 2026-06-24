'use server'

import { and, eq, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { user, availabilitySchedule, availabilityWindow, availabilityOverride, meetingLimit } from '@/db/schema'
import { audit } from '@/lib/audit'

type ActionResult<T = Record<never, never>> = { error: string } | ({ ok: true } & T)

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
export type TimeSlot = { startTime: string; endTime: string }

export interface ScheduleData {
  id: string
  name: string
  timezone: string
  windows: Record<DayOfWeek, TimeSlot[]>
}

export interface OverrideData {
  date: string
  isBlocked: boolean
  slots: TimeSlot[]
  reason: string | null
}

// ── Load ──────────────────────────────────────────────────────────────────────

export async function getAvailabilityData(): Promise<{
  schedule: ScheduleData | null
  overrides: OverrideData[]
  userTimezone: string
}> {
  const session = await requireSession()

  const [freshUser] = await db
    .select({ timezone: user.timezone })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1)

  const userTimezone = freshUser?.timezone ?? 'UTC'

  const schedule = await db.query.availabilitySchedule.findFirst({
    where: and(
      eq(availabilitySchedule.userId, session.user.id),
      eq(availabilitySchedule.isDefault, true),
    ),
    with: { windows: true },
  })

  // Today in YYYY-MM-DD so we only return future overrides
  const today = new Date().toISOString().slice(0, 10)

  const overrideRows = await db
    .select()
    .from(availabilityOverride)
    .where(
      and(
        eq(availabilityOverride.userId, session.user.id),
        gte(availabilityOverride.date, today),
      )
    )
    .orderBy(availabilityOverride.date)

  const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  let windows: Record<DayOfWeek, TimeSlot[]> = {
    monday: [], tuesday: [], wednesday: [], thursday: [],
    friday: [], saturday: [], sunday: [],
  }

  if (schedule) {
    for (const w of schedule.windows) {
      const day = w.dayOfWeek as DayOfWeek
      if (DAYS.includes(day)) {
        windows[day].push({ startTime: w.startTime, endTime: w.endTime })
      }
    }
  }

  // Group override rows by date — multiple rows per date = multiple slots
  const overrideMap = new Map<string, OverrideData>()
  for (const o of overrideRows) {
    if (o.isBlocked) {
      overrideMap.set(o.date, { date: o.date, isBlocked: true, slots: [], reason: o.reason ?? null })
    } else {
      const existing = overrideMap.get(o.date)
      const slot = { startTime: o.startTime!, endTime: o.endTime! }
      if (existing) {
        existing.slots.push(slot)
      } else {
        overrideMap.set(o.date, { date: o.date, isBlocked: false, slots: [slot], reason: o.reason ?? null })
      }
    }
  }

  return {
    schedule: schedule
      ? { id: schedule.id, name: schedule.name, timezone: schedule.timezone, windows }
      : null,
    overrides: Array.from(overrideMap.values()),
    userTimezone,
  }
}

// ── Update schedule windows ───────────────────────────────────────────────────

export async function updateAvailabilitySchedule(
  scheduleId: string,
  name: string,
  windows: Record<DayOfWeek, TimeSlot[]>,
): Promise<ActionResult> {
  try {
    const session = await requireSession()

    const [existing] = await db
      .select({ id: availabilitySchedule.id })
      .from(availabilitySchedule)
      .where(and(
        eq(availabilitySchedule.id, scheduleId),
        eq(availabilitySchedule.userId, session.user.id),
      ))
      .limit(1)

    if (!existing) return { error: 'Schedule not found' }

    await db.transaction(async (tx) => {
      await tx
        .update(availabilitySchedule)
        .set({ name: name.trim() || 'Working Hours' })
        .where(eq(availabilitySchedule.id, scheduleId))

      await tx
        .delete(availabilityWindow)
        .where(eq(availabilityWindow.scheduleId, scheduleId))

      const rows = (Object.entries(windows) as [DayOfWeek, TimeSlot[]][]).flatMap(
        ([day, slots]) =>
          slots.map((s) => ({
            scheduleId,
            dayOfWeek: day,
            startTime: s.startTime,
            endTime: s.endTime,
          }))
      )

      if (rows.length > 0) {
        await tx.insert(availabilityWindow).values(rows)
      }
    })

    await audit({
      action: 'availability.schedule_updated',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'user',
      entityId: session.user.id,
      description: `Updated availability schedule "${name}"`,
    })

    revalidatePath('/availability')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Create default schedule (if none exists) ──────────────────────────────────

export async function createDefaultSchedule(): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()

    const [freshUser] = await db
      .select({ timezone: user.timezone })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    const timezone = freshUser?.timezone ?? 'UTC'

    const [schedule] = await db
      .insert(availabilitySchedule)
      .values({ userId: session.user.id, name: 'Working Hours', isDefault: true, timezone })
      .returning()

    const defaultSlots = (
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]
    ).map((day) => ({ scheduleId: schedule.id, dayOfWeek: day, startTime: '09:00', endTime: '17:00' }))

    await db.insert(availabilityWindow).values(defaultSlots)

    revalidatePath('/availability')
    return { ok: true, id: schedule.id }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Date overrides ────────────────────────────────────────────────────────────

export async function addAvailabilityOverride(data: {
  date: string
  isBlocked: boolean
  slots?: TimeSlot[]
  reason?: string
}): Promise<ActionResult> {
  try {
    const session = await requireSession()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return { error: 'Invalid date format' }

    // Delete all existing rows for this date
    await db
      .delete(availabilityOverride)
      .where(and(
        eq(availabilityOverride.userId, session.user.id),
        eq(availabilityOverride.date, data.date),
      ))

    const slots = data.isBlocked ? [] : (data.slots ?? [{ startTime: '09:00', endTime: '17:00' }])

    if (data.isBlocked) {
      // Insert a single blocked row
      await db.insert(availabilityOverride).values({
        userId: session.user.id,
        date: data.date,
        isBlocked: true,
        startTime: null,
        endTime: null,
        reason: data.reason?.trim() || null,
      })
    } else {
      // Insert one row per slot
      await db.insert(availabilityOverride).values(
        slots.map((s) => ({
          userId: session.user.id,
          date: data.date,
          isBlocked: false,
          startTime: s.startTime,
          endTime: s.endTime,
          reason: data.reason?.trim() || null,
        }))
      )
    }

    await audit({
      action: 'availability.override_added',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'user',
      entityId: session.user.id,
      description: `Added availability override for ${data.date} (${data.isBlocked ? 'blocked' : `${slots.length} slot(s)`})`,
    })

    revalidatePath('/availability')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updateUserTimezone(timezone: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    // Validate timezone string
    try { Intl.DateTimeFormat(undefined, { timeZone: timezone }) } catch { return { error: 'Invalid timezone' } }

    await db.update(user).set({ timezone, updatedAt: new Date() }).where(eq(user.id, session.user.id))

    // Also update the default schedule timezone to stay in sync
    await db
      .update(availabilitySchedule)
      .set({ timezone })
      .where(and(
        eq(availabilitySchedule.userId, session.user.id),
        eq(availabilitySchedule.isDefault, true),
      ))

    await audit({
      action: 'user.timezone_changed',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'user',
      entityId: session.user.id,
      description: `Changed timezone to ${timezone}`,
    })

    revalidatePath('/availability')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function deleteAvailabilityOverride(date: string): Promise<ActionResult> {
  try {
    const session = await requireSession()

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Invalid date format' }

    await db.delete(availabilityOverride).where(and(
      eq(availabilityOverride.userId, session.user.id),
      eq(availabilityOverride.date, date),
    ))

    await audit({
      action: 'availability.override_removed',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'user',
      entityId: session.user.id,
      description: `Removed availability override for ${date}`,
    })

    revalidatePath('/availability')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Meeting Limits ────────────────────────────────────────────────────────────

export type MeetingLimitPeriod = 'day' | 'week' | 'month'

export interface MeetingLimitRow {
  id: string
  period: MeetingLimitPeriod
  count: number
}

export async function getMeetingLimits(): Promise<MeetingLimitRow[]> {
  const session = await requireSession()
  return db
    .select({ id: meetingLimit.id, period: meetingLimit.period, count: meetingLimit.count })
    .from(meetingLimit)
    .where(eq(meetingLimit.userId, session.user.id))
    .orderBy(meetingLimit.createdAt)
}

export async function addMeetingLimit(
  period: MeetingLimitPeriod,
  count: number,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()

    if (!['day', 'week', 'month'].includes(period)) return { error: 'Invalid period.' }
    if (!Number.isInteger(count) || count < 1 || count > 999) return { error: 'Count must be between 1 and 999.' }

    const existing = await db
      .select({ id: meetingLimit.id })
      .from(meetingLimit)
      .where(and(eq(meetingLimit.userId, session.user.id), eq(meetingLimit.period, period)))

    if (existing.length > 0) return { error: `A ${period}ly limit already exists. Remove it first.` }

    const [row] = await db
      .insert(meetingLimit)
      .values({ userId: session.user.id, period, count })
      .returning({ id: meetingLimit.id })

    revalidatePath('/availability')
    return { ok: true, id: row.id }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function removeMeetingLimit(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession()

    await db
      .delete(meetingLimit)
      .where(and(eq(meetingLimit.id, id), eq(meetingLimit.userId, session.user.id)))

    revalidatePath('/availability')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updateMeetingLimit(id: string, count: number): Promise<ActionResult> {
  try {
    const session = await requireSession()

    if (!Number.isInteger(count) || count < 1 || count > 999) return { error: 'Count must be between 1 and 999.' }

    await db
      .update(meetingLimit)
      .set({ count })
      .where(and(eq(meetingLimit.id, id), eq(meetingLimit.userId, session.user.id)))

    revalidatePath('/availability')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
