import { env } from '@/lib/env'
import * as local from './local'
import * as s3 from './s3'

const _driver = env.STORAGE_DRIVER === 's3' ? s3 : local

export const uploadFile = _driver.uploadFile
export const deleteFile = _driver.deleteFile
export const getFileUrl = _driver.getFileUrl

export function avatarKey(userId: string): string {
  return `avatars/${userId}`
}

export function logoKey(userId: string): string {
  return `logos/${userId}`
}
