import { useCallback, useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronDown,
  Clock,
  CreditCard,
  Database,
  DollarSign,
  ExternalLink,
  FileCheck,
  FileText,
  Flag,
  HardDrive,
  Package,
  RefreshCw,
  Server,
  ShoppingBag,
  ShoppingCart,
  Star,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
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
import { AdminProtectedRoute } from './AdminProtectedRoute'

// Mock data generators
const generateGMVData = (days: number) => {
  const data = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      gmv: Math.floor(Math.random() * 500000) + 200000,
      orders: Math.floor(Math.random() * 200) + 100,
    })
  }
  return data
}

const generateUserGrowthData = (days: number) => {
  const data = []
  const now = new Date()
  let buyers = 10000
  let sellers = 800
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    buyers += Math.floor(Math.random() * 50) + 10
    sellers += Math.floor(Math.random() * 5) + 1
    data.push({
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      buyers,
      sellers,
    })
  }
  return data
}

const ORDER_STATUS_DATA = [
  { name: 'Completed', value: 4500, color: '#22c55e' },
  { name: 'In Progress', value: 1200, color: '#3b82f6' },
  { name: 'Cancelled', value: 350, color: '#ef4444' },
  { name: 'Returned', value: 180, color: '#f59e0b' },
]

const RECENT_ACTIVITIES = [
  {
    id: 1,
    type: 'user',
    message: 'New user registered',
    detail: 'karim@example.com',
    time: '2 min ago',
  },
  {
    id: 2,
    type: 'order',
    message: 'New order placed',
    detail: 'Order #ORD-46012',
    time: '5 min ago',
  },
  {
    id: 3,
    type: 'kyc',
    message: 'KYC submitted',
    detail: 'Chittagong Electronics',
    time: '8 min ago',
  },
  {
    id: 4,
    type: 'dispute',
    message: 'Dispute opened',
    detail: 'Order #ORD-45998',
    time: '12 min ago',
  },
  {
    id: 5,
    type: 'flag',
    message: 'Product flagged',
    detail: 'SKU: PRD-2847',
    time: '15 min ago',
  },
  {
    id: 6,
    type: 'payout',
    message: 'Payout completed',
    detail: 'Rahim Textiles - ৳125,000',
    time: '20 min ago',
  },
  {
    id: 7,
    type: 'user',
    message: 'New seller registered',
    detail: 'Sylhet Trading Co.',
    time: '25 min ago',
  },
  {
    id: 8,
    type: 'order',
    message: 'Order delivered',
    detail: 'Order #ORD-45876',
    time: '30 min ago',
  },
  {
    id: 9,
    type: 'kyc',
    message: 'KYC approved',
    detail: 'Dhaka Wholesale Hub',
    time: '35 min ago',
  },
  {
    id: 10,
    type: 'order',
    message: 'New bulk order',
    detail: 'Order #ORD-46011 (৳450,000)',
    time: '40 min ago',
  },
]

const TOP_SELLERS = [
  {
    id: 1,
    name: 'Rahim Textiles Ltd.',
    gmv: 2450000,
    orders: 342,
    commission: 73500,
    status: 'premium',
  },
  {
    id: 2,
    name: 'Rajshahi Exports',
    gmv: 1890000,
    orders: 278,
    commission: 56700,
    status: 'verified',
  },
  {
    id: 3,
    name: 'Dhaka Wholesale Hub',
    gmv: 1650000,
    orders: 245,
    commission: 49500,
    status: 'verified',
  },
  {
    id: 4,
    name: 'Chittagong Trading',
    gmv: 1420000,
    orders: 198,
    commission: 42600,
    status: 'basic',
  },
  {
    id: 5,
    name: 'Sylhet Garments',
    gmv: 1180000,
    orders: 167,
    commission: 35400,
    status: 'verified',
  },
]

const TOP_BUYERS = [
  {
    id: 1,
    name: 'Karim Enterprises',
    orders: 89,
    spent: 1250000,
    lastOrder: '2024-04-22',
  },
  {
    id: 2,
    name: 'Fatima Trading Co.',
    orders: 76,
    spent: 980000,
    lastOrder: '2024-04-21',
  },
  {
    id: 3,
    name: 'Abdul & Sons',
    orders: 68,
    spent: 870000,
    lastOrder: '2024-04-22',
  },
  {
    id: 4,
    name: 'Nasreen Wholesale',
    orders: 54,
    spent: 720000,
    lastOrder: '2024-04-20',
  },
  {
    id: 5,
    name: 'Rafiq Industries',
    orders: 48,
    spent: 650000,
    lastOrder: '2024-04-22',
  },
]

