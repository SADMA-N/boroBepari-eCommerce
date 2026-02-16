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
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { api } from '@/api/client'

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
      return <Activity size={14} className="text-muted-foreground" />
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'premium':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
          Premium
        </span>
      )
    case 'verified':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
          Verified
        </span>
      )
    case 'basic':
      return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-foreground">
          Basic
        </span>
      )
    default:
      return null
  }
}

export function AdminDashboardPage() {
  const { getToken } = useAdminAuth()
  const { theme } = useTheme()
  const [dateRange, setDateRange] = useState('30d')
  const [chartRange, setChartRange] = useState(30)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)
  const [dismissedAlerts, setDismissedAlerts] = useState<Array<number>>([])
  const [dataError, setDataError] = useState<string | null>(null)
  const [gmvData, setGmvData] = useState<
    Array<{ date: string; gmv: number; orders: number }>
  >([])
  const [userGrowthData, setUserGrowthData] = useState<
    Array<{ date: string; buyers: number; sellers: number }>
  >([])
  const [orderStatusData, setOrderStatusData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([])
  const [topSellers, setTopSellers] = useState<
    Array<{
      id: number
      name: string
      gmv: number
      orders: number
      commission: number
      status: string
    }>
  >([])
  const [topBuyers, setTopBuyers] = useState<
    Array<{
      id: string
      name: string
      orders: number
      spent: number
      lastOrder: string
    }>
  >([])

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  const fetchAnalytics = useCallback(
    async (days: number) => {
      const token = getToken() || ''
      const result = await api.admin.analytics(token, days)
      setGmvData(
        Array.isArray(result.chart)
          ? result.chart
              .filter((point: unknown) => Boolean(point && typeof point === 'object'))
              .map((point: any) => ({
                date: String(point.date || ''),
                gmv: Number(point.gmv) || 0,
                orders: Number(point.orders) || 0,
              }))
          : [],
      )
      setUserGrowthData(
        Array.isArray(result.userGrowth)
          ? result.userGrowth
              .filter((point: unknown) => Boolean(point && typeof point === 'object'))
              .map((point: any) => ({
                date: String(point.date || ''),
                buyers: Number(point.buyers) || 0,
                sellers: Number(point.sellers) || 0,
              }))
          : [],
      )
      setOrderStatusData(
        Array.isArray(result.orderStatus)
          ? result.orderStatus
              .filter((point: unknown) => Boolean(point && typeof point === 'object'))
              .map((point: any) => ({
                name: String(point.name || ''),
                value: Number(point.value) || 0,
                color: String(point.color || '#9ca3af'),
              }))
          : [],
      )
      setTopSellers(
        Array.isArray(result.topSellers)
          ? result.topSellers
              .filter((seller: unknown) => Boolean(seller && typeof seller === 'object'))
              .map((seller: any) => ({
                id: Number(seller.id) || 0,
                name: String(seller.name || 'Unknown seller'),
                gmv: Number(seller.gmv) || 0,
                orders: Number(seller.orders) || 0,
                commission: Number(seller.commission) || 0,
                status:
                  seller.status === 'premium' ||
                  seller.status === 'verified' ||
                  seller.status === 'basic'
                    ? seller.status
                    : 'basic',
              }))
          : [],
      )
      setTopBuyers(
        Array.isArray(result.topBuyers)
          ? result.topBuyers
              .filter((buyer: unknown) => Boolean(buyer && typeof buyer === 'object'))
              .map((buyer: any) => ({
                id: String(buyer.id || ''),
                name: String(buyer.name || 'Unknown buyer'),
                orders: Number(buyer.orders) || 0,
                spent: Number(buyer.spent) || 0,
                lastOrder: String(buyer.lastOrder || ''),
              }))
          : [],
      )
      setLastUpdated(new Date())
    },
    [getToken],
  )

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    setDataError(null)
    try {
      await fetchAnalytics(chartRange)
    } catch (error) {
      console.error('Failed to refresh admin analytics:', error)
      setDataError('Could not load analytics data right now.')
    } finally {
      setIsRefreshing(false)
    }
  }, [chartRange, fetchAnalytics])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        void refreshData()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshData])

  useEffect(() => {
    void refreshData()
  }, [chartRange, refreshData])

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

  const latestGrowth = userGrowthData[userGrowthData.length - 1] ?? {
    date: '',
    buyers: 0,
    sellers: 0,
  }
  const previousGrowth =
    userGrowthData[userGrowthData.length - 2] ??
    latestGrowth ?? {
      date: '',
      buyers: 0,
      sellers: 0,
    }
  const buyersCount = Number(latestGrowth?.buyers) || 0
  const sellersCount = Number(latestGrowth?.sellers) || 0
  const activeUsers = buyersCount + sellersCount
  const newUsersToday = Math.max(
    0,
    (buyersCount - (Number(previousGrowth?.buyers) || 0)) +
      (sellersCount - (Number(previousGrowth?.sellers) || 0)),
  )

  const commissionRate = 0.03
  const todayCommission = todayGMV * commissionRate
  const monthlyCommission = totalGMV * commissionRate

  return (
    <AdminProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white transition-colors">
              Dashboard
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground transition-colors">
              Platform overview and key metrics
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-sm font-medium text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
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
                  <div className="absolute right-0 mt-2 w-48 bg-card dark:bg-slate-900 rounded-lg shadow-lg border border-border dark:border-slate-800 py-1 z-20 transition-colors">
                    {DATE_RANGES.map((range) => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value)
                          setChartRange(range.days)
                          setDateDropdownOpen(false)
                        }}
                        className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                          dateRange === range.value
                            ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                            : 'text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800'
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
            <label className="flex items-center gap-2 px-3 py-2 bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-lg text-sm cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-border dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
              />
              <span className="text-muted-foreground dark:text-muted-foreground">
                Auto-refresh
              </span>
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
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} />
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>

        {dataError && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {dataError}
          </div>
        )}

        {/* Alerts Panel */}
        {activeAlerts.length > 0 && (
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  alert.type === 'critical'
                    ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/20'
                    : alert.type === 'warning'
                      ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  {alert.type === 'critical' ? (
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : alert.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        alert.type === 'critical'
                          ? 'text-red-900 dark:text-red-200'
                          : alert.type === 'warning'
                            ? 'text-yellow-900 dark:text-yellow-200'
                            : 'text-blue-900 dark:text-blue-200'
                      }`}
                    >
                      {alert.message}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      {alert.time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 hover:bg-white/50 dark:hover:bg-slate-800 rounded transition-colors"
                >
                  <X size={16} className="text-muted-foreground dark:text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GMV Card */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span
                className={`flex items-center gap-1 text-xs font-medium ${
                  gmvChange >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
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
            <p className="text-2xl font-bold text-foreground dark:text-white transition-colors">
              ৳{totalGMV.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Gross Merchandise Value
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 transition-colors">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Today:{' '}
                <span className="font-medium text-foreground dark:text-slate-300">
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
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <TrendingUp size={14} />
                +{newUsersToday} today
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white transition-colors">
              {activeUsers.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Active Users
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 transition-colors grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Buyers
                </p>
                <p className="text-sm font-medium text-foreground dark:text-slate-300">
                  {buyersCount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Sellers
                </p>
                <p className="text-sm font-medium text-foreground dark:text-slate-300">
                  {sellersCount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <ShoppingCart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <TrendingUp size={14} />
                +18.7%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white transition-colors">
              {totalOrders.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Total Orders
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 transition-colors grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Today
                </p>
                <p className="text-sm font-medium text-foreground dark:text-slate-300">
                  {todayOrders}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                  Avg Value
                </p>
                <p className="text-sm font-medium text-foreground dark:text-slate-300">
                  ৳{avgOrderValue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Commission Card */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-5 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
                3% of GMV
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground dark:text-white transition-colors">
              ৳{monthlyCommission.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              Platform Commission
            </p>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 transition-colors">
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                Today:{' '}
                <span className="font-medium text-foreground dark:text-slate-300">
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
            className="flex items-center justify-between p-4 bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <FileCheck className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  KYC Pending
                </p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                  Awaiting review
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              47
            </span>
          </Link>

          <Link
            to="/admin/disputes"
            className="flex items-center justify-between p-4 bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  Open Disputes
                </p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                  Need resolution
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
              23
            </span>
          </Link>

          <Link
            to="/admin/products"
            className="flex items-center justify-between p-4 bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
                <Flag className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  Flagged Products
                </p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                  Needs review
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400">
              12
            </span>
          </Link>

          <Link
            to="/admin/suppliers"
            className="flex items-center justify-between p-4 bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-800 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  Seller Verification
                </p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                  Badge requests
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-sm font-bold rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
              8
            </span>
          </Link>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* GMV & Orders Chart */}
          <div className="lg:col-span-2 bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-foreground dark:text-white transition-colors">
                  GMV & Orders Over Time
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                  Revenue and order trends
                </p>
              </div>
              <div className="flex items-center gap-1 bg-muted dark:bg-slate-800 rounded-lg p-1 transition-colors">
                {CHART_RANGES.map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setChartRange(range.value)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                      chartRange === range.value
                        ? 'bg-card dark:bg-slate-700 text-foreground dark:text-white shadow-sm'
                        : 'text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-slate-200'
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{
                      fontSize: 12,
                      fill: isDark ? '#94a3b8' : '#64748b',
                    }}
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{
                      fontSize: 12,
                      fill: isDark ? '#94a3b8' : '#64748b',
                    }}
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                    tickFormatter={(value) => `৳${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{
                      fontSize: 12,
                      fill: isDark ? '#94a3b8' : '#64748b',
                    }}
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: isDark
                        ? '1px solid #334155'
                        : '1px solid #e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
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
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  GMV
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Orders
                </span>
              </div>
            </div>
          </div>

          {/* Order Status Breakdown */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-6 transition-colors">
            <div className="mb-6">
              <h2 className="font-semibold text-foreground dark:text-white transition-colors">
                Order Status
              </h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                Breakdown by status
              </p>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: isDark
                        ? '1px solid #334155'
                        : '1px solid #e2e8f0',
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    formatter={(value: number) => [
                      value.toLocaleString(),
                      'Orders',
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {orderStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    {item.name}
                  </span>
                  <span className="text-xs font-medium text-foreground dark:text-slate-200 ml-auto">
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-6 transition-colors">
          <div className="mb-6">
            <h2 className="font-semibold text-foreground dark:text-white transition-colors">
              User Growth
            </h2>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              Cumulative user registrations
            </p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: isDark ? '#94a3b8' : '#64748b' }}
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
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
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                Buyers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                Sellers
              </span>
            </div>
          </div>
        </div>

        {/* Tables and Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Top Sellers */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 transition-colors">
            <div className="px-6 py-4 border-b border-border dark:border-slate-800 flex items-center justify-between transition-colors">
              <h2 className="font-semibold text-foreground dark:text-white">
                Top Sellers
              </h2>
              <Link
                to="/admin/suppliers"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
              >
                View All <ExternalLink size={12} />
              </Link>
            </div>
            <div className="divide-y divide-border dark:divide-slate-800 transition-colors">
              {topSellers.map((seller, index) => (
                <div
                  key={seller.id}
                  className="px-6 py-3 flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground w-5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground dark:text-slate-200 truncate transition-colors">
                      {seller.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        ৳{seller.gmv.toLocaleString()}
                      </span>
                      {getStatusBadge(seller.status)}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                      {seller.orders}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Buyers */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 transition-colors">
            <div className="px-6 py-4 border-b border-border dark:border-slate-800 flex items-center justify-between transition-colors">
              <h2 className="font-semibold text-foreground dark:text-white">
                Top Buyers
              </h2>
              <Link
                to="/admin/users"
                className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 transition-colors"
              >
                View All <ExternalLink size={12} />
              </Link>
            </div>
            <div className="divide-y divide-border dark:divide-slate-800 transition-colors">
              {topBuyers.map((buyer, index) => (
                <div
                  key={buyer.id}
                  className="px-6 py-3 flex items-center gap-3"
                >
                  <span className="text-sm font-medium text-muted-foreground dark:text-muted-foreground w-5">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground dark:text-slate-200 truncate transition-colors">
                      {buyer.name}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                      ৳{buyer.spent.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                      {buyer.orders}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      orders
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 transition-colors">
            <div className="px-6 py-4 border-b border-border dark:border-slate-800 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-foreground dark:text-white">
                  Recent Activity
                </h2>
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <button className="text-sm text-orange-600 hover:text-orange-700 transition-colors">
                View All
              </button>
            </div>
            <div className="divide-y divide-border dark:divide-slate-800 max-h-[400px] overflow-y-auto transition-colors">
              {RECENT_ACTIVITIES.map((activity) => (
                <div
                  key={activity.id}
                  className="px-6 py-3 flex items-start gap-3"
                >
                  <div className="mt-0.5">{getActivityIcon(activity.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground dark:text-slate-200 transition-colors">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground truncate transition-colors">
                      {activity.detail}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground whitespace-nowrap transition-colors">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 p-6 transition-colors">
          <h2 className="font-semibold text-foreground dark:text-white mb-4 transition-colors">
            System Health
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted dark:bg-slate-800/50 rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  API Response
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    124ms
                  </span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted dark:bg-slate-800/50 rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  Database
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
                    Healthy
                  </span>
                  <CheckCircle size={14} className="text-green-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted dark:bg-slate-800/50 rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <HardDrive className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  Storage
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                    68%
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    used
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-muted dark:bg-slate-800/50 rounded-xl transition-colors">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                  Uptime
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-bold text-green-600 dark:text-green-400">
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
