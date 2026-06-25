import { desc } from "drizzle-orm";
import { OrbitPageHeader } from "@/components/admin/orbit-page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AuditTable } from "@/components/orbit/audit-table";
import { auditLogs } from "@/db/schema";
import { db } from "@/lib/db";

export const metadata = { title: "Audit Logs" };

export default async function AuditPage() {
  const rows = await db
    .select({
      id:          auditLogs.id,
      action:      auditLogs.action,
      actorId:     auditLogs.actorId,
      actorEmail:  auditLogs.actorEmail,
      entityType:  auditLogs.entityType,
      entityId:    auditLogs.entityId,
      description: auditLogs.description,
      metadata:    auditLogs.metadata,
      createdAt:   auditLogs.createdAt,
    })
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(500);

  // Serialize dates to ISO strings before passing to the client component
  const logs = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <OrbitPageHeader
        title="Audit Logs"
        description="All system and user actions recorded for compliance and security."
      />

      <Card>
        <CardContent className="p-0">
          <AuditTable logs={logs} />
        </CardContent>
      </Card>
    </div>
  );
}
