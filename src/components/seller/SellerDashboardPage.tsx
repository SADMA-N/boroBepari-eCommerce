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
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { SellerProtectedRoute } from '@/components/seller'

type DateRange = 'today' | '7d' | '30d' | 'custom'

const METRIC_ICON_CLASSES = 'h-9 w-9 rounded-lg flex items-center justify-center'

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
  const [range, setRange] = useState<DateRange>('7d')
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState([
    { id: 'stock', type: 'warning', message: '3 products are running low on stock (<10 units).' },
    { id: 'kyc', type: 'info', message: 'KYC renewal required in 30 days. Prepare updated documents.' },
    { id: 'system', type: 'success', message: 'New seller analytics dashboard is live for all verified stores.' },
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
    <SellerProtectedRoute requireVerified>
      <div className="space-y-8">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Seller Dashboard</h1>
            <p className="text-slate-500 mt-1">Track performance and respond to buyer activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={range}
              onChange={(event) => setRange(event.target.value as DateRange)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <span className="text-xs text-slate-400">
              {RANGE_LABELS[range]}
            </span>
          </div>
        </section>

        {alerts.length > 0 && (
          <section className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-2 text-sm text-orange-800">
                    <AlertTriangle size={16} className="mt-0.5" />
                    <span>{alert.message}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAlerts([])}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700"
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
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Revenue</h2>
                <p className="text-sm text-slate-500">Daily revenue trend</p>
              </div>
              <LineIcon size={18} className="text-slate-400" />
            </div>
            <div className="mt-4 h-64">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                    <Tooltip
                      formatter={(value: number) => [`৳${value.toLocaleString()}`, 'Revenue']}
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Order Status</h2>
                <p className="text-sm text-slate-500">Breakdown by fulfillment stage</p>
              </div>
              <BarChart3 size={18} className="text-slate-400" />
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
                          fill={ORDER_STATUS_COLORS[entry.name as keyof typeof ORDER_STATUS_COLORS]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: ORDER_STATUS_COLORS[item.name as keyof typeof ORDER_STATUS_COLORS] }}
                  />
                  <span>{item.name}</span>
                  <span className="ml-auto font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid xl:grid-cols-[2fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent Orders</h2>
              <Link to="/seller/orders" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                View All
              </Link>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <TableSkeleton />
              ) : recentOrders.length === 0 ? (
                <EmptyState icon={<FileText size={24} />} label="No recent orders" />
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400">
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
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="py-3 font-medium text-slate-800">{order.id}</td>
                        <td>{order.buyer}</td>
                        <td>{order.items}</td>
                        <td>৳{order.amount.toLocaleString()}</td>
                        <td>
                          <StatusBadge status={order.status} />
                        </td>
                        <td>{order.date}</td>
                        <td>
                          <button className="text-xs font-semibold text-orange-600 hover:text-orange-700">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">New Quote Requests</h2>
              <Link to="/seller/rfqs" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                View All
              </Link>
            </div>
            {loading ? (
              <PanelSkeleton />
            ) : rfqs.length === 0 ? (
              <EmptyState icon={<ClipboardList size={24} />} label="No pending RFQs" />
            ) : (
              <div className="space-y-4">
                {rfqs.map((rfq) => (
                  <div key={rfq.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{rfq.product}</p>
                        <p className="text-xs text-slate-500">
                          {rfq.quantity} · Target {rfq.price}
                        </p>
                      </div>
                      <span className="text-xs text-orange-600 font-semibold">{rfq.timeLeft}</span>
                    </div>
                    <button className="mt-3 w-full rounded-lg border border-orange-200 bg-orange-50 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100">
                      Send Quote
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-orange-600" />
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
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
      className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-orange-200 hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className={`${METRIC_ICON_CLASSES} bg-orange-50 text-orange-600`}>
          {icon}
        </div>
        <span
          className={`text-xs font-semibold ${
            trendUp ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {trendUp ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      </div>
      <div className="mt-4 text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
        {label}
        {urgent && urgent > 0 && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
            {urgent} urgent
          </span>
        )}
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    Confirmed: 'bg-green-50 text-green-700',
    Processing: 'bg-orange-50 text-orange-700',
    Shipped: 'bg-blue-50 text-blue-700',
    Delivered: 'bg-emerald-50 text-emerald-700',
  }
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
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
      className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 hover:border-orange-200 hover:bg-orange-50"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        {icon}
      </span>
      {label}
    </button>
  )
}

function ChartSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-xl bg-slate-100" />
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="h-10 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

function PanelSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((row) => (
        <div key={row} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

function EmptyState({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <p className="text-sm">{label}</p>
    </div>
  )
}
