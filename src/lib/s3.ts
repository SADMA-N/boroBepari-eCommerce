// src/lib/s3.ts
import fs from 'node:fs/promises'
import path from 'node:path'

let s3Client: any = null

const isS3Configured = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME
)

const getS3Client = async () => {
  if (s3Client) return s3Client
  if (!isS3Configured) return null

  try {
    // @ts-ignore -- S3Client is a Bun-specific API not in default types
    const { S3Client } = await import('bun')
    s3Client = new S3Client({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_BUCKET_NAME,
      region: process.env.AWS_REGION || 'ap-southeast-1',
      endpoint: process.env.AWS_ENDPOINT,
    })
    return s3Client
  } catch (e) {
    console.error('Failed to initialize Bun S3Client:', e)
    return null
  }
}

export const BUCKET_NAME = process.env.AWS_BUCKET_NAME || 'borobepari-kyc'

export async function uploadToS3(
  file: Buffer | Uint8Array | Blob | string,
  key: string,
  mimeType: string,
) {
  const s3 = await getS3Client()

  if (!s3) {
    // FALLBACK: Local storage for development if S3 is not configured
    console.warn(
      `S3 not configured. Saving ${key} to local filesystem (fallback).`,
    )
    const localPath = path.join(process.cwd(), 'public', 'uploads', key)
    await fs.mkdir(path.dirname(localPath), { recursive: true })

    let buffer: Buffer
    if (typeof file === 'string') {
      buffer = Buffer.from(file, 'base64')
    } else if (file instanceof Blob) {
      buffer = Buffer.from(await file.arrayBuffer())
    } else {
      buffer = Buffer.from(file)
    }

    await fs.writeFile(localPath, buffer)
    return {
      bucket: 'local-fs',
      key: key,
    }
  }

  const s3File = s3.file(key)
  await s3File.write(file, {
    type: mimeType,
  })
  return {
    bucket: BUCKET_NAME,
    key: key,
  }
}

export async function getSignedUrl(key: string, expiresIn: number = 3600) {
  const s3 = await getS3Client()

  if (!s3) {
    // FALLBACK: Local URL for development
    return `/uploads/${key}`
  }

  return s3.file(key).presign({
    expiresIn,
  })
}

export async function deleteFromS3(key: string) {
  const s3 = await getS3Client()

  if (!s3) {
    // FALLBACK: Local delete
    const localPath = path.join(process.cwd(), 'public', 'uploads', key)
    try {
      await fs.unlink(localPath)
    } catch (e) {}
    return
  }

  return s3.file(key).delete()
}