const ALERTS = [
  {
    id: 1,
    type: 'critical',
    message: 'High payment failure rate detected (8.2%)',
    time: '10 min ago',
  },
  {
    id: 2,
    type: 'warning',
    message: 'Dispute rate increased by 15% this week',
    time: '1 hour ago',
  },
  {
    id: 3,
    type: 'info',
    message: 'Scheduled maintenance on April 25, 2:00 AM',
    time: '2 hours ago',
  },
]

const DATE_RANGES = [
  { label: 'Today', value: 'today', days: 1 },
  { label: 'Yesterday', value: 'yesterday', days: 1 },
  { label: 'Last 7 Days', value: '7d', days: 7 },
  { label: 'Last 30 Days', value: '30d', days: 30 },
  { label: 'Last 90 Days', value: '90d', days: 90 },
]

const CHART_RANGES = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
  { label: '1Y', value: 365 },
]

function getActivityIcon(type: string) {
  switch (type) {
    case 'user':
      return <UserPlus size={14} className="text-blue-500" />
    case 'order':
      return <ShoppingBag size={14} className="text-green-500" />
    case 'kyc':
      return <FileText size={14} className="text-purple-500" />
    case 'dispute':
      return <AlertTriangle size={14} className="text-red-500" />
    case 'flag':
      return <Flag size={14} className="text-orange-500" />
    case 'payout':
      return <CreditCard size={14} className="text-teal-500" />
    default:
      return <Activity size={14} className="text-slate-500" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'premium':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
          Premium
        </span>
      )
    case 'verified':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          Verified
        </span>
      )
    case 'basic':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700">
          Basic
        </span>
      )
    default:
      return null
  }
}

