'use server'

import { and, eq, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createId } from '@paralleldrive/cuid2'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import {
  booking,
  eventType,
  eventTypeDuration,
  cancellationPolicy,
  eventTypeQuestion,
  availabilitySchedule,
  availabilityWindow,
} from '@/db/schema'
import { audit } from '@/lib/audit'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ActionResult<T = {}> = { error: string } | ({ ok: true } & T)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'meeting'
}

async function uniqueSlug(userId: string, base: string, excludeId?: string): Promise<string> {
  let slug = base
  let n = 0
  while (true) {
    const rows = await db
      .select({ id: eventType.id })
      .from(eventType)
      .where(and(eq(eventType.userId, userId), eq(eventType.slug, slug)))
      .limit(1)
    const taken = rows.find((r) => r.id !== excludeId)
    if (!taken) return slug
    n++
    slug = `${base}-${n}`
  }
}

// ── List ──────────────────────────────────────────────────────────────────────

export async function listEventTypes() {
  const session = await requireSession()
  const types = await db.query.eventType.findMany({
    where: eq(eventType.userId, session.user.id),
    with: { durations: true },
    orderBy: (et, { asc }) => [asc(et.position), asc(et.createdAt)],
  })
  return types
}

// ── Get single ────────────────────────────────────────────────────────────────

