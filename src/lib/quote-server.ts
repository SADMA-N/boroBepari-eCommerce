import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware } from './auth-server'
import { db } from '@/db'
import { notifications, quotes, rfqs, suppliers } from '@/db/schema'

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
