import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware } from './auth-server'
import { sellerAuthMiddleware } from './seller-auth-server'
import { uploadToS3 } from './s3'
import { db } from '@/db'
import {
  notifications,
  orderItems,
  orders,
  products,
  quotes,
  rfqs,
  sellers,
  suppliers,
  user as userTable,
} from '@/db/schema'
import { sendQuoteEmail, sendRfqEmail } from '@/lib/email'
import { formatBDT } from './product-server'
import { env } from '@/env'
import { sanitizeText } from '@/lib/sanitize'

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
    if (!product.supplierId) {
      console.error('Product found but has no supplierId:', product.id)
      throw new Error('Product has no associated supplier')
    }

    console.log('Submitting RFQ for product:', product.id, 'Supplier:', product.supplierId)

    const [newRfq] = await db
      .insert(rfqs)
      .values({
        buyerId: session.user.id,
        supplierId: product.supplierId,
        productId: data.productId,
        quantity: data.quantity,
        targetPrice: data.targetPrice?.toString(),
        deliveryLocation: data.deliveryLocation,
        notes: data.notes ? sanitizeText(data.notes) : null,
        attachments: data.attachments,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days expiry
      })
      .returning()

    console.log('RFQ created successfully:', newRfq.id)

    // Notify Supplier
    try {
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, product.supplierId),
        with: {
          owner: true,
        }
      })

      if (supplier?.ownerId) {
        // Only try to insert notification if ownerId exists and might be a valid user.id
        // We catch errors here to prevent RFQ submission failure due to notification issues
        try {
          await db.insert(notifications).values({
            userId: supplier.ownerId,
            title: 'New RFQ Received',
            message: `You have received a new RFQ for ${product.name} (Qty: ${data.quantity})`,
            type: 'rfq_received',
            link: `/seller/rfqs`,
          })
        } catch (notifyErr) {
          console.error('Failed to insert in-app notification:', notifyErr)
        }

        if (supplier.owner?.email) {
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
      } else {
        console.warn('No ownerId found for supplier:', product.supplierId, '- In-app notification skipped.')
      }
    } catch (supplierErr) {
      console.error('Error during supplier notification process:', supplierErr)
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
  .middleware([sellerAuthMiddleware])
  .inputValidator((data: any) => {
    return z
      .object({
        rfqId: z.number(),
        unitPrice: z.number().positive(),
        agreedQuantity: z.number().positive().optional(),
        depositPercentage: z.number().min(0).max(100).optional(),
        deliveryTime: z.string().optional(),
        validityPeriod: z.string(), // ISO date
        notes: z.string().optional(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const { seller } = context
    if (!seller) throw new Error('Unauthorized')

    // Find supplier linked to this seller
    const sellerRecord = await db.query.sellers.findFirst({
      where: eq(sellers.id, seller.id),
    })

    if (!sellerRecord?.supplierId) {
      throw new Error('No supplier shop found for this seller')
    }

    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, data.rfqId),
      with: {
        product: true,
      },
    })

    if (!rfq) throw new Error('RFQ not found')

    if (rfq.supplierId !== sellerRecord.supplierId) {
      throw new Error('Unauthorized access to this RFQ')
    }

    // Check for existing quote from this supplier for this RFQ
    const existingQuote = await db.query.quotes.findFirst({
      where: and(
        eq(quotes.rfqId, data.rfqId),
        eq(quotes.supplierId, rfq.supplierId),
      ),
    })

    const finalQuantity = data.agreedQuantity || rfq.quantity
    const totalPrice = (data.unitPrice * finalQuantity).toString()

    if (existingQuote) {
      // Update existing quote (for back-and-forth negotiation)
      await db
        .update(quotes)
        .set({
          unitPrice: data.unitPrice.toString(),
          totalPrice,
          agreedQuantity: finalQuantity,
          depositPercentage: data.depositPercentage || 0,
          deliveryTime: data.deliveryTime,
          validityPeriod: new Date(data.validityPeriod),
          terms: data.notes ? sanitizeText(data.notes) : null,
          status: 'pending', // Reset to pending for buyer review
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, existingQuote.id))
    } else {
      // Insert new quote
      await db.insert(quotes).values({
        rfqId: data.rfqId,
        supplierId: rfq.supplierId,
        unitPrice: data.unitPrice.toString(),
        totalPrice,
        agreedQuantity: finalQuantity,
        depositPercentage: data.depositPercentage || 0,
        deliveryTime: data.deliveryTime,
        validityPeriod: new Date(data.validityPeriod),
        terms: data.notes ? sanitizeText(data.notes) : null,
        status: 'pending',
      })
    }

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
        link: `${env.APP_URL || 'http://localhost:3000'}/buyer/rfqs/${rfq.id}`,
      })
    }

    return { success: true }
  })

