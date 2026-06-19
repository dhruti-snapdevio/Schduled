import { count, desc, eq, max } from "drizzle-orm";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDot,
  Clock,
  IdentificationCard,
  ShieldCheck,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { UserDetailActions } from "@/components/orbit/user-detail-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ADMIN_ROLE } from "@/config/platform";
import { auditLogs, booking, eventType, session, user } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "User Detail" };

export default async function OrbitUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      timezone: user.timezone,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, id))
    .limit(1);

  if (!profile) notFound();

  const isSelf = profile.id === admin.user.id;

  const [
    [bookingCount],
    [eventTypeCount],
    [lastSeen],
    recentBookings,
    recentAudit,
  ] = await Promise.all([
    db.select({ value: count() }).from(booking).where(eq(booking.hostUserId, id)),
    db.select({ value: count() }).from(eventType).where(eq(eventType.userId, id)),
    db.select({ lastSeen: max(session.createdAt) }).from(session).where(eq(session.userId, id)),
    db
      .select({
        id: booking.id,
        inviteeName: booking.inviteeName,
        startTime: booking.startTime,
        status: booking.status,
      })
      .from(booking)
      .where(eq(booking.hostUserId, id))
      .orderBy(desc(booking.startTime))
      .limit(5),
    db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.actorId, id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
  ]);

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/orbit/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back to Users
      </Link>

      <OrbitPageHeader
        eyebrow="User Detail"
        title={profile.name ?? profile.email}
        description={profile.email}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="lg:col-span-2">
          <CardHeader className="py-4">
            <CardTitle className="text-base font-semibold">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar + name row */}
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary/10 text-lg font-bold text-primary">
                {(profile.name ?? profile.email).slice(0, 2).toUpperCase()}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{profile.name ?? "—"}</p>
                  <Badge
                    variant={profile.role === ADMIN_ROLE ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {profile.role ?? "user"}
                  </Badge>
                  {profile.banned && (
                    <span className="inline-flex items-center gap-1 rounded-none border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
                      Suspended
                    </span>
                  )}
                  {isSelf && (
                    <span className="rounded-none bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-ui text-primary">
                      You
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{profile.email}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
              <InfoRow
                icon={<User size={14} />}
                label="Username"
                value={profile.username ? `@${profile.username}` : "—"}
              />
              <InfoRow
                icon={<Clock size={14} />}
                label="Timezone"
                value={profile.timezone ?? "UTC"}
              />
              <InfoRow
                icon={<IdentificationCard size={14} />}
                label="User ID"
                value={profile.id}
                mono
              />
              <InfoRow
                icon={<CalendarDot size={14} />}
                label="Joined"
                value={format(profile.createdAt, "MMM d, yyyy")}
              />
              <InfoRow
                icon={<Clock size={14} />}
                label="Last Seen"
                value={
                  lastSeen?.lastSeen
                    ? formatDistanceToNow(lastSeen.lastSeen, { addSuffix: true })
                    : "Never"
                }
              />
              {profile.banned && profile.banReason && (
                <InfoRow
                  icon={<ShieldCheck size={14} />}
                  label="Ban Reason"
                  value={profile.banReason}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats + Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-semibold">Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatRow
                icon={<CalendarCheck size={15} />}
                label="Total Bookings"
                value={bookingCount?.value ?? 0}
              />
              <StatRow
                icon={<CalendarDot size={15} />}
                label="Event Types"
                value={eventTypeCount?.value ?? 0}
              />
            </CardContent>
          </Card>

          {!isSelf && (
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-base font-semibold">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <UserDetailActions
                  userId={profile.id}
                  role={profile.role}
                  banned={profile.banned}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Recent Bookings</CardTitle>
            <span className="text-xs text-muted-foreground">
              {bookingCount?.value ?? 0} total
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentBookings.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No bookings yet.
            </p>
          ) : (
            <div>
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between border-t border-border px-6 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{b.inviteeName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(b.startTime, "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-none border px-2 py-0.5 text-xs font-semibold capitalize ${
                      b.status === "confirmed"
                        ? "border-success/25 bg-success/10 text-success"
                        : b.status === "cancelled"
                          ? "border-destructive/25 bg-destructive/10 text-destructive"
                          : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity log */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base font-semibold">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentAudit.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No activity recorded.
            </p>
          ) : (
            <div>
              {recentAudit.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-4 border-t border-border px-6 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium capitalize">
                      {log.action.replace(/[._]/g, " ")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.description}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-muted-foreground">
                    {format(log.createdAt, "MMM d, h:mm a")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`truncate text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
