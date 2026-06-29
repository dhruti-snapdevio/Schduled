"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";

const PAGE_SIZE = 10;
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, Trash, ProhibitInset } from "@phosphor-icons/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { ADMIN_ROLE } from "@/config/platform";
import { paginationRange } from "@/lib/utils";
import { bulkBanUsersAction, bulkDeleteUsersAction } from "@/app/actions/orbit-users";
import { UserSuspendForm } from "./user-actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  banned: boolean;
  createdAt: string;
};

type Filter = "all" | "active" | "admins" | "suspended";

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState<Filter>("all");
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Reset to first page when the search/filter narrows the list
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q);
    const matchFilter =
      filter === "all" ||
      (filter === "active"    && !u.banned) ||
      (filter === "admins"    && u.role === ADMIN_ROLE) ||
      (filter === "suspended" && u.banned);
    return matchSearch && matchFilter;
  });

  const selectableIds = filtered.filter((u) => u.id !== currentUserId).map((u) => u.id);
  const allSelected   = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const adminCount     = users.filter((u) => u.role === ADMIN_ROLE).length;
  const suspendedCount = users.filter((u) => u.banned).length;

  function toggleAll() {
    if (allSelected) {
      setSelected((s) => { const n = new Set(s); selectableIds.forEach((id) => n.delete(id)); return n; });
    } else {
      setSelected((s) => new Set([...s, ...selectableIds]));
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function buildFormData() {
    const fd = new FormData();
    selected.forEach((id) => fd.append("userId", id));
    return fd;
  }

  function handleBulkSuspend() {
    startTransition(async () => {
      await bulkBanUsersAction(buildFormData());
      setSelected(new Set());
    });
  }

  function handleBulkDelete() {
    startTransition(async () => {
      await bulkDeleteUsersAction(buildFormData());
      setSelected(new Set());
    });
  }

  return (
    <div className="relative">
      {/* ── Title + Search/Filter bar ───────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-foreground">All Users</p>
          <p className="text-sm text-muted-foreground">
            All registered accounts ordered by sign-up date.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <MagnifyingGlass
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(new Set()); }}
              className="h-9 w-full rounded-none border border-border bg-page pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64"
            />
          </div>

          <Select
            value={filter}
            onValueChange={(v) => { setFilter(v as Filter); setSelected(new Set()); }}
          >
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="admins">Admins</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Summary strip ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span><strong className="font-semibold text-foreground">{users.length}</strong> total</span>
        <span className="text-border">·</span>
        <span><strong className="font-semibold text-foreground">{adminCount}</strong> admin{adminCount !== 1 ? "s" : ""}</span>
        <span className="text-border">·</span>
        <span><strong className="font-semibold text-foreground">{suspendedCount}</strong> suspended</span>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <Table className="w-full text-sm">
          <TableHeader>
            <TableRow className="border-b border-border bg-muted/40">
              <TableHead className="w-10 px-4 py-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => toggleAll()}
                  disabled={selectableIds.length === 0}
                  title={selectableIds.length === 0 ? "No other accounts to select" : "Select all"}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                User
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No users match your search.
                </TableCell>
              </TableRow>
            ) : (
              pageUsers.map((u) => {
                const isSelf = u.id === currentUserId;
                const isChecked = selected.has(u.id);
                return (
                  <TableRow
                    key={u.id}
                    className={`border-b border-border transition-colors last:border-0 ${isChecked ? "bg-primary/[0.04]" : "hover:bg-muted/20"}`}
                  >
                    {/* Checkbox */}
                    <TableCell className="w-10 px-4 py-3">
                      {!isSelf && (
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleOne(u.id)}
                          aria-label={`Select ${u.email}`}
                        />
                      )}
                    </TableCell>

                    {/* User */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                            {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{u.name ?? "—"}</p>
                            {isSelf && (
                              <span className="shrink-0 rounded-none bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold text-primary uppercase tracking-ui">
                                You
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="px-4 py-3">
                      <Badge variant={u.role === ADMIN_ROLE ? "default" : "secondary"} className="text-xs">
                        {u.role ?? "user"}
                      </Badge>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="px-4 py-3">
                      {u.banned ? (
                        <span className="inline-flex items-center gap-1.5 rounded-none border border-destructive/20 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-none border border-success/30 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          Active
                        </span>
                      )}
                    </TableCell>

                    {/* Created */}
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!isSelf && (
                          <UserSuspendForm banned={u.banned} userId={u.id} />
                        )}
                        <Link
                          href={`/orbit/users/${u.id}`}
                          className="inline-flex items-center gap-1 rounded-none border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                        >
                          View <ArrowRight size={11} />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Row count + pagination */}
      {filtered.length > 0 && selected.size === 0 && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
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
      )}

      {/* ── Bulk action toolbar ──────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-primary/20 bg-background px-6 py-3">
          <p className="text-sm font-medium">
            <span className="text-primary font-bold">{selected.size}</span> user{selected.size !== 1 ? "s" : ""} selected
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setSelected(new Set())}
              disabled={isPending}
            >
              Clear
            </Button>

            {/* Suspend — confirmation dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isPending}
                >
                  <ProhibitInset size={13} />
                  Suspend {selected.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Suspend {selected.size} account{selected.size > 1 ? "s" : ""}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {selected.size > 1 ? "These users" : "This user"} will be signed out
                    immediately and blocked from logging in until reactivated. This can be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleBulkSuspend}
                    disabled={isPending}
                  >
                    {isPending ? "Suspending…" : "Suspend"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete — confirmation dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  disabled={isPending}
                >
                  <Trash size={13} />
                  Delete {selected.size}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {selected.size} account{selected.size > 1 ? "s" : ""} permanently?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes {selected.size > 1 ? "these accounts" : "this account"}{" "}
                    and all of their bookings, sessions, and data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleBulkDelete}
                    disabled={isPending}
                  >
                    {isPending ? "Deleting…" : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
    </div>
  );
}
