import { count, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/authz";
import { PageHeader } from "@/components/scaffold/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AuditTable } from "@/components/settings-admin/audit-table";
import { auditLogs } from "@/db/schema";
import { db } from "@/lib/db";
import { buildAuditWhereClause, parseAuditFilters } from "@/lib/audit-query";

export const metadata = { title: "Audit Logs" };

const PAGE_SIZE = 15;

export default async function SettingsAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; category?: string; entity?: string; dateRange?: string;
    from?: string; to?: string; page?: string;
  }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const filters = parseAuditFilters(params);
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const whereClause = buildAuditWhereClause(filters);

  const [totalResult, entityTypeRows, rows] = await Promise.all([
    db.select({ value: count() }).from(auditLogs).where(whereClause),
    // Distinct entity types across ALL logs (not just the current filtered
    // page) so the dropdown always offers every category, even ones with 0
    // matches under the current filter.
    db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs).orderBy(auditLogs.entityType),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        actorId: auditLogs.actorId,
        actorEmail: auditLogs.actorEmail,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        description: auditLogs.description,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
      })
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
  ]);

  const total = totalResult[0]?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const logs = rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="All system and user actions recorded for compliance and security."
      />

      <Card>
        <CardContent className="p-0">
          <AuditTable
            logs={logs}
            total={total}
            page={page}
            totalPages={totalPages}
            entityTypes={entityTypeRows.map((r) => r.entityType)}
            filters={filters}
          />
        </CardContent>
      </Card>
    </div>
  );
}
