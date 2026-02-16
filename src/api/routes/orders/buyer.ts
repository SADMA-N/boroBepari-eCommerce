import { Hono } from 'hono'
import { z } from 'zod'
import { and, asc, desc, eq, gte, inArray, isNull, ne, sql } from 'drizzle-orm'
import { requireBuyerAuth, type BuyerEnv } from '@/api/middleware/buyer-auth'
import { db } from '@/db'
import { orderItems, orders, products, rfqs, user } from '@/db/schema'
import { sendOrderStatusEmail } from '@/lib/notifications'
import { sendInvoiceEmail } from '@/lib/email'
import { sanitizeText } from '@/lib/sanitize'

const router = new Hono<BuyerEnv>().basePath('/orders')

// Apply buyer auth to all routes
router.use('*', requireBuyerAuth)

// --- Helpers ---

function buildRefundSummary(order: any) {
  const total = Number(order.totalAmount)
  const deposit = Number(order.depositAmount)
  const paymentStatus = order.paymentStatus
  if (paymentStatus === 'escrow_hold') return 'A full refund will be issued from escrow.'
  if (deposit > 0 && total > deposit) return `Deposit refund of ৳${deposit.toLocaleString('en-BD')} will be issued.`
  if (paymentStatus === 'full_paid' || paymentStatus === 'released') return `Full refund of ৳${total.toLocaleString('en-BD')} will be issued.`
  return 'No payment was captured. No refund is required.'
}

async function restockOrderInventory(tx: any, orderId: number) {
  const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity }).from(orderItems).where(eq(orderItems.orderId, orderId))
  if (items.length === 0) return
  const qtyMap = new Map<number, number>()
  items.forEach((item: any) => { qtyMap.set(item.productId, (qtyMap.get(item.productId) ?? 0) + item.quantity) })
  for (const [productId, quantity] of qtyMap.entries()) {
    await tx.update(products).set({ stock: sql`coalesce(${products.stock}, 0) + ${quantity}`, updatedAt: new Date() }).where(eq(products.id, productId))
  }
}

// --- Schemas ---

const buyerOrdersFilterSchema = z.object({
  filter: z.enum(['all', 'active', 'delivered', 'cancelled']).default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['date_desc', 'date_asc', 'amount_desc', 'amount_asc', 'status']).default('date_desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
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

// --- 1. GET / - List buyer orders ---
router.get('/', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const query = c.req.query()
    const data = buyerOrdersFilterSchema.parse(query)
    const userId = session.user.id
    const { filter, search, sortBy, page, limit } = data

    // Build status filter
    const activeStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'pending']
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

    // Build where conditions
    const conditions = [eq(orders.userId, userId)]
    if (statusFilter) {
      conditions.push(inArray(orders.status, statusFilter))
    }

    // Get all orders for the user (for searching by product name)
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
      delivered: allOrders.filter((o) => deliveredStatuses.includes(o.status)).length,
      cancelled: allOrders.filter((o) => cancelledStatuses.includes(o.status)).length,
    }

    // Paginate
    const totalCount = filteredOrders.length
    const totalPages = Math.ceil(totalCount / limit)
    const offset = (page - 1) * limit
    const paginatedOrders = filteredOrders.slice(offset, offset + limit)

    return c.json({
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
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch orders' }, 500)
  }
})

// --- 2. GET /:orderId - Get single order ---
router.get('/:orderId', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = parseInt(c.req.param('orderId'), 10)
    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400)
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
      return c.json({ error: 'Order not found' }, 404)
    }

    if (order.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    return c.json(order)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch order' }, 500)
  }
})

