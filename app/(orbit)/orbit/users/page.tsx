import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { UsersTable } from "@/components/orbit/users-table";
import { UsersSearch, UsersFilter } from "@/components/orbit/users-search";
import { InviteDialog } from "@/components/orbit/invite-dialog";
import { PendingInvitesTable } from "@/components/orbit/pending-invites-table";
import { PANEL_ROLES } from "@/config/platform";
import { invitation, user } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "Members" };

const PAGE_SIZE = 10;

type Filter = "all" | "active" | "staff" | "suspended";

export default async function OrbitUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string; page?: string }>;
}) {
  const session = await requireAdmin();
  const { q, filter: rawFilter, page: rawPage } = await searchParams;

  const search = q?.trim() ?? "";
  const filter: Filter =
    rawFilter === "active" || rawFilter === "staff" || rawFilter === "suspended"
      ? rawFilter
      : "all";
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);

  const searchFilter = search
    ? or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    : undefined;
  const statusFilter =
    filter === "active" ? eq(user.banned, false)
    : filter === "staff" ? inArray(user.role, PANEL_ROLES as unknown as string[])
    : filter === "suspended" ? eq(user.banned, true)
    : undefined;
  const whereClause = and(searchFilter, statusFilter);

  const [totalResult, staffResult, suspendedResult, allResult, rows, pendingInvites] = await Promise.all([
    db.select({ value: count() }).from(user).where(whereClause),
    db.select({ value: count() }).from(user).where(inArray(user.role, PANEL_ROLES as unknown as string[])),
    db.select({ value: count() }).from(user).where(eq(user.banned, true)),
    db.select({ value: count() }).from(user),
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(desc(user.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db
      .select({
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt,
      })
      .from(invitation)
      .where(eq(invitation.status, "pending"))
      .orderBy(desc(invitation.createdAt)),
  ]);

  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <OrbitPageHeader
        title="Members"
        description="Invite people into your workspace, manage roles, and suspend accounts."
        actions={<InviteDialog />}
      />

      {pendingInvites.length > 0 && (
        <PendingInvitesTable
          invites={pendingInvites.map((i) => ({
            ...i,
            expiresAt: i.expiresAt.toISOString(),
            createdAt: i.createdAt.toISOString(),
          }))}
        />
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold text-foreground">All Members</p>
            <p className="text-sm text-muted-foreground">
              All registered accounts ordered by sign-up date.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <UsersSearch />
            <UsersFilter value={filter} />
          </div>
        </div>

        <div className="flex items-center gap-2.5 border-b border-border px-4 py-2 text-xs text-muted-foreground">
          <span><strong className="font-semibold text-foreground">{allResult[0]?.value ?? 0}</strong> total</span>
          <span className="text-border">·</span>
          <span><strong className="font-semibold text-foreground">{staffResult[0]?.value ?? 0}</strong> owner &amp; manager{(staffResult[0]?.value ?? 0) !== 1 ? "s" : ""}</span>
          <span className="text-border">·</span>
          <span><strong className="font-semibold text-foreground">{suspendedResult[0]?.value ?? 0}</strong> suspended</span>
        </div>

        <CardContent className="p-0">
          <UsersTable
            users={rows.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
            currentUserId={session.user.id}
            currentUserRole={session.user.role}
            total={total}
            page={page}
            totalPages={totalPages}
            search={search}
            filter={filter}
          />
        </CardContent>
      </Card>
    </div>
  );
}
