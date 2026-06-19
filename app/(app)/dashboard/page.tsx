import { and, count, desc, eq, gt, gte, lte } from "drizzle-orm";
import { endOfDay, format, isToday, isTomorrow, startOfDay, startOfMonth } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  CalendarBlank,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  Clock,
  LinkSimple,
  Plus,
  ShareNetwork,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { booking, eventType, user } from "@/db/schema";
import { requireSession } from "@/lib/authz";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export const metadata = { title: "Dashboard" };

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export default async function DashboardPage() {
  const session = await requireSession();

  const [freshUser] = await db
    .select({ name: user.name, email: user.email, username: user.username })
    .from(user)
    .where(eq(user.id, session.user.id))
    .limit(1);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const displayName =
    freshUser?.name?.split(" ")[0] ?? freshUser?.email ?? "there";

  // ── Stats (all counts + this-month counts + next meeting) ─────────
  const [
    totalResult,
    totalMonthResult,
    upcomingResult,
    completedResult,
    completedMonthResult,
    cancelledResult,
    cancelledMonthResult,
    nextMeetingResult,
    activeEventTypesResult,
    meetingsTodayResult,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(booking)
      .where(eq(booking.hostUserId, session.user.id)),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          gte(booking.createdAt, monthStart),
        ),
      ),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "confirmed"),
          gt(booking.startTime, now),
        ),
      ),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "confirmed"),
          lte(booking.endTime, now),
        ),
      ),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "confirmed"),
          lte(booking.endTime, now),
          gte(booking.endTime, monthStart),
        ),
      ),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "cancelled"),
        ),
      ),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "cancelled"),
          gte(booking.createdAt, monthStart),
        ),
      ),

    db
      .select({ startTime: booking.startTime })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "confirmed"),
          gt(booking.startTime, now),
        ),
      )
      .orderBy(booking.startTime)
      .limit(1),

    db
      .select({ value: count() })
      .from(eventType)
      .where(
        and(
          eq(eventType.userId, session.user.id),
          eq(eventType.isActive, true),
        ),
      ),

    db
      .select({ value: count() })
      .from(booking)
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "confirmed"),
          gte(booking.startTime, startOfDay(now)),
          lte(booking.startTime, endOfDay(now)),
        ),
      ),
  ]);

  const stats = {
    total:              totalResult[0]?.value ?? 0,
    totalThisMonth:     totalMonthResult[0]?.value ?? 0,
    upcoming:           upcomingResult[0]?.value ?? 0,
    nextMeeting:        nextMeetingResult[0] ?? null,
    completed:          completedResult[0]?.value ?? 0,
    completedThisMonth: completedMonthResult[0]?.value ?? 0,
    cancelled:          cancelledResult[0]?.value ?? 0,
    cancelledThisMonth: cancelledMonthResult[0]?.value ?? 0,
    activeEventTypes:   activeEventTypesResult[0]?.value ?? 0,
    meetingsToday:      meetingsTodayResult[0]?.value ?? 0,
  };

  const username = freshUser?.username ?? null
  const bookingUrl = username ? `${env.NEXT_PUBLIC_APP_URL}/${username}` : null

  // ── Lists ──────────────────────────────────────────────────────────
  const [upcomingMeetings, recentBookings] = await Promise.all([
    db
      .select({
        id: booking.id,
        inviteeName: booking.inviteeName,
        startTime: booking.startTime,
        status: booking.status,
        eventName: eventType.name,
        locationType: eventType.locationType,
      })
      .from(booking)
      .innerJoin(eventType, eq(booking.eventTypeId, eventType.id))
      .where(
        and(
          eq(booking.hostUserId, session.user.id),
          eq(booking.status, "confirmed"),
          gt(booking.startTime, now),
        ),
      )
      .orderBy(booking.startTime)
      .limit(5),

    db
      .select({
        id: booking.id,
        inviteeName: booking.inviteeName,
        createdAt: booking.createdAt,
        status: booking.status,
        eventName: eventType.name,
      })
      .from(booking)
      .innerJoin(eventType, eq(booking.eventTypeId, eventType.id))
      .where(eq(booking.hostUserId, session.user.id))
      .orderBy(desc(booking.createdAt))
      .limit(5),
  ]);

  const upcomingSubtitle = stats.nextMeeting
    ? `Next: ${dayLabel(stats.nextMeeting.startTime)}`
    : "None scheduled";

  return (
    <div className="space-y-8">
      {/* ── Welcome + Quick Actions ──────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have{" "}
            <span className="font-semibold text-foreground">{stats.upcoming} upcoming meetings</span>
            {stats.meetingsToday > 0 && (
              <>, <span className="font-semibold text-foreground">{stats.meetingsToday} today</span></>
            )}
            {" "}and{" "}
            <span className="font-semibold text-foreground">{stats.totalThisMonth} bookings this month</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <Link href="/event-types">
              <Plus size={15} className="mr-1.5" weight="bold" />
              Create Event
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/availability">
              <LinkSimple size={15} className="mr-1.5" />
              Set Availability
            </Link>
          </Button>
          {bookingUrl ? (
            <Button asChild variant="secondary">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                <ShareNetwork size={15} className="mr-1.5" />
                View Booking Page
              </a>
            </Button>
          ) : (
            <Button asChild variant="secondary">
              <Link href="/settings/my-link">
                <ShareNetwork size={15} className="mr-1.5" />
                Set Up Link
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Event Types"
          value={stats.activeEventTypes}
          subtitle="Active"
          icon={<CalendarPlus size={20} weight="duotone" />}
          accent={stats.activeEventTypes > 0 && stats.total === 0}
          href="/event-types"
        />
        <StatCard
          label="Total Bookings"
          value={stats.total}
          subtitle="All time"
          icon={<CalendarBlank size={20} weight="duotone" />}
          note={`${stats.totalThisMonth} bookings this month`}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          subtitle={upcomingSubtitle}
          icon={<Clock size={20} weight="duotone" />}
          accent={stats.upcoming > 0}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          subtitle={`${stats.completedThisMonth} this month`}
          icon={<CalendarCheck size={20} weight="duotone" />}
        />
        <StatCard
          label="Cancelled"
          value={stats.cancelled}
          subtitle={`${stats.cancelledThisMonth} this month`}
          icon={<CalendarX size={20} weight="duotone" />}
        />
      </div>

      {/* ── Upcoming meetings + Recent bookings ─────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-semibold">
              Upcoming Meetings
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingMeetings.length === 0 ? (
              <EmptyUpcoming hasEventTypes={stats.activeEventTypes > 0} bookingUrl={bookingUrl} />
            ) : (
              upcomingMeetings.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-4 border-t border-border px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {m.inviteeName}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <p className="truncate text-xs text-muted-foreground">
                        {m.eventName}
                      </p>
                      <LocationBadge locationType={m.locationType} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-semibold text-foreground">
                      {dayLabel(m.startTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(m.startTime, "h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base font-semibold">
              Recent Bookings
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentBookings.length === 0 ? (
              <EmptyBookings bookingUrl={bookingUrl} />
            ) : (
              recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-4 border-t border-border px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {b.inviteeName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {b.eventName}
                    </p>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <StatusBadge status={b.status} />
                    <p className="text-xs text-muted-foreground">
                      {dayLabel(b.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
  icon,
  accent = false,
  note,
  href,
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
  note?: string;
  href?: string;
}) {
  return (
    <Card
      className={[
        "transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/60",
        accent ? "border-primary/40 bg-primary/[0.04]" : "",
      ].join(" ")}
    >
      <CardContent className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
              {label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold text-foreground">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <span className={accent ? "text-primary" : "text-muted-foreground/60"}>
            {icon}
          </span>
        </div>

        {(note || href) && (
          <div className="mt-3 border-t border-border pt-3">
            {note && (
              <p className="text-xs text-muted-foreground">{note}</p>
            )}
            {href && (
              <Link
                href={href}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Manage <ArrowRight size={11} weight="bold" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyUpcoming({
  hasEventTypes,
  bookingUrl,
}: {
  hasEventTypes: boolean
  bookingUrl: string | null
}) {
  if (hasEventTypes) {
    return (
      <div className="flex flex-col items-center px-6 py-10 text-center">
        <ShareNetwork
          size={36}
          weight="thin"
          className="mb-3 text-muted-foreground/30"
        />
        <p className="text-sm font-medium text-foreground">No upcoming meetings yet</p>
        <p className="mt-1 max-w-56 text-xs text-muted-foreground">
          Share your booking link and people can start scheduling with you.
        </p>
        {bookingUrl ? (
          <Button asChild size="sm" className="mt-4">
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
              <LinkSimple size={13} className="mr-1.5" />
              View Booking Page
            </a>
          </Button>
        ) : (
          <Button asChild size="sm" className="mt-4">
            <Link href="/event-types">
              <CalendarPlus size={13} className="mr-1.5" />
              View Event Types
            </Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <CalendarBlank
        size={36}
        weight="thin"
        className="mb-3 text-muted-foreground/30"
      />
      <p className="text-sm font-medium text-foreground">No upcoming meetings</p>
      <p className="mt-1 max-w-56 text-xs text-muted-foreground">
        Create your first event type and start accepting bookings.
      </p>
      <Button asChild size="sm" className="mt-4">
        <Link href="/event-types">
          <Plus size={13} className="mr-1.5" weight="bold" />
          Create Event
        </Link>
      </Button>
    </div>
  );
}

function EmptyBookings({ bookingUrl }: { bookingUrl: string | null }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <ShareNetwork
        size={36}
        weight="thin"
        className="mb-3 text-muted-foreground/30"
      />
      <p className="text-sm font-medium text-foreground">No bookings yet</p>
      <p className="mt-1 max-w-56 text-xs text-muted-foreground">
        {bookingUrl
          ? "Share your booking link to get your first booking."
          : "Create an event type, then share your link to get bookings."}
      </p>
      <Button asChild size="sm" variant="secondary" className="mt-4">
        <Link href="/event-types">
          {bookingUrl ? "View Event Types" : "Create Event Type"}
        </Link>
      </Button>
    </div>
  );
}

const STATUS_STYLES: Record<string, { badge: string; dotColor: string; label: string }> = {
  confirmed: { badge: "bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-2.5 py-0.5", dotColor: "bg-primary",       label: "Confirmed" },
  cancelled: { badge: "bg-red-50 text-red-600 border border-red-200 text-xs font-medium px-2.5 py-0.5",        dotColor: "bg-red-500",        label: "Cancelled" },
  pending:   { badge: "bg-amber-50 text-amber-600 border border-amber-200 text-xs font-medium px-2.5 py-0.5",  dotColor: "bg-amber-500",      label: "Pending"   },
  no_show:   { badge: "bg-muted text-muted-foreground border border-border text-xs font-medium px-2.5 py-0.5", dotColor: "bg-muted-foreground", label: "No show" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.no_show;
  return (
    <span className={`inline-flex items-center gap-1.5 ${s.badge}`}>
      <span className={`size-1.5 shrink-0 rounded-full ${s.dotColor}`} />
      {s.label}
    </span>
  );
}

const LOCATION_BADGE_STYLES: Record<string, string> = {
  zoom:               "bg-blue-50 text-blue-600 border border-blue-200",
  google_meet:        "bg-green-50 text-green-600 border border-green-200",
  phone_host_calls:   "bg-orange-50 text-orange-600 border border-orange-200",
  phone_invitee_calls:"bg-orange-50 text-orange-600 border border-orange-200",
  in_person:          "bg-purple-50 text-purple-600 border border-purple-200",
};
const LOCATION_LABEL: Record<string, string> = {
  zoom: "Zoom",
  google_meet: "Google Meet",
  phone_host_calls: "Phone",
  phone_invitee_calls: "Phone",
  in_person: "In Person",
};

function LocationBadge({ locationType }: { locationType: string }) {
  const style = LOCATION_BADGE_STYLES[locationType];
  const label = LOCATION_LABEL[locationType];
  if (!label) return null;
  return (
    <span className={`inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 shrink-0 ${style}`}>
      {label}
    </span>
  );
}
