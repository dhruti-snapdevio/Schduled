"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { ADMIN_ROLE } from "@/config/platform";
import { UserRoleForm, UserSuspendForm } from "./user-actions";

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
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q);

    const matchFilter =
      filter === "all" ||
      (filter === "active" && !u.banned) ||
      (filter === "admins" && u.role === ADMIN_ROLE) ||
      (filter === "suspended" && u.banned);

    return matchSearch && matchFilter;
  });

  return (
    <div>
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
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-none border border-border bg-page pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:w-64"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
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
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-ui text-muted-foreground">
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
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-muted-foreground"
                >
                  No users match your search.
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-border transition-colors hover:bg-muted/20 last:border-0"
                  >
                    {/* User */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                          {(u.name ?? u.email).slice(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">
                              {u.name ?? "—"}
                            </p>
                            {isSelf && (
                              <span className="shrink-0 rounded-none bg-primary/10 px-1.5 py-0.5 text-2xs font-semibold text-primary uppercase tracking-ui">
                                You
                              </span>
                            )}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          u.role === ADMIN_ROLE ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
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
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserRoleForm role={u.role} userId={u.id} />
                          <UserSuspendForm banned={u.banned} userId={u.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      {filtered.length > 0 && (
        <div className="border-t border-border px-6 py-3">
          <p className="text-xs text-muted-foreground">
            {filtered.length} of {users.length} user
            {users.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}
