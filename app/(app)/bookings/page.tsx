import { and, count, desc, eq, gt, gte, lte } from 'drizzle-orm'
import { format, isToday, isTomorrow } from 'date-fns'
import Link from 'next/link'
import {
  CalendarBlank,
  CalendarCheck,
  CalendarX,
  Clock,
  EnvelopeSimple,
  VideoCamera,
  Phone,
  MapPin,
  ArrowCounterClockwise,
  X,
} from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/scaffold/page-header'
import { booking, eventType } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Bookings' }

type Tab = 'upcoming' | 'past' | 'cancelled'

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, MMM d')
}

const LOCATION_ICON: Record<string, React.ElementType> = {
  zoom:         VideoCamera,
  google_meet:  VideoCamera,
  teams:        VideoCamera,
  phone:        Phone,
  in_person:    MapPin,
  other:        MapPin,
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-primary/10 text-primary border border-primary/20',
  cancelled:  'bg-destructive/10 text-destructive border border-destructive/20',
  pending:    'bg-amber-500/10 text-amber-700 border border-amber-500/20',
  no_show:    'bg-muted text-muted-foreground border border-border',
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  cancelled:  'Cancelled',
  pending:    'Pending',
  no_show:    'No show',
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await requireSession()
  const { tab: rawTab } = await searchParams
  const tab: Tab = rawTab === 'past' || rawTab === 'cancelled' ? rawTab : 'upcoming'

  const now = new Date()

  // ── Count each tab for badge display ────────────────────────────────────────
  const [upcomingCount, pastCount, cancelledCount] = await Promise.all([
    db.select({ value: count() }).from(booking).where(
      and(
        eq(booking.hostUserId, session.user.id),
        eq(booking.status, 'confirmed'),
        gt(booking.startTime, now),
      )
    ),
    db.select({ value: count() }).from(booking).where(
      and(
        eq(booking.hostUserId, session.user.id),
        eq(booking.status, 'confirmed'),
        lte(booking.endTime, now),
      )
    ),
    db.select({ value: count() }).from(booking).where(
      and(
        eq(booking.hostUserId, session.user.id),
        eq(booking.status, 'cancelled'),
      )
    ),
  ])

  const counts = {
    upcoming:  upcomingCount[0]?.value  ?? 0,
    past:      pastCount[0]?.value      ?? 0,
    cancelled: cancelledCount[0]?.value ?? 0,
  }

  // ── Fetch bookings for active tab ────────────────────────────────────────────
  const whereClause =
    tab === 'upcoming'
      ? and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'confirmed'), gt(booking.startTime, now))
      : tab === 'past'
        ? and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'confirmed'), lte(booking.endTime, now))
        : and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'cancelled'))

  const orderBy =
    tab === 'upcoming'
      ? booking.startTime          // soonest first
      : desc(booking.startTime)    // most recent first

  const bookings = await db
    .select({
      id:              booking.id,
      inviteeName:     booking.inviteeName,
      inviteeEmail:    booking.inviteeEmail,
      inviteeTimezone: booking.inviteeTimezone,
      startTime:       booking.startTime,
      endTime:         booking.endTime,
      duration:        booking.duration,
      status:          booking.status,
      locationValue:   booking.locationValue,
      cancelToken:     booking.cancelToken,
      rescheduleToken: booking.rescheduleToken,
      cancelledAt:     booking.cancelledAt,
      cancellationReason: booking.cancellationReason,
      eventName:       eventType.name,
      locationType:    eventType.locationType,
      eventColor:      eventType.color,
    })
    .from(booking)
    .innerJoin(eventType, eq(booking.eventTypeId, eventType.id))
    .where(whereClause)
    .orderBy(orderBy)
    .limit(50)

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'upcoming',  label: 'Upcoming',  icon: Clock },
    { key: 'past',      label: 'Past',      icon: CalendarCheck },
    { key: 'cancelled', label: 'Cancelled', icon: CalendarX },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Bookings"
        description="View and manage all your upcoming and past bookings."
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/bookings?tab=${key}`}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            )}
          >
            <Icon size={15} weight={tab === key ? 'fill' : 'regular'} />
            {label}
            <span className={cn(
              'ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold',
              tab === key ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
              {counts[key]}
            </span>
          </Link>
        ))}
      </div>

      {/* ── Booking list ─────────────────────────────────────────────────── */}
      {bookings.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const LocationIcon = LOCATION_ICON[b.locationType ?? 'other'] ?? MapPin
            const isUpcoming = tab === 'upcoming'

            return (
              <Card key={b.id}>
                <CardContent className="p-0">
                  <div className="flex items-start gap-4 p-5">
                    {/* Color dot + date column */}
                    <div className="flex flex-col items-center gap-1 shrink-0 w-14 text-center">
                      <div
                        className="size-3 rounded-full mt-1"
                        style={{ backgroundColor: b.eventColor ?? '#0d9488' }}
                      />
                      <p className="text-xs font-semibold text-foreground leading-tight">
                        {format(b.startTime, 'MMM')}
                      </p>
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {format(b.startTime, 'd')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(b.startTime, 'EEE')}
                      </p>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {b.inviteeName}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 truncate">
                            {b.eventName}
                          </p>
                        </div>
                        <span className={cn(
                          'shrink-0 rounded-none px-2 py-0.5 text-xs font-semibold',
                          STATUS_STYLES[b.status] ?? STATUS_STYLES.no_show,
                        )}>
                          {STATUS_LABEL[b.status] ?? b.status}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {dayLabel(b.startTime)} · {format(b.startTime, 'h:mm a')} – {format(b.endTime, 'h:mm a')}
                          <span className="text-muted-foreground/60">({b.duration} min)</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <EnvelopeSimple size={12} />
                          {b.inviteeEmail}
                        </span>
                        {b.locationValue && (
                          <span className="flex items-center gap-1">
                            <LocationIcon size={12} />
                            {b.locationValue}
                          </span>
                        )}
                      </div>

                      {/* Cancellation reason */}
                      {tab === 'cancelled' && b.cancellationReason && (
                        <p className="mt-2 text-xs text-muted-foreground border-l-2 border-destructive/30 pl-2">
                          Reason: {b.cancellationReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action row — only for upcoming confirmed bookings */}
                  {isUpcoming && b.status === 'confirmed' && (
                    <div className="border-t border-border px-5 py-3 flex items-center gap-2">
                      <Button asChild variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <Link href={`/reschedule/${b.rescheduleToken}`}>
                          <ArrowCounterClockwise size={13} />
                          Reschedule
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-destructive/70 hover:text-destructive hover:bg-destructive/5">
                        <Link href={`/cancel/${b.cancelToken}`}>
                          <X size={13} />
                          Cancel
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}

function EmptyState({ tab }: { tab: Tab }) {
  const CONFIG = {
    upcoming: {
      icon: CalendarBlank,
      title: 'No upcoming bookings',
      description: 'Share your booking link to start getting meetings.',
    },
    past: {
      icon: CalendarCheck,
      title: 'No past bookings',
      description: 'Completed meetings will appear here.',
    },
    cancelled: {
      icon: CalendarX,
      title: 'No cancelled bookings',
      description: 'Cancelled meetings will appear here.',
    },
  }
  const { icon: Icon, title, description } = CONFIG[tab]

  return (
    <Card>
      <CardContent className="flex flex-col items-center py-16 text-center">
        <Icon size={40} weight="thin" className="mb-3 text-muted-foreground/30" />
        <p className="font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
        {tab === 'upcoming' && (
          <Button asChild size="sm" className="mt-5">
            <Link href="/event-types">View Event Types</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
