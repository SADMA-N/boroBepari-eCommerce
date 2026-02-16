import { createServerFn } from '@tanstack/react-start'
import { and, eq, gte, isNull, lt } from 'drizzle-orm'
import { z } from 'zod'
import { sellerAuthMiddleware } from './seller-auth-server'
import { db } from '@/db'
import { categories, orderItems, orders, products, sellers } from '@/db/schema'

type AnalyticsRange = 'today' | '7d' | '30d' | '90d'

type SellerTopProduct = {
  id: number
  name: string
  image: string
  units: number
  revenue: number
  rating: number | null
  stock: 'In Stock' | 'Low' | 'Out'
}

type SellerCategoryShare = {
  name: string
  value: number
}

type SellerSeriesPoint = {
  label: string
  revenue: number
  orders: number
}

type SellerStatusPoint = {
  stage: 'Placed' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled'
  value: number
}

type SellerInventorySummary = {
  totalProducts: number
  inStock: number
  lowStock: number
  outOfStock: number
}

export type SellerSalesAnalytics = {
  range: AnalyticsRange
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  revenueChange: number
  orderChange: number
  chart: Array<SellerSeriesPoint>
  statusBreakdown: Array<SellerStatusPoint>
  categoryShare: Array<SellerCategoryShare>
  topProducts: Array<SellerTopProduct>
  inventory: SellerInventorySummary
}

const rangeSchema = z.object({
  range: z.enum(['today', '7d', '30d', '90d']).default('30d'),
})

const CANCELLED_STATUSES = new Set(['cancelled', 'returned'])
const DEFAULT_LOW_STOCK_THRESHOLD = 10

function rangeToDays(range: AnalyticsRange): number {
  if (range === 'today') return 1
  if (range === '7d') return 7
  if (range === '90d') return 90
  return 30
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

function dayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10)
}

function dayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusToStage(statusRaw: string): SellerStatusPoint['stage'] {
  const status = statusRaw.toLowerCase()
  if (status === 'cancelled' || status === 'returned') return 'Cancelled'
  if (status === 'delivered') return 'Delivered'
  if (status === 'shipped' || status === 'out_for_delivery') return 'Shipped'
  if (status === 'confirmed') return 'Confirmed'
  return 'Placed'
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export const getSellerSalesAnalytics = createServerFn({ method: 'GET' })
  .middleware([sellerAuthMiddleware])
  .inputValidator((data: unknown) => rangeSchema.parse(data || {}))
  .handler(async ({ data, context }) => {
    if (!context.seller) {
      throw new Error('Unauthorized')
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, context.seller.id),
      columns: {
        id: true,
        supplierId: true,
      },
    })

    if (!seller?.supplierId) {
      return {
        range: data.range,
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        revenueChange: 0,
        orderChange: 0,
        chart: [],
        statusBreakdown: [
          { stage: 'Placed', value: 0 },
          { stage: 'Confirmed', value: 0 },
          { stage: 'Shipped', value: 0 },
          { stage: 'Delivered', value: 0 },
          { stage: 'Cancelled', value: 0 },
        ],
        categoryShare: [],
        topProducts: [],
        inventory: {
          totalProducts: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
        },
      } satisfies SellerSalesAnalytics
    }

    const days = rangeToDays(data.range)
    const today = startOfDay(new Date())
    const rangeStart = addDays(today, -(days - 1))
    const rangeEnd = addDays(today, 1)
    const previousStart = addDays(rangeStart, -days)
    const previousEnd = rangeStart

    const [periodRows, previousRows, inventoryRows] = await Promise.all([
      db
        .select({
          orderId: orderItems.orderId,
          orderCreatedAt: orders.createdAt,
          orderStatus: orders.status,
          lineTotal: orderItems.price,
          quantity: orderItems.quantity,
          productId: products.id,
          productName: products.name,
          productImages: products.images,
          productRating: products.rating,
          productStock: products.stock,
          categoryName: categories.name,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(
          and(
            eq(products.supplierId, seller.supplierId),
            gte(orders.createdAt, rangeStart),
            lt(orders.createdAt, rangeEnd),
          ),
        ),
      db
        .select({
          orderId: orderItems.orderId,
          orderStatus: orders.status,
          lineTotal: orderItems.price,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(
          and(
            eq(products.supplierId, seller.supplierId),
            gte(orders.createdAt, previousStart),
            lt(orders.createdAt, previousEnd),
          ),
        ),
      db
        .select({
          stock: products.stock,
        })
        .from(products)
        .where(
          and(
            eq(products.supplierId, seller.supplierId),
            isNull(products.deletedAt),
          ),
        ),
    ])

    const bucketOrderSets = new Map<string, Set<number>>()
    const chart = []
    for (let i = 0; i < days; i++) {
      const date = addDays(rangeStart, i)
      const key = dayKey(date)
      bucketOrderSets.set(key, new Set<number>())
      chart.push({
        label: dayLabel(date),
        revenue: 0,
        orders: 0,
      })
    }

    const bucketIndexByKey = new Map<string, number>()
    chart.forEach((bucket, index) => {
      const date = addDays(rangeStart, index)
      bucketIndexByKey.set(dayKey(date), index)
    })

    const revenueOrderIds = new Set<number>()
    const statusOrderStage = new Map<number, SellerStatusPoint['stage']>()
    const productMap = new Map<
      number,
      {
        id: number
        name: string
        image: string
        units: number
        revenue: number
        rating: number | null
        stock: 'In Stock' | 'Low' | 'Out'
      }
    >()
    const categoryRevenue = new Map<string, number>()

    let totalRevenue = 0

    for (const row of periodRows) {
      const status = String(row.orderStatus || 'pending').toLowerCase()
      const isCancelled = CANCELLED_STATUSES.has(status)
      const createdAt = row.orderCreatedAt ? new Date(row.orderCreatedAt) : today

      if (!statusOrderStage.has(row.orderId)) {
        statusOrderStage.set(row.orderId, statusToStage(status))
      }

      if (isCancelled) {
        continue
      }

      const lineTotal = Number(row.lineTotal) || 0
      const quantity = Number(row.quantity) || 0

      totalRevenue += lineTotal
      revenueOrderIds.add(row.orderId)

      const key = dayKey(createdAt)
      const bucketIndex = bucketIndexByKey.get(key)
      if (bucketIndex !== undefined) {
        chart[bucketIndex].revenue += lineTotal
        bucketOrderSets.get(key)?.add(row.orderId)
      }

      const currentCategory = row.categoryName || 'Uncategorized'
      categoryRevenue.set(
        currentCategory,
        (categoryRevenue.get(currentCategory) ?? 0) + lineTotal,
      )

      const existing = productMap.get(row.productId)
      const rawImages = Array.isArray(row.productImages) ? row.productImages : []
      const image = rawImages[0] ?? ''
      const stock = Number(row.productStock ?? 0)
      const threshold = DEFAULT_LOW_STOCK_THRESHOLD
      const stockStatus: SellerTopProduct['stock'] =
        stock <= 0 ? 'Out' : stock <= threshold ? 'Low' : 'In Stock'
      const rating = row.productRating !== null ? Number(row.productRating) : null

      if (existing) {
        existing.units += quantity
        existing.revenue += lineTotal
      } else {
        productMap.set(row.productId, {
          id: row.productId,
          name: row.productName,
          image,
          units: quantity,
          revenue: lineTotal,
          rating,
          stock: stockStatus,
        })
      }
    }

    chart.forEach((bucket, index) => {
      const key = dayKey(addDays(rangeStart, index))
      bucket.orders = bucketOrderSets.get(key)?.size ?? 0
      bucket.revenue = Math.round(bucket.revenue)
    })

    const stageCounts: Record<SellerStatusPoint['stage'], number> = {
      Placed: 0,
      Confirmed: 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
    }
    for (const stage of statusOrderStage.values()) {
      stageCounts[stage] += 1
    }

    const statusBreakdown: Array<SellerStatusPoint> = [
      { stage: 'Placed', value: stageCounts.Placed },
      { stage: 'Confirmed', value: stageCounts.Confirmed },
      { stage: 'Shipped', value: stageCounts.Shipped },
      { stage: 'Delivered', value: stageCounts.Delivered },
      { stage: 'Cancelled', value: stageCounts.Cancelled },
    ]

    const totalOrders = revenueOrderIds.size
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    let previousRevenue = 0
    const previousOrderIds = new Set<number>()
    for (const row of previousRows) {
      const status = String(row.orderStatus || 'pending').toLowerCase()
      if (CANCELLED_STATUSES.has(status)) continue
      previousRevenue += Number(row.lineTotal) || 0
      previousOrderIds.add(row.orderId)
    }

    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue || b.units - a.units)
      .slice(0, 5)

    const categoryTotalRevenue = Array.from(categoryRevenue.values()).reduce(
      (sum, value) => sum + value,
      0,
    )
    const categoryShare = Array.from(categoryRevenue.entries())
      .map(([name, revenue]) => ({
        name,
        value:
          categoryTotalRevenue > 0
            ? Math.round((revenue / categoryTotalRevenue) * 100)
            : 0,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    const inventory = inventoryRows.reduce<SellerInventorySummary>(
      (acc, row) => {
        acc.totalProducts += 1
        const stock = Number(row.stock ?? 0)
        const lowStockThreshold = DEFAULT_LOW_STOCK_THRESHOLD
        if (stock <= 0) {
          acc.outOfStock += 1
        } else if (stock <= lowStockThreshold) {
          acc.lowStock += 1
        } else {
          acc.inStock += 1
        }
        return acc
      },
      { totalProducts: 0, inStock: 0, lowStock: 0, outOfStock: 0 },
    )

    return {
      range: data.range,
      totalRevenue: Math.round(totalRevenue),
      totalOrders,
      averageOrderValue: Math.round(averageOrderValue),
      revenueChange: percentChange(totalRevenue, previousRevenue),
      orderChange: percentChange(totalOrders, previousOrderIds.size),
      chart,
      statusBreakdown,
      categoryShare,
      topProducts,
      inventory,
    } satisfies SellerSalesAnalytics
  })
