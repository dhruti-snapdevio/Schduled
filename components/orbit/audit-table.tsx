"use client";

import { Export, FunnelSimple, MagnifyingGlass } from "@phosphor-icons/react";
import { format, startOfDay, subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
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

const PAGE_SIZE = 15;
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditRow = {
  id: string;
  action: string;
  actorId: string | null;
  actorEmail: string | null;
  entityType: string;
  entityId: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  createdAt: string; // ISO string — serialized from server
};

// ── Action labels ─────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  "auth.magic_link_sent": "Magic Link Sent",
  "auth.login": "User Logged In",
  "auth.logout": "User Logged Out",
  "auth.session_created": "Session Created",
  "profile.session_revoked": "Session Revoked",
  "profile.data_exported": "Profile Exported",
  "profile.updated": "Profile Updated",
  "profile.password_changed": "Password Changed",
  "orbit.user_role_updated": "Role Updated",
  "orbit.user_suspended": "User Suspended",
  "orbit.user_reactivated": "User Reactivated",
  "orbit.user_deleted": "User Deleted",
  "orbit.impersonation_start": "Impersonation Started",
  "booking.created": "Booking Created",
  "booking.cancelled": "Booking Cancelled",
  "booking.rescheduled": "Booking Rescheduled",
  "event_type.created": "Event Type Created",
  "event_type.updated": "Event Type Updated",
  "event_type.deleted": "Event Type Deleted",
  "email.sent": "Email Sent",
  "email.failed": "Email Failed",
  "calendar.connected": "Calendar Connected",
  "calendar.disconnected": "Calendar Disconnected",
  "video.connected": "Video Integration Connected",
};

function getFriendlyLabel(action: string): string {
  if (ACTION_LABELS[action]) {
    return ACTION_LABELS[action];
  }
  // Fallback: convert "auth.magic_link_sent" → "Magic Link Sent"
  const parts = action.split(".");
  const raw = parts[parts.length - 1] ?? action;
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Entity badge ───────────────────────────────────────────────────────────────
// One cohesive, on-brand neutral style for every entity type. The label text
// itself ("USER", "EVENT TYPE") carries the meaning — no need for a clashing
// rainbow of colours.

function EntityBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-none border border-border bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-ui text-muted-foreground">
      {type.replace(/_/g, " ")}
    </span>
  );
}

// ── Action category filter ────────────────────────────────────────────────────

type ActionCategory =
  | "all"
  | "auth"
  | "bookings"
  | "events"
  | "emails"
  | "profile";

function matchesCategory(action: string, cat: ActionCategory): boolean {
  if (cat === "all") {
    return true;
  }
  if (cat === "auth") {
    return action.startsWith("auth.");
  }
  if (cat === "bookings") {
    return action.startsWith("booking.");
  }
  if (cat === "events") {
    return action.startsWith("event_type.");
  }
  if (cat === "emails") {
    return action.startsWith("email.");
  }
  if (cat === "profile") {
    return action.startsWith("profile.") || action.startsWith("orbit.");
  }
  return true;
}

// ── Date filter ───────────────────────────────────────────────────────────────

type DateRange = "all" | "today" | "week" | "month" | "custom";

// ── Export ────────────────────────────────────────────────────────────────────

