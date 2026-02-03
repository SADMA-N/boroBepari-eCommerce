import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import { orders, orderItems, products, addresses, user } from '@/db/schema'
import { eq, desc, asc, sql, or, ilike, and, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware } from './auth-server'
import { sendOrderStatusEmail } from '@/lib/notifications'

export const getOrder = createServerFn({ method: 'GET' })
  .inputValidator((orderId: number) => orderId)
  .handler(async ({ data: orderId }) => {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: {
          with: {
            product: {
              with: {
                supplier: true,
              },
            },
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

    const buyer = await db.query.user.findFirst({
      where: eq(user.id, data.userId),
    })

    if (buyer) {
      try {
        void sendOrderStatusEmail({
          email: buyer.email,
          name: buyer.name,
          orderId: newOrder.id,
          status: 'placed',
        })
      } catch (error) {
        console.error('Failed to trigger order placed email:', error)
      }
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

// Filter types for buyer orders
const buyerOrdersFilterSchema = z.object({
  filter: z.enum(['all', 'active', 'delivered', 'cancelled']).default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc', 'status']).default('date_desc'),
  page: z.number().default(1),
  limit: z.number().default(10),
})

export type BuyerOrdersFilter = z.infer<typeof buyerOrdersFilterSchema>

export const getBuyerOrders = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((data: unknown) => buyerOrdersFilterSchema.parse(data || {}))
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const userId = session.user.id
    const { filter, search, sortBy, page, limit } = data

    // Build status filter
    const activeStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'pending']
    const deliveredStatuses = ['delivered']
    const cancelledStatuses = ['cancelled', 'returned']

    let statusFilter: string[] | undefined
    if (filter === 'active') {
      statusFilter = activeStatuses
    } else if (filter === 'delivered') {
      statusFilter = deliveredStatuses
    } else if (filter === 'cancelled') {
      statusFilter = cancelledStatuses
    }

    // Build the where conditions
    const conditions = [eq(orders.userId, userId)]

    if (statusFilter) {
      conditions.push(inArray(orders.status, statusFilter))
    }

    // Get all orders for the user first (for searching by product name)
    const allUserOrders = await db.query.orders.findMany({
      where: and(...conditions),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: sortBy === 'date_asc'
        ? [asc(orders.createdAt)]
        : sortBy === 'amount_desc'
        ? [desc(orders.totalAmount)]
        : sortBy === 'amount_asc'
        ? [asc(orders.totalAmount)]
        : sortBy === 'status'
        ? [asc(orders.status), desc(orders.createdAt)]
        : [desc(orders.createdAt)],
    })

    // Apply search filter on results (including product names)
    let filteredOrders = allUserOrders
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim()
      filteredOrders = allUserOrders.filter(order => {
        // Search by order ID
        if (order.id.toString().includes(searchLower)) return true
        // Search by product names
        const hasMatchingProduct = order.items.some(item =>
          item.product?.name?.toLowerCase().includes(searchLower)
        )
        return hasMatchingProduct
      })
    }

    // Calculate counts for each filter
    const allOrders = await db.query.orders.findMany({
      where: eq(orders.userId, userId),
    })

    const counts = {
      all: allOrders.length,
      active: allOrders.filter(o => activeStatuses.includes(o.status)).length,
      delivered: allOrders.filter(o => deliveredStatuses.includes(o.status)).length,
      cancelled: allOrders.filter(o => cancelledStatuses.includes(o.status)).length,
    }

    // Paginate
    const totalCount = filteredOrders.length
    const totalPages = Math.ceil(totalCount / limit)
    const offset = (page - 1) * limit
    const paginatedOrders = filteredOrders.slice(offset, offset + limit)

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      counts,
    }
  })
