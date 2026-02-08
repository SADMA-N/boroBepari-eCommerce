import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware } from './auth-server'
import { uploadToS3 } from './s3'
import { db } from '@/db'
import { notifications, products, quotes, rfqs, suppliers, user as userTable } from '@/db/schema'
import { sendQuoteEmail, sendRfqEmail } from '@/lib/email'
import { formatBDT } from './product-server'
import { env } from '@/env'

export const submitRFQ = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => {
    return z
      .object({
        productId: z.number(),
        quantity: z.number().positive(),
        targetPrice: z.number().positive().optional(),
        deliveryLocation: z.string().min(5),
        notes: z.string().optional(),
        attachments: z.array(z.string()).default([]),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    // Find the product to get the supplierId
    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
    })

    if (!product) throw new Error('Product not found')
    if (!product.supplierId) throw new Error('Product has no supplier')

    const [newRfq] = await db
      .insert(rfqs)
      .values({
        buyerId: session.user.id,
        supplierId: product.supplierId,
        productId: data.productId,
        quantity: data.quantity,
        targetPrice: data.targetPrice?.toString(),
        deliveryLocation: data.deliveryLocation,
        notes: data.notes,
        attachments: data.attachments,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      })
      .returning()

    // Notify Supplier
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, product.supplierId),
      with: {
        owner: true,
      }
    })

    if (supplier?.ownerId && supplier.owner) {
      await db.insert(notifications).values({
        userId: supplier.ownerId,
        title: 'New RFQ Received',
        message: `You have received a new RFQ for ${product.name} (Qty: ${data.quantity})`,
        type: 'rfq_received',
        link: `/seller/rfqs`,
      })

      // Send Email
      await sendRfqEmail({
        email: supplier.owner.email,
        name: supplier.owner.name || 'Supplier',
        rfqId: newRfq.id,
        productName: product.name,
        quantity: data.quantity,
        link: `${env.APP_URL || 'http://localhost:3000'}/seller/rfqs`
      })
    }

    return { success: true, rfqId: newRfq.id }
  })

export const uploadRfqAttachment = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => {
    return z
      .object({
        filename: z.string(),
        mimeType: z.string(),
        data: z.string(), // Base64
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    const base64Data = data.data.includes(',') ? data.data.split(',')[1] : data.data
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.byteLength > 5 * 1024 * 1024) {
      throw new Error('File exceeds 5MB limit')
    }

    const ext = data.filename.split('.').pop()
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const s3Key = `rfqs/attachments/${session.user.id}/${uniqueName}`

    const uploadResult = await uploadToS3(buffer, s3Key, data.mimeType)

    // Return the public URL or relative path
    // For now, consistent with existing S3 usage, we'll return the key or a constructed URL
    return { 
      success: true, 
      url: `/uploads/${uploadResult.key}`, // Assuming local fallback or prefix
      key: uploadResult.key 
    }
  })

export const sendQuote = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => {
    return z
      .object({
        rfqId: z.number(),
        unitPrice: z.number().positive(),
        validityPeriod: z.string(), // ISO date
        notes: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, data.rfqId),
      with: {
        product: true,
      },
    })

    if (!rfq) throw new Error('RFQ not found')

    const totalPrice = (data.unitPrice * rfq.quantity).toString()

    await db.insert(quotes).values({
      rfqId: data.rfqId,
      supplierId: rfq.supplierId,
      unitPrice: data.unitPrice.toString(),
      totalPrice,
      validityPeriod: new Date(data.validityPeriod),
      terms: data.notes,
      status: 'pending',
    })

    await db
      .update(rfqs)
      .set({ status: 'quoted' })
      .where(eq(rfqs.id, data.rfqId))

    // Notify Buyer
    const buyer = await db.query.user.findFirst({
      where: eq(userTable.id, rfq.buyerId),
    })

    await db.insert(notifications).values({
      userId: rfq.buyerId,
      title: 'New Quote Received',
      message: `A supplier has sent a quote for your RFQ #${rfq.id} (${rfq.product.name})`,
      type: 'quote_received',
      link: `/buyer/rfqs/${rfq.id}`,
    })

    if (buyer) {
      await sendQuoteEmail({
        email: buyer.email,
        name: buyer.name || 'Buyer',
        rfqId: rfq.id,
        productName: rfq.product.name,
        unitPrice: formatBDT(data.unitPrice),
        link: `${env.APP_URL || 'http://localhost:3000'}/buyer/rfqs/${rfq.id}`
      })
    }

    return { success: true }
  })