function buildCSV(rows: AuditRow[]): string {
  const headers = [
    "Action",
    "Actor",
    "Entity Type",
    "Entity ID",
    "Description",
    "IP",
    "Date",
  ];
  const lines = rows.map((r) => [
    getFriendlyLabel(r.action),
    r.actorEmail ?? "System",
    r.entityType,
    r.entityId ?? "",
    r.description,
    (r.metadata?.ip as string) ?? "",
    format(new Date(r.createdAt), "yyyy-MM-dd HH:mm:ss"),
  ]);
  return [headers, ...lines]
    .map((row) =>
      row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Main component ────────────────────────────────────────────────────────────

export function AuditTable({ logs }: { logs: AuditRow[] }) {
  const [search, setSearch] = useState("");
  const [actionCat, setActionCat] = useState<ActionCategory>("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);

  // Reset to the first page whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [search, actionCat, entityFilter, dateRange, customFrom, customTo]);

  const entityTypes = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((l) => l.entityType)))],
    [logs]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const q = search.toLowerCase();

    return logs.filter((log) => {
      // Search
      if (q) {
        const matchSearch =
          log.action.toLowerCase().includes(q) ||
          getFriendlyLabel(log.action).toLowerCase().includes(q) ||
          (log.actorEmail ?? "").toLowerCase().includes(q) ||
          (log.entityType ?? "").toLowerCase().includes(q) ||
          (log.description ?? "").toLowerCase().includes(q);
        if (!matchSearch) {
          return false;
        }
      }

      // Action category
      if (!matchesCategory(log.action, actionCat)) {
        return false;
      }

      // Entity type
      if (entityFilter !== "all" && log.entityType !== entityFilter) {
        return false;
      }

      // Date range
      const created = new Date(log.createdAt);
      if (dateRange === "today" && created < startOfDay(now)) {
        return false;
      }
      if (dateRange === "week" && created < subDays(now, 7)) {
        return false;
      }
      if (dateRange === "month" && created < subDays(now, 30)) {
        return false;
      }
      if (dateRange === "custom") {
        if (customFrom && created < new Date(customFrom)) {
          return false;
        }
        if (customTo && created > new Date(customTo + "T23:59:59")) {
          return false;
        }
      }

      return true;
    });
  }, [logs, search, actionCat, entityFilter, dateRange, customFrom, customTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const todayStamp = format(new Date(), "yyyy-MM-dd");

  function handleExportCSV() {
    downloadBlob(
      buildCSV(filtered),
      `audit-logs-${todayStamp}.csv`,
      "text/csv"
    );
  }

  function handleExportJSON() {
    const data = filtered.map((r) => ({
      action: r.action,
      friendlyAction: getFriendlyLabel(r.action),
      actor: r.actorEmail ?? "System",
      entityType: r.entityType,
      entityId: r.entityId,
      description: r.description,
      ip: (r.metadata?.ip as string) ?? null,
      timestamp: r.createdAt,
    }));
    downloadBlob(
      JSON.stringify(data, null, 2),
      `audit-logs-${todayStamp}.json`,
      "application/json"
    );
  }

  return (
    <div>
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end lg:justify-between">
        {/* Left: search + filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={14}
            />
            <input
              className="h-9 w-64 rounded-none border border-border bg-page pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, user or entity..."
              type="search"
              value={search}
            />
          </div>

          {/* Action category */}
          <Select onValueChange={(v) => setActionCat(v as ActionCategory)} value={actionCat}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="auth">Authentication</SelectItem>
              <SelectItem value="bookings">Bookings</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="emails">Emails</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
            </SelectContent>
          </Select>

          {/* Entity type */}
          <Select onValueChange={(v) => setEntityFilter(v)} value={entityFilter}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "all"
                    ? "All Entities"
                    : t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date range */}
          <Select onValueChange={(v) => setDateRange(v as DateRange)} value={dateRange}>
            <SelectTrigger className="h-9 w-40 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right: export buttons */}
        <div className="flex items-center gap-2">
          <Button
            className="h-9 gap-1.5 text-xs"
            onClick={handleExportCSV}
            size="sm"
            variant="outline"
          >
            <Export size={14} />
            Export CSV
          </Button>
          <Button
            className="h-9 gap-1.5 text-xs"
            onClick={handleExportJSON}
            size="sm"
            variant="outline"
          >
            <Export size={14} />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Custom date range inputs */}
      {dateRange === "custom" && (
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <FunnelSimple className="text-muted-foreground" size={14} />
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">From</span>
            <input
              className="h-8 rounded-none border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
              onChange={(e) => setCustomFrom(e.target.value)}
              type="date"
              value={customFrom}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">To</span>
            <input
              className="h-8 rounded-none border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
              onChange={(e) => setCustomTo(e.target.value)}
              type="date"
              value={customTo}
            />
          </label>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40">
              <TableHead className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Action
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Actor
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Entity
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  className="px-6 py-12 text-center text-sm text-muted-foreground"
                  colSpan={4}
                >
                  No audit logs match your filters.
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((log) => (
                <TableRow
                  className="border-b border-border transition-colors hover:bg-muted/20 last:border-0"
                  key={log.id}
                >
                  {/* Action */}
                  <TableCell className="px-6 py-3">
                    <p className="text-sm font-medium">
                      {getFriendlyLabel(log.action)}
                    </p>
                  </TableCell>

                  {/* Actor */}
                  <TableCell className="px-4 py-3">
                    {log.actorEmail ? (
                      <p className="text-sm">{log.actorEmail}</p>
                    ) : (
                      <span className="rounded-none bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        System
                      </span>
                    )}
                  </TableCell>

                  {/* Entity */}
                  <TableCell className="px-4 py-3">
                    <EntityBadge type={log.entityType} />
                    {log.entityId && (
                      <p className="mt-0.5 font-mono text-2xs text-muted-foreground/50 truncate max-w-24">
                        {log.entityId}
                      </p>
                    )}
                  </TableCell>

                  {/* Date */}
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-muted-foreground/60">
                      {format(new Date(log.createdAt), "h:mm a")}
                    </p>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Row count + pagination */}
      <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {logs.length} log{logs.length === 1 ? "" : "s"}
        </p>
        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={safePage <= 1}
                  className={safePage <= 1 ? "pointer-events-none opacity-40" : ""}
                  onClick={(e) => { e.preventDefault(); if (safePage > 1) setPage(safePage - 1); }}
                />
              </PaginationItem>
              {paginationRange(safePage, totalPages).map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === safePage}
                      onClick={(e) => { e.preventDefault(); setPage(p); }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={safePage >= totalPages}
                  className={safePage >= totalPages ? "pointer-events-none opacity-40" : ""}
                  onClick={(e) => { e.preventDefault(); if (safePage < totalPages) setPage(safePage + 1); }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
