import { desc } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubscribersTable } from "@/components/orbit/subscribers-table";
import { newsletterSubscriber } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export const metadata = { title: "Subscribers" };

export default async function OrbitSubscribersPage() {
  await requireAdmin();

  const subscribers = await db
    .select({
      id: newsletterSubscriber.id,
      email: newsletterSubscriber.email,
      createdAt: newsletterSubscriber.createdAt,
    })
    .from(newsletterSubscriber)
    .orderBy(desc(newsletterSubscriber.createdAt));

  return (
    <div className="space-y-6">
      <OrbitPageHeader
        title="Newsletter Subscribers"
        description="Everyone who signed up via the footer subscription form."
      />

      <Card>
        <CardContent className="p-0">
          <SubscribersTable subscribers={subscribers.map((s) => ({ ...s, createdAt: s.createdAt.toISOString() }))} />
        </CardContent>
      </Card>
    </div>
  );
}
