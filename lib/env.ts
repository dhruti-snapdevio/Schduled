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

  // Google OAuth + Calendar API
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,

  // Zoom OAuth
  ZOOM_CLIENT_ID: optionalString,
  ZOOM_CLIENT_SECRET: optionalString,

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
