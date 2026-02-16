import { Hono } from 'hono'
import { requireAdminAuth, type AdminEnv } from '@/api/middleware/admin-auth'
import { db } from '@/db'
import { orderItems, orders, sellers, suppliers, user } from '@/db/schema'
import { and, eq, gte, lt } from 'drizzle-orm'
import { z } from 'zod'

type AdminChartPoint = {
  date: string
  gmv: number
  orders: number
}

type UserGrowthPoint = {
  date: string
  buyers: number
  sellers: number
}

type OrderStatusPoint = {
  name: 'Completed' | 'In Progress' | 'Cancelled' | 'Returned'
  value: number
  color: string
}

type TopSellerPoint = {
  id: number
  name: string
  gmv: number
  orders: number
  commission: number
  status: 'premium' | 'verified' | 'basic'
}

type TopBuyerPoint = {
  id: string
  name: string
  orders: number
  spent: number
  lastOrder: string
}

type AdminSalesAnalytics = {
  chart: Array<AdminChartPoint>
  userGrowth: Array<UserGrowthPoint>
  orderStatus: Array<OrderStatusPoint>
  topSellers: Array<TopSellerPoint>
  topBuyers: Array<TopBuyerPoint>
}

const NON_SALES_STATUSES = new Set(['cancelled', 'returned'])

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

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10)
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function normalizeOrderStatus(statusRaw: string): OrderStatusPoint['name'] {
  const status = statusRaw.toLowerCase()
  if (status === 'cancelled') return 'Cancelled'
  if (status === 'returned') return 'Returned'
  if (status === 'delivered') return 'Completed'
  return 'In Progress'
}

function badgeToSellerStatus(
  badgeRaw: string | null,
): TopSellerPoint['status'] {
  if (badgeRaw === 'premium') return 'premium'
  if (badgeRaw === 'verified') return 'verified'
  return 'basic'
}

const inputSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
})

const router = new Hono<AdminEnv>().basePath('/admin/analytics')

router.use('*', requireAdminAuth)

