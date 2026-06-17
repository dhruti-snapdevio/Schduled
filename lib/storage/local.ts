import { mkdir, unlink, writeFile } from 'fs/promises'
import { dirname, join } from 'path'

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')

export async function uploadFile(params: {
  key: string
  body: Buffer | Uint8Array
  contentType: string
}): Promise<string> {
  const dest = join(UPLOAD_DIR, params.key)
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, params.body)
  return getFileUrl(params.key)
}

export async function deleteFile(key: string): Promise<void> {
  try {
    await unlink(join(UPLOAD_DIR, key))
  } catch {
    // File may not exist — not an error
  }
}

export function getFileUrl(key: string): string {
  return `/uploads/${key}`
}
