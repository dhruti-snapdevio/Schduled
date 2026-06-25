"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { emailOutbox } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { db, dbClient } from "@/lib/db";
import { enqueueJob } from "@/lib/worker/enqueue";
import { JOB_NAMES } from "@/lib/worker/job-types";

export async function retryFailedJobsAction(queueName: string): Promise<void> {
  await requireAdmin();

  // The email queue is special: a permanently-failed email leaves its pg-boss
  // job in the `completed` state (the handler returns normally after recording
  // the failure) and records the failure on the `email_outbox` row instead.
  // Resetting pg-boss `failed` jobs would therefore retry nothing — we have to
  // re-queue the outbox rows and enqueue fresh send jobs for them.
  if (queueName === JOB_NAMES.EMAIL_SEND) {
    const failed = await db
      .update(emailOutbox)
      .set({
        attemptCount: 0,
        claimedAt: null,
        status: "queued",
        updatedAt: new Date(),
      })
      .where(eq(emailOutbox.status, "failed"))
      .returning({ id: emailOutbox.id });

    await Promise.allSettled(
      failed.map((row) => enqueueJob(JOB_NAMES.EMAIL_SEND, { outboxId: row.id }))
    );

    revalidatePath("/orbit/queues");
    return;
  }

  try {
    await dbClient`
      UPDATE pgboss.job
      SET state     = 'created',
          retrycount = 0,
          completedon = NULL,
          startedon   = NULL
      WHERE name  = ${queueName}
        AND state = 'failed'
    `;
  } catch {
    // pgboss schema may not exist yet — silently ignore
  }
  revalidatePath("/orbit/queues");
}
