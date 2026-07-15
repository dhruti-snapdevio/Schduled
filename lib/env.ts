import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional()
);

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  APP_SECRET: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // SMTP email
  SMTP_HOST: optionalString,
  SMTP_PORT: z.preprocess((v) => (v ? Number(v) : undefined), z.number().optional()),
  SMTP_SECURE: z.preprocess((v) => v === 'true' || v === '1', z.boolean().optional()),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: optionalString,
  EMAIL_WEBHOOK_SECRET: optionalString,

  // Encryption — required before calendar/video OAuth token storage
  ENCRYPT_KEY: optionalString,

  // Self-hosted first-run bootstrap: this email is auto-promoted to admin
  // the moment its account is created (checked once, at signup)
  INITIAL_ADMIN_EMAIL: optionalString,

  // Email + password sign-in — ON by default. It's the primary login method
  // (works on a fresh self-hosted box with no SMTP or Google configured).
  // Magic link and Google are the optional secondary methods. Disable with any
  // of: false / 0 / off / no / disabled (case-insensitive) for a
  // magic-link/Google-only deployment.
  NEXT_PUBLIC_PASSWORD_AUTH_ENABLED: z.preprocess(
    (v) => {
      const s = typeof v === "string" ? v.trim().toLowerCase() : v;
      return !(s === "false" || s === "0" || s === "off" || s === "no" || s === "disabled");
    },
    z.boolean()
  ),

  // Gates new-account creation (password sign-up, magic link first-use, or
  // Google first-login) — on by default so nothing changes unless a
  // self-hoster opts in. Set to 'false' to close public sign-up; the
  // INITIAL_ADMIN_EMAIL account can always sign up regardless, so it's safe
  // to set both from day one instead of "open then close later".
  SIGNUP_ENABLED: z.preprocess(
    (v) => (v === undefined ? true : v === "true" || v === "1"),
    z.boolean()
  ),

  // Activity-log retention, in days. Unset = keep forever (the self-hosted
  // default — an operator owns their own Postgres, unlike a SaaS storage-cost
  // driven cap). Set e.g. 180 to prune older audit_logs rows nightly.
  ACTIVITY_LOG_RETENTION_DAYS: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().int().positive().optional()
  ),

  // Marketing landing page at "/" — on by default. Set to 'false' for
  // internal/team deployments that don't want a public marketing page;
  // "/" then redirects to "/login" instead. Booking + legal pages are
  // unaffected either way.
  NEXT_PUBLIC_LANDING_ENABLED: z.preprocess(
    (v) => (v === undefined ? true : v === "true" || v === "1"),
    z.boolean()
  ),

  // Postgres connection pool size (postgres.js `max`). Multiple web replicas
  // each open their own pool — do the math against your database's
  // max_connections before scaling out (replicas × DB_POOL_MAX + pg-boss's
  // own pool).
  DB_POOL_MAX: z.preprocess(
    (v) => (v ? Number(v) : undefined),
    z.number().int().positive().default(20)
  ),

  // White-labeling — product name shown in email subjects, page titles, the
  // login page, and iCal PRODID. Defaults to "Schduled" (the hosted product).
  NEXT_PUBLIC_PRODUCT_NAME: z.string().min(1).default("Schduled"),

  // "Powered by <product>" attribution on public booking pages — on by
  // default (matches the hosted product). Self-hosters can turn it off.
  NEXT_PUBLIC_SHOW_POWERED_BY: z.preprocess(
    (v) => (v === undefined ? true : v === "true" || v === "1"),
    z.boolean()
  ),

  // Contact-form destination (server-only — not exposed to the browser).
  // Falls back to SMTP_USER, then a hardcoded address, if unset.
  CONTACT_EMAIL: optionalString,

  // Public-facing addresses shown on the landing/contact pages. Fall back to
  // the hosted product's addresses if unset — self-hosters should override.
  NEXT_PUBLIC_CONTACT_EMAIL: z.string().min(1).default("support@schduled.com"),
  PRIVACY_EMAIL: z.string().min(1).default("privacy@schduled.com"),

  // Google OAuth + Calendar API
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  // Zoom OAuth
  ZOOM_CLIENT_ID: optionalString,
  ZOOM_CLIENT_SECRET: optionalString,

  // Address autocomplete geocoder. Defaults to free, keyless Photon (OSM).
  // Set a Google or Mapbox key for richer village/street/building coverage —
  // the provider is auto-detected, or pin it with GEOCODER_PROVIDER.
  GEOCODER_PROVIDER: z
    .enum(["photon", "google", "mapbox"])
    .optional(),
  GOOGLE_MAPS_API_KEY: optionalString,
  MAPBOX_TOKEN: optionalString,

  // File storage driver: 'local' (default, saves to public/uploads/) or 's3' (Cloudflare R2 / AWS S3)
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),

  // S3/R2 credentials — only required when STORAGE_DRIVER=s3
  S3_ENDPOINT: optionalString,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_PUBLIC_URL: optionalString,
}).superRefine((val, ctx) => {
  // OAuth integrations store access/refresh tokens encrypted at rest with
  // ENCRYPT_KEY. If an integration is configured but the key is missing, the
  // OAuth callback would throw *after* the code exchange — fail at boot instead.
  const googleEnabled = !!(val.GOOGLE_CLIENT_ID && val.GOOGLE_CLIENT_SECRET);
  const zoomEnabled = !!(val.ZOOM_CLIENT_ID && val.ZOOM_CLIENT_SECRET);
  if ((googleEnabled || zoomEnabled) && !val.ENCRYPT_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ENCRYPT_KEY"],
      message:
        "ENCRYPT_KEY is required when Google or Zoom OAuth is configured (it encrypts stored OAuth tokens).",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