export async function getEventType(id: string) {
  const session = await requireSession()
  const et = await db.query.eventType.findFirst({
    where: and(eq(eventType.id, id), eq(eventType.userId, session.user.id)),
    with: {
      durations: true,
      cancellationPolicy: true,
      questions: { orderBy: (q, { asc }) => [asc(q.position)] },
    },
  })
  return et ?? null
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface EventTypeFormData {
  name: string
  slug: string
  description?: string
  color: string
  meetingType: 'one_on_one' | 'group' | 'round_robin' | 'collective'
  isActive: boolean
  isHidden: boolean
  durations: number[]
  defaultDuration: number
  availabilityScheduleId?: string
  bookingWindow: number
  bookingWindowType: 'rolling' | 'fixed'
  bookingRangeStart?: string | null
  bookingRangeEnd?: string | null
  minimumNotice: number
  bufferBefore: number
  bufferAfter: number
  maxBookingsPerDay?: number | null
  startTimeIncrement: number
  locationType: 'zoom' | 'google_meet' | 'phone_host_calls' | 'phone_invitee_calls' | 'in_person' | 'custom' | 'invitees_choice'
  locationValue?: string
  hostPhoneNumber?: string
  confirmationNote?: string
  requiresApproval: boolean
  allowCancellation: boolean
  cancellationCutoffHours: number
  allowRescheduling: boolean
  rescheduleCutoffHours: number
  requireCancellationReason: boolean
  showPolicyText: boolean
  policyText?: string
}

export async function createEventType(data: EventTypeFormData, initialQuestions?: QuestionData[]): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const session = await requireSession()

    const name = data.name.trim()
    if (!name) return { error: 'Event name is required' }
    if (name.length > 100) return { error: 'Event name must be 100 characters or less' }
    if (data.durations.length === 0) return { error: 'At least one duration is required' }

    const slugBase = slugify(data.slug || name)
    const id = createId()

    // Serialise slug allocation per user so two concurrent creates can't both
    // claim the same slug. The advisory lock is held until this transaction
    // commits, so a waiting request reads the freshly-committed slug.
    const slug = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`et-slug:${session.user.id}`}))`
      )
      const resolvedSlug = await uniqueSlug(session.user.id, slugBase)

      // Count existing for position
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(eventType)
        .where(eq(eventType.userId, session.user.id))

      await tx.insert(eventType).values({
        id,
        userId: session.user.id,
        name,
        slug: resolvedSlug,
        description: data.description?.trim() || null,
        color: data.color,
        meetingType: data.meetingType,
        isActive: data.isActive,
        isHidden: data.isHidden,
        availabilityScheduleId: data.availabilityScheduleId || null,
        bookingWindow: data.bookingWindow,
        bookingWindowType: data.bookingWindowType,
        bookingRangeStart: data.bookingWindowType === "fixed" ? data.bookingRangeStart || null : null,
        bookingRangeEnd: data.bookingWindowType === "fixed" ? data.bookingRangeEnd || null : null,
        minimumNotice: data.minimumNotice,
        bufferBefore: data.bufferBefore,
        bufferAfter: data.bufferAfter,
        maxBookingsPerDay: data.maxBookingsPerDay ?? null,
        startTimeIncrement: data.startTimeIncrement,
        locationType: data.locationType,
        locationValue: data.locationValue?.trim() || null,
        hostPhoneNumber: data.hostPhoneNumber?.trim() || null,
        confirmationNote: data.confirmationNote?.trim() || null,
        requiresApproval: data.requiresApproval,
        position: count,
      })

      return resolvedSlug
    })

    // Insert durations
    await db.insert(eventTypeDuration).values(
      data.durations.map((d) => ({
        eventTypeId: id,
        duration: d,
        isDefault: d === data.defaultDuration,
      }))
    )

    // Insert cancellation policy
    await db.insert(cancellationPolicy).values({
      eventTypeId: id,
      allowCancellation: data.allowCancellation,
      cutoffHours: data.cancellationCutoffHours,
      allowRescheduling: data.allowRescheduling,
      rescheduleCutoffHours: data.rescheduleCutoffHours,
      requireCancellationReason: data.requireCancellationReason,
      showPolicyText: data.showPolicyText,
      policyText: data.policyText?.trim() || null,
    })

    // Insert initial questions (added before first save in create mode)
    if (initialQuestions && initialQuestions.length > 0) {
      await db.insert(eventTypeQuestion).values(
        initialQuestions.map((q, i) => ({
          id: createId(),
          eventTypeId: id,
          label: q.label.trim(),
          type: q.type,
          isRequired: q.isRequired,
          options: q.options && q.options.length > 0 ? q.options : null,
          placeholder: q.placeholder?.trim() || null,
          position: i,
          isActive: true,
        }))
      )
    }

    await audit({
      action: 'event_type.created',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'event_type',
      entityId: id,
      description: `Created event type "${name}"`,
      metadata: { slug, locationType: data.locationType },
    })

    revalidatePath('/event-types')
    return { ok: true, id, slug }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateEventType(id: string, data: EventTypeFormData): Promise<ActionResult<{ slug: string }>> {
  try {
    const session = await requireSession()

    const name = data.name.trim()
    if (!name) return { error: 'Event name is required' }
    if (data.durations.length === 0) return { error: 'At least one duration is required' }

    // Verify ownership
    const [existing] = await db
      .select({ id: eventType.id })
      .from(eventType)
      .where(and(eq(eventType.id, id), eq(eventType.userId, session.user.id)))
      .limit(1)
    if (!existing) return { error: 'Event type not found' }

    const slugBase = slugify(data.slug || name)

    // Serialise slug allocation per user (same guard as createEventType) so two
    // concurrent edits can't resolve to the same slug.
    const slug = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`et-slug:${session.user.id}`}))`
      )
      const resolvedSlug = await uniqueSlug(session.user.id, slugBase, id)
      await tx
        .update(eventType)
        .set({ slug: resolvedSlug })
        .where(eq(eventType.id, id))
      return resolvedSlug
    })

    await db
      .update(eventType)
      .set({
        name,
        slug,
        description: data.description?.trim() || null,
        color: data.color,
        meetingType: data.meetingType,
        isActive: data.isActive,
        isHidden: data.isHidden,
        availabilityScheduleId: data.availabilityScheduleId || null,
        bookingWindow: data.bookingWindow,
        bookingWindowType: data.bookingWindowType,
        bookingRangeStart: data.bookingWindowType === "fixed" ? data.bookingRangeStart || null : null,
        bookingRangeEnd: data.bookingWindowType === "fixed" ? data.bookingRangeEnd || null : null,
        minimumNotice: data.minimumNotice,
        bufferBefore: data.bufferBefore,
        bufferAfter: data.bufferAfter,
        maxBookingsPerDay: data.maxBookingsPerDay ?? null,
        startTimeIncrement: data.startTimeIncrement,
        locationType: data.locationType,
        locationValue: data.locationValue?.trim() || null,
        hostPhoneNumber: data.hostPhoneNumber?.trim() || null,
        confirmationNote: data.confirmationNote?.trim() || null,
        requiresApproval: data.requiresApproval,
        updatedAt: new Date(),
      })
      .where(eq(eventType.id, id))

    // Replace durations
    await db.delete(eventTypeDuration).where(eq(eventTypeDuration.eventTypeId, id))
    await db.insert(eventTypeDuration).values(
      data.durations.map((d) => ({
        eventTypeId: id,
        duration: d,
        isDefault: d === data.defaultDuration,
      }))
    )

    // Upsert cancellation policy
    const [existingPolicy] = await db
      .select({ id: cancellationPolicy.id })
      .from(cancellationPolicy)
      .where(eq(cancellationPolicy.eventTypeId, id))
      .limit(1)

    const policyValues = {
      allowCancellation: data.allowCancellation,
      cutoffHours: data.cancellationCutoffHours,
      allowRescheduling: data.allowRescheduling,
      rescheduleCutoffHours: data.rescheduleCutoffHours,
      requireCancellationReason: data.requireCancellationReason,
      showPolicyText: data.showPolicyText,
      policyText: data.policyText?.trim() || null,
    }

    if (existingPolicy) {
      await db.update(cancellationPolicy).set(policyValues).where(eq(cancellationPolicy.id, existingPolicy.id))
    } else {
      await db.insert(cancellationPolicy).values({ eventTypeId: id, ...policyValues })
    }

    await audit({
      action: 'event_type.updated',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'event_type',
      entityId: id,
      description: `Updated event type "${name}"`,
    })

    revalidatePath('/event-types')
    revalidatePath(`/event-types/${id}`)
    return { ok: true, slug }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Toggle active ─────────────────────────────────────────────────────────────

