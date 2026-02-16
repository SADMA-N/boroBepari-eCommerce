import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { requireBuyerAuth, type BuyerEnv } from '@/api/middleware/buyer-auth'
import { db } from '@/db'
import {
  notifications,
  orderItems,
  products,
  quotes,
  rfqs,
  suppliers,
} from '@/db/schema'
import { uploadToS3 } from '@/lib/s3'
import { sendRfqEmail, sendQuoteEmail } from '@/lib/email'
import { sanitizeText } from '@/lib/sanitize'

const router = new Hono<BuyerEnv>().basePath('/rfq')

router.use('*', requireBuyerAuth)

// POST / - Submit RFQ
router.post('/', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()
    const data = z
      .object({
        productId: z.number(),
        quantity: z.number().positive(),
        targetPrice: z.number().positive().optional(),
        deliveryLocation: z.string().min(5),
        notes: z.string().optional(),
        attachments: z.array(z.string()).default([]),
      })
      .parse(body)

    const product = await db.query.products.findFirst({
      where: eq(products.id, data.productId),
    })

    if (!product) return c.json({ error: 'Product not found' }, 404)
    if (!product.supplierId) {
      return c.json({ error: 'Product has no associated supplier' }, 400)
    }

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
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .returning()

    // Notify supplier (in-app + email)
    try {
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, product.supplierId),
        with: { owner: true },
      })

      if (supplier?.ownerId) {
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
          await sendRfqEmail({
            email: supplier.owner.email,
            name: supplier.owner.name || 'Supplier',
            rfqId: newRfq.id,
            productName: product.name,
            quantity: data.quantity,
            link: `${process.env.APP_URL || 'http://localhost:3000'}/seller/rfqs`,
          })
        }
      }
    } catch (supplierErr) {
      console.error('Error during supplier notification process:', supplierErr)
    }

    return c.json({ success: true, rfqId: newRfq.id })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to submit RFQ' }, 500)
  }
})

// POST /upload-attachment
router.post('/upload-attachment', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    const body = await c.req.json()
    const data = z
      .object({
        filename: z.string(),
        mimeType: z.string(),
        data: z.string(),
      })
      .parse(body)

    const base64Data = data.data.includes(',')
      ? data.data.split(',')[1]
      : data.data
    const buffer = Buffer.from(base64Data, 'base64')

    if (buffer.byteLength > 5 * 1024 * 1024) {
      return c.json({ error: 'File exceeds 5MB limit' }, 400)
    }

    const ext = data.filename.split('.').pop()
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`
    const s3Key = `rfqs/attachments/${session.user.id}/${uniqueName}`

    const uploadResult = await uploadToS3(buffer, s3Key, data.mimeType)

    return c.json({
      success: true,
      url: `/uploads/${uploadResult.key}`,
      key: uploadResult.key,
    })
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to upload attachment' },
      500,
    )
  }
})

// GET /buyer - Get buyer's RFQs
router.get('/buyer', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

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

    return c.json(
      buyerRfqs.map((rfq) => ({
        ...rfq,
        quoteCount: rfq.quotes.length,
      })),
    )
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to fetch buyer RFQs' },
      500,
    )
  }
})

// GET /:rfqId - Get RFQ by id
router.get('/:rfqId', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    const rfqId = parseInt(c.req.param('rfqId'), 10)
    if (isNaN(rfqId)) return c.json({ error: 'Invalid RFQ ID' }, 400)

    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, rfqId),
      with: {
        product: true,
        quotes: {
          with: {
            supplier: true,
          },
        },
      },
    })

    if (!rfq) return c.json({ error: 'RFQ not found' }, 404)
    if (rfq.buyerId !== session.user.id) {
      return c.json({ error: 'Unauthorized' }, 403)
    }

    // Find associated order via orderItems.rfqId
    let orderMatch = await db.query.orderItems.findFirst({
      where: eq(orderItems.rfqId, rfq.id),
      with: { order: true },
      orderBy: (items, { desc: d }) => [d(items.id)],
    })

    // Fallback: find via matching product+quantity+price
    if (!orderMatch) {
      const acceptedQuote = rfq.quotes.find((q) => q.status === 'accepted')
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
          with: { order: true },
          orderBy: (items, { desc: d }) => [d(items.id)],
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

    return c.json({ ...rfq, order })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch RFQ' }, 500)
  }
})

// GET /buyer/quotes - Get quotes for buyer's RFQs
router.get('/buyer/quotes', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

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
              and(
                eq(rfqs.id, quotes.rfqId),
                eq(rfqs.buyerId, session.user.id),
              ),
            ),
        ),
      orderBy: [desc(quotes.createdAt)],
    })

    return c.json(buyerQuotes)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to fetch buyer quotes' },
      500,
    )
  }
})

// PATCH /quotes/:quoteId/status - Update quote status
router.patch('/quotes/:quoteId/status', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    const quoteId = parseInt(c.req.param('quoteId'), 10)
    if (isNaN(quoteId)) return c.json({ error: 'Invalid quote ID' }, 400)

    const body = await c.req.json()
    const data = z
      .object({
        status: z.enum(['accepted', 'rejected', 'countered']),
        counterPrice: z.string().optional(),
        counterNote: z.string().optional(),
      })
      .parse(body)

    // Verify quote belongs to buyer's RFQ
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
      with: { rfq: true },
    })

    if (!quote) return c.json({ error: 'Quote not found' }, 404)
    if (quote.rfq.buyerId !== session.user.id) {
      return c.json({ error: 'Unauthorized access to quote' }, 403)
    }

    // Check expiry for acceptance
    if (
      data.status === 'accepted' &&
      new Date(quote.validityPeriod) < new Date()
    ) {
      return c.json({ error: 'Quote has expired' }, 400)
    }

    // Update quote
    await db
      .update(quotes)
      .set({
        status: data.status,
        counterPrice: data.counterPrice,
        counterNote: data.counterNote
          ? sanitizeText(data.counterNote)
          : null,
      })
      .where(eq(quotes.id, quoteId))

    // Update RFQ status
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

    // Notify supplier
    try {
      const supplier = await db.query.suppliers.findFirst({
        where: eq(suppliers.id, quote.supplierId),
        with: { owner: true },
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
          message,
          type: `quote_${data.status}`,
          link: `/seller/rfqs`,
        })

        if (data.status === 'rejected' || data.status === 'countered') {
          await sendQuoteEmail({
            email: supplier.owner.email,
            name: supplier.owner.name || 'Supplier',
            rfqId: quote.rfqId,
            productName: quote.rfq.productId.toString(),
            unitPrice:
              data.status === 'countered'
                ? `Counter: ৳${data.counterPrice}`
                : 'Declined',
            link: `${process.env.APP_URL || 'http://localhost:3000'}/seller/rfqs`,
          })
        }
      }
    } catch (notifyErr) {
      console.error('Error notifying supplier:', notifyErr)
    }

    return c.json({ success: true })
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to update quote status' },
      500,
    )
  }
})

export default router
