import { useCallback, useEffect, useMemo, useState } from 'react'
import { Download, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { SellerProtectedRoute } from '@/components/seller'
import { useTheme } from '@/contexts/ThemeContext'
import { api } from '@/api/client'

type SellerSalesAnalytics = any

type Range = 'today' | '7d' | '30d' | '90d' | 'custom'

const RANGE_LABELS: Record<Range, string> = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  custom: 'Custom',
}

const CATEGORY_COLORS = [
  '#f97316',
  '#2563eb',
  '#22c55e',
  '#f59e0b',
  '#0ea5e9',
  '#8b5cf6',
]

export function SellerAnalyticsPage() {
  const { theme } = useTheme()
  const [range, setRange] = useState<Range>('30d')
  const [compare, setCompare] = useState(true)
  const [metricView, setMetricView] = useState<'revenue' | 'orders' | 'both'>(
    'revenue',
  )
  const [analytics, setAnalytics] = useState<SellerSalesAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const resolvedRange: Exclude<Range, 'custom'> =
    range === 'custom' ? '30d' : range

  const loadAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('seller_token') || ''
      const next = await api.seller.analytics(token, resolvedRange)
      setAnalytics(next)
    } catch (err) {
      console.error('Failed to load seller analytics:', err)
      setError('Could not load analytics data right now.')
    } finally {
      setLoading(false)
    }
  }, [resolvedRange])

  useEffect(() => {
    void loadAnalytics()
  }, [loadAnalytics])

  const chartData = analytics?.chart ?? []
  const categoryData = analytics?.categoryShare ?? []
  const topProducts = analytics?.topProducts ?? []
  const inventory =
    analytics?.inventory ??
    ({
      totalProducts: 0,
      inStock: 0,
      lowStock: 0,
      outOfStock: 0,
    } as const)

  const stageCounts = useMemo(() => {
    const lookup = new Map<string, number>()
    analytics?.statusBreakdown.forEach((item) => {
      lookup.set(item.stage, item.value)
    })
    return {
      placed: lookup.get('Placed') ?? 0,
      confirmed: lookup.get('Confirmed') ?? 0,
      shipped: lookup.get('Shipped') ?? 0,
      delivered: lookup.get('Delivered') ?? 0,
      cancelled: lookup.get('Cancelled') ?? 0,
    }
  }, [analytics])

  const funnelData = [
    { stage: 'Placed', value: stageCounts.placed },
    { stage: 'Confirmed', value: stageCounts.confirmed },
    { stage: 'Shipped', value: stageCounts.shipped },
    { stage: 'Delivered', value: stageCounts.delivered },
    { stage: 'Cancelled', value: stageCounts.cancelled },
  ]
  const funnelTopValue = Math.max(...funnelData.map((step) => step.value), 1)

  const trackedOrders =
    stageCounts.placed +
    stageCounts.confirmed +
    stageCounts.shipped +
    stageCounts.delivered +
    stageCounts.cancelled
  const deliveryRate =
    trackedOrders > 0
      ? Number(((stageCounts.delivered / trackedOrders) * 100).toFixed(1))
      : 0
  const cancelRate =
    trackedOrders > 0
      ? Number(((stageCounts.cancelled / trackedOrders) * 100).toFixed(1))
      : 0

  const totalRevenue = analytics?.totalRevenue ?? 0
  const totalOrders = analytics?.totalOrders ?? 0
  const averageOrderValue = analytics?.averageOrderValue ?? 0
  const revenueChange = analytics?.revenueChange ?? 0
  const orderChange = analytics?.orderChange ?? 0

  const revenueSpark = chartData.slice(-7).map((point) => point.revenue)
  const topCategory = categoryData[0]?.name
  const restockCandidate = topProducts.find((product) => product.stock !== 'In Stock')

  const bestRevenuePoint = chartData.reduce<
    { label: string; revenue: number } | null
  >((best, point) => {
    if (!best || point.revenue > best.revenue) {
      return { label: point.label, revenue: point.revenue }
    }
    return best
  }, null)

  const customerItems = [
    { label: 'Tracked orders', value: String(trackedOrders) },
    { label: 'Average order value', value: `৳${averageOrderValue.toLocaleString()}` },
    {
      label: 'Delivery completion',
      value: `${deliveryRate}%`,
    },
  ]

  const rfqItems = [
    { label: 'RFQ analytics', value: 'Coming soon' },
    { label: 'Response SLA', value: 'Coming soon' },
    { label: 'RFQ → Order', value: 'Coming soon' },
  ]

  const inventoryItems = [
    { label: 'Total products', value: String(inventory.totalProducts) },
    { label: 'In stock', value: String(inventory.inStock) },
    { label: 'Low stock', value: String(inventory.lowStock) },
    { label: 'Out of stock', value: String(inventory.outOfStock) },
  ]

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100 transition-colors">
              Analytics & Insights
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 transition-colors">
              Live sales metrics from your placed orders.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as Range)}
              className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-200 transition-colors"
            >
              <option value="today" className="dark:bg-slate-900">
                Today
              </option>
              <option value="7d" className="dark:bg-slate-900">
                Last 7 Days
              </option>
              <option value="30d" className="dark:bg-slate-900">
                Last 30 Days
              </option>
              <option value="90d" className="dark:bg-slate-900">
                Last 90 Days
              </option>
              <option value="custom" className="dark:bg-slate-900">
                Custom
              </option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={compare}
                onChange={(event) => setCompare(event.target.checked)}
                className="rounded border-border dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
              />
              Compare with previous period
            </label>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
          <KpiCard
            title="Total Revenue (GMV)"
            value={`৳${totalRevenue.toLocaleString()}`}
            change={revenueChange}
            spark={revenueSpark}
            compare={compare}
          />
          <KpiCard
            title="Total Orders"
            value={`${totalOrders}`}
            change={orderChange}
            subtitle={`Avg order: ৳${averageOrderValue.toLocaleString()}`}
            compare={compare}
          />
          <KpiCard
            title="Delivery Completion"
            value={`${deliveryRate}%`}
            subtitle={`${stageCounts.delivered} delivered`}
          />
          <KpiCard
            title="Cancellation Rate"
            value={`${cancelRate}%`}
            subtitle={`${stageCounts.cancelled} cancelled`}
          />
          <KpiCard
            title="Inventory Health"
            value={`${inventory.inStock}/${inventory.totalProducts}`}
            subtitle={`${inventory.lowStock} low · ${inventory.outOfStock} out`}
          />
        </section>

        <section className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-6 space-y-4 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground dark:text-gray-100 transition-colors">
                Revenue Performance
              </h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                Trend across {RANGE_LABELS[range]}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMetricView('revenue')}
                className={metricView === 'revenue' ? 'tab-active' : 'tab'}
              >
                Revenue
              </button>
              <button
                onClick={() => setMetricView('orders')}
                className={metricView === 'orders' ? 'tab-active' : 'tab'}
              >
                Orders
              </button>
              <button
                onClick={() => setMetricView('both')}
                className={metricView === 'both' ? 'tab-active' : 'tab'}
              >
                Both
              </button>
            </div>
          </div>
          <div className="h-72 min-h-[288px] min-w-0">
            {loading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                  {metricView !== 'orders' && (
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={3}
                    />
                  )}
                  {metricView !== 'revenue' && (
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#2563eb"
                      strokeWidth={3}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-foreground dark:text-gray-100 transition-colors">
              Sales by Category
            </h2>
            <div className="mt-4 h-64 min-h-[256px] min-w-0">
              {loading ? (
                <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ) : categoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No category sales data for this period.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, 'Share']}
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        color: isDark ? '#f8fafc' : '#0f172a',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-6 transition-colors">
            <h2 className="text-lg font-semibold text-foreground dark:text-gray-100 transition-colors">
              Order Status Funnel
            </h2>
            <div className="mt-4 space-y-3">
              {funnelData.map((step, index) => (
                <div key={step.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                    <span>{step.stage}</span>
                    <span className="dark:text-gray-200 font-medium">
                      {step.value}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted dark:bg-slate-800 transition-colors">
                    <div
                      className="h-3 rounded-full bg-orange-500"
                      style={{
                        width: `${(step.value / funnelTopValue) * 100}%`,
                      }}
                    />
                  </div>
                  {index < funnelData.length - 1 && step.value > 0 && (
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                      Drop-off:{' '}
                      {Math.round(
                        ((step.value - funnelData[index + 1].value) / step.value) *
                          100,
                      )}
                      %
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[1.4fr_1fr] gap-6">
          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-6 transition-colors">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground dark:text-gray-100 transition-colors">
                Top Products
              </h2>
            </div>
            <div className="mt-4 overflow-x-auto">
              {loading ? (
                <div className="h-44 w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
              ) : topProducts.length === 0 ? (
                <div className="rounded-xl border border-border dark:border-slate-800 bg-muted dark:bg-slate-950 px-4 py-8 text-center text-sm text-muted-foreground">
                  No product sales data for this period.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground dark:text-muted-foreground">
                    <tr>
                      <th className="pb-2">Product</th>
                      <th>Units sold</th>
                      <th>Revenue</th>
                      <th>Avg rating</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-slate-800 text-muted-foreground dark:text-gray-300">
                    {topProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover border border-border dark:border-slate-800"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg border border-border dark:border-slate-800 bg-muted dark:bg-slate-950" />
                            )}
                            <span className="font-semibold text-foreground dark:text-gray-100">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td>{product.units}</td>
                        <td>৳{product.revenue.toLocaleString()}</td>
                        <td>
                          {product.rating !== null ? product.rating.toFixed(1) : 'N/A'}
                        </td>
                        <td>
                          <span
                            className={`font-medium ${
                              product.stock === 'In Stock'
                                ? 'text-green-600 dark:text-green-400'
                                : product.stock === 'Low'
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-6 space-y-4 transition-colors">
            <h2 className="text-lg font-semibold text-foreground dark:text-gray-100 transition-colors">
              Performance Highlights
            </h2>
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                <span>Best revenue day</span>
                <span className="dark:text-gray-200 font-medium">
                  {bestRevenuePoint
                    ? `${bestRevenuePoint.label} · ৳${bestRevenuePoint.revenue.toLocaleString()}`
                    : 'No data'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                <span>Top category</span>
                <span className="dark:text-gray-200 font-medium">
                  {topCategory || 'No category data'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                <span>Restock candidate</span>
                <span className="dark:text-gray-200 font-medium">
                  {restockCandidate ? restockCandidate.name : 'None right now'}
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-border dark:border-slate-800 bg-muted dark:bg-slate-950 p-4 text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
              Real-time map and traffic analytics are planned for a future release.
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <InfoCard title="Customer Analytics" items={customerItems} />
          <InfoCard title="RFQ Analytics" items={rfqItems} />
          <InfoCard title="Inventory Insights" items={inventoryItems} />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-foreground">
                Insights & Recommendations
              </h2>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li>
                Revenue is {revenueChange >= 0 ? 'up' : 'down'} {Math.abs(revenueChange)}%
                vs the previous comparable period.
              </li>
              <li>
                Delivery completion is {deliveryRate}% for {RANGE_LABELS[range].toLowerCase()}.
              </li>
              <li>
                {inventory.lowStock > 0 || inventory.outOfStock > 0
                  ? `${inventory.lowStock + inventory.outOfStock} product(s) need inventory attention.`
                  : 'Inventory levels look healthy across all active products.'}
              </li>
              <li>
                {topCategory
                  ? `Top revenue category this period: ${topCategory}.`
                  : 'Not enough category data yet to determine a top category.'}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Reports & Exports
              </h2>
              <button className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <Download size={16} />
                Export Report
              </button>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <button className="rounded-lg border border-border px-3 py-2">
                PDF
              </button>
              <button className="rounded-lg border border-border px-3 py-2">
                Excel
              </button>
              <button className="rounded-lg border border-border px-3 py-2">
                CSV
              </button>
              <button className="rounded-lg border border-border px-3 py-2">
                Email report
              </button>
            </div>
          </div>
        </section>
      </div>
    </SellerProtectedRoute>
  )
}

function KpiCard({
  title,
  value,
  change,
  subtitle,
  spark,
  compare,
}: {
  title: string
  value: string
  change?: number
  subtitle?: string
  spark?: Array<number>
  compare?: boolean
}) {
  const trendUp = change !== undefined && change >= 0
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <p className="text-xs uppercase text-muted-foreground">{title}</p>
      <div className="flex items-center justify-between">
        <p className="text-xl font-semibold text-foreground">{value}</p>
        {change !== undefined && (
          <span
            className={`text-xs font-semibold ${trendUp ? 'text-green-600' : 'text-red-500'}`}
          >
            {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {compare && change !== undefined && (
        <p className="text-xs text-muted-foreground">vs previous period</p>
      )}
      {spark && spark.length > 1 && (
        <div className="h-10 min-h-[40px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={spark.map((point, index) => ({ index, value: point }))}
            >
              <Area
                type="monotone"
                dataKey="value"
                stroke="#f97316"
                fill="#fde7d0"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function InfoCard({
  title,
  items,
}: {
  title: string
  items: Array<{ label: string; value: string }>
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span>{item.label}</span>
            <span className="font-semibold text-foreground">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
