import { and, count, desc, eq, gt, ilike, lte, or } from 'drizzle-orm'
import { format, isToday, isTomorrow } from 'date-fns'
import Link from 'next/link'
import {
  CalendarBlank,
  CalendarCheck,
  CalendarX,
  Check,
  Clock,
  EnvelopeSimple,
  EnvelopeOpen,
  Hourglass,
  VideoCamera,
  Phone,
  MapPin,
  ArrowCounterClockwise,
  MagnifyingGlass,
  Sliders,
  X,
} from '@phosphor-icons/react/dist/ssr'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/scaffold/page-header'
import { BookingsSearch } from './_components/bookings-search'
import { booking, eventType } from '@/db/schema'
import { requireSession } from '@/lib/authz'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Bookings' }

type Tab = 'upcoming' | 'past' | 'cancelled' | 'pending'

function dayLabel(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE, MMM d')
}

const PLATFORM_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  zoom:                { label: 'Zoom',        color: 'bg-blue-500/10 text-blue-600',   icon: VideoCamera },
  google_meet:         { label: 'Google Meet', color: 'bg-primary/10 text-primary',     icon: VideoCamera },
  teams:               { label: 'Teams',       color: 'bg-purple-500/10 text-purple-600', icon: VideoCamera },
  phone_host_calls:    { label: 'Phone',       color: 'bg-muted text-muted-foreground', icon: Phone },
  phone_invitee_calls: { label: 'Phone',       color: 'bg-muted text-muted-foreground', icon: Phone },
  in_person:           { label: 'In-person',   color: 'bg-amber-500/10 text-amber-700', icon: MapPin },
  invitees_choice:     { label: 'Flexible',    color: 'bg-muted text-muted-foreground', icon: VideoCamera },
  custom:              { label: 'Online',      color: 'bg-muted text-muted-foreground', icon: VideoCamera },
}

const STATUS_STYLES: Record<string, { dotClass: string; badge: string; label: string }> = {
  confirmed: { dotClass: 'bg-primary',          badge: 'bg-primary/10 text-primary',         label: 'Confirmed' },
  cancelled: { dotClass: 'bg-destructive',       badge: 'bg-destructive/10 text-destructive', label: 'Cancelled' },
  pending:   { dotClass: 'bg-amber-500',         badge: 'bg-amber-500/10 text-amber-700',     label: 'Pending' },
  no_show:   { dotClass: 'bg-muted-foreground',  badge: 'bg-muted text-muted-foreground',     label: 'No show' },
  completed: { dotClass: 'bg-foreground/30',     badge: 'bg-foreground/5 text-muted-foreground', label: 'Completed' },
}