export async function toggleEventTypeActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const [existing] = await db
      .select({ id: eventType.id, name: eventType.name })
      .from(eventType)
      .where(and(eq(eventType.id, id), eq(eventType.userId, session.user.id)))
      .limit(1)
    if (!existing) return { error: 'Event type not found' }

    await db.update(eventType).set({ isActive, updatedAt: new Date() }).where(eq(eventType.id, id))

    await audit({
      action: isActive ? 'event_type.activated' : 'event_type.deactivated',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'event_type',
      entityId: id,
      description: `${isActive ? 'Activated' : 'Deactivated'} event type "${existing.name}"`,
    })

    revalidatePath('/event-types')
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteEventType(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const [existing] = await db
      .select({ id: eventType.id, name: eventType.name })
      .from(eventType)
      .where(and(eq(eventType.id, id), eq(eventType.userId, session.user.id)))
      .limit(1)
    if (!existing) return { error: 'Event type not found' }

    await db.transaction(async (tx) => {
      await tx.delete(booking).where(eq(booking.eventTypeId, id))
      await tx.delete(eventType).where(eq(eventType.id, id))
    })

    await audit({
      action: 'event_type.deleted',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'event_type',
      entityId: id,
      description: `Deleted event type "${existing.name}"`,
    })

    revalidatePath('/event-types')
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Bulk delete ───────────────────────────────────────────────────────────────

export async function bulkDeleteEventTypes(ids: string[]): Promise<ActionResult> {
  if (!ids.length) return { ok: true }
  try {
    const session = await requireSession()
    await db.transaction(async (tx) => {
      await tx.delete(booking).where(inArray(booking.eventTypeId, ids))
      await tx.delete(eventType).where(
        and(inArray(eventType.id, ids), eq(eventType.userId, session.user.id))
      )
    })
    revalidatePath('/event-types')
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Bulk toggle ───────────────────────────────────────────────────────────────

export async function bulkToggleEventTypes(ids: string[], isActive: boolean): Promise<ActionResult> {
  if (!ids.length) return { ok: true }
  try {
    const session = await requireSession()
    await db.update(eventType)
      .set({ isActive, updatedAt: new Date() })
      .where(and(inArray(eventType.id, ids), eq(eventType.userId, session.user.id)))
    revalidatePath('/event-types')
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Duplicate ─────────────────────────────────────────────────────────────────

export async function duplicateEventType(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()
    const source = await db.query.eventType.findFirst({
      where: and(eq(eventType.id, id), eq(eventType.userId, session.user.id)),
      with: { durations: true, cancellationPolicy: true, questions: true },
    })
    if (!source) return { error: 'Event type not found' }

    const newId = createId()
    // Pull the relation arrays out so they aren't spread into the insert.
    const { durations, cancellationPolicy: sourcePolicy, questions, ...sourceCols } = source

    await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${`et-slug:${session.user.id}`}))`
      )
      const resolvedSlug = await uniqueSlug(session.user.id, source.slug)

      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(eventType)
        .where(eq(eventType.userId, session.user.id))

      await tx.insert(eventType).values({
        ...sourceCols,
        id: newId,
        name: `${source.name} (copy)`,
        slug: resolvedSlug,
        isActive: false,
        position: count,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    })

    if (durations.length > 0) {
      await db.insert(eventTypeDuration).values(
        durations.map((d) => ({ eventTypeId: newId, duration: d.duration, isDefault: d.isDefault }))
      )
    }

    if (sourcePolicy) {
      const { id: _pid, eventTypeId: _eid, createdAt: _ca, ...policyRest } = sourcePolicy
      await db.insert(cancellationPolicy).values({ eventTypeId: newId, ...policyRest })
    }

    // Copy custom booking-form questions (previously silently dropped).
    if (questions.length > 0) {
      await db.insert(eventTypeQuestion).values(
        questions.map((q) => ({
          eventTypeId: newId,
          label: q.label,
          type: q.type,
          isRequired: q.isRequired,
          options: q.options ?? null,
          placeholder: q.placeholder,
          position: q.position,
          isActive: q.isActive,
        }))
      )
    }

    revalidatePath('/event-types')
    return { ok: true, id: newId }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Questions ─────────────────────────────────────────────────────────────────

export interface QuestionData {
  label: string
  type: 'short_text' | 'long_text' | 'phone' | 'single_select' | 'multiple_select' | 'dropdown'
  isRequired: boolean
  options?: string[]
  placeholder?: string
}

export async function addQuestion(eventTypeId: string, data: QuestionData): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession()
    const [et] = await db
      .select({ id: eventType.id })
      .from(eventType)
      .where(and(eq(eventType.id, eventTypeId), eq(eventType.userId, session.user.id)))
      .limit(1)
    if (!et) return { error: 'Event type not found' }

    const [{ maxPos }] = await db
      .select({ maxPos: sql<number>`coalesce(max(position), -1)::int` })
      .from(eventTypeQuestion)
      .where(eq(eventTypeQuestion.eventTypeId, eventTypeId))

    const id = createId()
    await db.insert(eventTypeQuestion).values({
      id,
      eventTypeId,
      label: data.label.trim(),
      type: data.type,
      isRequired: data.isRequired,
      options: data.options && data.options.length > 0 ? data.options : null,
      placeholder: data.placeholder?.trim() || null,
      position: maxPos + 1,
      isActive: true,
    })

    revalidatePath(`/event-types/${eventTypeId}`)
    return { ok: true, id }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function updateQuestion(id: string, data: QuestionData): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const question = await db.query.eventTypeQuestion.findFirst({
      where: eq(eventTypeQuestion.id, id),
      with: { eventType: { columns: { userId: true, id: true } } },
    })
    if (!question || question.eventType.userId !== session.user.id) return { error: 'Question not found' }

    await db.update(eventTypeQuestion).set({
      label: data.label.trim(),
      type: data.type,
      isRequired: data.isRequired,
      options: data.options && data.options.length > 0 ? data.options : null,
      placeholder: data.placeholder?.trim() || null,
    }).where(eq(eventTypeQuestion.id, id))

    revalidatePath(`/event-types/${question.eventType.id}`)
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function deleteQuestion(id: string): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const question = await db.query.eventTypeQuestion.findFirst({
      where: eq(eventTypeQuestion.id, id),
      with: { eventType: { columns: { userId: true, id: true } } },
    })
    if (!question || question.eventType.userId !== session.user.id) return { error: 'Question not found' }

    await db.delete(eventTypeQuestion).where(eq(eventTypeQuestion.id, id))
    revalidatePath(`/event-types/${question.eventType.id}`)
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function reorderEventTypes(ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireSession()
    await Promise.all(
      ids.map((id, pos) =>
        db.update(eventType).set({ position: pos }).where(
          and(eq(eventType.id, id), eq(eventType.userId, session.user.id))
        )
      )
    )
    revalidatePath('/event-types')
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

export async function reorderQuestions(eventTypeId: string, ids: string[]): Promise<ActionResult> {
  try {
    const session = await requireSession()
    const [et] = await db
      .select({ id: eventType.id })
      .from(eventType)
      .where(and(eq(eventType.id, eventTypeId), eq(eventType.userId, session.user.id)))
      .limit(1)
    if (!et) return { error: 'Event type not found' }

    await Promise.all(
      ids.map((qid, pos) =>
        db.update(eventTypeQuestion).set({ position: pos }).where(
          and(eq(eventTypeQuestion.id, qid), eq(eventTypeQuestion.eventTypeId, eventTypeId))
        )
      )
    )

    revalidatePath(`/event-types/${eventTypeId}`)
    return { ok: true }
  } catch (err) {
    console.error('[eventTypes]', err)
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Availability schedules (for tab select) ───────────────────────────────────

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
type DayOfWeek = typeof DAY_ORDER[number]
const DAY_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export async function listAvailabilitySchedules() {
  const session = await requireSession()
  const schedules = await db
    .select({ id: availabilitySchedule.id, name: availabilitySchedule.name, isDefault: availabilitySchedule.isDefault })
    .from(availabilitySchedule)
    .where(eq(availabilitySchedule.userId, session.user.id))

  if (schedules.length === 0) return []

  const windows = await db
    .select({
      scheduleId: availabilityWindow.scheduleId,
      dayOfWeek: availabilityWindow.dayOfWeek,
      startTime: availabilityWindow.startTime,
      endTime: availabilityWindow.endTime,
    })
    .from(availabilityWindow)
    .where(inArray(availabilityWindow.scheduleId, schedules.map((s) => s.id)))

  const bySchedule = new Map<string, typeof windows>()
  for (const w of windows) {
    const arr = bySchedule.get(w.scheduleId) ?? []
    arr.push(w)
    bySchedule.set(w.scheduleId, arr)
  }

  return schedules.map((s) => {
    const wins = bySchedule.get(s.id) ?? []
    const sortedDays = [...new Set(wins.map((w) => w.dayOfWeek))].sort(
      (a, b) => DAY_ORDER.indexOf(a as DayOfWeek) - DAY_ORDER.indexOf(b as DayOfWeek)
    )
    const isMidF = sortedDays.length === 5 && !sortedDays.includes('saturday') && !sortedDays.includes('sunday')
    const isAll7 = sortedDays.length === 7
    const daysStr = sortedDays.length === 0
      ? null
      : isMidF ? 'Mon – Fri'
      : isAll7 ? 'Every day'
      : sortedDays.map((d) => DAY_SHORT[d] ?? d).join(', ')
    const first = wins[0]
    const timeStr = first ? `${fmt12(first.startTime)} – ${fmt12(first.endTime)}` : null
    return { ...s, summary: daysStr && timeStr ? { days: daysStr, time: timeStr } : null }
  })
}
