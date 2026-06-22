import { desc } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsersTable } from "@/components/orbit/users-table";
import { user } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "Users" };

export default async function OrbitUsersPage() {
  const session = await requireAdmin();

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return (
    <div>
      <OrbitPageHeader
        title="User Management"
        description="Suspend accounts, manage users, and inspect basic account state."
      />

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base font-semibold">All Users</CardTitle>
          <CardDescription>
            All registered accounts ordered by sign-up date.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable users={users} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