const TAB_DOTS: Record<Tab, string> = {
  upcoming:  'bg-primary',
  past:      'bg-muted-foreground/60',
  cancelled: 'bg-destructive',
  pending:   'bg-amber-500',
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const session = await requireSession()
  const { tab: rawTab, q } = await searchParams
  const tab: Tab =
    rawTab === 'past' || rawTab === 'cancelled' || rawTab === 'pending' ? rawTab : 'upcoming'
  const search = q?.trim() ?? ''

  const now = new Date()

  // ── Tab counts ───────────────────────────────────────────────────────────────
  const [upcomingCount, pastCount, cancelledCount, pendingCount] = await Promise.all([
    db.select({ value: count() }).from(booking).where(
      and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'confirmed'), gt(booking.startTime, now))
    ),
    db.select({ value: count() }).from(booking).where(
      and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'confirmed'), lte(booking.startTime, now))
    ),
    db.select({ value: count() }).from(booking).where(
      and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'cancelled'))
    ),
    db.select({ value: count() }).from(booking).where(
      and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'pending'))
    ),
  ])

  const counts = {
    upcoming:  upcomingCount[0]?.value  ?? 0,
    past:      pastCount[0]?.value      ?? 0,
    cancelled: cancelledCount[0]?.value ?? 0,
    pending:   pendingCount[0]?.value   ?? 0,
  }

  // ── Fetch bookings ───────────────────────────────────────────────────────────
  const baseWhere =
    tab === 'upcoming'
      ? and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'confirmed'), gt(booking.startTime, now))
      : tab === 'past'
        ? and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'confirmed'), lte(booking.startTime, now))
        : tab === 'pending'
          ? and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'pending'))
          : and(eq(booking.hostUserId, session.user.id), eq(booking.status, 'cancelled'))

  const whereClause = search
    ? and(baseWhere, or(
        ilike(booking.inviteeName, `%${search}%`),
        ilike(booking.inviteeEmail, `%${search}%`),
      ))
    : baseWhere

  const bookings = await db
    .select({
      id:                 booking.id,
      inviteeName:        booking.inviteeName,
      inviteeEmail:       booking.inviteeEmail,
      startTime:          booking.startTime,
      endTime:            booking.endTime,
      duration:           booking.duration,
      status:             booking.status,
      locationValue:      booking.locationValue,
      cancelToken:        booking.cancelToken,
      rescheduleToken:    booking.rescheduleToken,
      cancellationReason: booking.cancellationReason,
      approvalToken:      booking.approvalToken,
      rejectionReason:    booking.rejectionReason,
      eventName:          eventType.name,
      locationType:       eventType.locationType,
      eventColor:         eventType.color,
    })
    .from(booking)
    .innerJoin(eventType, eq(booking.eventTypeId, eventType.id))
    .where(whereClause)
    .orderBy(tab === 'upcoming' || tab === 'pending' ? booking.startTime : desc(booking.startTime))
    .limit(50)

  const TABS: { key: Tab; label: string }[] = [
    { key: 'upcoming',  label: 'Upcoming' },
    { key: 'pending',   label: 'Pending' },
    { key: 'past',      label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Bookings"
        description="View and manage all your upcoming and past bookings."
      />

      {/* ── Toolbar: pill tabs + search ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {/* Pill tabs */}
        <div className="flex items-center gap-1.5">
          {TABS.map(({ key, label }) => (
            <Link
              key={key}
              href={`/bookings?tab=${key}`}
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium border transition-all',
                tab === key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground hover:border-primary/40',
              )}
            >
              <span className={cn(
                'size-2 rounded-full shrink-0',
                tab === key ? 'bg-white/70' : TAB_DOTS[key],
              )} />
              {label}
              <span className={cn(
                'text-xs font-bold',
                tab === key ? 'text-white/80' : 'text-muted-foreground',
              )}>
                {counts[key]}
              </span>
            </Link>
          ))}
        </div>

        {/* Search — debounced, updates URL as you type */}
        <BookingsSearch tab={tab} />
      </div>

      {/* ── List ─────────────────────────────────────────────────────────────── */}
      {bookings.length === 0 ? (
        <EmptyState tab={tab} hasSearch={!!search} />
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => {
            const isUpcoming = tab === 'upcoming'
            const isPending = tab === 'pending'
            const statusMeta = STATUS_STYLES[b.status] ?? STATUS_STYLES.no_show
            const platform = PLATFORM_META[b.locationType ?? 'custom'] ?? PLATFORM_META.custom
            const PlatformIcon = platform.icon

            const joinUrl =
              b.locationValue?.startsWith('http') &&
              ['zoom', 'google_meet', 'teams', 'custom'].includes(b.locationType ?? '')
                ? b.locationValue
                : null

            const joinLabel =
              b.locationType === 'zoom'        ? 'Open Zoom'
              : b.locationType === 'google_meet' ? 'Join Meet'
              : 'Join Meeting'

            return (
              <div
                key={b.id}
                className="group relative flex items-stretch border border-border bg-background transition-all duration-150 hover:border-primary/40 hover:bg-primary/[0.02] overflow-hidden"
              >
                {/* 3px event color bar */}
                <div
                  className="w-[3px] shrink-0"
                  style={{ backgroundColor: b.eventColor ?? 'var(--primary)' }}
                />

                {/* Date column */}
                <div className="flex flex-col items-center justify-center w-[58px] shrink-0 text-center py-3 px-2 border-r border-border/40">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide leading-none">
                    {format(b.startTime, 'MMM')}
                  </p>
                  <p className="text-2xl font-bold text-foreground leading-tight">
                    {format(b.startTime, 'd')}
                  </p>
                  <p className="text-xs text-muted-foreground leading-none">
                    {format(b.startTime, 'EEE')}
                  </p>
                </div>

                {/* Center: content */}
                <div className="flex-1 min-w-0 py-3 px-4 flex flex-col justify-center">
                  {/* Name + event name */}
                  <div className="flex items-baseline gap-2 min-w-0">
                    <p className="font-semibold text-foreground text-base truncate transition-colors duration-150 group-hover:text-primary">{b.inviteeName}</p>
                    <p className="text-sm text-muted-foreground truncate">{b.eventName}</p>
                  </div>

                  {/* Meta row */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock size={13} />
                      {dayLabel(b.startTime)} · {format(b.startTime, 'h:mm a')} – {format(b.endTime, 'h:mm a')}
                    </span>
                    <span className="flex items-center gap-1 max-w-[180px] sm:max-w-none truncate">
                      <EnvelopeSimple size={13} className="shrink-0" />
                      <span className="truncate">{b.inviteeEmail}</span>
                    </span>
                    {/* Platform badge */}
                    <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium', platform.color)}>
                      <PlatformIcon size={12} weight="fill" />
                      {platform.label}
                    </span>
                    {/* Cancellation reason */}
                    {tab === 'cancelled' && b.cancellationReason && (
                      <span className="text-destructive/70 truncate max-w-xs">
                        "{b.cancellationReason}"
                      </span>
                    )}
                    {/* Pending indicator */}
                    {isPending && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Hourglass size={13} weight="fill" />
                        Awaiting your review
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: status badge + actions */}
                <div className="flex flex-col items-end justify-center gap-2 px-4 py-3 shrink-0">
                  {/* Status pill */}
                  <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-semibold', statusMeta.badge)}>
                    <span className={cn('size-1.5 rounded-full shrink-0', statusMeta.dotClass)} />
                    {statusMeta.label}
                  </span>

                  {/* Actions — upcoming confirmed bookings */}
                  {isUpcoming && b.status === 'confirmed' && (
                    <div className="flex items-center gap-1">
                      {joinUrl && (
                        <Button asChild size="sm" className="h-7 text-xs gap-1 px-2.5">
                          <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                            <VideoCamera size={13} weight="fill" />
                            {joinLabel}
                          </a>
                        </Button>
                      )}
                      {b.rescheduleToken && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 px-2"
                          title="Reschedule"
                        >
                          <Link href={`/reschedule/${b.rescheduleToken}`}>
                            <ArrowCounterClockwise size={14} />
                            <span className="hidden lg:inline">Reschedule</span>
                          </Link>
                        </Button>
                      )}
                      {b.cancelToken && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                          title="Cancel"
                        >
                          <Link href={`/cancel/${b.cancelToken}`}>
                            <X size={14} />
                          </Link>
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Actions — pending approval bookings */}
                  {tab === 'pending' && b.approvalToken && (
                    <div className="flex items-center gap-1">
                      <Button
                        asChild
                        size="sm"
                        className="h-7 text-xs gap-1 px-2.5 bg-primary hover:bg-primary/90"
                      >
                        <Link href={`/booking/review/${b.approvalToken}?action=approve`}>
                          <Check size={13} weight="bold" />
                          Approve
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 px-2 border-destructive/40 text-destructive hover:bg-destructive/5 hover:border-destructive"
                      >
                        <Link href={`/booking/review/${b.approvalToken}`}>
                          <X size={13} weight="bold" />
                          Decline
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function EmptyState({ tab, hasSearch }: { tab: Tab; hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <MagnifyingGlass size={40} weight="thin" className="mb-3 text-muted-foreground/30" />
        <p className="font-medium text-foreground">No results found</p>
        <p className="mt-1 text-sm text-muted-foreground">Try a different name or email address.</p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href={`/bookings?tab=${tab}`}>Clear search</Link>
        </Button>
      </div>
    )
  }

  if (tab === 'pending') {
    return (
      <div className="flex justify-center py-10">
        <div className="w-full max-w-lg border border-border bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-amber-50/60 px-6 py-5">
            <span className="flex size-10 shrink-0 items-center justify-center bg-amber-100 text-amber-600">
              <Hourglass size={20} weight="fill" />
            </span>
            <div>
              <p className="font-semibold text-foreground text-sm">No pending requests</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Booking requests awaiting your approval will appear here.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              How approval works
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Enable approval on a meeting type</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Edit any meeting type → Details tab → turn on <strong>Require Approval</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">Invitee submits a request</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    They book a time slot and see "Awaiting Approval" instead of a confirmation.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                  3
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">You approve or decline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Requests appear here with <strong>Approve</strong> and <strong>Decline</strong> buttons,
                    or act directly from the email notification you receive.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/event-types">
                <Sliders size={15} weight="bold" />
                Go to Meeting Types
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/bookings">
                <EnvelopeOpen size={13} />
                View all bookings
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'upcoming') {
    return (
      <div className="flex justify-center py-6">
        <div className="w-full max-w-lg border border-border bg-background overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border bg-primary/[0.04] px-6 py-5">
            <span className="flex size-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
              <CalendarBlank size={20} weight="duotone" />
            </span>
            <div>
              <p className="font-semibold text-foreground text-base">No upcoming bookings</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your confirmed meetings will appear here once people start booking.
              </p>
            </div>
          </div>

          {/* Steps */}
          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Get your first booking
            </p>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  title: 'Create a meeting type',
                  desc: 'Define the meeting length, location, and any custom questions you want to ask.',
                  href: '/event-types',
                  cta: 'Go to Meeting Types',
                },
                {
                  step: '2',
                  title: 'Share your booking link',
                  desc: 'Copy your personal link and paste it in your email signature, LinkedIn bio, or Slack profile.',
                  href: '/settings/my-link',
                  cta: 'Get your link',
                },
                {
                  step: '3',
                  title: 'Set your availability',
                  desc: 'Make sure your working hours are configured so invitees see the right time slots.',
                  href: '/availability',
                  cta: 'Set availability',
                },
              ].map(({ step, title, desc, href, cta }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                    {step}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <Button asChild size="sm" variant="outline" className="shrink-0 text-xs h-7 px-2.5">
                    <Link href={href}>{cta}</Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center gap-3 border-t border-border bg-muted/30 px-6 py-4">
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/event-types">
                <CalendarBlank size={15} weight="bold" />
                Create Meeting Type
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/settings/my-link">
                View my booking page
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (tab === 'past') {
    return (
      <div className="flex justify-center py-6">
        <div className="w-full max-w-lg border border-border bg-background overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-5">
            <span className="flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground">
              <CalendarCheck size={20} weight="duotone" />
            </span>
            <div>
              <p className="font-semibold text-foreground text-sm">No past bookings yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Completed meetings will appear here once they have passed.
              </p>
            </div>
          </div>
          <div className="px-6 py-5 text-sm text-muted-foreground leading-relaxed">
            Once you have upcoming bookings confirmed and those meetings pass, they will automatically move here. You can review details, see who attended, and download ICS files.
          </div>
          <div className="flex items-center border-t border-border bg-muted/30 px-6 py-4">
            <Button asChild size="sm" variant="outline" className="gap-1.5">
              <Link href="/bookings?tab=upcoming">
                <CalendarBlank size={15} />
                View upcoming
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // cancelled
  return (
    <div className="flex justify-center py-6">
      <div className="w-full max-w-lg border border-border bg-background overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-6 py-5">
          <span className="flex size-10 shrink-0 items-center justify-center bg-muted text-muted-foreground">
            <CalendarX size={20} weight="duotone" />
          </span>
          <div>
            <p className="font-semibold text-foreground text-sm">No cancelled bookings</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Meetings that are cancelled will be logged here for reference.
            </p>
          </div>
        </div>
        <div className="px-6 py-5 text-sm text-muted-foreground leading-relaxed">
          When you or an invitee cancels a meeting, it moves here along with the cancellation reason. You can use this history to spot patterns or follow up with invitees.
        </div>
        <div className="flex items-center border-t border-border bg-muted/30 px-6 py-4">
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/bookings?tab=upcoming">
              <CalendarBlank size={13} />
              View upcoming
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
