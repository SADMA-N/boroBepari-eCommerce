import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from './auth-server'
import { db } from '@/db'
import { rfqs } from '@/db/schema'
import { z } from 'zod'

const rfqSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  targetPrice: z.string().optional(), // Decimal as string to avoid float precision issues
  deliveryLocation: z.string().min(3, 'Delivery location is required'),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(), // Array of file URLs/paths
})

export const submitRfq = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => rfqSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) {
      throw new Error('You must be logged in to submit an RFQ')
    }

    const [newRfq] = await db
      .insert(rfqs)
      .values({
        userId: session.user.id,
        productId: data.productId,
        quantity: data.quantity,
        targetPrice: data.targetPrice, // Drizzle handles string -> decimal
        deliveryLocation: data.deliveryLocation,
        notes: data.notes,
        attachments: data.attachments,
        status: 'pending',
      })
      .returning()

    return {
      success: true,
      rfqId: newRfq.id,
      message: 'RFQ submitted successfully',
      expectedResponse: '24-48 hours',
    }
  })
