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

  // S3-compatible file storage (Cloudflare R2 / AWS S3 / MinIO)
  S3_ENDPOINT: optionalString,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,
  S3_PUBLIC_URL: optionalString,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.issues);
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
