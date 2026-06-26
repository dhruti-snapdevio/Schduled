import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { EmailClient } from "@/components/orbit/email-client";
import { emailEvents, emailOutbox } from "@/db/schema";
import { db } from "@/lib/db";

export const metadata = { title: "Email" };

const OUTBOX_PAGE_SIZE = 10;

export default async function OrbitEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ outboxPage?: string; q?: string; status?: string }>;
}) {
  const { outboxPage: rawOutboxPage, q: rawQ, status: rawStatus } = await searchParams;

  const outboxPage = Math.max(1, parseInt(rawOutboxPage ?? "1", 10) || 1);
  const searchQuery = rawQ?.trim() ?? "";
  const statusFilter = rawStatus ?? "all";

  // Build WHERE conditions for outbox filtering
  const statusCond =
    statusFilter && statusFilter !== "all"
      ? eq(emailOutbox.status, statusFilter as "queued" | "sending" | "sent" | "failed")
      : undefined;

  const searchCond = searchQuery
    ? or(
        sql`LOWER(${emailOutbox.payload}->>'to') LIKE ${`%${searchQuery.toLowerCase()}%`}`,
        sql`LOWER(${emailOutbox.payload}->>'subject') LIKE ${`%${searchQuery.toLowerCase()}%`}`,
      )
    : undefined;

  const where = and(statusCond, searchCond);

  const [
    outboxRows,
    eventRows,
    [totalRow],
    [sentRow],
    [failedRow],
    [pendingRow],
    [filteredCountRow],
  ] = await Promise.all([
    db
      .select({
        id:           emailOutbox.id,
        status:       emailOutbox.status,
        payload:      emailOutbox.payload,
        attemptCount: emailOutbox.attemptCount,
        sentAt:       emailOutbox.sentAt,
        createdAt:    emailOutbox.createdAt,
      })
      .from(emailOutbox)
      .where(where)
      .orderBy(desc(emailOutbox.createdAt))
      .limit(OUTBOX_PAGE_SIZE)
      .offset((outboxPage - 1) * OUTBOX_PAGE_SIZE),

    db
      .select({
        id:         emailEvents.id,
        eventType:  emailEvents.eventType,
        recipient:  emailEvents.recipient,
        receivedAt: emailEvents.receivedAt,
      })
      .from(emailEvents)
      .orderBy(desc(emailEvents.receivedAt))
      .limit(50),

    // Stats are always unfiltered totals
    db.select({ value: count() }).from(emailOutbox),
    db.select({ value: count() }).from(emailOutbox).where(eq(emailOutbox.status, "sent")),
    db.select({ value: count() }).from(emailOutbox).where(eq(emailOutbox.status, "failed")),
    db
      .select({ value: count() })
      .from(emailOutbox)
      .where(or(eq(emailOutbox.status, "queued"), eq(emailOutbox.status, "sending"))),

    // Filtered total for pagination
    db.select({ value: count() }).from(emailOutbox).where(where),
  ]);

  const outbox = outboxRows.map((r) => ({
    ...r,
    sentAt:    r.sentAt    ? r.sentAt.toISOString()    : null,
    createdAt: r.createdAt.toISOString(),
  }));

  const events = eventRows.map((r) => ({
    ...r,
    receivedAt: r.receivedAt.toISOString(),
  }));

  const filteredTotal = filteredCountRow?.value ?? 0;
  const outboxTotalPages = Math.max(1, Math.ceil(filteredTotal / OUTBOX_PAGE_SIZE));

  return (
    <EmailClient
      outbox={outbox}
      events={events}
      stats={{
        total:   totalRow?.value   ?? 0,
        sent:    sentRow?.value    ?? 0,
        failed:  failedRow?.value  ?? 0,
        pending: pendingRow?.value ?? 0,
      }}
      outboxPage={outboxPage}
      outboxTotalPages={outboxTotalPages}
      fetchedAt={new Date().toISOString()}
      searchQuery={searchQuery}
      statusFilter={statusFilter}
    />
  );
}
