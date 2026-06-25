import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { listAvailabilitySchedules } from '@/app/actions/event-types'
import { getMeetingLimits } from '@/app/actions/availability'
import { getMeetingIntegrations } from '@/lib/integrations/status'
import { EventTypeBuilder } from '../_components/builder'
import type { BuilderFormValues } from '../_components/builder'

export const metadata = { title: 'New Event Type' }

const DEFAULT_VALUES: BuilderFormValues = {
  name:                    '',
  slug:                    '',
  description:             '',
  color:                   '#0d9488',
  meetingType:             'one_on_one',
  isActive:                true,
  isHidden:                false,
  durations:               [30],
  defaultDuration:         30,
  availabilityScheduleId:  undefined,
  bookingWindow:           60,
  bookingWindowType:       'rolling',
  bookingRangeStart:       undefined,
  bookingRangeEnd:         undefined,
  minimumNotice:           60,
  bufferBefore:            0,
  bufferAfter:             0,
  maxBookingsPerDay:       null,
  startTimeIncrement:      30,
  locationType:            'google_meet',
  locationValue:           '',
  hostPhoneNumber:         '',
  confirmationNote:        '',
  requiresApproval:        false,
  allowCancellation:       true,
  cancellationCutoffHours: 0,
  allowRescheduling:       true,
  rescheduleCutoffHours:   0,
  requireCancellationReason: false,
  showPolicyText:          false,
  policyText:              '',
}

export default async function NewEventTypePage() {
  const session = await requireSession()

  const [[currentUser], schedules, globalLimits, integrations] = await Promise.all([
    db.select({ username: user.username }).from(user).where(eq(user.id, session.user.id)).limit(1),
    listAvailabilitySchedules(),
    getMeetingLimits(),
    getMeetingIntegrations(session.user.id),
  ])

  return (
    <EventTypeBuilder
      mode="create"
      defaultValues={DEFAULT_VALUES}
      schedules={schedules}
      globalLimits={globalLimits}
      integrations={integrations}
      username={currentUser?.username ?? null}
    />
  )
}
