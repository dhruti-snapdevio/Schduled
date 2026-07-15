import { inArray } from "drizzle-orm";
import { PRODUCT_NAME } from "@/config/platform";
import { appSetting } from "@/db/schema";
import { db } from "@/lib/db";

export interface WorkspaceBranding {
  name: string;
  logoUrl: string | null;
}

const KEYS = {
  name: "workspace.name",
  logoUrl: "workspace.logo_url",
} as const;

const ALL_KEYS = [KEYS.name, KEYS.logoUrl];

export async function getWorkspaceBranding(): Promise<WorkspaceBranding> {
  const rows = await db
    .select({ key: appSetting.key, value: appSetting.value })
    .from(appSetting)
    .where(inArray(appSetting.key, ALL_KEYS));

  const stored = new Map(rows.map((r) => [r.key, r.value]));

  return {
    name: stored.get(KEYS.name) || PRODUCT_NAME,
    logoUrl: stored.get(KEYS.logoUrl) || null,
  };
}

export async function setWorkspaceBranding(next: WorkspaceBranding): Promise<void> {
  const rows = [
    { key: KEYS.name, value: next.name },
    { key: KEYS.logoUrl, value: next.logoUrl ?? "" },
  ];

  await db.transaction(async (tx) => {
    for (const row of rows) {
      await tx
        .insert(appSetting)
        .values({ key: row.key, value: row.value, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: appSetting.key,
          set: { value: row.value, updatedAt: new Date() },
        });
    }
  });
}
