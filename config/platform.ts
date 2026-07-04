// Read directly (not via lib/env.ts) — this file is imported by client
// components too, and lib/env.ts's Zod schema requires server-only secrets
// (DATABASE_URL, APP_SECRET) that don't exist in the browser and would
// throw. A literal `process.env.NEXT_PUBLIC_*` access is safely inlined by
// Next.js for both server and client bundles.
export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "Schduled";
export const PRODUCT_DESCRIPTION = "Smart scheduling for modern teams.";
export const LOGO_PATH = "/logo.svg";

export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";
