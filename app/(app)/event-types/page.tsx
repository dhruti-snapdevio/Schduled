import Link from 'next/link'
import { CalendarPlus } from '@phosphor-icons/react/dist/ssr'
import { listEventTypes } from '@/app/actions/event-types'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { Button } from '@/components/ui/button'
import { Empty } from '@/components/ui/empty'
import { PageHeader } from '@/components/scaffold/page-header'
import { EventTypeCard } from './_components/event-type-card'

export const metadata = { title: 'Event Types' }

export default async function EventTypesPage() {
  const session = await requireSession()

  const [eventTypes, [currentUser]] = await Promise.all([
    listEventTypes(),
    db.select({ username: user.username }).from(user).where(eq(user.id, session.user.id)).limit(1),
  ])

  const username = currentUser?.username ?? null

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
              color={et.color ?? '#0d9488'}
              locationType={et.locationType}
              isActive={et.isActive}
              isHidden={et.isHidden}
              durations={et.durations}
              username={username}
            />
          ))}
        </div>
      )}
    </>
  )
}
