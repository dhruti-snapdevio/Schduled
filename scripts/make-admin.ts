import { existsSync } from "node:fs";
import { eq } from "drizzle-orm";
import { MANAGER_ROLE } from "@/config/platform";

if (existsSync(".env")) {
  process.loadEnvFile();
}

// Promotes to Manager, not Owner — the workspace has exactly one Owner, set
// during first-run setup or via ownership transfer in the Admin Center. This
// script is the recovery path for granting a second person Admin Center
// access outside the normal invite flow.
async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: pnpm make:admin <email>");
    process.exit(1);
  }

  const [{ db }, { user }] = await Promise.all([
    import("@/lib/db"),
    import("@/db/schema"),
  ]);

  const [updated] = await db
    .update(user)
    .set({ role: MANAGER_ROLE, updatedAt: new Date() })
    .where(eq(user.email, email))
    .returning({ email: user.email, role: user.role });

  if (!updated) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`${updated.email} is now an Orbit manager.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed:", error);
  process.exit(1);
});
