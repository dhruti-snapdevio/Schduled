"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, Trash, ProhibitInset } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ADMIN_ROLE } from "@/config/platform";
import { bulkBanUsersAction, bulkDeleteUsersAction } from "@/app/actions/orbit-users";
import { UserSuspendForm } from "./user-actions";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  banned: boolean;
  createdAt: Date;
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();

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
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      await bulkDeleteUsersAction(buildFormData());
      setSelected(new Set());
      setConfirmDelete(false);
    });
  }

  return (
    <div className="relative">
      {/* ── Search + Filter bar ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
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

        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value as Filter); setSelected(new Set()); }}
          className="h-9 rounded-none border border-border bg-page px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Users</option>
          <option value="active">Active</option>
          <option value="admins">Admins</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={selectableIds.length === 0}
                  title={selectableIds.length === 0 ? "No other accounts to select" : "Select all"}
                  className="h-4 w-4 accent-primary disabled:cursor-not-allowed disabled:opacity-40 enabled:cursor-pointer"
                  aria-label="Select all"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No users match your search.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                const isChecked = selected.has(u.id);
                return (
                  <tr
                    key={u.id}
                    className={`border-b border-border transition-colors last:border-0 ${isChecked ? "bg-primary/[0.04]" : "hover:bg-muted/20"}`}
                  >
                    {/* Checkbox */}
                    <td className="w-10 px-4 py-3">
                      {!isSelf && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOne(u.id)}
                          className="h-4 w-4 cursor-pointer accent-primary"
                          aria-label={`Select ${u.email}`}
                        />
                      )}
                    </td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                          {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                        </span>
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
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge variant={u.role === ADMIN_ROLE ? "default" : "secondary"} className="text-xs">
                        {u.role ?? "user"}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
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
                    </td>

                    {/* Created */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(u.createdAt, "MMM d, yyyy")}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      {filtered.length > 0 && selected.size === 0 && (
        <div className="border-t border-border px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
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
              onClick={() => { setSelected(new Set()); setConfirmDelete(false); }}
              disabled={isPending}
            >
              Clear
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleBulkSuspend}
              disabled={isPending}
            >
              <ProhibitInset size={13} />
              Suspend {selected.size}
            </Button>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <p className="text-xs text-destructive font-medium">Delete {selected.size} accounts permanently?</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={handleBulkDelete}
                  disabled={isPending}
                >
                  {isPending ? "Deleting…" : "Yes, delete"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleBulkDelete}
                disabled={isPending}
              >
                <Trash size={13} />
                Delete {selected.size}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
