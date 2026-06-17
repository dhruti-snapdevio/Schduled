import { env } from '@/lib/env'
import * as local from './local'
// import * as s3 from './s3'   // ← S3 ACTIVATE: uncomment this line when STORAGE_DRIVER=s3

const _driver = (() => {
  if (env.STORAGE_DRIVER === 's3') {
    // return s3                // ← S3 ACTIVATE: uncomment this line when STORAGE_DRIVER=s3
    throw new Error('STORAGE_DRIVER=s3 is set but the S3 driver is not activated. Uncomment the two S3 ACTIVATE lines in lib/storage/index.ts')
  }
  return local
})()

export const uploadFile = _driver.uploadFile
export const deleteFile = _driver.deleteFile
export const getFileUrl = _driver.getFileUrl

export function avatarKey(userId: string): string {
  return `avatars/${userId}`
}

export function logoKey(userId: string): string {
  return `logos/${userId}`
}