export const getSellerRfqs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    // Find the supplier owned by this user
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.ownerId, session.user.id),
    })

    if (!supplier) throw new Error('No supplier shop found for this user')

    const sellerRfqs = await db.query.rfqs.findMany({
      where: eq(rfqs.supplierId, supplier.id),
      with: {
        product: true,
        buyer: {
          columns: {
            name: true,
            email: true,
          },
        },
        quotes: true,
      },
      orderBy: [desc(rfqs.createdAt)],
    })

    return sellerRfqs
  })

export const getBuyerRfqs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    const buyerRfqs = await db.query.rfqs.findMany({
      where: eq(rfqs.buyerId, session.user.id),
      with: {
        product: true,
        quotes: {
          columns: {
            id: true,
          },
        },
      },
      orderBy: [desc(rfqs.createdAt)],
    })

    return buyerRfqs.map((rfq) => ({
      ...rfq,
      quoteCount: rfq.quotes.length,
    }))
  })

export const getBuyerQuotes = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    // Fetch quotes for RFQs created by this user
    // quotes -> rfqs (where userId = session.user.id)

    const buyerQuotes = await db.query.quotes.findMany({
      with: {
        rfq: {
          with: {
            product: true,
          },
        },
        supplier: true,
      },
      where: (_quotes, { exists }) =>
        exists(
          db
            .select()
            .from(rfqs)
            .where(
              and(eq(rfqs.id, quotes.rfqId), eq(rfqs.buyerId, session.user.id)),
            ),
        ),
      orderBy: [desc(quotes.createdAt)],
    })

    return buyerQuotes
  })

const statusSchema = z.object({
  quoteId: z.number(),
  status: z.enum(['accepted', 'rejected', 'countered']),
  counterPrice: z.string().optional(),
  counterNote: z.string().optional(),
})

export const getRfqById = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => z.union([z.number(), z.string()]).parse(data))
  .handler(async ({ data: id, context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    const rfq = await db.query.rfqs.findFirst({
      where: typeof id === 'number' ? eq(rfqs.id, id) : undefined, // Add logic for string ID if needed
      with: {
        product: true,
        quotes: {
          with: {
            supplier: true,
          },
        },
      },
    })

    if (!rfq) throw new Error('RFQ not found')
    if (rfq.buyerId !== session.user.id) throw new Error('Unauthorized')

    return rfq
  })

export const updateQuoteStatus = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => statusSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    // Verify quote belongs to an RFQ owned by user
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, data.quoteId),
      with: {
        rfq: true,
      },
    })

    if (!quote) throw new Error('Quote not found')
    if (quote.rfq.buyerId !== session.user.id)
      throw new Error('Unauthorized access to quote')

    // Check if expired (for acceptance)
    if (
      data.status === 'accepted' &&
      new Date(quote.validityPeriod) < new Date()
    ) {
      throw new Error('Quote has expired')
    }

    // Update Quote
    await db
      .update(quotes)
      .set({
        status: data.status,
        counterPrice: data.counterPrice,
        counterNote: data.counterNote,
      })
      .where(eq(quotes.id, data.quoteId))

    // If accepted, maybe update RFQ?
    if (data.status === 'accepted') {
      await db
        .update(rfqs)
        .set({ status: 'accepted' })
        .where(eq(rfqs.id, quote.rfqId))
    }

    // Notify Supplier (find supplier owner)
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, quote.supplierId),
    })

    if (supplier?.ownerId) {
      await db.insert(notifications).values({
        userId: supplier.ownerId,
        title: `Quote ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
        message: `Your quote for RFQ #${quote.rfqId} has been ${data.status} by the buyer.`,
        type: `quote_${data.status}`,
        link: `/supplier/dashboard`,
      })
    }

    return { success: true }
  })
