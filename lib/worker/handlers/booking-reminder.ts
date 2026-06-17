import { eq } from 'drizzle-orm'
import type { Job } from 'pg-boss'
import { createId } from '@paralleldrive/cuid2'
import { db } from '@/lib/db'
import { booking, emailOutbox, eventType, user } from '@/db/schema'
import { enqueueJob } from '@/lib/worker/enqueue'
import { type BookingReminderPayload, JOB_NAMES } from '@/lib/worker/job-types'
import { reminderInviteeTemplate } from '@/lib/email/templates/reminder-invitee'

function resolveLocationLabel(locationType: string, locationValue: string | null): string {
  switch (locationType) {
    case 'google_meet':         return 'Google Meet'
    case 'zoom':                return 'Zoom'
    case 'phone_host_calls':    return 'Phone (host will call you)'
    case 'phone_invitee_calls': return locationValue ? `Call: ${locationValue}` : 'Phone (you call host)'
    case 'in_person':           return locationValue ?? 'In person (see invite for address)'
    case 'custom':              return locationValue ?? 'See invite for details'
    default:                    return locationValue ?? 'See invite for details'
  }
}

export async function handleBookingReminder24h(jobs: Job<BookingReminderPayload>[]) {
  for (const job of jobs) {
    await processReminder(job, '24 hours')
  }
}

export async function handleBookingReminder1h(jobs: Job<BookingReminderPayload>[]) {
  for (const job of jobs) {
    await processReminder(job, '1 hour')
  }
}

async function processReminder(
  job: Job<BookingReminderPayload>,
  timeUntil: '24 hours' | '1 hour',
) {
  const { bookingId, bookingStartUtc } = job.data

  const [b] = await db
    .select({
      id:              booking.id,
      inviteeName:     booking.inviteeName,
      inviteeEmail:    booking.inviteeEmail,
      inviteeTimezone: booking.inviteeTimezone,
      startTime:       booking.startTime,
      videoLinkInvitee: booking.videoLinkInvitee,
      cancelToken:     booking.cancelToken,
      rescheduleToken: booking.rescheduleToken,
      status:          booking.status,
      etName:          eventType.name,
      etLocationType:  eventType.locationType,
      etLocationValue: eventType.locationValue,
      hostName:        user.name,
      hostTimezone:    user.timezone,
    })
    .from(booking)
    .innerJoin(eventType, eq(eventType.id, booking.eventTypeId))
    .innerJoin(user, eq(user.id, booking.hostUserId))
    .where(eq(booking.id, bookingId))
    .limit(1)

  if (!b) {
    console.warn(`[booking-reminder] booking ${bookingId} not found`)
    return
  }

  if (b.status !== 'confirmed') {
    console.log(`[booking-reminder] booking ${bookingId} is ${b.status} — skipping`)
    return
  }

  // Skip if booking was rescheduled to a different time after this reminder was scheduled
  const scheduledFor = new Date(bookingStartUtc)
  const actual       = new Date(b.startTime)
  const drift        = Math.abs(actual.getTime() - scheduledFor.getTime())
  if (drift > 60_000) {
    console.log(`[booking-reminder] booking ${bookingId} start time drifted ${drift}ms — skipping (rescheduled)`)
    return
  }

  const hostTimezone  = b.hostTimezone ?? 'UTC'
  const locationLabel = resolveLocationLabel(b.etLocationType, b.etLocationValue)

  const { html, text } = await reminderInviteeTemplate({
    inviteeName:     b.inviteeName,
    hostName:        b.hostName ?? 'Your host',
    eventName:       b.etName,
    startUtc:        new Date(b.startTime),
    hostTimezone,
    inviteeTimezone: b.inviteeTimezone,
    locationLabel,
    meetLink:        b.videoLinkInvitee,
    cancelToken:     b.cancelToken,
    rescheduleToken: b.rescheduleToken,
    timeUntil,
  })

  const subject        = `Reminder: ${b.etName} with ${b.hostName ?? 'your host'} in ${timeUntil}`
  const idempotencyKey = `reminder-${timeUntil === '24 hours' ? '24h' : '1h'}-${bookingId}-${scheduledFor.toISOString()}`

  const newOutboxId = createId()
  const inserted    = await db.insert(emailOutbox).values({
    id:             newOutboxId,
    idempotencyKey,
    payload:        { to: b.inviteeEmail, subject, html, text },
    status:         'queued',
    maxAttempts:    3,
  }).onConflictDoNothing().returning({ id: emailOutbox.id })

  let outboxId: string
  if (inserted.length > 0) {
    outboxId = inserted[0].id
  } else {
    // Idempotency key already exists — look up the existing record
    const [existing] = await db
      .select({ id: emailOutbox.id, status: emailOutbox.status })
      .from(emailOutbox)
      .where(eq(emailOutbox.idempotencyKey, idempotencyKey))
      .limit(1)
    if (!existing) {
      console.warn(`[booking-reminder] could not find existing outbox row for key ${idempotencyKey}`)
      return
    }
    if (existing.status === 'sent') {
      console.log(`[booking-reminder] reminder already sent for ${idempotencyKey} — skipping`)
      return
    }
    outboxId = existing.id
  }

  await enqueueJob(JOB_NAMES.EMAIL_SEND, { outboxId })

  console.log(`[booking-reminder] queued ${timeUntil} reminder email for booking ${bookingId}`)
}
