"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/authz";
import { dbClient } from "@/lib/db";

export async function retryFailedJobsAction(queueName: string): Promise<void> {
  await requireAdmin();
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
