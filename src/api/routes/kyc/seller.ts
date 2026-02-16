import { Hono } from 'hono'
import { requireSellerAuth, type SellerEnv } from '@/api/middleware/seller-auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { uploadToS3 } from '@/lib/s3'
import { sanitizeText } from '@/lib/sanitize'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const

const documentSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.enum(ALLOWED_TYPES),
  data: z.string().min(1), // Base64 data
})

const submitKycSchema = z.object({
  description: z.string().min(1).max(500),
  categories: z.array(z.string()).min(1),
  inventoryRange: z.string().min(1),
  documents: z.object({
    trade_license: documentSchema,
    nid_front: documentSchema,
    nid_back: documentSchema,
    selfie: documentSchema.optional(),
    bank_proof: documentSchema.optional(),
  }),
})

function bufferFromBase64(data: string) {
  // Handle data URI if present
  const base64Data = data.includes(',') ? data.split(',')[1] : data
  return Buffer.from(base64Data, 'base64')
}

function getExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  return 'pdf'
}

async function processAndUploadDocument(
  sellerId: string,
  type: schema.SellerDocument['documentType'],
  doc: z.infer<typeof documentSchema>,
) {
  const buffer = bufferFromBase64(doc.data)
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(`${type} exceeds file size limit`)
  }

  const ext = getExtension(doc.mimeType)
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
  const s3Key = `kyc/seller/${sellerId}/${type}/${uniqueName}`

  const uploadResult = await uploadToS3(buffer, s3Key, doc.mimeType)

  return {
    sellerId,
    documentType: type,
    s3Bucket: uploadResult.bucket,
    s3Key: uploadResult.key,
    mimeType: doc.mimeType,
    fileSize: buffer.byteLength,
    status: 'pending' as const,
    uploadedAt: new Date(),
  }
}

const router = new Hono<SellerEnv>().basePath('/seller/kyc')

router.use('*', requireSellerAuth)

router.post('/', async (c) => {
  const seller = c.get('seller')
  if (!seller) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json()
  const parsed = submitKycSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const sellerId = seller.id
  const { description, categories, inventoryRange, documents } = parsed.data
  const safeDescription = sanitizeText(description)
  const safeCategories = categories.map((cat) => sanitizeText(cat))
  const safeInventoryRange = sanitizeText(inventoryRange)

  // Process all documents
  const docEntries = Object.entries(documents) as Array<
    [
      schema.SellerDocument['documentType'],
      z.infer<typeof documentSchema> | undefined,
    ]
  >

  const uploadPromises = docEntries
    .filter(([_, doc]) => !!doc)
    .map(([type, doc]) => processAndUploadDocument(sellerId, type, doc!))

  const uploadedDocs = await Promise.all(uploadPromises)

  const submittedAt = new Date()

  // Transaction to update seller and insert document metadata
  await db.transaction(async (tx) => {
    // Update seller status
    await tx
      .update(schema.sellers)
      .set({
        kycStatus: 'submitted',
        kycSubmittedAt: submittedAt,
        kycRejectionReason: null,
        kycAdditionalInfo: {
          description: safeDescription,
          categories: safeCategories,
          inventoryRange: safeInventoryRange,
        },
        updatedAt: submittedAt,
      })
      .where(eq(schema.sellers.id, sellerId))

    // Insert document metadata
    for (const doc of uploadedDocs) {
      await tx.insert(schema.sellerDocuments).values(doc)
    }
  })

  return c.json({
    success: true,
    submittedAt: submittedAt.toISOString(),
  })
})

export default router
