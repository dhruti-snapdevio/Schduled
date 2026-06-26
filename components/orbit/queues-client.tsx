"use client";

import {
  ArrowClockwise,
  CheckCircle,
  Cpu,
  MagnifyingGlass,
  Stack,
  XCircle,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { paginationRange } from "@/lib/utils";

const PAGE_SIZE = 10;

import { retryFailedJobsAction } from "@/app/actions/orbit-queues";
import { getFriendlyName, StateBadge } from "@/components/orbit/queue-format";
import { QueueJobsSheet } from "@/components/orbit/queue-jobs-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { QueueSummaryRow } from "@/lib/worker/queue-inspection";

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
      className="h-7 gap-1.5 border-destructive/30 text-xs text-destructive hover:bg-destructive/10"
      disabled={isPending}
      onClick={handleRetry}
      size="sm"
      variant="outline"
    >
      <ArrowClockwise className={isPending ? "animate-spin" : ""} size={12} />
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
      label: "Running",
      textCls: "text-success",
      dotCls: "bg-success",
      cardCls: "border-success/30 bg-success/[0.03]",
    },
    idle: {
      label: "Idle",
      textCls: "text-primary",
      dotCls: "bg-primary",
      cardCls: "border-primary/30 bg-primary/[0.03]",
    },
    stopped: {
      label: "Stopped",
      textCls: "text-destructive",
      dotCls: "bg-destructive",
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
  if (s < 60) {
    return `${s}s ago`;
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)}m ago`;
  }
  return `${Math.floor(s / 3600)}h ago`;
}

// ── Filter chip + state labels ──────────────────────────────────────────────────

const STATE_LABELS: Record<string, string> = {
  created: "Queued",
  active: "Running",
  completed: "Completed",
  failed: "Failed",
  retry: "Retrying",
  cancelled: "Cancelled",
};

function stateLabel(state: string): string {
  return STATE_LABELS[state] ?? state.charAt(0).toUpperCase() + state.slice(1);
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
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [selected, setSelected] = useState<{
    name: string;
    state: string;
  } | null>(null);
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
    const comp = queues
      .filter((q) => q.state === "completed")
      .reduce((s, q) => s + q.count, 0);
    const fail = queues
      .filter((q) => q.state === "failed")
      .reduce((s, q) => s + q.count, 0);
    const ws: WorkerStatus =
      queues.length === 0
        ? "stopped"
        : queues.some((q) => q.state === "active")
          ? "running"
          : "idle";
    return {
      totalQueues: total,
      completed: comp,
      failed: fail,
      workerStatus: ws,
    };
  }, [queues]);

  // ── Sort: app queues first, internal at bottom ──────────────────────────
  const sorted = useMemo(
    () =>
      [...queues].sort((a, b) => {
        const aI = a.name.startsWith("__");
        const bI = b.name.startsWith("__");
        if (aI !== bI) {
          return aI ? 1 : -1;
        }
        return a.name.localeCompare(b.name) || a.state.localeCompare(b.state);
      }),
    [queues]
  );

  // States present in the data (for the filter chips).
  const availableStates = useMemo(
    () => Array.from(new Set(queues.map((q) => q.state))).sort(),
    [queues]
  );

  // ── Apply search (queue name) + state filter ────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sorted.filter((row) => {
      if (stateFilter !== "all" && row.state !== stateFilter) {
        return false;
      }
      if (
        q &&
        !row.name.toLowerCase().includes(q) &&
        !getFriendlyName(row.name).toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [sorted, search, stateFilter]);

  // Reset to page 1 whenever the filter narrows/changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, stateFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
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
            className="h-8 gap-1.5 text-xs"
            disabled={isPending}
            onClick={handleRefresh}
            size="sm"
            variant="outline"
          >
            <ArrowClockwise
              className={isPending ? "animate-spin" : ""}
              size={13}
            />
            {isPending ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Stack size={20} weight="duotone" />}
          label="Total Queues"
          value={totalQueues}
        />
        <StatCard
          accent
          icon={<CheckCircle size={20} weight="duotone" />}
          label="Completed Jobs"
          value={completed.toLocaleString()}
        />
        <StatCard
          danger={failed > 0}
          icon={<XCircle size={20} weight="duotone" />}
          label="Failed Jobs"
          value={failed}
        />
        <WorkerStatusCard status={workerStatus} />
      </div>

      {/* ── Queue details table ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base font-semibold">
            Queue Details
          </CardTitle>
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
            <>
              {/* ── Search + state filter toolbar ───────────────────────── */}
              <div className="flex flex-col gap-3 border-b border-border px-5 py-3 sm:flex-row sm:items-center">
                <div className="relative sm:max-w-xs sm:flex-1">
                  <MagnifyingGlass
                    className="-translate-y-1/2 absolute top-1/2 left-2.5 text-muted-foreground"
                    size={15}
                  />
                  <Input
                    className="h-9 pl-8 text-sm"
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search queue name…"
                    value={search}
                  />
                </div>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="h-9 w-full text-sm sm:w-40" aria-label="State">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All states</SelectItem>
                    {availableStates.map((st) => (
                      <SelectItem key={st} value={st}>
                        {stateLabel(st)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                  <span className="text-muted-foreground/25">
                    <MagnifyingGlass size={36} />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    No queues match
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Try a different search or filter.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="w-full text-sm">
                    <TableHeader>
                      <TableRow className="border-b border-border bg-muted/40">
                        <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                          Queue
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                          State
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                          Jobs
                        </TableHead>
                        <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((row) => (
                        <TableRow
                          className="cursor-pointer border-b border-border transition-colors hover:bg-muted/20 last:border-0"
                          key={`${row.name}:${row.state}`}
                          onClick={() =>
                            setSelected({ name: row.name, state: row.state })
                          }
                        >
                          {/* Queue name */}
                          <TableCell className="px-6 py-3">
                            <p className="text-sm font-medium">
                              {getFriendlyName(row.name)}
                            </p>
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground/60">
                              {row.name}
                            </p>
                          </TableCell>

                          {/* State badge */}
                          <TableCell className="px-4 py-3">
                            <StateBadge state={row.state} />
                          </TableCell>

                          {/* Job count */}
                          <TableCell className="px-4 py-3">
                            <span className="text-sm font-semibold tabular-nums">
                              {row.count.toLocaleString()}
                            </span>
                          </TableCell>

                          {/* Actions */}
                          <TableCell
                            className="px-4 py-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {row.state === "failed" ? (
                              <RetryButton queueName={row.name} />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">
                {filtered.length} rows
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      aria-disabled={safePage <= 1}
                      className={
                        safePage <= 1 ? "pointer-events-none opacity-40" : ""
                      }
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (safePage > 1) {
                          setPage(safePage - 1);
                        }
                      }}
                    />
                  </PaginationItem>
                  {paginationRange(safePage, totalPages).map((p, i) =>
                    p === "ellipsis" ? (
                      <PaginationItem key={`e-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          isActive={p === safePage}
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(p);
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      aria-disabled={safePage >= totalPages}
                      className={
                        safePage >= totalPages
                          ? "pointer-events-none opacity-40"
                          : ""
                      }
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (safePage < totalPages) {
                          setPage(safePage + 1);
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <QueueJobsSheet
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
        queue={selected}
      />
    </div>
  );
}
