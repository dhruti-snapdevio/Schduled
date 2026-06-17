"use client";

import { useState, useMemo } from "react";
import { format, startOfDay, subDays } from "date-fns";
import {
  Export,
  FunnelSimple,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

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
  "auth.magic_link_sent":    "Magic Link Sent",
  "auth.login":              "User Logged In",
  "auth.logout":             "User Logged Out",
  "auth.session_created":    "Session Created",
  "profile.session_revoked": "Session Revoked",
  "profile.data_exported":   "Profile Exported",
  "profile.updated":         "Profile Updated",
  "profile.password_changed":"Password Changed",
  "orbit.user_role_updated": "Role Updated",
  "orbit.user_suspended":    "User Suspended",
  "orbit.user_reactivated":  "User Reactivated",
  "orbit.impersonation_start":"Impersonation Started",
  "booking.created":         "Booking Created",
  "booking.cancelled":       "Booking Cancelled",
  "booking.rescheduled":     "Booking Rescheduled",
  "event_type.created":      "Event Type Created",
  "event_type.updated":      "Event Type Updated",
  "event_type.deleted":      "Event Type Deleted",
  "email.sent":              "Email Sent",
  "email.failed":            "Email Failed",
  "calendar.connected":      "Calendar Connected",
  "calendar.disconnected":   "Calendar Disconnected",
  "video.connected":         "Video Integration Connected",
};

function getFriendlyLabel(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  // Fallback: convert "auth.magic_link_sent" → "Magic Link Sent"
  const parts = action.split(".");
  const raw = parts[parts.length - 1] ?? action;
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ── Entity badge colours ──────────────────────────────────────────────────────

const ENTITY_STYLES: Record<string, string> = {
  user:       "bg-blue-500/10 text-blue-600 border-blue-500/25 dark:text-blue-400",
  session:    "bg-teal-500/10 text-teal-600 border-teal-500/25 dark:text-teal-400",
  booking:    "bg-violet-500/10 text-violet-600 border-violet-500/25 dark:text-violet-400",
  event_type: "bg-orange-500/10 text-orange-600 border-orange-500/25 dark:text-orange-400",
  email:      "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400",
};

function EntityBadge({ type }: { type: string }) {
  const cls =
    ENTITY_STYLES[type.toLowerCase()] ??
    "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center rounded-none border px-2 py-0.5 text-xs font-semibold uppercase tracking-ui ${cls}`}
    >
      {type}
    </span>
  );
}

// ── Action category filter ────────────────────────────────────────────────────

type ActionCategory = "all" | "auth" | "bookings" | "events" | "emails" | "profile";

function matchesCategory(action: string, cat: ActionCategory): boolean {
  if (cat === "all") return true;
  if (cat === "auth")     return action.startsWith("auth.");
  if (cat === "bookings") return action.startsWith("booking.");
  if (cat === "events")   return action.startsWith("event_type.");
  if (cat === "emails")   return action.startsWith("email.");
  if (cat === "profile")  return action.startsWith("profile.") || action.startsWith("orbit.");
  return true;
}

// ── Date filter ───────────────────────────────────────────────────────────────

type DateRange = "all" | "today" | "week" | "month" | "custom";

// ── Export ────────────────────────────────────────────────────────────────────

function buildCSV(rows: AuditRow[]): string {
  const headers = ["Action", "Actor", "Entity Type", "Entity ID", "Description", "IP", "Date"];
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
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
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
  const [search,       setSearch]       = useState("");
  const [actionCat,   setActionCat]    = useState<ActionCategory>("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateRange,    setDateRange]    = useState<DateRange>("all");
  const [customFrom,   setCustomFrom]   = useState("");
  const [customTo,     setCustomTo]     = useState("");

  const entityTypes = useMemo(
    () => ["all", ...Array.from(new Set(logs.map((l) => l.entityType)))],
    [logs],
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
        if (!matchSearch) return false;
      }

      // Action category
      if (!matchesCategory(log.action, actionCat)) return false;

      // Entity type
      if (entityFilter !== "all" && log.entityType !== entityFilter) return false;

      // Date range
      const created = new Date(log.createdAt);
      if (dateRange === "today"  && created < startOfDay(now)) return false;
      if (dateRange === "week"   && created < subDays(now, 7))  return false;
      if (dateRange === "month"  && created < subDays(now, 30)) return false;
      if (dateRange === "custom") {
        if (customFrom && created < new Date(customFrom)) return false;
        if (customTo   && created > new Date(customTo + "T23:59:59")) return false;
      }

      return true;
    });
  }, [logs, search, actionCat, entityFilter, dateRange, customFrom, customTo]);

  const todayStamp = format(new Date(), "yyyy-MM-dd");

  function handleExportCSV() {
    downloadBlob(buildCSV(filtered), `audit-logs-${todayStamp}.csv`, "text/csv");
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
    downloadBlob(JSON.stringify(data, null, 2), `audit-logs-${todayStamp}.json`, "application/json");
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
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search action, user or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-64 rounded-none border border-border bg-page pl-8 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Action category */}
          <select
            value={actionCat}
            onChange={(e) => setActionCat(e.target.value as ActionCategory)}
            className="h-9 rounded-none border border-border bg-page px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Actions</option>
            <option value="auth">Authentication</option>
            <option value="bookings">Bookings</option>
            <option value="events">Events</option>
            <option value="emails">Emails</option>
            <option value="profile">Profile</option>
          </select>

          {/* Entity type */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-9 rounded-none border border-border bg-page px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Entities" : t.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Date range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRange)}
            className="h-9 rounded-none border border-border bg-page px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        {/* Right: export buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={handleExportCSV}
          >
            <Export size={14} />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 text-xs"
            onClick={handleExportJSON}
          >
            <Export size={14} />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Custom date range inputs */}
      {dateRange === "custom" && (
        <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
          <FunnelSimple size={14} className="text-muted-foreground" />
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">From</span>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-8 rounded-none border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">To</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-8 rounded-none border border-border bg-background px-2 text-sm focus:border-primary focus:outline-none"
            />
          </label>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Entity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                IP
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-muted-foreground"
                >
                  No audit logs match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border transition-colors hover:bg-muted/20 last:border-0"
                >
                  {/* Action */}
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium">
                      {getFriendlyLabel(log.action)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground/60">
                      {log.action}
                    </p>
                  </td>

                  {/* Actor */}
                  <td className="px-4 py-3">
                    {log.actorEmail ? (
                      <p className="text-sm">{log.actorEmail}</p>
                    ) : (
                      <span className="rounded-none bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        System
                      </span>
                    )}
                  </td>

                  {/* Entity */}
                  <td className="px-4 py-3">
                    <EntityBadge type={log.entityType} />
                    {log.entityId && (
                      <p className="mt-0.5 font-mono text-2xs text-muted-foreground/50 truncate max-w-24">
                        {log.entityId}
                      </p>
                    )}
                  </td>

                  {/* IP */}
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {(log.metadata?.ip as string) ?? "—"}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-muted-foreground/60">
                      {format(new Date(log.createdAt), "h:mm a")}
                    </p>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <div className="border-t border-border px-6 py-3">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {logs.length} log{logs.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}
