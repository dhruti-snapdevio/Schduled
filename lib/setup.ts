import "server-only";

import { user } from "@/db/schema";
import { db } from "@/lib/db";

/** Check if any user exists in the system. Used to gate the setup wizard. */
export async function hasAnyUser(): Promise<boolean> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .limit(1);
  return !!row;
}
