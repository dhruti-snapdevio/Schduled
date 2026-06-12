'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createId } from '@paralleldrive/cuid2'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { user, eventType, eventTypeDuration } from '@/db/schema'
import { audit } from '@/lib/audit'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type ActionResult<T = {}> =
  | { error: string }
  | ({ ok: true } & T)

// Reserved paths that cannot be used as usernames
const RESERVED = new Set([
  'orbit', 'api', 'admin', 'dashboard', 'settings', 'login',
  'signup', 'post-auth', 'onboarding', 'privacy', 'terms', 'cookies',
  'cancel', 'reschedule', 'help', 'support', 'about', 'pricing',
])

function validateUsername(raw: string): string | null {
  const u = raw.toLowerCase().trim()
  if (u.length < 3) return 'Username must be at least 3 characters'
  if (u.length > 30) return 'Username must be 30 characters or less'
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(u)) {
    return 'Only lowercase letters, numbers, and hyphens. Cannot start or end with a hyphen.'
  }
  if (RESERVED.has(u)) return 'That username is reserved. Please choose another.'
  return null
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'meeting'
}

// ── Step 1: Save name + username ─────────────────────────────────────────────

export async function saveProfileStep(data: {
  name: string
  username: string
}): Promise<ActionResult<{ username: string }>> {
  try {
    const session = await requireSession()

    const name = data.name.trim()
    const username = data.username.toLowerCase().trim()

    if (!name || name.length < 1) return { error: 'Name is required' }
    if (name.length > 64) return { error: 'Name is too long (max 64 characters)' }

    const usernameError = validateUsername(username)
    if (usernameError) return { error: usernameError }

    // Check availability — exclude current user so they can keep their own username
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)

    if (existing && existing.id !== session.user.id) {
      return { error: 'That username is already taken. Please choose another.' }
    }

    await db
      .update(user)
      .set({ name, username, onboardingStep: 1, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    await audit({
      action: 'user.profile_updated',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'user',
      entityId: session.user.id,
      description: 'Updated name and username during onboarding',
    })

    revalidatePath('/dashboard')
    return { ok: true, username }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Step 2: Skip calendar (mark step saved, no connection) ───────────────────

export async function skipCalendarStep(): Promise<ActionResult> {
  try {
    const session = await requireSession()
    await db
      .update(user)
      .set({ onboardingStep: 2, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))
    revalidatePath('/dashboard')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Step 3: Save timezone ────────────────────────────────────────────────────

export async function saveTimezoneStep(timezone: string): Promise<ActionResult> {
  try {
    const session = await requireSession()

    // Validate it's a real IANA timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      return { error: 'Invalid timezone selected' }
    }

    await db
      .update(user)
      .set({ timezone, onboardingStep: 3, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    revalidatePath('/dashboard')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Step 4: Create first event type (Calendly-style quick create) ────────────

export async function createFirstEventType(data: {
  name: string
  duration: number
  locationType: 'zoom' | 'google_meet' | 'phone_host_calls' | 'in_person'
}): Promise<ActionResult<{ eventTypeId: string }>> {
  try {
    const session = await requireSession()

    const name = data.name.trim()
    if (!name) return { error: 'Event name is required' }
    if (name.length > 100) return { error: 'Event name is too long (max 100 characters)' }
    if (![15, 30, 45, 60].includes(data.duration)) return { error: 'Select a valid duration' }

    const slug = slugify(name)
    const eventTypeId = createId()

    await db.transaction(async (tx) => {
      await tx.insert(eventType).values({
        id: eventTypeId,
        userId: session.user.id,
        name,
        slug,
        locationType: data.locationType,
        color: '#0d9488',
        isActive: true,
        minimumNotice: 60,        // 1 hour minimum notice
        bookingWindow: 60,        // 60-day rolling window
        startTimeIncrement: data.duration,
        bufferBefore: 0,
        bufferAfter: 0,
        requiresApproval: false,
      })

      await tx.insert(eventTypeDuration).values({
        id: createId(),
        eventTypeId,
        duration: data.duration,
        isDefault: true,
      })
    })

    await db
      .update(user)
      .set({ onboardingStep: 4, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))

    await audit({
      action: 'event_type.created',
      actorId: session.user.id,
      actorEmail: session.user.email,
      entityType: 'event_type',
      entityId: eventTypeId,
      description: `Created first event type "${name}" during onboarding`,
    })

    revalidatePath('/dashboard')
    return { ok: true, eventTypeId }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}

// ── Step 5: Complete onboarding ──────────────────────────────────────────────

export async function completeOnboarding(): Promise<ActionResult> {
  try {
    const session = await requireSession()
    await db
      .update(user)
      .set({ onboardingDone: true, onboardingStep: 5, updatedAt: new Date() })
      .where(eq(user.id, session.user.id))
    revalidatePath('/dashboard')
    return { ok: true }
  } catch {
    return { error: 'Something went wrong. Please try again.' }
  }
}
