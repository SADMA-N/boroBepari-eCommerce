import { createServerFn } from '@tanstack/react-start'
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  ne,
  or,
  sql,
} from 'drizzle-orm'
import { z } from 'zod'
import { adminAuthMiddleware } from './admin-auth-server'
import { sanitizeText } from './sanitize'
import type { SQL } from 'drizzle-orm'
import { db } from '@/db'
import { orderItems, orders, products, suppliers, user } from '@/db/schema'

const ORDER_STATUSES = [
  'pending',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
] as const

const ORDER_FILTER_VALUES = ['all', ...ORDER_STATUSES] as const
const ORDER_SORT_VALUES = [
  'newest',
  'oldest',
  'amount_desc',
  'amount_asc',
] as const

const TERMINAL_STATUSES = new Set<AdminOrderStatus>(['cancelled', 'returned'])

const ACTIVE_STATUSES = new Set<AdminOrderStatus>([
  'pending',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
])

const TRANSITION_MAP: Record<AdminOrderStatus, Array<AdminOrderStatus>> = {
  pending: ['placed', 'confirmed', 'processing', 'cancelled'],
  placed: ['confirmed', 'processing', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'out_for_delivery', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'cancelled', 'returned'],
  out_for_delivery: ['delivered', 'cancelled', 'returned'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
}

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number]

export type AdminOrderListItem = {
  id: number
  orderNumber: string
  createdAt: string
  updatedAt: string
  status: AdminOrderStatus
  paymentStatus: string
  totalAmount: number
  itemCount: number
  supplierNames: Array<string>
  buyer: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  availableNextStatuses: Array<AdminOrderStatus>
  canUpdate: boolean
}

export type AdminOrdersResult = {
  orders: Array<AdminOrderListItem>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  counts: {
    all: number
    active: number
    completed: number
    cancelled: number
  }
}

function startOfDay(date: Date): Date {
  const out = new Date(date)
  out.setHours(0, 0, 0, 0)
  return out
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date)
  out.setDate(out.getDate() + days)
  return out
}

function normalizeOrderStatus(statusRaw: string): AdminOrderStatus {
  const normalized = statusRaw.toLowerCase()
  if ((ORDER_STATUSES as ReadonlyArray<string>).includes(normalized)) {
    return normalized as AdminOrderStatus
  }
  if (normalized === 'in_progress') return 'processing'
  if (normalized === 'completed' || normalized === 'complete') return 'delivered'
  if (normalized === 'refund_processed') return 'returned'
  return 'pending'
}

function getAllowedTransitions(status: AdminOrderStatus): Array<AdminOrderStatus> {
  return TRANSITION_MAP[status] ?? [] // eslint-disable-line @typescript-eslint/no-unnecessary-condition
}

function formatOrderNumber(orderId: number, createdAt: Date | string | null) {
  const date = createdAt ? new Date(createdAt) : new Date()
  const year = date.getFullYear()
  return `BO-${year}-${orderId.toString().padStart(4, '0')}`
}

const getAdminOrdersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum(ORDER_FILTER_VALUES).default('all'),
  paymentStatus: z.string().trim().default('all'),
  sortBy: z.enum(ORDER_SORT_VALUES).default('newest'),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export const getAdminOrders = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .inputValidator((data: unknown) => getAdminOrdersSchema.parse(data || {}))
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const search = data.search?.trim() ?? ''
    const searchPattern = `%${search}%`
    const fromDate = data.from ? startOfDay(new Date(data.from)) : null
    const toDateExclusive = data.to
      ? addDays(startOfDay(new Date(data.to)), 1)
      : null

    const buildWhere = (includeStatus: boolean): SQL<unknown> | undefined => {
      const clauses: Array<SQL<unknown>> = []

      if (search.length > 0) {
        const searchClause = or(
          ilike(user.name, searchPattern),
          ilike(user.email, searchPattern),
          ilike(user.phoneNumber, searchPattern),
          ilike(orders.status, searchPattern),
          sql`cast(${orders.id} as text) ilike ${searchPattern}`,
        )
        if (searchClause) {
          clauses.push(searchClause)
        }
      }

      if (fromDate) {
        clauses.push(gte(orders.createdAt, fromDate))
      }

      if (toDateExclusive) {
        clauses.push(lt(orders.createdAt, toDateExclusive))
      }

      if (data.paymentStatus !== 'all') {
        clauses.push(eq(orders.paymentStatus, data.paymentStatus))
      }

      if (includeStatus && data.status !== 'all') {
        clauses.push(eq(orders.status, data.status))
      }

      return clauses.length > 0 ? and(...clauses) : undefined
    }

    const whereWithStatus = buildWhere(true)
    const whereWithoutStatus = buildWhere(false)

    const listBaseQuery = db
      .select({
        id: orders.id,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        status: orders.status,
        paymentStatus: orders.paymentStatus,
        totalAmount: orders.totalAmount,
        buyerId: user.id,
        buyerName: user.name,
        buyerEmail: user.email,
        buyerPhone: user.phoneNumber,
      })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .where(whereWithStatus)

    const sortedListQuery =
      data.sortBy === 'oldest'
        ? listBaseQuery.orderBy(asc(orders.createdAt), asc(orders.id))
        : data.sortBy === 'amount_asc'
          ? listBaseQuery.orderBy(asc(orders.totalAmount), desc(orders.createdAt))
          : data.sortBy === 'amount_desc'
            ? listBaseQuery.orderBy(
                desc(orders.totalAmount),
                desc(orders.createdAt),
              )
            : listBaseQuery.orderBy(desc(orders.createdAt), desc(orders.id))

    const offset = (data.page - 1) * data.limit

    const [listRows, totalRows, statusRows] = await Promise.all([
      sortedListQuery.limit(data.limit).offset(offset),
      db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .innerJoin(user, eq(orders.userId, user.id))
        .where(whereWithStatus),
      db
        .select({
          status: orders.status,
          count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .innerJoin(user, eq(orders.userId, user.id))
        .where(whereWithoutStatus)
        .groupBy(orders.status),
    ])

    const orderIds = listRows.map((row) => row.id)
    const itemRows =
      orderIds.length === 0
        ? []
        : await db
            .select({
              orderId: orderItems.orderId,
              quantity: orderItems.quantity,
              supplierIdFromItem: orderItems.supplierId,
              supplierIdFromProduct: products.supplierId,
              supplierName: suppliers.name,
            })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .leftJoin(suppliers, eq(orderItems.supplierId, suppliers.id))
            .where(inArray(orderItems.orderId, orderIds))

    const orderItemSummary = new Map<
      number,
      { itemCount: number; supplierNames: Set<string> }
    >()

    itemRows.forEach((row) => {
      const current =
        orderItemSummary.get(row.orderId) ??
        { itemCount: 0, supplierNames: new Set<string>() }

      current.itemCount += Number(row.quantity) || 0
      const supplierLabel =
        row.supplierName ||
        (row.supplierIdFromItem ?? row.supplierIdFromProduct
          ? `Supplier #${String(row.supplierIdFromItem ?? row.supplierIdFromProduct)}`
          : 'Unknown supplier')
      current.supplierNames.add(supplierLabel)
      orderItemSummary.set(row.orderId, current)
    })

    const ordersList: Array<AdminOrderListItem> = listRows.map((row) => {
      const normalizedStatus = normalizeOrderStatus(row.status)
      const summary = orderItemSummary.get(row.id)
      const availableNextStatuses = getAllowedTransitions(normalizedStatus)

      return {
        id: row.id,
        orderNumber: formatOrderNumber(row.id, row.createdAt),
        createdAt: new Date(row.createdAt ?? new Date()).toISOString(),
        updatedAt: new Date(row.updatedAt ?? row.createdAt ?? new Date()).toISOString(),
        status: normalizedStatus,
        paymentStatus: row.paymentStatus,
        totalAmount: Number(row.totalAmount) || 0,
        itemCount: summary?.itemCount ?? 0,
        supplierNames: Array.from(summary?.supplierNames ?? []),
        buyer: {
          id: row.buyerId,
          name: row.buyerName,
          email: row.buyerEmail,
          phone: row.buyerPhone,
        },
        availableNextStatuses,
        canUpdate: availableNextStatuses.length > 0,
      }
    })

    const total = Number(totalRows[0]?.count ?? 0)
    const totalPages = Math.max(1, Math.ceil(total / data.limit))

    const statusCountMap = new Map<AdminOrderStatus, number>()
    statusRows.forEach((row) => {
      const normalized = normalizeOrderStatus(row.status)
      statusCountMap.set(normalized, Number(row.count) || 0)
    })

    const allCount = Array.from(statusCountMap.values()).reduce(
      (sum, value) => sum + value,
      0,
    )
    const activeCount = Array.from(ACTIVE_STATUSES).reduce(
      (sum, status) => sum + (statusCountMap.get(status) ?? 0),
      0,
    )
    const completedCount = statusCountMap.get('delivered') ?? 0
    const cancelledCount =
      (statusCountMap.get('cancelled') ?? 0) + (statusCountMap.get('returned') ?? 0)

    return {
      orders: ordersList,
      pagination: {
        page: data.page,
        limit: data.limit,
        total,
        totalPages,
      },
      counts: {
        all: allCount,
        active: activeCount,
        completed: completedCount,
        cancelled: cancelledCount,
      },
    } satisfies AdminOrdersResult
  })

