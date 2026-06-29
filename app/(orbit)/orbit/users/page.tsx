import { desc } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="space-y-6">
      <OrbitPageHeader
        title="User Management"
        description="Suspend accounts, manage users, and inspect basic account state."
      />

      <Card>
        <CardContent className="p-0">
          <UsersTable users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} currentUserId={session.user.id} />
        </CardContent>
      </Card>
    </div>
  );
}
