import fs from 'node:fs/promises'
import path from 'node:path'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { verifySellerToken } from './seller-auth-server'
import { db } from '@/db'
import * as schema from '@/db/schema'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const

const documentSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.enum(ALLOWED_TYPES),
  data: z.string().min(1),
})

const submitSchema = z.object({
  token: z.string().min(1),
  description: z.string().min(1).max(500),
  categories: z.array(z.string()).min(1),
  inventoryRange: z.string().min(1),
  documents: z.object({
    tradeLicense: documentSchema,
    nidFront: documentSchema,
    nidBack: documentSchema,
    bankProof: documentSchema.optional(),
  }),
})

function bufferFromBase64(data: string) {
  return Buffer.from(data, 'base64')
}

function getExtension(mimeType: string) {
  if (mimeType === 'image/jpeg') return 'jpg'
  if (mimeType === 'image/png') return 'png'
  return 'pdf'
}

async function saveDocument(
  sellerId: string,
  key: string,
  doc: z.infer<typeof documentSchema>,
) {
  const buffer = bufferFromBase64(doc.data)
  if (buffer.byteLength > MAX_FILE_SIZE) {
    throw new Error('File exceeds 5MB limit')
  }

  const ext = getExtension(doc.mimeType)
  const safeName = `${key}-${Date.now()}.${ext}`
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kyc', sellerId)
  await fs.mkdir(uploadDir, { recursive: true })
  const filePath = path.join(uploadDir, safeName)
  await fs.writeFile(filePath, buffer)

  return `/uploads/kyc/${sellerId}/${safeName}`
}

/** Server handler to accept seller KYC payloads and persist documents. */
export const submitSellerKyc = createServerFn({ method: 'POST' })
  .inputValidator((input) => submitSchema.parse(input))
  .handler(async ({ data }) => {
    const { token, description, categories, inventoryRange, documents } = data
    const decoded = verifySellerToken(token)
    if (!decoded) {
      throw new Error('Unauthorized')
    }

    const sellerId = decoded.sellerId

    const savedDocuments: Record<string, string | null> = {
      tradeLicense: await saveDocument(sellerId, 'trade-license', documents.tradeLicense),
      nidFront: await saveDocument(sellerId, 'nid-front', documents.nidFront),
      nidBack: await saveDocument(sellerId, 'nid-back', documents.nidBack),
      bankProof: documents.bankProof
        ? await saveDocument(sellerId, 'bank-proof', documents.bankProof)
        : null,
    }

    const submittedAt = new Date()

    await db
      .update(schema.sellers)
      .set({
        kycStatus: 'submitted',
        kycSubmittedAt: submittedAt,
        kycRejectionReason: null,
        kycDocuments: savedDocuments,
        kycAdditionalInfo: {
          description,
          categories,
          inventoryRange,
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.sellers.id, sellerId))

    return {
      success: true,
      submittedAt: submittedAt.toISOString(),
    }
  })
