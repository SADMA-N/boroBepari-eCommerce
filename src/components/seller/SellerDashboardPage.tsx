import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  BarChart3,
  Box,
  ClipboardList,
  DollarSign,
  FileText,
  LineChart as LineIcon,
  PackagePlus,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import {
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
import { useSellerAuth } from '@/contexts/SellerAuthContext'
import { BadgeCheck, CheckCircle2, XCircle, Info as InfoIcon } from 'lucide-react'

type DateRange = 'today' | '7d' | '30d' | 'custom'

const METRIC_ICON_CLASSES =
  'h-9 w-9 rounded-lg flex items-center justify-center'

const ORDER_STATUS_COLORS = {
  Confirmed: '#16a34a',
  Processing: '#f97316',
  Shipped: '#2563eb',
  Delivered: '#0f766e',
} as const

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  custom: 'Custom Range',
}

export function SellerDashboardPage() {
  const navigate = useNavigate()
  const { seller } = useSellerAuth()
  const [range, setRange] = useState<DateRange>('7d')
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState([
    {
      id: 'stock',
      type: 'warning',
      message: '3 products are running low on stock (<10 units).',
    },
    {
      id: 'kyc',
      type: 'info',
      message: 'KYC renewal required in 30 days. Prepare updated documents.',
    },
    {
      id: 'system',
      type: 'success',
      message:
        'New seller analytics dashboard is live for all verified stores.',
    },
  ])

  useEffect(() => {
    setLoading(true)
    const timer = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(timer)
  }, [range])

  const metrics = useMemo(() => {
    if (range === 'today') {
      return {
        orders: { value: 12, trend: 8 },
        revenue: { value: 58000, trend: 5 },
        listings: { value: 128, trend: 0 },
        rfqs: { value: 4, trend: -12, urgent: 1 },
      }
    }
    if (range === '30d') {
      return {
        orders: { value: 420, trend: 18 },
        revenue: { value: 2450000, trend: 22 },
        listings: { value: 132, trend: 4 },
        rfqs: { value: 22, trend: 9, urgent: 2 },
      }
    }
    if (range === 'custom') {
      return {
        orders: { value: 280, trend: 12 },
        revenue: { value: 1600000, trend: 15 },
        listings: { value: 130, trend: 2 },
        rfqs: { value: 16, trend: -3, urgent: 1 },
      }
    }
    return {
      orders: { value: 96, trend: 14 },
      revenue: { value: 640000, trend: 9 },
      listings: { value: 129, trend: 1 },
      rfqs: { value: 8, trend: 6, urgent: 1 },
    }
  }, [range])

  const revenueData = useMemo(() => {
    if (range === 'today') {
      return [
        { date: '9 AM', revenue: 4000 },
        { date: '11 AM', revenue: 7200 },
        { date: '1 PM', revenue: 9800 },
        { date: '3 PM', revenue: 12000 },
        { date: '5 PM', revenue: 18000 },
        { date: '7 PM', revenue: 58000 },
      ]
    }
    if (range === '30d') {
      return [
        { date: 'Week 1', revenue: 520000 },
        { date: 'Week 2', revenue: 600000 },
        { date: 'Week 3', revenue: 640000 },
        { date: 'Week 4', revenue: 690000 },
      ]
    }
    if (range === 'custom') {
      return [
        { date: 'Day 1', revenue: 120000 },
        { date: 'Day 2', revenue: 140000 },
        { date: 'Day 3', revenue: 95000 },
        { date: 'Day 4', revenue: 170000 },
        { date: 'Day 5', revenue: 210000 },
      ]
    }
    return [
      { date: 'Mon', revenue: 82000 },
      { date: 'Tue', revenue: 90000 },
      { date: 'Wed', revenue: 76000 },
      { date: 'Thu', revenue: 102000 },
      { date: 'Fri', revenue: 110000 },
      { date: 'Sat', revenue: 95000 },
      { date: 'Sun', revenue: 85000 },
    ]
  }, [range])

  const orderStatusData = useMemo(
    () => [
      { name: 'Confirmed', value: 38 },
      { name: 'Processing', value: 26 },
      { name: 'Shipped', value: 18 },
      { name: 'Delivered', value: 14 },
    ],
    [],
  )

  const recentOrders = [
    {
      id: '#BB-1041',
      buyer: 'Shahjalal Traders',
      items: 12,
      amount: 125000,
      status: 'Processing',
      date: 'Feb 2, 2026',
    },
    {
      id: '#BB-1039',
      buyer: 'Meghna Distributors',
      items: 6,
      amount: 82000,
      status: 'Confirmed',
      date: 'Feb 2, 2026',
    },
    {
      id: '#BB-1037',
      buyer: 'Karim Wholesale',
      items: 4,
      amount: 54000,
      status: 'Shipped',
      date: 'Feb 1, 2026',
    },
    {
      id: '#BB-1033',
      buyer: 'Metro Retail',
      items: 7,
      amount: 91000,
      status: 'Delivered',
      date: 'Jan 31, 2026',
    },
    {
      id: '#BB-1031',
      buyer: 'CityMart Ltd.',
      items: 3,
      amount: 46000,
      status: 'Processing',
      date: 'Jan 31, 2026',
    },
  ]

  const rfqs = [
    {
      id: 'rfq-1',
      product: 'Industrial Safety Gloves',
      quantity: '1,200 pairs',
      price: '৳120 / pair',
      timeLeft: '6h 45m',
    },
    {
      id: 'rfq-2',
      product: 'HDPE Packaging Bags',
      quantity: '5,000 units',
      price: '৳18 / unit',
      timeLeft: '12h 10m',
    },
    {
      id: 'rfq-3',
      product: 'Cotton T-Shirts (Bulk)',
      quantity: '800 pieces',
      price: '৳210 / piece',
      timeLeft: '1d 4h',
    },
  ]

  return (
    <SellerProtectedRoute>
      <div className="space-y-8">
        <VerificationStatus seller={seller} />

        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
              Seller Dashboard
            </h1>
            <p className="text-slate-500 dark:text-gray-400 mt-1 transition-colors">
              Track performance and respond to buyer activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as DateRange)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-colors"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {RANGE_LABELS[range]}
            </span>
          </div>
        </section>

        {alerts.length > 0 && (
          <section className="rounded-2xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/20 p-4 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 text-sm text-orange-800 dark:text-orange-300"
                  >
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAlerts([])}
                className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<ShoppingCart size={18} />}
            label="Total Orders"
            value={metrics.orders.value}
            trend={metrics.orders.trend}
            onClick={() => navigate({ to: '/seller/orders' })}
          />
          <MetricCard
            icon={<DollarSign size={18} />}
            label="Revenue"
            value={`৳${metrics.revenue.value.toLocaleString()}`}
            trend={metrics.revenue.trend}
            onClick={() => navigate({ to: '/seller/analytics' })}
          />
          <MetricCard
            icon={<Box size={18} />}
            label="Active Listings"
            value={metrics.listings.value}
            trend={metrics.listings.trend}
            onClick={() => navigate({ to: '/seller/products' })}
          />
          <MetricCard
            icon={<ClipboardList size={18} />}
            label="Pending RFQs"
            value={metrics.rfqs.value}
            trend={metrics.rfqs.trend}
            urgent={metrics.rfqs.urgent}
            onClick={() => navigate({ to: '/seller/rfqs' })}
          />
        </section>

        <section className="grid lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Revenue
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Daily revenue trend
                </p>
              </div>
              <LineIcon
                size={18}
                className="text-slate-400 dark:text-slate-500"
              />
            </div>
            <div className="mt-4 h-64">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e2e8f0"
                      className="dark:stroke-slate-800"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#94a3b8"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(15, 23, 42)',
                        borderColor: 'rgb(30, 41, 59)',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [
                        `৳${value.toLocaleString()}`,
                        'Revenue',
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#f97316' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Order Status
                </h2>
                <p className="text-sm text-slate-500 dark:text-gray-400">
                  Breakdown by fulfillment stage
                </p>
              </div>
              <BarChart3
                size={18}
                className="text-slate-400 dark:text-slate-500"
              />
            </div>
            <div className="mt-4 h-64">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {orderStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            ORDER_STATUS_COLORS[
                              entry.name as keyof typeof ORDER_STATUS_COLORS
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgb(15, 23, 42)',
                        borderColor: 'rgb(30, 41, 59)',
                        color: '#fff',
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 dark:text-gray-400 transition-colors">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        ORDER_STATUS_COLORS[
                          item.name as keyof typeof ORDER_STATUS_COLORS
                        ],
                    }}
                  />
                  <span>{item.name}</span>
                  <span className="ml-auto font-semibold dark:text-gray-200">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[2fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                Recent Orders
              </h2>
              <Link
                to="/seller/orders"
                className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton />
              ) : recentOrders.length === 0 ? (
                <EmptyState
                  icon={<FileText size={24} />}
                  label="No recent orders"
                />
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 dark:text-slate-500">
                    <tr>
                      <th className="py-2">Order</th>
                      <th>Buyer</th>
                      <th>Items</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-gray-400 transition-colors">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 font-medium text-slate-800 dark:text-gray-200">
                          {order.id}
                        </td>
                        <td>{order.buyer}</td>
                        <td>{order.items}</td>
                        <td>৳{order.amount.toLocaleString()}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>{order.date}</td>
                        <td>
                          <button className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                New Quote Requests
              </h2>
              <Link
                to="/seller/rfqs"
                className="text-sm font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
              >
                View All
              </Link>
            </div>
            {loading ? (
              <PanelSkeleton />
            ) : rfqs.length === 0 ? (
              <EmptyState
                icon={<ClipboardList size={24} />}
                label="No pending RFQs"
              />
            ) : (
              <div className="space-y-4">
                {rfqs.map((rfq) => (
                  <div
                    key={rfq.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-gray-200 transition-colors">
                          {rfq.product}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 transition-colors">
                          {rfq.quantity} · Target {rfq.price}
                        </p>
                      </div>
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                        {rfq.timeLeft}
                      </span>
                    </div>
                    <button className="mt-3 w-full rounded-lg border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/20 py-2 text-xs font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors">
                      Send Quote
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
              Quick Actions
            </h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ActionButton
              icon={<PackagePlus size={18} />}
              label="Add New Product"
              onClick={() => navigate({ to: '/seller/products/add' })}
            />
            <ActionButton
              icon={<ShoppingCart size={18} />}
              label="View All Orders"
              onClick={() => navigate({ to: '/seller/orders' })}
            />
            <ActionButton
              icon={<FileText size={18} />}
              label="Check RFQs"
              onClick={() => navigate({ to: '/seller/rfqs' })}
            />
            <ActionButton
              icon={<Box size={18} />}
              label="Manage Inventory"
              onClick={() => navigate({ to: '/seller/products' })}
            />
          </div>
        </section>
      </div>
    </SellerProtectedRoute>
  )
}

function MetricCard({
  icon,
  label,
  value,
  trend,
  urgent,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  trend: number
  urgent?: number
  onClick: () => void
}) {
  const trendUp = trend >= 0
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left transition-all hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div
          className={`${METRIC_ICON_CLASSES} bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 transition-colors`}
        >
          {icon}
        </div>
        <span
          className={`text-xs font-semibold ${
            trendUp
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-500 dark:text-red-400'
          }`}
        >
          {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900 dark:text-white transition-colors">
        {value}
      </div>
      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400 transition-colors">
        {label}
        {urgent && urgent > 0 && (
          <span className="rounded-full bg-red-50 dark:bg-red-900/20 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400 transition-colors">
            {urgent} urgent
          </span>
        )}
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Confirmed:
      'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    Processing:
      'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
    Shipped: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    Delivered:
      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
  }
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold transition-colors ${styles[status as keyof typeof styles]}`}
    >
      {status}
    </span>
  )
}

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-gray-200 hover:border-orange-200 dark:hover:border-orange-900 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 transition-colors">
        {icon}
      </span>
      {label}
    </button>
  )
}

function VerificationStatus({ seller }: { seller: any }) {
  const status = seller?.kycStatus || 'pending'
  const isVerified = status === 'approved'
  const isRejected = status === 'rejected'
  const isPending = status === 'pending'
  const isSubmitted = status === 'submitted'

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className={`mt-1 p-3 rounded-xl ${
            isVerified ? 'bg-green-50 dark:bg-green-900/20 text-green-600' :
            isRejected ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
            'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
          }`}>
            {isVerified ? <BadgeCheck size={24} /> :
             isRejected ? <XCircle size={24} /> :
             <AlertTriangle size={24} />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">
              Account Verification: {status.toUpperCase()}
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 transition-colors">
              {isVerified ? 'Your account is fully verified. You have full access to all features.' :
               isRejected ? 'Your verification was rejected. Please review and resubmit.' :
               isSubmitted ? 'Your documents are under review. This usually takes 24-48 hours.' :
               'Complete your profile verification to start selling on BoroBepari.'}
            </p>
          </div>
        </div>
        {!isVerified && !isSubmitted && (
          <Link
            to="/seller/kyc"
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
          >
            Complete Verification
          </Link>
        )}
        {isSubmitted && (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-medium">
            <Clock size={16} />
            Under Review
          </div>
        )}
      </div>
    </section>
  )
}

function ChartSkeleton() {
  return (
    <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="h-10 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          className="h-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-gray-400 transition-colors">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors">
        {icon}
      </div>
      <p className="text-sm">{label}</p>
    </div>
  )
}
