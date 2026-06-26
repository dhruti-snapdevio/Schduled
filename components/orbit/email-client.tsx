"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowClockwise,
  CheckCircle,
  Clock,
  Envelope,
  EnvelopeSimple,
  MagnifyingGlass,
  X,
  XCircle,
} from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export type OutboxRow = {
  id: string;
  status: string;
  payload: { to: string; subject: string };
  attemptCount: number;
  sentAt: string | null;
  createdAt: string;
};

export type EventRow = {
  id: string;
  eventType: string;
  recipient: string | null;
  receivedAt: string;
};

export type EmailStats = {
  total: number;
  sent: number;
  failed: number;
  pending: number;
};

// ── Friendly subject names ────────────────────────────────────────────────────

function getFriendlySubject(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("sign in") || s.includes("magic link") || s.includes("log in")) return "Magic Link Login";
  if (s.includes("booking confirmation") || s.includes("confirmed your booking")) return "Booking Confirmation";
  if (s.includes("reminder") || s.includes("upcoming meeting")) return "Meeting Reminder";
  if (s.includes("password reset") || s.includes("reset your password")) return "Password Reset";
  if (s.includes("welcome")) return "Welcome Email";
  if (s.includes("reschedule") || s.includes("rescheduled")) return "Booking Rescheduled";
  if (s.includes("new booking request") || s.includes("approval")) return "Booking Request";
  if (s.includes("declined") || s.includes("rejected")) return "Booking Declined";
  if (s.includes("approved")) return "Booking Approved";
  if (s.includes("cancel")) return "Booking Cancelled";
  return subject;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  sent:    { label: "Sent",    cls: "bg-success/10 text-success border-success/25",             dot: "bg-success" },
  failed:  { label: "Failed",  cls: "bg-destructive/10 text-destructive border-destructive/20", dot: "bg-destructive" },
  queued:  { label: "Queued",  cls: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400", dot: "bg-amber-500" },
  sending: { label: "Sending", cls: "bg-primary/10 text-primary border-primary/20",             dot: "bg-primary" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Event type badge ──────────────────────────────────────────────────────────

const EVENT_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  delivered: { label: "Delivered",  cls: "bg-success/10 text-success border-success/25",              dot: "bg-success" },
  opened:    { label: "Opened",     cls: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400", dot: "bg-blue-500" },
  open:      { label: "Opened",     cls: "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400", dot: "bg-blue-500" },
  bounced:   { label: "Bounced",    cls: "bg-destructive/10 text-destructive border-destructive/20",   dot: "bg-destructive" },
  bounce:    { label: "Bounced",    cls: "bg-destructive/10 text-destructive border-destructive/20",   dot: "bg-destructive" },
  complained:{ label: "Complained", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400", dot: "bg-orange-500" },
  complaint: { label: "Complained", cls: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400", dot: "bg-orange-500" },
};

function EventTypeBadge({ type }: { type: string }) {
  const cfg = EVENT_CONFIG[type.toLowerCase()] ?? { label: type, cls: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" };
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-0.5 text-xs font-semibold ${cfg.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, accent = false, danger = false, active = false, onClick,
}: {
  label: string; value: number; icon: React.ReactNode;
  accent?: boolean; danger?: boolean; active?: boolean; onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        onClick && "cursor-pointer transition-all hover:border-primary/50",
        active && "ring-2 ring-primary ring-offset-0",
        accent ? "border-primary/40 bg-primary/[0.04]" : danger ? "border-destructive/30 bg-destructive/[0.03]" : "",
      )}
    >
      <CardContent className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">{label}</p>
            <p className="mt-1.5 font-heading text-3xl font-bold text-foreground">{value}</p>
          </div>
          <span className={accent ? "text-primary" : danger ? "text-destructive" : "text-muted-foreground/60"}>{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function formatSecondsAgo(s: number): string {
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function formatDate(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmailClient({
  outbox,
  events,
  stats,
  outboxPage,
  outboxTotalPages,
  fetchedAt,
  searchQuery = "",
  statusFilter = "all",
}: {
  outbox: OutboxRow[];
  events: EventRow[];
  stats: EmailStats;
  outboxPage: number;
  outboxTotalPages: number;
  fetchedAt: string;
  searchQuery?: string;
  statusFilter?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => { setInputValue(searchQuery); }, [searchQuery]);

  useEffect(() => {
    setSecondsAgo(0);
    const id = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [fetchedAt]);

  function buildUrl({ q, status, page }: { q?: string; status?: string; page?: number }) {
    const params = new URLSearchParams();
    const qVal    = q      !== undefined ? q      : inputValue;
    const statVal = status !== undefined ? status : statusFilter;
    const pageVal = page   !== undefined ? page   : outboxPage;
    if (qVal.trim())             params.set("q",         qVal.trim());
    if (statVal && statVal !== "all") params.set("status",    statVal);
    if (pageVal > 1)             params.set("outboxPage", String(pageVal));
    const str = params.toString();
    return `/orbit/email${str ? `?${str}` : ""}`;
  }

  function handleRefresh() { startTransition(() => router.refresh()); }

  function handleSearchChange(val: string) {
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => router.push(buildUrl({ q: val, page: 1 })));
    }, 350);
  }

  function clearSearch() {
    setInputValue("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    startTransition(() => router.push(buildUrl({ q: "", page: 1 })));
  }

  function handleStatusChange(s: string) {
    startTransition(() => router.push(buildUrl({ status: s, page: 1 })));
  }

  function goToPage(p: number) {
    startTransition(() => router.push(buildUrl({ page: p })));
  }

  const isFiltered = inputValue.trim() !== "" || (statusFilter !== "all" && statusFilter !== "");

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="mb-8 flex items-start justify-between border-b border-border pb-5">
        <div>
          <h1 className="font-black text-2xl tracking-normal">Email</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Transactional email queue and inbound delivery events.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">Updated {formatSecondsAgo(secondsAgo)}</p>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleRefresh} disabled={isPending}>
            <ArrowClockwise size={13} className={isPending ? "animate-spin" : ""} />
            {isPending ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* ── Summary stat cards (clickable as status shortcuts) ───────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Emails" value={stats.total}
          icon={<Envelope size={20} weight="duotone" />}
          onClick={() => handleStatusChange("all")}
          active={!statusFilter || statusFilter === "all"}
        />
        <StatCard
          label="Sent" value={stats.sent}
          icon={<CheckCircle size={20} weight="duotone" />}
          accent
          onClick={() => handleStatusChange("sent")}
          active={statusFilter === "sent"}
        />
        <StatCard
          label="Failed" value={stats.failed}
          icon={<XCircle size={20} weight="duotone" />}
          danger={stats.failed > 0}
          onClick={() => handleStatusChange("failed")}
          active={statusFilter === "failed"}
        />
        <StatCard
          label="Pending" value={stats.pending}
          icon={<Clock size={20} weight="duotone" />}
          onClick={() => handleStatusChange("queued")}
          active={statusFilter === "queued" || statusFilter === "sending"}
        />
      </div>

      {/* ── Outbox + Events ──────────────────────────────────────────────── */}
      <div className="grid gap-6 xl:grid-cols-3">

        {/* Outbox — 2/3 width */}
        <Card className="xl:col-span-2">
          {/* Toolbar */}
          <CardHeader className="border-b border-border py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">Outbox</CardTitle>
                {isFiltered && outbox.length > 0 && (
                  <span className="inline-flex items-center border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                    {outboxTotalPages > 1
                      ? `Page ${outboxPage} / ${outboxTotalPages}`
                      : `${outbox.length} result${outbox.length !== 1 ? "s" : ""}`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <MagnifyingGlass
                    size={13}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    value={inputValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search recipient or subject…"
                    className="h-9 w-52 pl-8 pr-7 text-sm"
                  />
                  {inputValue && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Status filter dropdown */}
                <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
                  <SelectTrigger size="sm" className="h-9 w-38 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" align="end">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="queued">Queued</SelectItem>
                    <SelectItem value="sending">Sending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Clear filters */}
                {isFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 px-3 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => { clearSearch(); handleStatusChange("all"); }}
                  >
                    <X size={12} />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {outbox.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-muted-foreground/25"><Envelope size={40} weight="duotone" /></span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isFiltered ? "No emails match your search" : "No emails yet"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {isFiltered ? "Try a different term or clear the filters." : "Emails will appear here once the queue starts processing."}
                  </p>
                  {isFiltered && (
                    <button
                      type="button"
                      onClick={() => { clearSearch(); handleStatusChange("all"); }}
                      className="mt-3 text-xs font-medium text-primary hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full text-sm">
                  <TableHeader>
                    <TableRow className="border-b border-border bg-muted/40">
                      <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Recipient</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Subject</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Status</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Attempts</TableHead>
                      <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">Sent At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outbox.map((email) => {
                      const sentAt = email.sentAt ? formatDate(email.sentAt) : null;
                      return (
                        <TableRow key={email.id} className="border-b border-border transition-colors hover:bg-muted/20 last:border-0">
                          <TableCell className="px-6 py-3">
                            <p className="max-w-[180px] truncate text-sm">{email.payload.to}</p>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <p className="text-sm font-medium">{getFriendlySubject(email.payload.subject)}</p>
                            {getFriendlySubject(email.payload.subject) !== email.payload.subject && (
                              <p className="mt-0.5 max-w-[200px] truncate text-xs text-muted-foreground/60">
                                {email.payload.subject}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3"><StatusBadge status={email.status} /></TableCell>
                          <TableCell className="px-4 py-3">
                            <span className="tabular-nums text-sm text-muted-foreground">{email.attemptCount}</span>
                          </TableCell>
                          <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                            {sentAt ? (
                              <>
                                <p>{sentAt.date}</p>
                                <p className="text-muted-foreground/60">{sentAt.time}</p>
                              </>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {outboxTotalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Page <span className="font-semibold text-foreground">{outboxPage}</span> of {outboxTotalPages}
                </p>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        aria-disabled={outboxPage <= 1}
                        className={outboxPage <= 1 ? "pointer-events-none opacity-40" : ""}
                        onClick={(e) => { e.preventDefault(); if (outboxPage > 1) goToPage(outboxPage - 1); }}
                      />
                    </PaginationItem>
                    {paginationRange(outboxPage, outboxTotalPages).map((p, i) =>
                      p === "ellipsis" ? (
                        <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink href="#" isActive={p === outboxPage} onClick={(e) => { e.preventDefault(); goToPage(p); }}>{p}</PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        aria-disabled={outboxPage >= outboxTotalPages}
                        className={outboxPage >= outboxTotalPages ? "pointer-events-none opacity-40" : ""}
                        onClick={(e) => { e.preventDefault(); if (outboxPage < outboxTotalPages) goToPage(outboxPage + 1); }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Events — 1/3 width */}
        <Card>
          <CardHeader className="border-b border-border py-4">
            <CardTitle className="text-base font-semibold">Events</CardTitle>
            <p className="text-xs text-muted-foreground">SMTP delivery, opens, bounces and complaints.</p>
          </CardHeader>
          <CardContent className="p-0">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <span className="text-muted-foreground/25"><EnvelopeSimple size={40} weight="duotone" /></span>
                <div>
                  <p className="text-sm font-medium text-foreground">No email events yet</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Events will appear here once<br />your SMTP webhook is configured.
                  </p>
                </div>
              </div>
            ) : (
              <div>
                {events.map((event) => {
                  const received = formatDate(event.receivedAt);
                  return (
                    <div key={event.id} className="flex items-start justify-between gap-4 border-b border-border px-5 py-3 last:border-0">
                      <div className="min-w-0">
                        <EventTypeBadge type={event.eventType} />
                        {event.recipient && (
                          <p className="mt-1 max-w-[160px] truncate text-xs text-muted-foreground">{event.recipient}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-right text-xs text-muted-foreground">
                        <p>{received.date}</p>
                        <p className="text-muted-foreground/60">{received.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
