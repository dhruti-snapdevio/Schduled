"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowClockwise,
  CheckCircle,
  Cpu,
  Stack,
  XCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { retryFailedJobsAction } from "@/app/actions/orbit-queues";
import type { QueueSummaryRow } from "@/lib/worker/queue-inspection";

// ── Friendly queue name map ───────────────────────────────────────────────────

const QUEUE_LABELS: Record<string, string> = {
  "email.send":                   "Email Send",
  "email.outbox-reap":            "Email Cleanup",
  "email.outbox_reap":            "Email Cleanup",
  "email.events-prune":           "Email Events Cleanup",
  "email.events_prune":           "Email Events Cleanup",
  "scaffold.healthcheck":         "Health Check",
  "__pgboss__send-it":            "Internal Worker",
  "__pgboss__maintain":           "pg-boss Maintenance",
  "__pgboss__cron":               "Cron Scheduler",
  "__pgboss__archive":            "Job Archive",
  "booking.video-link-generate":  "Video Link Generator",
  "booking.video-link-retry":     "Video Link Retry",
  "booking.calendar-write":       "Calendar Event Writer",
  "booking.reminder-24h":         "24h Reminder",
  "booking.reminder-1h":          "1h Reminder",
  "booking.cancel-reminders":     "Cancel Reminders",
  "booking.calendar-cancel":      "Calendar Cancellation",
  "booking.reschedule-reminders": "Reschedule Reminders",
  "booking.calendar-update":      "Calendar Update",
  "calendar.sync":                "Calendar Sync",
  "calendar.token-refresh":       "Token Refresh",
  "calendar.disconnect-alert":    "Disconnect Alert",
};

function getFriendlyName(raw: string): string {
  if (QUEUE_LABELS[raw]) return QUEUE_LABELS[raw];
  return raw
    .replace(/^__[^_]+__/, "")
    .replace(/[-_.]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim() || raw;
}

// ── State badge ───────────────────────────────────────────────────────────────

const STATE_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  completed: {
    label: "Completed",
    cls:   "bg-success/10 text-success border-success/25",
    dot:   "bg-success",
  },
  failed: {
    label: "Failed",
    cls:   "bg-destructive/10 text-destructive border-destructive/20",
    dot:   "bg-destructive",
  },
  active: {
    label: "Active",
    cls:   "bg-primary/10 text-primary border-primary/20",
    dot:   "bg-primary",
  },
  created: {
    label: "Queued",
    cls:   "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
    dot:   "bg-amber-500",
  },
  retry: {
    label: "Retrying",
    cls:   "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
    dot:   "bg-orange-500",
  },
  expired: {
    label: "Expired",
    cls:   "bg-muted text-muted-foreground border-border",
    dot:   "bg-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    cls:   "bg-muted text-muted-foreground border-border",
    dot:   "bg-muted-foreground",
  },
};

