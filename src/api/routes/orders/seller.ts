import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq, inArray, ne, sql } from 'drizzle-orm'
import { requireSellerAuth, type SellerEnv } from '@/api/middleware/seller-auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { sendOrderStatusEmail } from '@/lib/notifications'
import { sanitizeText } from '@/lib/sanitize'

const router = new Hono<SellerEnv>().basePath('/seller/orders')

// Apply seller auth to all routes
router.use('*', requireSellerAuth)

// --- Helpers ---

function formatOrderNumber(orderId: number, createdAt: Date | string | null) {
  const date = createdAt ? new Date(createdAt) : new Date()
  const year = date.getFullYear()
  return `BO-${year}-${orderId.toString().padStart(4, '0')}`
}

type SellerOrderActionStatus =
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'

const transitionMap: Record<string, Array<SellerOrderActionStatus>> = {
  pending: ['confirmed', 'cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
}

type SellerOrderListItem = {
  id: number
  orderNumber: string
  createdAt: string
  updatedAt: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  totalAmount: number
  sellerSubtotal: number
  sellerItemsCount: number
  canManageStatus: boolean
  containsOtherSuppliers: boolean
  buyer: {
    id: string
    name: string
    email: string
    phone: string | null
    address: string
  }
  lineItems: Array<{
    id: number
    productId: number
    name: string
    image: string
    quantity: number
    lineTotal: number
    unitPrice: number
  }>
}

async function restockOrderInventory(tx: any, orderId: number) {
  const items = await tx
    .select({
      productId: schema.orderItems.productId,
      quantity: schema.orderItems.quantity,
    })
    .from(schema.orderItems)
    .where(eq(schema.orderItems.orderId, orderId))

  if (items.length === 0) return

  const quantityByProductId = new Map<number, number>()
  items.forEach((item: any) => {
    quantityByProductId.set(
      item.productId,
      (quantityByProductId.get(item.productId) ?? 0) + item.quantity,
    )
  })

  for (const [productId, quantity] of quantityByProductId.entries()) {
    await tx
      .update(schema.products)
      .set({
        stock: sql`coalesce(${schema.products.stock}, 0) + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, productId))
  }
}

// --- 1. GET / - List seller orders ---
router.get('/', async (c) => {
  try {
    const seller = c.get('seller')
    if (!seller) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const sellerRecord = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, seller.id),
      columns: { id: true, supplierId: true },
    })

    if (!sellerRecord?.supplierId) {
      return c.json([])
    }

    const rows = await db
      .select({
        orderId: schema.orders.id,
        orderCreatedAt: schema.orders.createdAt,
        orderUpdatedAt: schema.orders.updatedAt,
        orderStatus: schema.orders.status,
        orderPaymentStatus: schema.orders.paymentStatus,
        orderPaymentMethod: schema.orders.paymentMethod,
        orderTotalAmount: schema.orders.totalAmount,
        buyerId: schema.user.id,
        buyerName: schema.user.name,
        buyerEmail: schema.user.email,
        buyerPhone: schema.user.phoneNumber,
        addressName: schema.addresses.name,
        addressLine: schema.addresses.address,
        addressCity: schema.addresses.city,
        addressPostcode: schema.addresses.postcode,
        addressPhone: schema.addresses.phone,
        itemId: schema.orderItems.id,
        itemQuantity: schema.orderItems.quantity,
        itemLineTotal: schema.orderItems.price,
        itemProductId: schema.products.id,
        itemProductName: schema.products.name,
        itemProductImages: schema.products.images,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .innerJoin(schema.user, eq(schema.orders.userId, schema.user.id))
      .leftJoin(
        schema.addresses,
        and(
          eq(schema.addresses.userId, schema.orders.userId),
          eq(schema.addresses.isDefault, true),
        ),
      )
      .where(eq(schema.products.supplierId, sellerRecord.supplierId))
      .orderBy(desc(schema.orders.createdAt), desc(schema.orderItems.id))

    if (rows.length === 0) {
      return c.json([])
    }

    const grouped = new Map<number, SellerOrderListItem>()

    for (const row of rows) {
      const key = row.orderId
      let order = grouped.get(key)

      if (!order) {
        const addressParts = [
          row.addressName,
          row.addressLine,
          row.addressCity,
          row.addressPostcode,
          row.addressPhone,
        ].filter(Boolean)

        order = {
          id: row.orderId,
          orderNumber: formatOrderNumber(row.orderId, row.orderCreatedAt),
          createdAt: new Date(row.orderCreatedAt ?? new Date()).toISOString(),
          updatedAt: new Date(row.orderUpdatedAt ?? new Date()).toISOString(),
          status: row.orderStatus,
          paymentStatus: row.orderPaymentStatus,
          paymentMethod: row.orderPaymentMethod,
          totalAmount: Number(row.orderTotalAmount),
          sellerSubtotal: 0,
          sellerItemsCount: 0,
          canManageStatus: false,
          containsOtherSuppliers: false,
          buyer: {
            id: row.buyerId,
            name: row.buyerName,
            email: row.buyerEmail,
            phone: row.buyerPhone,
            address: addressParts.join(', ') || 'No default address available',
          },
          lineItems: [],
        }
        grouped.set(key, order)
      }

      const lineTotal = Number(row.itemLineTotal)
      const quantity = row.itemQuantity
      const productImages = Array.isArray(row.itemProductImages) ? row.itemProductImages : []

      order.lineItems.push({
        id: row.itemId,
        productId: row.itemProductId,
        name: row.itemProductName,
        image: productImages[0] ?? '',
        quantity,
        lineTotal,
        unitPrice: quantity > 0 ? lineTotal / quantity : lineTotal,
      })
      order.sellerSubtotal += lineTotal
      order.sellerItemsCount += quantity
    }

    // Check if orders have multiple suppliers
    const orderIds = Array.from(grouped.keys())
    const supplierRows = await db
      .select({
        orderId: schema.orderItems.orderId,
        supplierId: schema.products.supplierId,
      })
      .from(schema.orderItems)
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(inArray(schema.orderItems.orderId, orderIds))

    const supplierMap = new Map<number, Set<number>>()
    for (const row of supplierRows) {
      if (typeof row.supplierId !== 'number') continue
      if (!supplierMap.has(row.orderId)) {
        supplierMap.set(row.orderId, new Set<number>())
      }
      supplierMap.get(row.orderId)!.add(row.supplierId)
    }

    for (const order of grouped.values()) {
      const suppliers = supplierMap.get(order.id) ?? new Set<number>()
      order.containsOtherSuppliers =
        suppliers.size > 1 || (suppliers.size === 1 && !suppliers.has(sellerRecord.supplierId))
      order.canManageStatus = suppliers.size === 1 && suppliers.has(sellerRecord.supplierId)
    }

    const result = Array.from(grouped.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    return c.json(result)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch seller orders' }, 500)
  }
})

// --- 2. PATCH /:orderId/status - Update order status ---
router.patch('/:orderId/status', async (c) => {
  try {
    const seller = c.get('seller')
    if (!seller) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const orderId = parseInt(c.req.param('orderId'), 10)
    if (isNaN(orderId)) {
      return c.json({ error: 'Invalid order ID' }, 400)
    }

    const body = await c.req.json()
    const { nextStatus, cancellationReason } = z.object({
      nextStatus: z.enum([
        'confirmed',
        'processing',
        'shipped',
        'out_for_delivery',
        'delivered',
        'cancelled',
      ]),
      cancellationReason: z.string().optional(),
    }).parse(body)

    const sellerRecord = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, seller.id),
      columns: { id: true, supplierId: true },
    })

    if (!sellerRecord?.supplierId) {
      return c.json({ error: 'Seller shop is not configured' }, 400)
    }

    // Verify seller owns the order's products
    const supplierRows = await db
      .select({ supplierId: schema.products.supplierId })
      .from(schema.orderItems)
      .innerJoin(schema.products, eq(schema.orderItems.productId, schema.products.id))
      .where(eq(schema.orderItems.orderId, orderId))

    if (supplierRows.length === 0) {
      return c.json({ error: 'Order not found' }, 404)
    }

    const distinctSuppliers = new Set<number>()
    for (const row of supplierRows) {
      if (typeof row.supplierId === 'number') {
        distinctSuppliers.add(row.supplierId)
      }
    }

    if (!distinctSuppliers.has(sellerRecord.supplierId)) {
      return c.json({ error: 'You are not authorized to manage this order' }, 403)
    }

    if (distinctSuppliers.size > 1) {
      return c.json({
        error: 'This order contains multiple suppliers. Seller-side status update is disabled for this order.',
      }, 400)
    }

    const existingOrder = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      columns: { id: true, userId: true, status: true },
    })

    if (!existingOrder) {
      return c.json({ error: 'Order not found' }, 404)
    }

    // Check transition map
    const currentStatus = String(existingOrder.status).toLowerCase()
    const allowedNextStatuses = transitionMap[currentStatus] ?? []

    if (nextStatus !== currentStatus && !allowedNextStatuses.includes(nextStatus)) {
      return c.json({
        error: `Invalid status transition from "${currentStatus}" to "${nextStatus}"`,
      }, 400)
    }

    const updates: Partial<typeof schema.orders.$inferInsert> = {
      status: nextStatus,
      updatedAt: new Date(),
    }

    if (nextStatus === 'cancelled') {
      updates.cancelledAt = new Date()
      updates.cancellationReason = sanitizeText(
        cancellationReason?.trim() || 'Cancelled by seller',
      )
    }

    let updated:
      | {
          id: number
          status: string
          updatedAt: Date | null
          cancellationReason: string | null
          cancelledAt: Date | null
        }
      | undefined

    if (nextStatus === 'cancelled') {
      updated = await db.transaction(async (tx) => {
        const [cancelledOrder] = await tx
          .update(schema.orders)
          .set(updates)
          .where(and(eq(schema.orders.id, orderId), ne(schema.orders.status, 'cancelled')))
          .returning({
            id: schema.orders.id,
            status: schema.orders.status,
            updatedAt: schema.orders.updatedAt,
            cancellationReason: schema.orders.cancellationReason,
            cancelledAt: schema.orders.cancelledAt,
          })

        if (!cancelledOrder) {
          throw new Error('Order already cancelled')
        }

        await restockOrderInventory(tx, orderId)

        return cancelledOrder
      })
    } else {
      ;[updated] = await db
        .update(schema.orders)
        .set(updates)
        .where(eq(schema.orders.id, orderId))
        .returning({
          id: schema.orders.id,
          status: schema.orders.status,
          updatedAt: schema.orders.updatedAt,
          cancellationReason: schema.orders.cancellationReason,
          cancelledAt: schema.orders.cancelledAt,
        })
    }

    if (!updated) {
      return c.json({ error: 'Order update failed' }, 500)
    }

    // Send buyer notification + email
    const buyer = await db.query.user.findFirst({
      where: eq(schema.user.id, existingOrder.userId),
      columns: { id: true, name: true, email: true },
    })

    if (buyer) {
      try {
        await db.insert(schema.notifications).values({
          userId: buyer.id,
          title: 'Order status updated',
          message: `Your order ${formatOrderNumber(updated.id, updated.updatedAt)} is now ${updated.status.replace(/_/g, ' ')}.`,
          type: 'order_status',
          link: `/buyer/orders/${updated.id}`,
        })
      } catch (error) {
        console.error('Failed to insert buyer notification:', error)
      }

      try {
        await sendOrderStatusEmail({
          email: buyer.email,
          name: buyer.name,
          orderId: updated.id,
          status: updated.status as
            | 'confirmed'
            | 'processing'
            | 'shipped'
            | 'out_for_delivery'
            | 'delivered'
            | 'cancelled',
        })
      } catch (error) {
        console.error('Failed to send buyer status email:', error)
      }
    }

    return c.json({
      success: true,
      order: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt?.toISOString() ?? new Date().toISOString(),
        cancellationReason: updated.cancellationReason,
        cancelledAt: updated.cancelledAt?.toISOString() ?? null,
      },
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update order status' }, 500)
  }
})

export default router
