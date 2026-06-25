import { count, desc, eq, or } from "drizzle-orm";
import { EmailClient } from "@/components/orbit/email-client";
import { emailEvents, emailOutbox } from "@/db/schema";
import { db } from "@/lib/db";

export const metadata = { title: "Email" };

const OUTBOX_PAGE_SIZE = 10;

export default async function OrbitEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ outboxPage?: string }>;
}) {
  const { outboxPage: rawOutboxPage } = await searchParams;
  const outboxPage = Math.max(1, parseInt(rawOutboxPage ?? "1", 10) || 1);

  const [
    outboxRows,
    eventRows,
    [totalRow],
    [sentRow],
    [failedRow],
    [pendingRow],
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

    db.select({ value: count() }).from(emailOutbox),
    db.select({ value: count() }).from(emailOutbox).where(eq(emailOutbox.status, "sent")),
    db.select({ value: count() }).from(emailOutbox).where(eq(emailOutbox.status, "failed")),
    db
      .select({ value: count() })
      .from(emailOutbox)
      .where(or(eq(emailOutbox.status, "queued"), eq(emailOutbox.status, "sending"))),
  ]);

  // Serialize Date → ISO string before passing to client component
  const outbox = outboxRows.map((r) => ({
    ...r,
    sentAt:    r.sentAt    ? r.sentAt.toISOString()    : null,
    createdAt: r.createdAt.toISOString(),
  }));

  const events = eventRows.map((r) => ({
    ...r,
    receivedAt: r.receivedAt.toISOString(),
  }));

  const total = totalRow?.value ?? 0;
  const outboxTotalPages = Math.max(1, Math.ceil(total / OUTBOX_PAGE_SIZE));

  return (
    <EmailClient
      outbox={outbox}
      events={events}
      stats={{
        total,
        sent:    sentRow?.value    ?? 0,
        failed:  failedRow?.value  ?? 0,
        pending: pendingRow?.value ?? 0,
      }}
      outboxPage={outboxPage}
      outboxTotalPages={outboxTotalPages}
      fetchedAt={new Date().toISOString()}
    />
  );
}
