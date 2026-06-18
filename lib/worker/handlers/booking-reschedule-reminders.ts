import { subHours } from 'date-fns'
import type { Job } from 'pg-boss'
import { enqueueJob } from '@/lib/worker/enqueue'
import { type BookingRescheduleRemindersPayload, JOB_NAMES } from '@/lib/worker/job-types'

export async function handleBookingRescheduleReminders(
  jobs: Job<BookingRescheduleRemindersPayload>[],
) {
  for (const job of jobs) {
    await processRescheduleReminders(job)
  }
}

async function processRescheduleReminders(job: Job<BookingRescheduleRemindersPayload>) {
  const { bookingId, newStartTime } = job.data

  const newStart  = new Date(newStartTime)
  const now       = new Date()

  const reminder24h = subHours(newStart, 24)
  const reminder1h  = subHours(newStart, 1)

  // Old reminders will self-cancel: they check booking.startTime against their
  // bookingStartUtc and skip if the times differ by more than 60 seconds.

  if (reminder24h > now) {
    await enqueueJob(
      JOB_NAMES.BOOKING_REMINDER_24H,
      { bookingId, bookingStartUtc: newStart.toISOString() },
      {
        startAfter:   reminder24h,
        singletonKey: `reminder-24h-${bookingId}`,
      },
    )
    console.log(`[reschedule-reminders] scheduled 24h reminder for booking ${bookingId} at ${reminder24h.toISOString()}`)
  }

  if (reminder1h > now) {
    await enqueueJob(
      JOB_NAMES.BOOKING_REMINDER_1H,
      { bookingId, bookingStartUtc: newStart.toISOString() },
      {
        startAfter:   reminder1h,
        singletonKey: `reminder-1h-${bookingId}`,
      },
    )
    console.log(`[reschedule-reminders] scheduled 1h reminder for booking ${bookingId} at ${reminder1h.toISOString()}`)
  }
}
