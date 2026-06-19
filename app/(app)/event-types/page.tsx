import Link from 'next/link'
import { startOfMonth } from 'date-fns'
import { and, count, eq, gte, max } from 'drizzle-orm'
import { CalendarPlus } from '@phosphor-icons/react/dist/ssr'
import { listEventTypes } from '@/app/actions/event-types'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { booking, user } from '@/db/schema'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { PageHeader } from '@/components/scaffold/page-header'
import { EventTypeCard } from './_components/event-type-card'

export const metadata = { title: 'Event Types' }

export default async function EventTypesPage() {
  const session = await requireSession()
  const now = new Date()
  const monthStart = startOfMonth(now)

  const [eventTypes, [currentUser], lastBookedStats, monthlyStats] = await Promise.all([
    listEventTypes(),
    db.select({ username: user.username }).from(user).where(eq(user.id, session.user.id)).limit(1),
    // Last booking time per event type (all time)
    db
      .select({ eventTypeId: booking.eventTypeId, lastBooked: max(booking.createdAt) })
      .from(booking)
      .where(eq(booking.hostUserId, session.user.id))
      .groupBy(booking.eventTypeId),
    // Booking count per event type for the current month only
    db
      .select({ eventTypeId: booking.eventTypeId, countThisMonth: count() })
      .from(booking)
      .where(and(eq(booking.hostUserId, session.user.id), gte(booking.createdAt, monthStart)))
      .groupBy(booking.eventTypeId),
  ])

  const username = currentUser?.username ?? null
  const monthlyMap = new Map(monthlyStats.map((s) => [s.eventTypeId, s.countThisMonth ?? 0]))
  const statsMap = new Map(
    lastBookedStats.map((s) => [
      s.eventTypeId,
      { countThisMonth: monthlyMap.get(s.eventTypeId) ?? 0, lastBooked: s.lastBooked ?? null },
    ])
  )

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Event Types"
        description="Create meeting templates that people can book with you."
        action={
          <Button asChild>
            <Link href="/event-types/new">
              <CalendarPlus size={16} />
              New Event Type
            </Link>
          </Button>
        }
      />

      {eventTypes.length === 0 ? (
        <Empty
          icon={<CalendarPlus size={24} />}
          title="No event types yet"
          description="Create your first event type to start accepting bookings."
          action={
            <Button asChild>
              <Link href="/event-types/new">Create event type</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {eventTypes.map((et) => (
            <EventTypeCard
              key={et.id}
              id={et.id}
              name={et.name}
              slug={et.slug}
              color={et.color}
              locationType={et.locationType}
              isActive={et.isActive}
              isHidden={et.isHidden}
              durations={et.durations}
              username={username}
              stats={statsMap.get(et.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
