import { S3Client } from 'bun'
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { products } from '../src/db/schema'

const s3 = new S3Client({
  endpoint: process.env.PRODUCT_IMAGES_S3_ENDPOINT!,
  accessKeyId: process.env.PRODUCT_IMAGES_S3_ACCESS_KEY!,
  secretAccessKey: process.env.PRODUCT_IMAGES_S3_SECRET_KEY!,
  bucket: process.env.PRODUCT_IMAGES_S3_BUCKET!,
  region: process.env.PRODUCT_IMAGES_S3_REGION!,
})

const PUBLIC_URL = process.env.PRODUCT_IMAGES_PUBLIC_URL!

async function uploadProductImages() {
  console.log('Fetching products from DB...')
  const allProducts = await db.query.products.findMany()
  console.log(`Found ${allProducts.length} products`)

  const BATCH_SIZE = 10
  let totalUploaded = 0
  let totalFailed = 0

  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE)

    await Promise.all(
      batch.map(async (product) => {
        const images = (product.images ?? []) as string[]
        if (images.length === 0) return

        const newUrls: string[] = []

        for (const imageUrl of images) {
          // Skip if already uploaded to S3
          if (imageUrl.startsWith(PUBLIC_URL)) {
            newUrls.push(imageUrl)
            continue
          }

          try {
            const response = await fetch(imageUrl)
            if (!response.ok) {
              console.warn(
                `  Failed to fetch ${imageUrl} for product ${product.id}: ${response.status}`,
              )
              totalFailed++
              continue
            }

            const buffer = await response.arrayBuffer()
            const key = `products/${product.id}/${crypto.randomUUID()}.jpg`

            await s3.write(key, buffer, { type: 'image/jpeg' })

            const publicUrl = `${PUBLIC_URL}/${key}`
            newUrls.push(publicUrl)
            totalUploaded++
          } catch (err) {
            console.warn(
              `  Error uploading image for product ${product.id}:`,
              (err as Error).message,
            )
            totalFailed++
          }
        }

        // Update product with new image URLs
        if (newUrls.length > 0) {
          await db
            .update(products)
            .set({ images: newUrls })
            .where(eq(products.id, product.id))
        }
      }),
    )

    console.log(
      `Processed ${Math.min(i + BATCH_SIZE, allProducts.length)}/${allProducts.length} products (${totalUploaded} uploaded, ${totalFailed} failed)`,
    )
  }

  console.log(
    `\nDone! ${totalUploaded} images uploaded, ${totalFailed} failed.`,
  )
}

uploadProductImages()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
