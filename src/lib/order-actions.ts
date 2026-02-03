import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { orders, orderItems, products, addresses } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((orderId: number) => orderId)
  .handler(async ({ data: orderId }) => {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: true,
          },
        },
        user: {
            with: {
                addresses: true
            }
        }
      },
    })

    if (!order) {
        return null
    }

    return order
  })

const createOrderSchema = z.object({
  userId: z.string(),
  items: z.array(z.object({
    productId: z.number(),
    quantity: z.number(),
    price: z.number(),
  })),
  totalAmount: z.number(),
  paymentMethod: z.string(),
  depositAmount: z.number().default(0),
  balanceDue: z.number().default(0),
  notes: z.string().optional(),
})

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createOrderSchema.parse(data))
  .handler(async ({ data }) => {
    // 1. Create Order
    const [newOrder] = await db.insert(orders).values({
      userId: data.userId,
      totalAmount: data.totalAmount.toString(),
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: data.paymentMethod,
      depositAmount: data.depositAmount.toString(),
      balanceDue: data.balanceDue.toString(),
      notes: data.notes,
    }).returning()

    // 2. Create Order Items
    if (data.items.length > 0) {
      await db.insert(orderItems).values(
        data.items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price.toString(),
        }))
      )
    }

    return newOrder
  })

export const updateOrderPayment = createServerFn({ method: 'POST' })
  .inputValidator((data: { orderId: number; status: string; transactionId?: string }) => data)
  .handler(async ({ data }) => {
    const updateData: any = {
      // Default to what was passed, but override logic below
      paymentStatus: data.status, 
      transactionId: data.transactionId,
    }

    // Timeline updates & Logic
    const now = new Date()
    
    if (data.status === 'deposit_paid') {
      updateData.depositPaidAt = now
      updateData.paymentStatus = 'deposit_paid'
      updateData.status = 'processing' 
    } else if (data.status === 'full_paid') {
      updateData.fullPaymentPaidAt = now
      // Logic: Full payment -> Escrow Hold
      updateData.paymentStatus = 'escrow_hold'
      updateData.status = 'processing'
    } else if (data.status === 'escrow_hold') {
       updateData.paymentStatus = 'escrow_hold'
    }

    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, data.orderId))
      .returning()
      
    return updatedOrder
  })