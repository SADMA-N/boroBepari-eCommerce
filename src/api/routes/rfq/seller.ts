import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { requireSellerAuth, type SellerEnv } from '@/api/middleware/seller-auth'
import { db } from '@/db'
import {
  notifications,
  quotes,
  rfqs,
  sellers,
  user as userTable,
} from '@/db/schema'
import { sendQuoteEmail } from '@/lib/email'
import { sanitizeText } from '@/lib/sanitize'

import { formatBDT } from '@/lib/format'

const router = new Hono<SellerEnv>().basePath('/seller/rfq')

router.use('*', requireSellerAuth)

// GET / - Get seller's RFQs
router.get('/', async (c) => {
  try {
    const seller = c.get('seller')
    if (!seller) return c.json({ error: 'Unauthorized' }, 401)

    // Find supplier linked to this seller
    const sellerRecord = await db.query.sellers.findFirst({
      where: eq(sellers.id, seller.id),
    })

    if (!sellerRecord?.supplierId) {
      return c.json({ error: 'No supplier shop found for this seller' }, 400)
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

    return c.json(sellerRfqs)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to fetch seller RFQs' },
      500,
    )
  }
})

// POST /:rfqId/quote - Send a quote for an RFQ
router.post('/:rfqId/quote', async (c) => {
  try {
    const seller = c.get('seller')
    if (!seller) return c.json({ error: 'Unauthorized' }, 401)

    const rfqId = parseInt(c.req.param('rfqId'), 10)
    if (isNaN(rfqId)) return c.json({ error: 'Invalid RFQ ID' }, 400)

    const body = await c.req.json()
    const data = z
      .object({
        unitPrice: z.number().positive(),
        agreedQuantity: z.number().positive().optional(),
        depositPercentage: z.number().min(0).max(100).optional(),
        deliveryTime: z.string().optional(),
        validityPeriod: z.string(),
        notes: z.string().optional(),
      })
      .parse(body)

    // Find supplier linked to this seller
    const sellerRecord = await db.query.sellers.findFirst({
      where: eq(sellers.id, seller.id),
    })

    if (!sellerRecord?.supplierId) {
      return c.json({ error: 'No supplier shop found for this seller' }, 400)
    }

    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, rfqId),
      with: { product: true },
    })

    if (!rfq) return c.json({ error: 'RFQ not found' }, 404)
    if (rfq.supplierId !== sellerRecord.supplierId) {
      return c.json({ error: 'Unauthorized access to this RFQ' }, 403)
    }

    // Check for existing quote from this supplier
    const existingQuote = await db.query.quotes.findFirst({
      where: and(
        eq(quotes.rfqId, rfqId),
        eq(quotes.supplierId, rfq.supplierId),
      ),
    })

    const finalQuantity = data.agreedQuantity || rfq.quantity
    const totalPrice = (data.unitPrice * finalQuantity).toString()

    if (existingQuote) {
      // Update existing quote
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
          status: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, existingQuote.id))
    } else {
      // Insert new quote
      await db.insert(quotes).values({
        rfqId,
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

    // Update RFQ to quoted
    await db
      .update(rfqs)
      .set({ status: 'quoted' })
      .where(eq(rfqs.id, rfqId))

    // Notify buyer
    try {
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
          link: `${process.env.APP_URL || 'http://localhost:3000'}/buyer/rfqs/${rfq.id}`,
        })
      }
    } catch (notifyErr) {
      console.error('Error notifying buyer:', notifyErr)
    }

    return c.json({ success: true })
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to send quote' },
      500,
    )
  }
})

export default router
