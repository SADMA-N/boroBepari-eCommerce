import fs from 'node:fs/promises'
import path from 'node:path'

let s3Client: any = null

const isS3Configured = !!(
  process.env.PRODUCT_IMAGES_S3_ACCESS_KEY_ID &&
  process.env.PRODUCT_IMAGES_S3_SECRET_ACCESS_KEY &&
  process.env.PRODUCT_IMAGES_S3_BUCKET
)

const getS3Client = async () => {
  if (s3Client) return s3Client
  if (!isS3Configured) return null

  try {
    // @ts-ignore -- S3Client is a Bun-specific API not in default types
    const { S3Client } = await import('bun')
    s3Client = new S3Client({
      accessKeyId: process.env.PRODUCT_IMAGES_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.PRODUCT_IMAGES_S3_SECRET_ACCESS_KEY,
      bucket: process.env.PRODUCT_IMAGES_S3_BUCKET,
      region: process.env.PRODUCT_IMAGES_S3_REGION || 'ap-southeast-1',
      endpoint: process.env.PRODUCT_IMAGES_S3_ENDPOINT,
    })
    return s3Client
  } catch (e) {
    console.error('Failed to initialize Product Images S3Client:', e)
    return null
  }
}

const PUBLIC_URL =
  process.env.PRODUCT_IMAGES_PUBLIC_URL || '/uploads/product-images'

function getExtFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  }
  return map[mimeType] || 'jpg'
}

export async function uploadProductImage(
  file: Buffer | Uint8Array,
  sellerId: string,
  mimeType: string,
): Promise<string> {
  const ext = getExtFromMime(mimeType)
  const uuid = crypto.randomUUID()
  const key = `seller/${sellerId}/${uuid}.${ext}`

  const s3 = await getS3Client()

  if (!s3) {
    // Fallback: local storage for development
    const localPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'product-images',
      key,
    )
    await fs.mkdir(path.dirname(localPath), { recursive: true })
    await fs.writeFile(localPath, file)
    return `/uploads/product-images/${key}`
  }

  const s3File = s3.file(key)
  await s3File.write(file, { type: mimeType })
  return `${PUBLIC_URL}/${key}`
}

export async function deleteProductImage(publicUrl: string): Promise<void> {
  // Extract the key from the public URL
  const prefix = PUBLIC_URL + '/'
  const key = publicUrl.startsWith(prefix)
    ? publicUrl.slice(prefix.length)
    : publicUrl.replace(/^\/uploads\/product-images\//, '')

  const s3 = await getS3Client()

  if (!s3) {
    const localPath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'product-images',
      key,
    )
    try {
      await fs.unlink(localPath)
    } catch {
      // ignore
    }
    return
  }

  return s3.file(key).delete()
}
