"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { newsletterSubscriber } from "@/db/schema";
import { requireAdmin } from "@/lib/authz";
import { db } from "@/lib/db";

export async function deleteSubscriberAction(id: string) {
  await requireAdmin();
  await db.delete(newsletterSubscriber).where(eq(newsletterSubscriber.id, id));
  revalidatePath("/orbit/subscribers");
}