const updateAdminOrderStatusSchema = z.object({
  orderId: z.number().int().positive(),
  nextStatus: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(300).optional(),
})

export const updateAdminOrderStatus = createServerFn({ method: 'POST' })
  .middleware([adminAuthMiddleware])
  .inputValidator((input: unknown) => updateAdminOrderStatusSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, data.orderId),
      columns: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!existingOrder) {
      throw new Error('Order not found')
    }

    const currentStatus = normalizeOrderStatus(existingOrder.status)

    if (currentStatus === data.nextStatus) {
      return {
        orderId: existingOrder.id,
        orderNumber: formatOrderNumber(existingOrder.id, existingOrder.createdAt),
        previousStatus: currentStatus,
        status: currentStatus,
        updatedAt: new Date(
          existingOrder.updatedAt ?? existingOrder.createdAt ?? new Date(),
        ).toISOString(),
        restocked: false,
      }
    }

    const allowedStatuses = getAllowedTransitions(currentStatus)
    if (!allowedStatuses.includes(data.nextStatus)) {
      throw new Error(
        `Invalid status transition from "${currentStatus}" to "${data.nextStatus}"`,
      )
    }

    const sanitizedNote = data.note ? sanitizeText(data.note) : ''
    const shouldRestock =
      TERMINAL_STATUSES.has(data.nextStatus) && !TERMINAL_STATUSES.has(currentStatus)

    const updated = await db.transaction(async (tx) => {
      const updates: Partial<typeof orders.$inferInsert> = {
        status: data.nextStatus,
        updatedAt: new Date(),
      }

      if (data.nextStatus === 'cancelled') {
        updates.cancellationReason =
          sanitizedNote || 'Cancelled by admin'
        updates.cancelledAt = new Date()
      } else if (data.nextStatus === 'returned') {
        updates.cancellationReason =
          sanitizedNote || 'Returned by admin'
      }

      const [next] = await tx
        .update(orders)
        .set(updates)
        .where(and(eq(orders.id, data.orderId), ne(orders.status, data.nextStatus)))
        .returning({
          id: orders.id,
          status: orders.status,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
        })

      if (!next) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        throw new Error('Failed to update order status')
      }

      if (shouldRestock) {
        await restockOrderInventory(tx, data.orderId)
      }

      return next
    })

    return {
      orderId: updated.id,
      orderNumber: formatOrderNumber(updated.id, updated.createdAt),
      previousStatus: currentStatus,
      status: normalizeOrderStatus(updated.status),
      updatedAt: new Date(updated.updatedAt ?? new Date()).toISOString(),
      restocked: shouldRestock,
    }
  })

async function restockOrderInventory(tx: any, orderId: number) {
  const items = await tx
    .select({
      productId: orderItems.productId,
      quantity: orderItems.quantity,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))

  if (items.length === 0) {
    return
  }

  const quantityByProductId = new Map<number, number>()
  for (const item of items) {
    quantityByProductId.set(
      item.productId,
      (quantityByProductId.get(item.productId) ?? 0) + item.quantity,
    )
  }

  for (const [productId, quantity] of quantityByProductId.entries()) {
    await tx
      .update(products)
      .set({
        stock: sql`coalesce(${products.stock}, 0) + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, productId))
  }
}
