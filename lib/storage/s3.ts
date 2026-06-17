// ── S3 / R2 Storage Driver ────────────────────────────────────────────────────
// Activate by:
//   1. Set STORAGE_DRIVER=s3 in .env
//   2. Fill in S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET
//   3. In lib/storage/index.ts — uncomment the two lines marked "S3 ACTIVATE"
//
// Compatible with: Cloudflare R2, AWS S3, Backblaze B2, MinIO, DigitalOcean Spaces
// ─────────────────────────────────────────────────────────────────────────────

// import {
//   S3Client,
//   PutObjectCommand,
//   DeleteObjectCommand,
//   GetObjectCommand,
// } from '@aws-sdk/client-s3'
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
// import { env } from '@/lib/env'

// let _client: S3Client | null = null

// function getClient(): S3Client {
//   if (_client) return _client
//   if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET) {
//     throw new Error(
//       'S3 not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET in .env'
//     )
//   }
//   _client = new S3Client({
//     region:      env.S3_REGION ?? 'auto',
//     endpoint:    env.S3_ENDPOINT,
//     credentials: {
//       accessKeyId:     env.S3_ACCESS_KEY_ID,
//       secretAccessKey: env.S3_SECRET_ACCESS_KEY,
//     },
//     forcePathStyle: false,   // false for R2 and AWS; set true for MinIO
//   })
//   return _client
// }

// export async function uploadFile(params: {
//   key:         string
//   body:        Buffer | Uint8Array
//   contentType: string
// }): Promise<string> {
//   await getClient().send(
//     new PutObjectCommand({
//       Bucket:      env.S3_BUCKET,
//       Key:         params.key,
//       Body:        params.body,
//       ContentType: params.contentType,
//     })
//   )
//   return getFileUrl(params.key)
// }

// export async function deleteFile(key: string): Promise<void> {
//   await getClient().send(
//     new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key })
//   )
// }

// export function getFileUrl(key: string): string {
//   // If a public CDN URL is configured, use it (no expiry, faster):
//   if (env.S3_PUBLIC_URL) return `${env.S3_PUBLIC_URL}/${key}`
//   // Otherwise fall back to the bucket endpoint URL:
//   return `${env.S3_ENDPOINT}/${env.S3_BUCKET}/${key}`
// }

// For private buckets — generate a time-limited presigned URL (async):
// export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
//   return getSignedUrl(
//     getClient(),
//     new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
//     { expiresIn }
//   )
// }

// ── Placeholder exports ───────────────────────────────────────────────────────
// These keep TypeScript happy when this file is imported before S3 is activated.
// DELETE these three functions once you uncomment the real implementation above.

export async function uploadFile(_params: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<string> {
  throw new Error('S3 driver is not activated. Set STORAGE_DRIVER=local or uncomment the S3 implementation in lib/storage/s3.ts')
}

export async function deleteFile(_key: string): Promise<void> {
  throw new Error('S3 driver is not activated.')
}

export function getFileUrl(_key: string): string {
  throw new Error('S3 driver is not activated.')
}
