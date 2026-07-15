import { lt } from "drizzle-orm";
import type { Job } from "pg-boss";
import { auditLogs } from "@/db/schema";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

// No-op when retention is unset (the self-hosted default — an operator owns
// their own Postgres, unlike Calendly's SaaS storage-cost-driven 90-day cap).
export async function handleAuditLogsPrune(_jobs: Job<Record<string, never>>[]) {
  if (!env.ACTIVITY_LOG_RETENTION_DAYS) return;

  const cutoff = new Date(Date.now() - env.ACTIVITY_LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(auditLogs).where(lt(auditLogs.createdAt, cutoff));
}
