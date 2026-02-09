import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { sellerAuthMiddleware } from './seller-auth-server'
import { adminAuthMiddleware } from './admin-auth-server'
import { BUCKET_NAME, getSignedUrl, uploadToS3 } from './s3'
import { db } from '@/db'
import * as schema from '@/db/schema'

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

/** Seller: Submit KYC documents */
export const submitSellerKyc = createServerFn({ method: 'POST' })
  .middleware([sellerAuthMiddleware])
  .inputValidator((input) => submitKycSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.seller) {
      throw new Error('Unauthorized')
    }

    const sellerId = context.seller.id
    const { description, categories, inventoryRange, documents } = data

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
            description,
            categories,
            inventoryRange,
          },
          updatedAt: submittedAt,
        })
        .where(eq(schema.sellers.id, sellerId))

      // Insert document metadata
      for (const doc of uploadedDocs) {
        await tx.insert(schema.sellerDocuments).values(doc)
      }
    })

    return {
      success: true,
      submittedAt: submittedAt.toISOString(),
    }
  })

/** Admin: Get KYC review queue */
export const getKycReviewQueue = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .handler(async ({ context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const queue = await db.query.sellers.findMany({
      where: eq(schema.sellers.kycStatus, 'submitted'),
      orderBy: [desc(schema.sellers.kycSubmittedAt)],
      with: {
        documents: true,
      },
    })

    return queue.map((seller) => {
      // Get unique document types
      const uniqueTypes = new Set(seller.documents.map((d) => d.documentType))

      return {
        id: seller.id,
        businessName: seller.businessName,
        fullName: seller.fullName,
        email: seller.email,
        submittedAt: seller.kycSubmittedAt?.toISOString(),
        documentCount: uniqueTypes.size,
      }
    })
  })

/** Admin: Get detailed KYC info for a seller including signed URLs */
export const getSellerKycDetails = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .inputValidator(z.object({ sellerId: z.string() }))
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, data.sellerId),
      with: {
        documents: true,
      },
    })

    if (!seller) {
      throw new Error('Seller not found')
    }

    // Deduplicate documents (keep latest of each type)
    const latestDocs = seller.documents.reduce(
      (acc, current) => {
        const existing = acc.find(
          (d) => d.documentType === current.documentType,
        )
        if (!existing || current.uploadedAt > existing.uploadedAt) {
          return [
            ...acc.filter((d) => d.documentType !== current.documentType),
            current,
          ]
        }
        return acc
      },
      [] as typeof seller.documents,
    )

    // Generate signed URLs for each document
    const documentsWithUrls = await Promise.all(
      latestDocs.map(async (doc) => {
        const url = await getSignedUrl(doc.s3Key)
        return {
          id: doc.id,
          type: doc.documentType,
          status: doc.status,
          uploadedAt: doc.uploadedAt.toISOString(),
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          url,
        }
      }),
    )

    return {
      seller: {
        id: seller.id,
        businessName: seller.businessName,
        businessType: seller.businessType,
        businessCategory: seller.businessCategory,
        email: seller.email,
        phone: seller.phone,
        fullName: seller.fullName,
        kycStatus: seller.kycStatus,
        additionalInfo: seller.kycAdditionalInfo,
      },
      documents: documentsWithUrls,
    }
  })

/** Admin: Review (Approve/Reject) Seller KYC */
export const reviewSellerKyc = createServerFn({ method: 'POST' })
  .middleware([adminAuthMiddleware])
  .inputValidator(
    z.object({
      sellerId: z.string(),
      status: z.enum(['approved', 'rejected']),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const { sellerId, status, reason } = data

    await db.transaction(async (tx) => {
      // Update seller status
      await tx
        .update(schema.sellers)
        .set({
          kycStatus: status,
          kycRejectionReason: status === 'rejected' ? reason : null,
          verificationBadge: status === 'approved' ? 'verified' : 'none',
          updatedAt: new Date(),
        })
        .where(eq(schema.sellers.id, sellerId))

      // Update all pending documents status
      await tx
        .update(schema.sellerDocuments)
        .set({
          status: status,
        })
        .where(
          and(
            eq(schema.sellerDocuments.sellerId, sellerId),
            eq(schema.sellerDocuments.status, 'pending'),
          ),
        )
    })

    return { success: true }
  })
