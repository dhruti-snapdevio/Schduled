// ── S3 / R2 Storage Driver ────────────────────────────────────────────────────
// Set STORAGE_DRIVER=s3 in .env, then fill in S3_ENDPOINT, S3_ACCESS_KEY_ID,
// S3_SECRET_ACCESS_KEY, S3_BUCKET.
//
// Compatible with: Cloudflare R2, AWS S3, Backblaze B2, MinIO, DigitalOcean Spaces
// ─────────────────────────────────────────────────────────────────────────────

import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) {
    return _client;
  }
  if (
    !env.S3_ENDPOINT ||
    !env.S3_ACCESS_KEY_ID ||
    !env.S3_SECRET_ACCESS_KEY ||
    !env.S3_BUCKET
  ) {
    throw new Error(
      "S3 not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET in .env"
    );
  }
  _client = new S3Client({
    region: env.S3_REGION ?? "auto",
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false, // false for R2 and AWS; set true for MinIO
  });
  return _client;
}

export async function uploadFile(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
  return getFileUrl(params.key);
}

export async function deleteFile(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
  );
}

export function getFileUrl(key: string): string {
  // If a public CDN URL is configured, use it (no expiry, faster):
  if (env.S3_PUBLIC_URL) {
    return `${env.S3_PUBLIC_URL}/${key}`;
  }
  // Otherwise fall back to the bucket endpoint URL:
  return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`;
}

// For private buckets — generate a time-limited presigned URL (async):
export async function getPresignedUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn }
  );
}