// --- 3. POST / - Create order ---
router.post('/', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const data = createOrderSchema.parse(body)

    const normalizedItems = data.items.map((item) => ({
      ...item,
      lineTotal: item.price * item.quantity,
    }))

    const calculatedTotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0)
    const totalAmount = Math.round(calculatedTotal * 100) / 100
    const depositAmount = Math.max(0, data.depositAmount)
    const balanceDue = Math.max(0, totalAmount - depositAmount)

    if (Math.abs(totalAmount - data.totalAmount) > 0.01) {
      console.warn('[createOrder] total mismatch, using calculated total', {
        provided: data.totalAmount,
        calculated: totalAmount,
      })
    }

    const insertValues = {
      userId: session.user.id,
      totalAmount: totalAmount.toString(),
      status: 'placed',
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

    const rfqIds = Array.from(
      new Set(
        normalizedItems
          .map((item) => item.rfqId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    )

    const quantityByProductId = new Map<number, number>()
    normalizedItems.forEach((item) => {
      quantityByProductId.set(
        item.productId,
        (quantityByProductId.get(item.productId) ?? 0) + item.quantity,
      )
    })

    const newOrder = await db.transaction(async (tx) => {
      let insertedOrder: typeof orders.$inferSelect
      try {
        ;[insertedOrder] = await tx.insert(orders).values(insertValues).returning()
      } catch (err: any) {
        const msg = err?.cause?.message || err?.message || 'Unknown database error'
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
          ;[insertedOrder] = await tx.insert(orders).values(fallbackValues).returning()
        } else {
          throw new Error(`Order insert failed: ${msg}`)
        }
      }

      // Reserve stock and create order items
      if (normalizedItems.length > 0) {
        const productIds = Array.from(new Set(normalizedItems.map((item) => item.productId)))

        const supplierRows = await tx
          .select({ id: products.id, supplierId: products.supplierId })
          .from(products)
          .where(and(inArray(products.id, productIds), isNull(products.deletedAt)))

        const supplierByProductId = new Map<number, number | null>()
        supplierRows.forEach((row) => {
          supplierByProductId.set(row.id, row.supplierId)
        })

        for (const [productId, quantity] of quantityByProductId.entries()) {
          const [reserved] = await tx
            .update(products)
            .set({
              stock: sql`${products.stock} - ${quantity}`,
              soldCount: sql`coalesce(${products.soldCount}, 0) + ${quantity}`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(products.id, productId),
                isNull(products.deletedAt),
                gte(products.stock, quantity),
              ),
            )
            .returning({ id: products.id })

          if (!reserved) {
            throw new Error(`Insufficient stock for product ${productId}`)
          }
        }

        await tx.insert(orderItems).values(
          normalizedItems.map((item) => ({
            orderId: insertedOrder.id,
            productId: item.productId,
            supplierId: supplierByProductId.get(item.productId) ?? null,
            rfqId: item.rfqId,
            quoteId: item.quoteId,
            quantity: item.quantity,
            price: item.lineTotal.toString(),
          })),
        )
      }

      if (rfqIds.length > 0) {
        await tx
          .update(rfqs)
          .set({ status: 'converted', updatedAt: new Date() })
          .where(inArray(rfqs.id, rfqIds))
      }

      return insertedOrder
    })

    // Send email notification
    const buyer = await db.query.user.findFirst({
      where: eq(user.id, session.user.id),
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

    return c.json(newOrder, 201)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create order' }, 500)
  }
})

// --- 4. PATCH /:orderId/payment - Update payment status ---
router.patch('/:orderId/payment', async (c) => {
  try {
    const orderId = parseInt(c.req.param('orderId'), 10)
    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400)
    }

    const body = await c.req.json()
    const { status, transactionId } = z.object({
      status: z.string(),
      transactionId: z.string().optional(),
    }).parse(body)

    const updateData: any = {
      paymentStatus: status,
      transactionId,
    }

    const now = new Date()

    if (status === 'deposit_paid') {
      updateData.depositPaidAt = now
      updateData.paymentStatus = 'deposit_paid'
      updateData.status = 'processing'
    } else if (status === 'full_paid') {
      updateData.fullPaymentPaidAt = now
      updateData.paymentStatus = 'escrow_hold'
      updateData.status = 'processing'
    } else if (status === 'escrow_hold') {
      updateData.paymentStatus = 'escrow_hold'
    }

    const [updatedOrder] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId))
      .returning()

    if (!updatedOrder) {
      return c.json({ error: 'Order not found' }, 404)
    }

    return c.json(updatedOrder)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update payment' }, 500)
  }
})

// --- 5. GET /:orderId/status - Get order status ---
router.get('/:orderId/status', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = parseInt(c.req.param('orderId'), 10)
    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400)
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        userId: true,
        status: true,
        updatedAt: true,
        cancellationReason: true,
        cancelledAt: true,
      },
    })

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (order.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    return c.json({
      status: order.status,
      updatedAt: order.updatedAt,
      cancellationReason: order.cancellationReason,
      cancelledAt: order.cancelledAt,
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch order status' }, 500)
  }
})

