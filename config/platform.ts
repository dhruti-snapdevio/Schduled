// Read directly (not via lib/env.ts) — this file is imported by client
// components too, and lib/env.ts's Zod schema requires server-only secrets
// (DATABASE_URL, APP_SECRET) that don't exist in the browser and would
// throw. A literal `process.env.NEXT_PUBLIC_*` access is safely inlined by
// Next.js for both server and client bundles.
export const PRODUCT_NAME = process.env.NEXT_PUBLIC_PRODUCT_NAME || "Schduled";
export const PRODUCT_DESCRIPTION = "Open-source scheduling, self-hosted.";
export const LOGO_PATH = "/logo.svg";

// Workspace roles — see docs/self-hosting/boss-employee-flow.md.
// Owner: exactly one, the account created during setup. Manager: delegated
// staff who run the Admin Center day-to-day but can't touch ownership/infra
// (Calendly calls this role "Admin"; renamed so it doesn't collide with
// "Owner"). Member: an invited host with their own scheduling only.
export const OWNER_ROLE = "owner";
export const MANAGER_ROLE = "manager";
export const MEMBER_ROLE = "member";

// Roles that can reach the /orbit Admin Center.
export const PANEL_ROLES = [OWNER_ROLE, MANAGER_ROLE] as const;

// How long an invite link stays valid before it must be re-sent.
export const INVITE_TTL_HOURS = 24 * 7;

// Single source of truth for password length constraints — read by
// lib/auth.ts (Better Auth's minPasswordLength/maxPasswordLength config) and
// every UI/action that validates a password client- or server-side, so none
// of them can silently drift out of sync with what the server actually
// enforces.
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
