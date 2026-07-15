# Bug: workspace branding saves correctly but has zero visible effect anywhere

**Found:** 2026-07-15, while reviewing the workspace-settings surface against Calendly's Admin Center for feature-completeness.

**Where:** `lib/settings/workspace.ts` (`getWorkspaceBranding`/`setWorkspaceBranding`), consumed only by `app/(orbit)/orbit/settings/_components/workspace-branding-card.tsx` and `app/actions/orbit-settings.ts`.

**What's broken:** The Workspace card on `/orbit/settings` lets an owner/manager set a workspace name and logo URL, and the save/reload round-trip works correctly — the value persists to the `app_setting` table and reloads on the settings page. But nothing else in the application ever read it. The Admin Center sidebar and mobile header always showed the hardcoded string `"Admin Panel"`; the invite email always said `"You're invited to Schduled"` (the generic product name) regardless of what an owner had configured. From a user's perspective this looks exactly like a broken setting — you type a name, save it, see it reflected back on the same page, and then it has no effect anywhere you'd actually expect to see it.

**How it was found:** Grepped every call site of `getWorkspaceBranding` while answering a direct question about whether the workspace-settings feature was "ready" compared to Calendly's equivalent — confirmed the function was only ever called from the one page that also writes it.

**Root cause:** The workspace branding feature was built (storage + settings-page UI) without a corresponding pass to wire it into the places that should actually display it — the Admin Center chrome and outbound emails were left hardcoded to `PRODUCT_NAME`/static copy rather than reading the configured value.
