import { and, count, desc, eq, gt, gte, lte } from "drizzle-orm";
import { format, isToday, isTomorrow, startOfMonth } from "date-fns";
import Link from "next/link";
import {
  CalendarBlank,
  CalendarCheck,
  CalendarX,
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

export const metadata = { title: "Dashboard" };

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export default async function DashboardPage() {
  const session = await requireSession();

  const [freshUser] = await db
    .select({ name: user.name, email: user.email })
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
  ]);

  const stats = {
    total:             totalResult[0]?.value ?? 0,
    totalThisMonth:    totalMonthResult[0]?.value ?? 0,
    upcoming:          upcomingResult[0]?.value ?? 0,
    nextMeeting:       nextMeetingResult[0] ?? null,
    completed:         completedResult[0]?.value ?? 0,
    completedThisMonth: completedMonthResult[0]?.value ?? 0,
    cancelled:         cancelledResult[0]?.value ?? 0,
    cancelledThisMonth: cancelledMonthResult[0]?.value ?? 0,
  };

  // ── Lists ──────────────────────────────────────────────────────────
  const [upcomingMeetings, recentBookings] = await Promise.all([
    db
      .select({
        id: booking.id,
        inviteeName: booking.inviteeName,
        startTime: booking.startTime,
        status: booking.status,
        eventName: eventType.name,
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
      {/* ── Welcome ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          👋 Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your meetings, event types and bookings from one place.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Bookings"
          value={stats.total}
          subtitle={
            stats.totalThisMonth > 0
              ? `+${stats.totalThisMonth} this month`
              : "All time"
          }
          icon={<CalendarBlank size={20} weight="duotone" />}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          subtitle={upcomingSubtitle}
          icon={<Clock size={20} weight="duotone" />}
          accent
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
              <EmptyUpcoming />
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
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {m.eventName}
                    </p>
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
              <EmptyBookings />
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

      {/* ── Quick actions ────────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-ui text-muted-foreground">
          Quick Actions
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/event-types">
              <Plus size={15} className="mr-1.5" weight="bold" />
              Create Event
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/settings">
              <ShareNetwork size={15} className="mr-1.5" />
              Share Booking Link
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/availability">
              <LinkSimple size={15} className="mr-1.5" />
              Set Availability
            </Link>
          </Button>
        </div>
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
}: {
  label: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/[0.04]" : ""}>
      <CardContent className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
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
      </CardContent>
    </Card>
  );
}

function EmptyUpcoming() {
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

function EmptyBookings() {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <ShareNetwork
        size={36}
        weight="thin"
        className="mb-3 text-muted-foreground/30"
      />
      <p className="text-sm font-medium text-foreground">No bookings yet</p>
      <p className="mt-1 max-w-56 text-xs text-muted-foreground">
        Share your booking link to get your first booking.
      </p>
      <Button asChild size="sm" variant="secondary" className="mt-4">
        <Link href="/settings">Share Link</Link>
      </Button>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  confirmed:
    "bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-2 py-0.5",
  cancelled:
    "bg-destructive/10 text-destructive border border-destructive/20 text-xs font-medium px-2 py-0.5",
  pending:
    "bg-warning/10 text-warning border border-warning/20 text-xs font-medium px-2 py-0.5",
  no_show:
    "bg-muted text-muted-foreground border border-border text-xs font-medium px-2 py-0.5",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={STATUS_STYLES[status] ?? STATUS_STYLES.no_show}>
      {status === "no_show" ? "No show" : status}
    </span>
  );
}