export const getSellerRfqs = createServerFn({ method: 'GET' })
  .middleware([sellerAuthMiddleware])
  .handler(async ({ context }) => {
    const { seller } = context
    if (!seller) throw new Error('Unauthorized')

    // Find supplier linked to this seller
    const sellerRecord = await db.query.sellers.findFirst({
      where: eq(sellers.id, seller.id),
    })

    if (!sellerRecord?.supplierId) {
      throw new Error('No supplier shop found for this seller')
    }

    const sellerRfqs = await db.query.rfqs.findMany({
      where: eq(rfqs.supplierId, sellerRecord.supplierId),
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

    let orderMatch = await db.query.orderItems.findFirst({
      where: eq(orderItems.rfqId, rfq.id),
      with: {
        order: true,
      },
      orderBy: (items, { desc }) => [desc(items.id)],
    })

    if (!orderMatch) {
      const acceptedQuote = rfq.quotes?.find((quote) => quote.status === 'accepted')
      if (acceptedQuote) {
        const expectedQuantity = acceptedQuote.agreedQuantity ?? rfq.quantity
        const expectedTotal = (
          Number(acceptedQuote.unitPrice) * expectedQuantity
        ).toString()

        orderMatch = await db.query.orderItems.findFirst({
          where: and(
            eq(orderItems.productId, rfq.productId),
            eq(orderItems.quantity, expectedQuantity),
            eq(orderItems.price, expectedTotal),
          ),
          with: {
            order: true,
          },
          orderBy: (items, { desc }) => [desc(items.id)],
        })
      }
    }

    const order =
      orderMatch?.order && orderMatch.order.userId === session.user.id
        ? {
            id: orderMatch.order.id,
            status: orderMatch.order.status,
            paymentStatus: orderMatch.order.paymentStatus,
            createdAt: orderMatch.order.createdAt,
          }
        : null

    return {
      ...rfq,
      order,
    }
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
        counterNote: data.counterNote ? sanitizeText(data.counterNote) : null,
      })
      .where(eq(quotes.id, data.quoteId))

    // If accepted, maybe update RFQ?
    if (data.status === 'accepted') {
      await db
        .update(rfqs)
        .set({ status: 'accepted' })
        .where(eq(rfqs.id, quote.rfqId))
    } else if (data.status === 'rejected') {
      await db
        .update(rfqs)
        .set({ status: 'rejected' })
        .where(eq(rfqs.id, quote.rfqId))
    }

    // Notify Supplier (find supplier owner)
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.id, quote.supplierId),
      with: {
        owner: true,
      },
    })

    if (supplier?.ownerId && supplier.owner) {
      const statusLabel =
        data.status === 'accepted'
          ? 'Accepted'
          : data.status === 'rejected'
            ? 'Declined'
            : 'Countered'

      let message = `Your quote for RFQ #${quote.rfqId} has been ${data.status} by the buyer.`
      if (data.status === 'rejected') {
        message = `The buyer has declined your quote for RFQ #${quote.rfqId}. They won't agree to the terms and do not wish to proceed with this request from you.`
      } else if (data.status === 'countered') {
        message = `The buyer has sent a counter offer of ৳${Number(data.counterPrice).toLocaleString()} for RFQ #${quote.rfqId}.`
      }

      await db.insert(notifications).values({
        userId: supplier.ownerId,
        title: `Quote ${statusLabel}`,
        message: message,
        type: `quote_${data.status}`,
        link: `/seller/rfqs`,
      })

      // Send Email for important updates
      if (data.status === 'rejected' || data.status === 'countered') {
        await sendQuoteEmail({
          email: supplier.owner.email,
          name: supplier.owner.name || 'Supplier',
          rfqId: quote.rfqId,
          productName: quote.rfq.productId.toString(), // Simplified or lookup
          unitPrice: data.status === 'countered' ? `Counter: ৳${data.counterPrice}` : 'Declined',
          link: `${env.APP_URL || 'http://localhost:3000'}/seller/rfqs`
        })
      }
    }

    return { success: true }
  })
