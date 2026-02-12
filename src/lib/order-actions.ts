import { createServerFn } from '@tanstack/react-start'
import { and, asc, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import { z } from 'zod'
import { authMiddleware } from './auth-server'
import { addresses, orderItems, orders, products, rfqs, user } from '@/db/schema'
import { db } from '@/db'
import { sendOrderStatusEmail } from '@/lib/notifications'
import { sanitizeText } from '@/lib/sanitize'

export const getOrder = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((orderId: number) => orderId)
  .handler(async ({ data: orderId, context }) => {
    const { session } = context
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

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
            addresses: true,
          },
        },
      },
    })

    if (!order) {
      return null
    }

    if (order.userId !== session.user.id) {
      throw new Error('Forbidden')
    }

    return order
  })

const createOrderSchema = z.object({
  userId: z.string(),
  items: z.array(
    z.object({
      productId: z.number(),
      quantity: z.number(),
      price: z.number(),
      rfqId: z.number().optional(),
      quoteId: z.number().optional(),
    }),
  ),
  totalAmount: z.number(),
  paymentMethod: z.string(),
  paymentChannel: z.string().optional(),
  paymentProvider: z.string().optional(),
  paymentReference: z.string().optional(),
  paymentSenderAccount: z.string().optional(),
  paymentDeclaration: z.boolean().optional(),
  transactionId: z.string().optional(),
  depositAmount: z.number().default(0),
  balanceDue: z.number().default(0),
  notes: z.string().optional(),
})

export const createOrder = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => createOrderSchema.parse(data))
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    const normalizedItems = data.items.map((item) => ({
      ...item,
      lineTotal: item.price * item.quantity,
    }))

    const calculatedTotal = normalizedItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    )
    const totalAmount = Math.round(calculatedTotal * 100) / 100
    const depositAmount = Math.max(0, data.depositAmount)
    const balanceDue = Math.max(0, totalAmount - depositAmount)

    if (Math.abs(totalAmount - data.totalAmount) > 0.01) {
      console.warn('[createOrder] total mismatch, using calculated total', {
        provided: data.totalAmount,
        calculated: totalAmount,
      })
    }

    // 1. Create Order
    const insertValues = {
      userId: session.user.id,
      totalAmount: totalAmount.toString(),
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: data.paymentMethod,
      paymentChannel: data.paymentChannel,
      paymentProvider: data.paymentProvider,
      paymentReference: data.paymentReference,
      paymentSenderAccount: data.paymentSenderAccount,
      paymentDeclaration: data.paymentDeclaration ?? false,
      transactionId: data.transactionId,
      depositAmount: depositAmount.toString(),
      balanceDue: balanceDue.toString(),
        notes: data.notes ? sanitizeText(data.notes) : null,
    }

    let newOrder
    try {
      ;[newOrder] = await db.insert(orders).values(insertValues).returning()
    } catch (err: any) {
      const msg =
        err?.cause?.message || err?.message || 'Unknown database error'
      // Fallback for older DBs missing new payment columns
      if (
        msg.includes('payment_channel') ||
        msg.includes('payment_provider') ||
        msg.includes('payment_reference') ||
        msg.includes('payment_sender_account') ||
        msg.includes('payment_declaration')
      ) {
        const fallbackValues = {
          userId: insertValues.userId,
          totalAmount: insertValues.totalAmount,
          status: insertValues.status,
          paymentStatus: insertValues.paymentStatus,
          paymentMethod: insertValues.paymentMethod,
          transactionId: insertValues.transactionId,
          depositAmount: insertValues.depositAmount,
          balanceDue: insertValues.balanceDue,
          notes: insertValues.notes,
        }
        ;[newOrder] = await db.insert(orders).values(fallbackValues).returning()
      } else {
        throw new Error(`Order insert failed: ${msg}`)
      }
    }

    // 2. Create Order Items
    if (normalizedItems.length > 0) {
      await db.insert(orderItems).values(
        normalizedItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          rfqId: item.rfqId,
          quoteId: item.quoteId,
          quantity: item.quantity,
          price: item.lineTotal.toString(),
        })),
      )
    }

    const rfqIds = Array.from(
      new Set(
        normalizedItems
          .map((item) => item.rfqId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    )

    if (rfqIds.length > 0) {
      await db
        .update(rfqs)
        .set({ status: 'converted', updatedAt: new Date() })
        .where(inArray(rfqs.id, rfqIds))
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
  .inputValidator(
    (data: { orderId: number; status: string; transactionId?: string }) => data,
  )
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

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, data.orderId))
      .returning()

    return updatedOrder
  })

// Filter types for buyer orders
const buyerOrdersFilterSchema = z.object({
  filter: z.enum(['all', 'active', 'delivered', 'cancelled']).default('all'),
  search: z.string().optional(),
  sortBy: z
    .enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc', 'status'])
    .default('date_desc'),
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
    const activeStatuses = [
      'placed',
      'confirmed',
      'processing',
      'shipped',
      'out_for_delivery',
      'pending',
    ]
    const deliveredStatuses = ['delivered']
    const cancelledStatuses = ['cancelled', 'returned']

    let statusFilter: Array<string> | undefined
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
      orderBy:
        sortBy === 'date_asc'
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
      filteredOrders = allUserOrders.filter((order) => {
        // Search by order ID
        if (order.id.toString().includes(searchLower)) return true
        // Search by product names
        const hasMatchingProduct = order.items.some((item) =>
          item.product.name.toLowerCase().includes(searchLower),
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
      active: allOrders.filter((o) => activeStatuses.includes(o.status)).length,
      delivered: allOrders.filter((o) => deliveredStatuses.includes(o.status))
        .length,
      cancelled: allOrders.filter((o) => cancelledStatuses.includes(o.status))
        .length,
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
