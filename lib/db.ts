import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

export const dbClient = postgres(env.DATABASE_URL, {
  max: env.DB_POOL_MAX,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(dbClient, { schema });

// Retries an initial connectivity check with backoff — smooths over Docker
// Compose startup ordering (Postgres container not accepting connections yet
// when the web container starts), matching the worker's startBossWithRetry
// pattern. Bounded, non-fatal: a query-time error still surfaces normally if
// the database is genuinely unreachable after this.
export async function waitForDatabase(maxRetries = 10) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await dbClient`select 1`;
      return;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`[db] not reachable after ${maxRetries} attempts`, error);
        return;
      }
      const delay = Math.min(1000 * 2 ** (attempt - 1), 15_000);
      console.error(
        `[db] connection attempt ${attempt}/${maxRetries} failed; retrying in ${delay / 1000}s`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
