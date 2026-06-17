import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { env } from '@/lib/env'

let _s3: S3Client | null = null

function getClient(): S3Client {
  if (_s3) return _s3
  if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_BUCKET) {
    throw new Error('S3 not configured. Set S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET in .env')
  }
  _s3 = new S3Client({
    region:   env.S3_REGION ?? 'auto',
    endpoint: env.S3_ENDPOINT,
    credentials: {
      accessKeyId:     env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
  })
  return _s3
}

export async function uploadFile(params: {
  key:         string
  body:        Buffer | Uint8Array
  contentType: string
}): Promise<string> {
  await getClient().send(new PutObjectCommand({
    Bucket:      env.S3_BUCKET,
    Key:         params.key,
    Body:        params.body,
    ContentType: params.contentType,
  }))
  return getFileUrl(params.key)
}

export async function deleteFile(key: string): Promise<void> {
  await getClient().send(new DeleteObjectCommand({
    Bucket: env.S3_BUCKET,
    Key:    key,
  }))
}

export async function getFileUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  if (env.S3_PUBLIC_URL) return `${env.S3_PUBLIC_URL}/${key}`
  return getSignedUrl(
    getClient(),
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn: expiresInSeconds },
  )
}

export function avatarKey(userId: string): string {
  return `avatars/${userId}`
}

export function logoKey(userId: string): string {
  return `logos/${userId}`
}