function StateBadge({ state }: { state: string }) {
  const cfg = STATE_CONFIG[state] ?? {
    label: state,
    cls:   "bg-muted text-muted-foreground border-border",
    dot:   "bg-muted-foreground",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-none border px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Retry button ──────────────────────────────────────────────────────────────

function RetryButton({ queueName }: { queueName: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRetry() {
    startTransition(async () => {
      await retryFailedJobsAction(queueName);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
      onClick={handleRetry}
      disabled={isPending}
    >
      <ArrowClockwise size={12} className={isPending ? "animate-spin" : ""} />
      {isPending ? "Retrying…" : "Retry Failed"}
    </Button>
  );
}

// ── Stat cards ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  accent = false,
  danger = false,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <Card
      className={
        accent
          ? "border-primary/40 bg-primary/[0.04]"
          : danger
          ? "border-destructive/30 bg-destructive/[0.03]"
          : ""
      }
    >
      <CardContent className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
              {label}
            </p>
            <p className="mt-1.5 font-heading text-3xl font-bold text-foreground">
              {value}
            </p>
          </div>
          <span
            className={
              accent
                ? "text-primary"
                : danger
                ? "text-destructive"
                : "text-muted-foreground/60"
            }
          >
            {icon}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

type WorkerStatus = "running" | "idle" | "stopped";

function WorkerStatusCard({ status }: { status: WorkerStatus }) {
  const cfg = {
    running: {
      label:   "Running",
      textCls: "text-success",
      dotCls:  "bg-success",
      cardCls: "border-success/30 bg-success/[0.03]",
    },
    idle: {
      label:   "Idle",
      textCls: "text-primary",
      dotCls:  "bg-primary",
      cardCls: "border-primary/30 bg-primary/[0.03]",
    },
    stopped: {
      label:   "Stopped",
      textCls: "text-destructive",
      dotCls:  "bg-destructive",
      cardCls: "border-destructive/30 bg-destructive/[0.03]",
    },
  }[status];

  return (
    <Card className={cfg.cardCls}>
      <CardContent className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
              Worker Status
            </p>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotCls}`} />
              <p className={`font-heading text-2xl font-bold ${cfg.textCls}`}>
                {cfg.label}
              </p>
            </div>
          </div>
          <span className={cfg.textCls}>
            <Cpu size={20} weight="duotone" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Timer helpers ─────────────────────────────────────────────────────────────

function formatSecondsAgo(s: number): string {
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Main component ────────────────────────────────────────────────────────────

export function QueuesClient({
  queues,
  fetchedAt,
}: {
  queues: QueueSummaryRow[];
  fetchedAt: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const router = useRouter();

  // Reset and tick timer whenever fresh data arrives
  useEffect(() => {
    setSecondsAgo(0);
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  function handleRefresh() {
    startTransition(() => router.refresh());
  }

  // ── Computed stats ──────────────────────────────────────────────────────
  const { totalQueues, completed, failed, workerStatus } = useMemo(() => {
    const total = new Set(queues.map((q) => q.name)).size;
    const comp  = queues.filter((q) => q.state === "completed").reduce((s, q) => s + q.count, 0);
    const fail  = queues.filter((q) => q.state === "failed").reduce((s, q) => s + q.count, 0);
    const ws: WorkerStatus =
      queues.length === 0
        ? "stopped"
        : queues.some((q) => q.state === "active")
        ? "running"
        : "idle";
    return { totalQueues: total, completed: comp, failed: fail, workerStatus: ws };
  }, [queues]);

  // ── Sort: app queues first, internal at bottom ──────────────────────────
  const sorted = useMemo(
    () =>
      [...queues].sort((a, b) => {
        const aI = a.name.startsWith("__");
        const bI = b.name.startsWith("__");
        if (aI !== bI) return aI ? 1 : -1;
        return a.name.localeCompare(b.name) || a.state.localeCompare(b.state);
      }),
    [queues],
  );

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-black text-2xl tracking-normal">Job Queues</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            pg-boss queue state grouped by queue name and job state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Updated {formatSecondsAgo(secondsAgo)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={handleRefresh}
            disabled={isPending}
          >
            <ArrowClockwise
              size={13}
              className={isPending ? "animate-spin" : ""}
            />
            {isPending ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Queues"
          value={totalQueues}
          icon={<Stack size={20} weight="duotone" />}
        />
        <StatCard
          label="Completed Jobs"
          value={completed.toLocaleString()}
          icon={<CheckCircle size={20} weight="duotone" />}
          accent
        />
        <StatCard
          label="Failed Jobs"
          value={failed}
          icon={<XCircle size={20} weight="duotone" />}
          danger={failed > 0}
        />
        <WorkerStatusCard status={workerStatus} />
      </div>

      {/* ── Queue details table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base font-semibold">Queue Details</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {queues.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <span className="text-muted-foreground/25">
                <Stack size={40} weight="duotone" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  No queue data yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Run{" "}
                  <code className="font-mono text-foreground">pnpm worker</code>{" "}
                  or enqueue an email to populate the pg-boss schema.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Queue
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      State
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Jobs
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr
                      key={`${row.name}:${row.state}`}
                      className="border-b border-border transition-colors hover:bg-muted/20 last:border-0"
                    >
                      {/* Queue name */}
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium">
                          {getFriendlyName(row.name)}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground/60">
                          {row.name}
                        </p>
                      </td>

                      {/* State badge */}
                      <td className="px-4 py-3">
                        <StateBadge state={row.state} />
                      </td>

                      {/* Job count */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold tabular-nums">
                          {row.count.toLocaleString()}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {row.state === "failed" ? (
                          <RetryButton queueName={row.name} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