export function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [chartRange, setChartRange] = useState(30)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Array<number>>([])
  const [gmvData, setGmvData] = useState(() => generateGMVData(30))
  const [userGrowthData, setUserGrowthData] = useState(() =>
    generateUserGrowthData(30),
  )

  const refreshData = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      setGmvData(generateGMVData(chartRange))
      setUserGrowthData(generateUserGrowthData(chartRange))
      setLastUpdated(new Date())
      setIsRefreshing(false)
    }, 500)
  }, [chartRange])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshData])

  useEffect(() => {
    setGmvData(generateGMVData(chartRange))
    setUserGrowthData(generateUserGrowthData(chartRange))
  }, [chartRange])

  const dismissAlert = (id: number) => {
    setDismissedAlerts((prev) => [...prev, id])
  }

  const activeAlerts = ALERTS.filter((a) => !dismissedAlerts.includes(a.id))

  // Calculate metrics
  const todayGMV = gmvData[gmvData.length - 1]?.gmv || 0
  const yesterdayGMV = gmvData[gmvData.length - 2]?.gmv || 0
  const gmvChange = yesterdayGMV
    ? ((todayGMV - yesterdayGMV) / yesterdayGMV) * 100
    : 0
  const totalGMV = gmvData.reduce((sum, d) => sum + d.gmv, 0)

  const todayOrders = gmvData[gmvData.length - 1]?.orders || 0
  const totalOrders = gmvData.reduce((sum, d) => sum + d.orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalGMV / totalOrders : 0

  const commissionRate = 0.03
  const todayCommission = todayGMV * commissionRate
  const monthlyCommission = totalGMV * commissionRate

  return (
    <AdminProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600">Platform overview and key metrics</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Calendar size={16} />
                {DATE_RANGES.find((r) => r.value === dateRange)?.label}
                <ChevronDown size={16} />
              </button>
              {dateDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDateDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                    {DATE_RANGES.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value)
                          setDateDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm ${
                          dateRange === range.value
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Auto-refresh Toggle */}
            <label className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-slate-600">Auto-refresh</span>
            </label>

            {/* Manual Refresh */}
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-60"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={12} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>

        {/* Alerts Panel */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  alert.type === 'critical'
                    ? 'bg-red-50 border-red-200'
                    : alert.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'critical' ? (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        alert.type === 'critical'
                          ? 'text-red-900'
                          : alert.type === 'warning'
                            ? 'text-yellow-900'
                            : 'text-blue-900'
                      }`}
                    >
                      {alert.message}
                    </p>
                    <p className="text-xs text-slate-500">{alert.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 hover:bg-white/50 rounded"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GMV Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  gmvChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {gmvChange >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}
                {Math.abs(gmvChange).toFixed(1)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ৳{totalGMV.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">Gross Merchandise Value</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Today:{' '}
                <span className="font-medium text-slate-700">
                  ৳{todayGMV.toLocaleString()}
                </span>
              </p>
            </div>
            {/* Sparkline */}
            <div className="mt-2 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gmvData.slice(-7)}>
                  <Line
                    type="monotone"
                    dataKey="gmv"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Users Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <TrendingUp size={14} />
                +124 today
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">12,847</p>
            <p className="text-sm text-slate-500">Active Users</p>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-500">Buyers</p>
                <p className="text-sm font-medium text-slate-700">11,563</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sellers</p>
                <p className="text-sm font-medium text-slate-700">1,284</p>
              </div>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <TrendingUp size={14} />
                +18.7%
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {totalOrders.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">Total Orders</p>
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-slate-500">Today</p>
                <p className="text-sm font-medium text-slate-700">
                  {todayOrders}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Avg Value</p>
                <p className="text-sm font-medium text-slate-700">
                  ৳{avgOrderValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Commission Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <span className="text-xs font-medium text-slate-500">
                3% of GMV
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              ৳{monthlyCommission.toLocaleString()}
            </p>
            <p className="text-sm text-slate-500">Platform Commission</p>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500">
                Today:{' '}
                <span className="font-medium text-slate-700">
                  ৳{todayCommission.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/kyc"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <FileCheck className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  KYC Pending
                </p>
                <p className="text-xs text-slate-500">Awaiting review</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-red-100 text-red-700">
              47
            </span>
          </Link>

          <Link
            to="/admin/disputes"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Open Disputes
                </p>
                <p className="text-xs text-slate-500">Need resolution</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-orange-100 text-orange-700">
              23
            </span>
          </Link>

          <Link
            to="/admin/products"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Flag className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Flagged Products
                </p>
                <p className="text-xs text-slate-500">Needs review</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-red-100 text-red-700">
              12
            </span>
          </Link>

          <Link
            to="/admin/suppliers"
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Seller Verification
                </p>
                <p className="text-xs text-slate-500">Badge requests</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-700">
              8
            </span>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* GMV & Orders Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-slate-900">
                  GMV & Orders Over Time
                </h2>
                <p className="text-sm text-slate-500">
                  Revenue and order trends
                </p>
              </div>
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                {CHART_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setChartRange(range.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      chartRange === range.value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gmvData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                    tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                    formatter={(value: number, name: string) =>
                      name === 'gmv'
                        ? [`৳${value.toLocaleString()}`, 'GMV']
                        : [value, 'Orders']
                    }
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="gmv"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-slate-600">GMV</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-slate-600">Orders</span>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="mb-6">
              <h2 className="font-semibold text-slate-900">Order Status</h2>
              <p className="text-sm text-slate-500">Breakdown by status</p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ORDER_STATUS_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {ORDER_STATUS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [
                      value.toLocaleString(),
                      'Orders',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {ORDER_STATUS_DATA.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-slate-600">{item.name}</span>
                  <span className="text-xs font-medium text-slate-900 ml-auto">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="font-semibold text-slate-900">User Growth</h2>
            <p className="text-sm text-slate-500">
              Cumulative user registrations
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="buyers"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#93c5fd"
                  name="Buyers"
                />
                <Area
                  type="monotone"
                  dataKey="sellers"
                  stackId="1"
                  stroke="#22c55e"
                  fill="#86efac"
                  name="Sellers"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-sm text-slate-600">Buyers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-sm text-slate-600">Sellers</span>
            </div>
          </div>
        </div>

        {/* Tables and Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Sellers */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Top Sellers</h2>
              <Link
                to="/admin/suppliers"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View All <ExternalLink size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {TOP_SELLERS.map((seller, index) => (
                <div
                  key={seller.id}
                  className="px-6 py-3 flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-slate-400 w-5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {seller.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">
                        ৳{seller.gmv.toLocaleString()}
                      </span>
                      {getStatusBadge(seller.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {seller.orders}
                    </p>
                    <p className="text-xs text-slate-500">orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Buyers */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Top Buyers</h2>
              <Link
                to="/admin/users"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1"
              >
                View All <ExternalLink size={12} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {TOP_BUYERS.map((buyer, index) => (
                <div
                  key={buyer.id}
                  className="px-6 py-3 flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-slate-400 w-5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {buyer.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ৳{buyer.spent.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">
                      {buyer.orders}
                    </p>
                    <p className="text-xs text-slate-500">orders</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">
                  Recent Activity
                </h2>
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <button className="text-sm text-orange-600 hover:text-orange-700">
                View All
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
              {RECENT_ACTIVITIES.map((activity) => (
                <div
                  key={activity.id}
                  className="px-6 py-3 flex items-start gap-3"
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {activity.detail}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">System Health</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="p-2 rounded-lg bg-green-100">
                <Server className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  API Response
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600">
                    124ms
                  </span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="p-2 rounded-lg bg-green-100">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Database</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600">
                    Healthy
                  </span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="p-2 rounded-lg bg-yellow-100">
                <HardDrive className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Storage</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-yellow-600">68%</span>
                  <span className="text-xs text-slate-500">used</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className="p-2 rounded-lg bg-green-100">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Uptime</p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600">
                    99.98%
                  </span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
