"use client";

import { Export } from "@phosphor-icons/react";
import { format } from "date-fns";
import { useTransition } from "react";
import { toast } from "sonner";
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
import { exportAuditLogsAction, type ExportAuditRow } from "@/app/actions/orbit-audit";
import type { AuditFilters } from "@/lib/audit-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AuditFilters as AuditFiltersBar } from "./audit-filters";

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
  const parts = action.split(".");
  const raw = parts[parts.length - 1] ?? action;
  return raw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function EntityBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center rounded-none border border-border bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-ui text-muted-foreground">
      {type.replace(/_/g, " ")}
    </span>
  );
}

// ── Export ────────────────────────────────────────────────────────────────────

function buildCSV(rows: ExportAuditRow[]): string {
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

export function AuditTable({
  logs, total, page, totalPages, entityTypes, filters,
}: {
  logs: AuditRow[];
  total: number;
  page: number;
  totalPages: number;
  entityTypes: string[];
  filters: AuditFilters;
}) {
  const [exporting, startExport] = useTransition();

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.category !== "all") params.set("category", filters.category);
    if (filters.entityType !== "all") params.set("entity", filters.entityType);
    if (filters.dateRange !== "all") params.set("dateRange", filters.dateRange);
    if (filters.customFrom) params.set("from", filters.customFrom);
    if (filters.customTo) params.set("to", filters.customTo);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/orbit/audit?${qs}` : "/orbit/audit";
  }

  function runExport(format: "csv" | "json") {
    startExport(async () => {
      const { rows, truncated } = await exportAuditLogsAction(filters);
      if (truncated) {
        toast.warning(`Export capped at ${rows.length} rows — narrow the date range for more.`);
      }
      const todayStamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        downloadBlob(buildCSV(rows), `audit-logs-${todayStamp}.csv`, "text/csv");
      } else {
        const data = rows.map((r) => ({
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
    });
  }

  return (
    <div>
      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-start lg:justify-between">
        <AuditFiltersBar
          entityTypes={entityTypes}
          category={filters.category}
          entityType={filters.entityType}
          dateRange={filters.dateRange}
          customFrom={filters.customFrom}
          customTo={filters.customTo}
        />

        <div className="flex items-center gap-2">
          <Button
            className="h-9 gap-1.5 text-xs"
            onClick={() => runExport("csv")}
            size="sm"
            variant="outline"
            disabled={exporting}
          >
            <Export size={14} />
            Export CSV
          </Button>
          <Button
            className="h-9 gap-1.5 text-xs"
            onClick={() => runExport("json")}
            size="sm"
            variant="outline"
            disabled={exporting}
          >
            <Export size={14} />
            Export JSON
          </Button>
        </div>
      </div>

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
            {logs.length === 0 ? (
              <TableRow>
                <TableCell className="px-6 py-12 text-center text-sm text-muted-foreground" colSpan={4}>
                  No audit logs match your filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow className="border-b border-border transition-colors hover:bg-muted/20 last:border-0" key={log.id}>
                  <TableCell className="px-6 py-3">
                    <p className="text-sm font-medium">{getFriendlyLabel(log.action)}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {log.actorEmail ? (
                      <p className="text-sm">{log.actorEmail}</p>
                    ) : (
                      <span className="rounded-none bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        System
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <EntityBadge type={log.entityType} />
                    {log.entityId && (
                      <p className="mt-0.5 font-mono text-2xs text-muted-foreground/50 truncate max-w-24">
                        {log.entityId}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{format(new Date(log.createdAt), "MMM d, yyyy")}</p>
                    <p className="text-muted-foreground/60">{format(new Date(log.createdAt), "h:mm a")}</p>
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
          Page {page} of {totalPages} · {total} log{total === 1 ? "" : "s"}
        </p>
        {totalPages > 1 && (
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={page > 1 ? pageHref(page - 1) : "#"}
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-40" : ""}
                />
              </PaginationItem>
              {paginationRange(page, totalPages).map((p, i) =>
                p === "ellipsis" ? (
                  <PaginationItem key={`e-${i}`}><PaginationEllipsis /></PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink href={pageHref(p)} isActive={p === page}>
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages ? pageHref(page + 1) : "#"}
                  aria-disabled={page >= totalPages}
                  className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
