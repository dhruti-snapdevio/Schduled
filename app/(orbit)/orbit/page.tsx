import { count, desc, eq, gte, max } from "drizzle-orm";
import { format, formatDistanceToNow, startOfMonth } from "date-fns";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle,
  Envelope,
  GoogleLogo,
  Queue,
  Stack,
  Users,
  Warning,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ADMIN_ROLE } from "@/config/platform";
import { auditLogs, booking, emailOutbox, session, user } from "@/db/schema";
import { db } from "@/lib/db";
import { getQueueSummary } from "@/lib/worker/queue-inspection";

export const metadata = { title: "Admin Panel" };

export default async function OrbitPage() {
  const monthStart = startOfMonth(new Date());

  const [
    [userCount],
    [emailCount],
    [bookingCount],
    [bookingThisMonth],
    [failedEmailCount],
    queues,
    recentUsers,
    recentActivities,
  ] = await Promise.all([
    db.select({ value: count() }).from(user),
    db.select({ value: count() }).from(emailOutbox),
    db.select({ value: count() }).from(booking),
    db
      .select({ value: count() })
      .from(booking)
      .where(gte(booking.createdAt, monthStart)),
    db
      .select({ value: count() })
      .from(emailOutbox)
      .where(eq(emailOutbox.status, "failed")),
    getQueueSummary(),
    db
      .select({
        id:        user.id,
        name:      user.name,
        email:     user.email,
        role:      user.role,
        banned:    user.banned,
        createdAt: user.createdAt,
        lastLogin: max(session.createdAt),
      })
      .from(user)
      .leftJoin(session, eq(session.userId, user.id))
      .groupBy(
        user.id,
        user.name,
        user.email,
        user.role,
        user.banned,
        user.createdAt,
      )
      .orderBy(desc(user.createdAt))
      .limit(5),
    db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(6),
  ]);

  const googleConfigured = !!(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );
  const emailHealthy = (failedEmailCount?.value ?? 0) === 0;
  const queuesRunning = queues.length > 0;

  return (
    <div className="space-y-8">
      {/* ── Page heading ────────────────────────────────────────────── */}
      <div className="border-b border-border pb-6">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-eyebrow text-primary">
          Admin Panel
        </p>
        <h1 className="font-black text-3xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Workspace Administration
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Manage users, bookings, emails and monitor system health.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Users"
          value={userCount?.value ?? 0}
          icon={<Users size={20} weight="duotone" />}
          href="/orbit/users"
        />
        <StatCard
          label="Total Bookings"
          value={bookingCount?.value ?? 0}
          icon={<CalendarCheck size={20} weight="duotone" />}
          accent
          subtitle={`${bookingThisMonth?.value ?? 0} bookings this month`}
        />
        <StatCard
          label="Outbox Emails"
          value={emailCount?.value ?? 0}
          icon={<Envelope size={20} weight="duotone" />}
          href="/orbit/email"
        />
        <StatCard
          label="Queue Jobs"
          value={queues.reduce((sum, r) => sum + Number(r.count), 0)}
          icon={<Stack size={20} weight="duotone" />}
          href="/orbit/queues"
        />
      </div>

      {/* ── Recent Users + System Status ────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Users (2/3 width) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-ui">
              Recent Users
            </CardTitle>
            <Link
              href="/orbit/users"
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-border bg-muted/40">
                    <th className="px-6 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      User
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Role
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Joined
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Last Login
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-border hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                            {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {u.name ?? "—"}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            u.role === ADMIN_ROLE ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.banned ? (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                            <XCircle size={13} weight="fill" />
                            Suspended
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                            <CheckCircle size={13} weight="fill" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(u.createdAt, "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {u.lastLogin
                          ? formatDistanceToNow(u.lastLogin, {
                              addSuffix: true,
                            })
                          : <span className="text-muted-foreground/40">Never</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* System Status (1/3 width) */}
        <Card>
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-ui">
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-0 pb-3">
            <StatusRow
              label="Google Calendar"
              icon={<GoogleLogo size={15} weight="bold" />}
              ok={googleConfigured}
              okText="Connected"
              failText="Not configured"
            />
            <StatusRow
              label="Email Queue"
              icon={<Envelope size={15} weight="bold" />}
              ok={emailHealthy}
              okText="Healthy"
              failText={`${failedEmailCount?.value} failed`}
            />
            <StatusRow
              label="Worker Queues"
              icon={<Queue size={15} weight="bold" />}
              ok={queuesRunning}
              okText="Active"
              failText="No queues"
            />
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Activities ────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border py-4">
          <CardTitle className="text-sm font-bold uppercase tracking-ui">
            Recent Activities
          </CardTitle>
          <Link
            href="/orbit/audit"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {recentActivities.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              No activities recorded yet.
            </p>
          ) : (
            <div>
              {recentActivities.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-4 border-t border-border px-6 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-primary/10 text-primary">
                      <ActivityIcon action={log.action} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium capitalize">
                        {formatAction(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.description}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {log.entityType}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {format(log.createdAt, "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
  subtitle,
  href,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
  subtitle?: string;
  href?: string;
}) {
  const inner = (
    <Card
      className={[
        "relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-primary/60",
        accent ? "border-primary/40 bg-primary/[0.03]" : "",
      ].join(" ")}
    >
      {accent && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-primary" />
      )}
      <CardContent className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 font-heading text-4xl font-black text-foreground leading-none">
              {value}
            </p>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center",
              accent ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground/60",
            ].join(" ")}
          >
            {icon}
          </span>
        </div>
        {href && (
          <div className="mt-3 border-t border-border/60 pt-3">
            <Link
              href={href}
              className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              View all <ArrowRight size={12} weight="bold" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

function StatusRow({
  label,
  icon,
  ok,
  okText,
  failText,
}: {
  label: string;
  icon: React.ReactNode;
  ok: boolean;
  okText: string;
  failText: string;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-2.5">
      <div className="flex items-center gap-2.5 text-sm font-medium text-foreground">
        <span className="text-muted-foreground">{icon}</span>
        {label}
      </div>
      <span
        className={`inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 text-xs font-semibold ${
          ok
            ? "bg-success/10 text-success border-success/25"
            : "bg-destructive/10 text-destructive border-destructive/20"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            ok ? "bg-success" : "bg-destructive"
          }`}
        />
        {ok ? okText : failText}
      </span>
    </div>
  );
}

function formatAction(action: string): string {
  return action.replace(/[._]/g, " ");
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes("user"))    return <Users size={14} />;
  if (action.includes("booking")) return <CalendarCheck size={14} />;
  if (action.includes("email"))   return <Envelope size={14} />;
  if (action.includes("event"))   return <Warning size={14} />;
  return <CheckCircle size={14} />;
}