// --- 6. PATCH /:orderId/status - Update order status (cancel or update) ---
router.patch('/:orderId/status', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = parseInt(c.req.param('orderId'), 10)
    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400)
    }

    const body = await c.req.json()
    const { action, status, reason } = z.object({
      action: z.enum(['cancel', 'update']),
      status: z.string().optional(),
      reason: z.string().optional(),
      tracking: z.string().optional(),
    }).parse(body)

    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })

    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (existingOrder.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    if (action === 'cancel') {
      const cancellableStatuses = ['pending', 'placed', 'confirmed', 'processing']
      if (!cancellableStatuses.includes(existingOrder.status)) {
        return c.json({
          error: `Cannot cancel order with status "${existingOrder.status}"`,
          refundSummary: buildRefundSummary(existingOrder),
        }, 400)
      }

      const updated = await db.transaction(async (tx) => {
        const [cancelledOrder] = await tx
          .update(orders)
          .set({
            status: 'cancelled',
            cancellationReason: sanitizeText(reason?.trim() || 'Cancelled by buyer'),
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(and(eq(orders.id, orderId), ne(orders.status, 'cancelled')))
          .returning()

        if (!cancelledOrder) {
          throw new Error('Order already cancelled')
        }

        await restockOrderInventory(tx, orderId)

        return cancelledOrder
      })

      // Send notifications
      try {
        void sendOrderStatusEmail({
          email: session.user.email,
          name: session.user.name,
          orderId: updated.id,
          status: 'cancelled',
        })
      } catch (error) {
        console.error('Failed to send cancellation email:', error)
      }

      return c.json({
        status: updated.status,
        updatedAt: updated.updatedAt,
        cancellationReason: updated.cancellationReason,
        cancelledAt: updated.cancelledAt,
        refundSummary: buildRefundSummary(updated),
      })
    }

    // action === 'update'
    if (!status) {
      return c.json({ error: 'Status is required for update action' }, 400)
    }

    const [updated] = await db
      .update(orders)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning()

    if (!updated) {
      return c.json({ error: 'Failed to update order' }, 500)
    }

    // Send notifications
    try {
      void sendOrderStatusEmail({
        email: session.user.email,
        name: session.user.name,
        orderId: updated.id,
        status: updated.status as any,
      })
    } catch (error) {
      console.error('Failed to send status update email:', error)
    }

    return c.json({
      status: updated.status,
      updatedAt: updated.updatedAt,
      cancellationReason: updated.cancellationReason,
      cancelledAt: updated.cancelledAt,
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update order status' }, 500)
  }
})

// --- 7. GET /:orderId/invoice - Get stored invoice metadata ---
router.get('/:orderId/invoice', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = Number(c.req.param('orderId'))
    if (Number.isNaN(orderId)) {
      return c.json({ error: 'Invalid order id' }, 400)
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        userId: true,
        invoiceUrl: true,
        invoiceGeneratedAt: true,
      },
    })

    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (order.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    return c.json({
      invoiceUrl: order.invoiceUrl,
      invoiceGeneratedAt: order.invoiceGeneratedAt,
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch invoice' }, 500)
  }
})

// --- 8. POST /:orderId/invoice - Store or email invoice ---
router.post('/:orderId/invoice', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = Number(c.req.param('orderId'))
    if (Number.isNaN(orderId)) {
      return c.json({ error: 'Invalid order id' }, 400)
    }

    const payload = await c.req.json().catch(() => ({}))
    const action = payload?.action ?? 'store'

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    })
    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }

    if (order.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    if (action === 'store') {
      const invoiceUrl = payload?.invoiceUrl
      if (!invoiceUrl) {
        return c.json({ error: 'invoiceUrl is required' }, 400)
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          invoiceUrl,
          invoiceGeneratedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning({
          invoiceUrl: orders.invoiceUrl,
          invoiceGeneratedAt: orders.invoiceGeneratedAt,
        })

      return c.json({
        invoiceUrl: updatedOrder?.invoiceUrl ?? null,
        invoiceGeneratedAt: updatedOrder?.invoiceGeneratedAt ?? null,
      })
    }

    if (action === 'email') {
      const invoiceUrl = payload?.invoiceUrl ?? order.invoiceUrl
      if (!invoiceUrl) {
        return c.json({ error: 'Invoice URL not available' }, 400)
      }

      const buyer = await db.query.user.findFirst({
        where: eq(user.id, order.userId),
      })
      if (!buyer) {
        return c.json({ error: 'Buyer not found' }, 404)
      }

      const year = order.createdAt
        ? new Date(order.createdAt).getFullYear()
        : new Date().getFullYear()
      const invoiceNumber = `INV-${year}-${order.id.toString().padStart(5, '0')}`
      const orderNumber = `BO-${year}-${order.id.toString().padStart(4, '0')}`

      const result = await sendInvoiceEmail({
        email: buyer.email,
        name: buyer.name,
        invoiceNumber,
        invoiceUrl,
        orderNumber,
      })

      return c.json({ success: result.success })
    }

    return c.json({ error: 'Unknown action' }, 400)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to process invoice action' }, 500)
  }
})

// --- 9. POST /:orderId/track - Legacy tracking endpoint ---
router.post('/:orderId/track', async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = Number(c.req.param('orderId'))
    if (Number.isNaN(orderId)) {
      return c.json({ error: 'Invalid order id' }, 400)
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        userId: true,
        status: true,
        updatedAt: true,
      },
    })
    if (!order) {
      return c.json({ error: 'Order not found' }, 404)
    }
    if (order.userId !== session.user.id) {
      return c.json({ error: 'Forbidden' }, 403)
    }

    return c.json({
      trackingInfo: {
        currentStatus: order.status,
        lastUpdatedAt: order.updatedAt,
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch tracking info' }, 500)
  }
})

// --- 10. POST /:orderId/reorder - Legacy reorder endpoint ---
router.post('/:orderId/reorder', async (c) => {
  const orderId = c.req.param('orderId')
  return c.json({
    message: `Reordering items from order ${orderId}`,
  })
})

// --- 11. GET /buyer/:buyerId - Legacy buyer scoped orders endpoint ---
router.get('/buyer/:buyerId', async (c) => {
  const buyerId = c.req.param('buyerId')
  return c.json({
    message: `Fetching orders for buyer ${buyerId}`,
  })
})

export default router