router.get('/', async (c) => {
  const admin = c.get('admin')
  if (!admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const query = inputSchema.safeParse({
    days: c.req.query('days') || 30,
  })
  if (!query.success) {
    return c.json({ error: 'Invalid days parameter' }, 400)
  }
  const { days } = query.data

  const today = startOfDay(new Date())
  const rangeStart = addDays(today, -(days - 1))
  const rangeEnd = addDays(today, 1)

  const [
    orderRows,
    buyerRows,
    topSellerRows,
    userCreatedRows,
    sellerCreatedRows,
  ] = await Promise.all([
    db
      .select({
        orderId: orderItems.orderId,
        orderCreatedAt: orders.createdAt,
        orderStatus: orders.status,
        lineTotal: orderItems.price,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(gte(orders.createdAt, rangeStart), lt(orders.createdAt, rangeEnd))),
    db
      .select({
        orderId: orders.id,
        orderStatus: orders.status,
        orderTotalAmount: orders.totalAmount,
        orderCreatedAt: orders.createdAt,
        buyerId: user.id,
        buyerName: user.name,
      })
      .from(orders)
      .innerJoin(user, eq(orders.userId, user.id))
      .where(and(gte(orders.createdAt, rangeStart), lt(orders.createdAt, rangeEnd))),
    db
      .select({
        supplierId: orderItems.supplierId,
        supplierName: suppliers.name,
        businessName: sellers.businessName,
        verificationBadge: sellers.verificationBadge,
        orderId: orderItems.orderId,
        orderStatus: orders.status,
        lineTotal: orderItems.price,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(suppliers, eq(orderItems.supplierId, suppliers.id))
      .leftJoin(sellers, eq(sellers.supplierId, orderItems.supplierId))
      .where(and(gte(orders.createdAt, rangeStart), lt(orders.createdAt, rangeEnd))),
    db
      .select({
        createdAt: user.createdAt,
      })
      .from(user)
      .where(lt(user.createdAt, rangeEnd)),
    db
      .select({
        createdAt: sellers.createdAt,
      })
      .from(sellers)
      .where(lt(sellers.createdAt, rangeEnd)),
  ])

  const chart: Array<AdminChartPoint> = []
  const chartOrderSets = new Map<string, Set<number>>()
  const chartIndexByKey = new Map<string, number>()
  for (let i = 0; i < days; i++) {
    const date = addDays(rangeStart, i)
    const key = dayKey(date)
    chartOrderSets.set(key, new Set<number>())
    chartIndexByKey.set(key, i)
    chart.push({
      date: dayLabel(date),
      gmv: 0,
      orders: 0,
    })
  }

  const orderStatusByOrderId = new Map<number, OrderStatusPoint['name']>()
  for (const row of orderRows) {
    const normalized = String(row.orderStatus || 'pending').toLowerCase()
    if (!orderStatusByOrderId.has(row.orderId)) {
      orderStatusByOrderId.set(row.orderId, normalizeOrderStatus(normalized))
    }
    if (NON_SALES_STATUSES.has(normalized)) continue

    const createdAt = row.orderCreatedAt ? new Date(row.orderCreatedAt) : today
    const key = dayKey(createdAt)
    const index = chartIndexByKey.get(key)
    if (index === undefined) continue

    chart[index].gmv += Number(row.lineTotal) || 0
    chartOrderSets.get(key)?.add(row.orderId)
  }

  chart.forEach((point, index) => {
    const key = dayKey(addDays(rangeStart, index))
    point.orders = chartOrderSets.get(key)?.size ?? 0
    point.gmv = Math.round(point.gmv)
  })

  const orderStatusCounter: Record<OrderStatusPoint['name'], number> = {
    Completed: 0,
    'In Progress': 0,
    Cancelled: 0,
    Returned: 0,
  }
  for (const status of orderStatusByOrderId.values()) {
    orderStatusCounter[status] += 1
  }

  const orderStatus: Array<OrderStatusPoint> = [
    { name: 'Completed', value: orderStatusCounter.Completed, color: '#22c55e' },
    {
      name: 'In Progress',
      value: orderStatusCounter['In Progress'],
      color: '#3b82f6',
    },
    { name: 'Cancelled', value: orderStatusCounter.Cancelled, color: '#ef4444' },
    { name: 'Returned', value: orderStatusCounter.Returned, color: '#f59e0b' },
  ]

  const topSellerMap = new Map<
    number,
    {
      id: number
      name: string
      gmv: number
      orders: Set<number>
      status: TopSellerPoint['status']
    }
  >()
  for (const row of topSellerRows) {
    if (typeof row.supplierId !== 'number') continue
    const normalized = String(row.orderStatus || 'pending').toLowerCase()
    if (NON_SALES_STATUSES.has(normalized)) continue

    const existing = topSellerMap.get(row.supplierId)
    const sellerName =
      row.businessName ||
      row.supplierName ||
      `Supplier #${String(row.supplierId)}`
    const status = badgeToSellerStatus(row.verificationBadge)
    const lineTotal = Number(row.lineTotal) || 0
    if (existing) {
      existing.gmv += lineTotal
      existing.orders.add(row.orderId)
    } else {
      topSellerMap.set(row.supplierId, {
        id: row.supplierId,
        name: sellerName,
        gmv: lineTotal,
        orders: new Set<number>([row.orderId]),
        status,
      })
    }
  }

  const topSellers = Array.from(topSellerMap.values())
    .map((seller) => ({
      id: seller.id,
      name: seller.name,
      gmv: Math.round(seller.gmv),
      orders: seller.orders.size,
      commission: Math.round(seller.gmv * 0.03),
      status: seller.status,
    }))
    .sort((a, b) => b.gmv - a.gmv || b.orders - a.orders)
    .slice(0, 5)

  const topBuyerMap = new Map<
    string,
    {
      id: string
      name: string
      orders: number
      spent: number
      lastOrder: Date
    }
  >()
  for (const row of buyerRows) {
    const normalized = String(row.orderStatus || 'pending').toLowerCase()
    if (NON_SALES_STATUSES.has(normalized)) continue

    const existing = topBuyerMap.get(row.buyerId)
    const amount = Number(row.orderTotalAmount) || 0
    const createdAt = row.orderCreatedAt ? new Date(row.orderCreatedAt) : today
    if (existing) {
      existing.orders += 1
      existing.spent += amount
      if (createdAt > existing.lastOrder) existing.lastOrder = createdAt
    } else {
      topBuyerMap.set(row.buyerId, {
        id: row.buyerId,
        name: row.buyerName,
        orders: 1,
        spent: amount,
        lastOrder: createdAt,
      })
    }
  }

  const topBuyers = Array.from(topBuyerMap.values())
    .sort((a, b) => b.spent - a.spent || b.orders - a.orders)
    .slice(0, 5)
    .map((buyer) => ({
      id: buyer.id,
      name: buyer.name,
      orders: buyer.orders,
      spent: Math.round(buyer.spent),
      lastOrder: buyer.lastOrder.toISOString().slice(0, 10),
    }))

  const userIncrements = new Map<string, number>()
  let buyerBase = 0
  for (const row of userCreatedRows) {
    const createdAt = row.createdAt ? new Date(row.createdAt) : null
    if (!createdAt) continue
    if (createdAt < rangeStart) {
      buyerBase += 1
    } else {
      const key = dayKey(createdAt)
      userIncrements.set(key, (userIncrements.get(key) ?? 0) + 1)
    }
  }

  const sellerIncrements = new Map<string, number>()
  let sellerBase = 0
  for (const row of sellerCreatedRows) {
    const createdAt = row.createdAt ? new Date(row.createdAt) : null
    if (!createdAt) continue
    if (createdAt < rangeStart) {
      sellerBase += 1
    } else {
      const key = dayKey(createdAt)
      sellerIncrements.set(key, (sellerIncrements.get(key) ?? 0) + 1)
    }
  }

  const userGrowth: Array<UserGrowthPoint> = []
  let buyerRunning = buyerBase
  let sellerRunning = sellerBase
  for (let i = 0; i < days; i++) {
    const date = addDays(rangeStart, i)
    const key = dayKey(date)
    buyerRunning += userIncrements.get(key) ?? 0
    sellerRunning += sellerIncrements.get(key) ?? 0
    userGrowth.push({
      date: dayLabel(date),
      buyers: buyerRunning,
      sellers: sellerRunning,
    })
  }

  return c.json({
    chart,
    userGrowth,
    orderStatus,
    topSellers,
    topBuyers,
  } satisfies AdminSalesAnalytics)
})

export default router
