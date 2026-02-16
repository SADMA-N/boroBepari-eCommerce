import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq } from 'drizzle-orm'
import { requireBuyerAuth, type BuyerEnv } from '@/api/middleware/buyer-auth'
import { db } from '@/db'
import {
  notifications,
  products,
  quotes,
  rfqs,
  suppliers,
  user as userTable,
} from '@/db/schema'
import { sendQuoteEmail } from '@/lib/email'

import { formatBDT } from '@/lib/format'

const router = new Hono<BuyerEnv>().basePath('/supplier/rfq')

router.use('*', requireBuyerAuth)

// GET / - Get RFQs for supplier owned by current user
router.get('/', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    // Find supplier owned by this user
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.ownerId, session.user.id),
    })

    if (!supplier) {
      return c.json({ error: 'No supplier found for this user' }, 400)
    }

    // Query RFQs via exists subquery on products where supplierId matches
    const supplierRfqs = await db.query.rfqs.findMany({
      where: (_rfqs, { exists }) =>
        exists(
          db
            .select()
            .from(products)
            .where(
              and(
                eq(products.id, rfqs.productId),
                eq(products.supplierId, supplier.id),
              ),
            ),
        ),
      with: {
        product: {
          with: {
            supplier: true,
          },
        },
        buyer: true,
      },
      orderBy: [desc(rfqs.createdAt)],
    })

    return c.json(supplierRfqs)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to fetch supplier RFQs' },
      500,
    )
  }
})

// POST /:rfqId/quote - Submit a quote for an RFQ
router.post('/:rfqId/quote', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) return c.json({ error: 'Unauthorized' }, 401)

    const rfqId = parseInt(c.req.param('rfqId'), 10)
    if (isNaN(rfqId)) return c.json({ error: 'Invalid RFQ ID' }, 400)

    const body = await c.req.json()
    const data = z
      .object({
        unitPrice: z.number().positive(),
        totalPrice: z.number().positive(),
        validityPeriod: z.string(),
        terms: z.string().optional(),
      })
      .parse(body)

    // Verify user owns supplier of the product
    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, rfqId),
      with: { product: true },
    })

    if (!rfq) return c.json({ error: 'RFQ not found' }, 404)

    const supplier = await db.query.suppliers.findFirst({
      where: and(
        eq(suppliers.id, rfq.product.supplierId!),
        eq(suppliers.ownerId, session.user.id),
      ),
    })

    if (!supplier) {
      return c.json({ error: 'Unauthorized - not the supplier owner' }, 403)
    }

    // Insert quote
    await db.insert(quotes).values({
      rfqId,
      supplierId: supplier.id,
      unitPrice: data.unitPrice.toString(),
      totalPrice: data.totalPrice.toString(),
      validityPeriod: new Date(data.validityPeriod),
      terms: data.terms || null,
      status: 'pending',
    })

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
      { error: error.message || 'Failed to submit quote' },
      500,
    )
  }
})

export default router
