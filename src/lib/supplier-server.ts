import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './auth-server'
import { db } from '@/db'
import { rfqs, quotes, notifications, products, suppliers } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'

// Schema for quote response
const quoteSchema = z.object({
  rfqId: z.number(),
  unitPrice: z.string().min(1, 'Unit price is required'),
  totalPrice: z.string().min(1, 'Total price is required'),
  validityPeriod: z.string().min(1, 'Validity period is required'), // ISO date string
  terms: z.string().optional(),
})

export const getSupplierRfqs = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Find supplier owned by this user
    const supplier = await db.query.suppliers.findFirst({
      where: eq(suppliers.ownerId, session.user.id),
    })

    if (!supplier) {
      // For demo purposes, if no supplier is linked, return empty or maybe all RFQs if admin?
      // Let's return empty for now, user needs to be a supplier.
      return []
    }

    // Fetch RFQs for products belonging to this supplier
    // We need to join rfqs -> products -> suppliers

    // Using query builder if relationships are set up correctly
    const supplierRfqs = await db.query.rfqs.findMany({
      with: {
        product: {
          with: {
            supplier: true,
          },
        },
        buyer: true, // Buyer info
      },
      where: (rfqs, { exists }) =>
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
      orderBy: [desc(rfqs.createdAt)],
    })

    return supplierRfqs
  })

export const respondToRfq = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => quoteSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) throw new Error('Unauthorized')

    // Verify user owns the supplier of the product in the RFQ
    // 1. Get RFQ to check product
    const rfq = await db.query.rfqs.findFirst({
      where: eq(rfqs.id, data.rfqId),
      with: {
        product: true,
      },
    })

    if (!rfq || !rfq.product?.supplierId) throw new Error('RFQ not found')

    // 2. Check if user owns the supplier
    const supplier = await db.query.suppliers.findFirst({
      where: and(
        eq(suppliers.id, rfq.product.supplierId),
        eq(suppliers.ownerId, session.user.id),
      ),
    })

    if (!supplier) throw new Error('You are not the supplier for this product')

    // 3. Insert Quote
    await db.insert(quotes).values({
      rfqId: data.rfqId,
      supplierId: supplier.id,
      unitPrice: data.unitPrice,
      totalPrice: data.totalPrice,
      validityPeriod: new Date(data.validityPeriod),
      terms: data.terms,
      status: 'pending',
    })

    // 4. Update RFQ status
    await db
      .update(rfqs)
      .set({ status: 'quoted' })
      .where(eq(rfqs.id, data.rfqId))

    // 5. Notify Buyer
    await db.insert(notifications).values({
      userId: rfq.buyerId,
      title: 'New Quote Received',
      message: `You have received a quote from ${supplier.name} for ${rfq.product?.name ?? 'a product'}.`,
      type: 'quote_received',
      link: `/dashboard/rfqs/${rfq.id}`, // Placeholder link
    })

    return { success: true }
  })
