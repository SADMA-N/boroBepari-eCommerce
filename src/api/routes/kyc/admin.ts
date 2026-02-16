import { Hono } from 'hono'
import { requireAdminAuth, type AdminEnv } from '@/api/middleware/admin-auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getSignedUrl } from '@/lib/s3'

const router = new Hono<AdminEnv>().basePath('/admin/kyc')

router.use('*', requireAdminAuth)

// GET /queue - Get KYC review queue
router.get('/queue', async (c) => {
  const admin = c.get('admin')
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const queue = await db.query.sellers.findMany({
    where: eq(schema.sellers.kycStatus, 'submitted'),
    orderBy: [desc(schema.sellers.kycSubmittedAt)],
    with: {
      documents: true,
    },
  })

  return c.json(
    queue.map((seller) => {
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
    }),
  )
})

// GET /:sellerId - Get detailed KYC info for a seller
router.get('/:sellerId', async (c) => {
  const admin = c.get('admin')
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sellerId = c.req.param('sellerId')

  const seller = await db.query.sellers.findFirst({
    where: eq(schema.sellers.id, sellerId),
    with: {
      documents: true,
    },
  })

  if (!seller) {
    return c.json({ error: 'Seller not found' }, 404)
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

  return c.json({
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
  })
})

// POST /:sellerId/review - Review (Approve/Reject) Seller KYC
router.post('/:sellerId/review', async (c) => {
  const admin = c.get('admin')
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const sellerId = c.req.param('sellerId')
  const body = await c.req.json()

  const reviewSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    reason: z.string().optional(),
  })

  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Invalid input', details: parsed.error.flatten() }, 400)
  }

  const { status, reason } = parsed.data

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

  return c.json({ success: true })
})

export default router
