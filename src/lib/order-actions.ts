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
