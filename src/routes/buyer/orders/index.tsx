import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import type { MouseEvent } from 'react'
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Package,
  ShoppingBag,
  ArrowUpDown,
  Calendar,
  Filter,
  Loader2,
  FileText,
} from 'lucide-react'
import { format } from 'date-fns'
import { formatBDT } from '@/data/mock-products'
import { getBuyerOrders, type BuyerOrdersFilter } from '@/lib/order-actions'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'

export const Route = createFileRoute('/buyer/orders/')({
  component: BuyerOrderHistoryPage,
})

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled'
type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'status'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'date_desc', label: 'Newest First' },
  { value: 'date_asc', label: 'Oldest First' },
  { value: 'amount_desc', label: 'Amount: High to Low' },
  { value: 'amount_asc', label: 'Amount: Low to High' },
  { value: 'status', label: 'Status' },
]

function BuyerOrderHistoryPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { orderUnreadCount } = useNotifications()
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date_desc')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    delivered: 0,
    cancelled: 0,
  })

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getBuyerOrders({
        filter: activeTab,
        search: debouncedSearch,
        sortBy,
        page,
        limit: 10,
      })
      const filteredOrders = filterOrdersByTab(result.orders, activeTab)
      setOrders(filteredOrders)
      setPagination(result.pagination)
      setCounts(result.counts)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, debouncedSearch, page, sortBy])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    fetchOrders()
  }, [isAuthenticated, authLoading, activeTab, debouncedSearch, sortBy, page, fetchOrders])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    const interval = setInterval(() => {
      fetchOrders()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchOrders, isAuthenticated, authLoading])

  // Handle tab change
  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab)
    setPage(1)
  }

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-16">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to view your orders</h2>
          <p className="text-gray-500 mb-6">Please log in to access your order history</p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Order History
            {orderUnreadCount > 0 && (
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {orderUnreadCount} updates
              </span>
            )}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track and manage your orders
          </p>
        </div>
        <Link
          to="/"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2"
        >
          <ShoppingBag size={18} />
          Continue Shopping
        </Link>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        {/* Filter Tabs */}
        <div className="border-b px-4 overflow-x-auto">
          <div className="flex space-x-6 min-w-max">
            {(
              [
                { key: 'all', label: 'All Orders' },
                { key: 'active', label: 'Active' },
                { key: 'delivered', label: 'Delivered' },
                { key: 'cancelled', label: 'Cancelled/Returned' },
              ] as { key: FilterTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Sort */}
        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by order number or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption)
                  setPage(1)
                }}
                className="appearance-none pl-3 pr-10 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          hasFilters={!!debouncedSearch || activeTab !== 'all'}
          onClearFilters={() => {
            setSearchQuery('')
            setActiveTab('all')
            setSortBy('date_desc')
          }}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && orders.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} orders
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  // Show first, last, and pages around current
                  if (p === 1 || p === pagination.totalPages) return true
                  if (Math.abs(p - pagination.page) <= 1) return true
                  return false
                })
                .map((p, idx, arr) => {
                  // Add ellipsis
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          p === pagination.page
                            ? 'bg-orange-500 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={!pagination.hasNext}
              className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function filterOrdersByTab(orders: any[], tab: FilterTab) {
  if (tab === 'all') return orders

  const activeStatuses = ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'pending']
  const deliveredStatuses = ['delivered']
  const cancelledStatuses = ['cancelled', 'returned']

  if (tab === 'active') {
    return orders.filter((order) => activeStatuses.includes(order.status))
  }

  if (tab === 'delivered') {
    return orders.filter((order) => deliveredStatuses.includes(order.status))
  }

  if (tab === 'cancelled') {
    return orders.filter((order) => cancelledStatuses.includes(order.status))
  }

  return orders
}

function OrderCard({ order }: { order: any }) {
  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    placed: 'bg-blue-100 text-blue-800',
    confirmed: 'bg-blue-100 text-blue-800',
    processing: 'bg-purple-100 text-purple-800',
    shipped: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    returned: 'bg-orange-100 text-orange-800',
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    placed: 'Placed',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
  }

  const itemCount = order.items?.length || 0
  const totalAmount = parseFloat(order.totalAmount) || 0
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date()
  const year = createdAt.getFullYear()
  const invoiceFileName = `Invoice_BO-${year}-${order.id.toString().padStart(5, '0')}.pdf`

  const handleDownloadInvoice = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!order.invoiceUrl) return
    const link = document.createElement('a')
    link.href = order.invoiceUrl
    link.download = invoiceFileName
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  // Get first 3 product images
  const productImages = order.items
    ?.slice(0, 3)
    .map((item: any) => ({
      name: item.product?.name || 'Product',
      image: item.product?.images?.[0] || `https://picsum.photos/seed/product${item.productId}/100/100`,
    })) || []

  return (
    <Link
      to={`/buyer/orders/${order.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Order info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-sm font-mono font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                #{order.id.toString().padStart(6, '0')}
              </span>
              <span className="text-sm text-gray-400 flex items-center gap-1">
                <Calendar size={14} />
                {format(createdAt, 'MMM d, yyyy')}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusStyles[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {statusLabels[order.status] || order.status}
              </span>
            </div>

            {/* Product thumbnails */}
            <div className="flex items-center gap-3 mt-3">
              <div className="flex -space-x-3">
                {productImages.map((product: any, idx: number) => (
                  <img
                    key={idx}
                    src={product.image}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg border-2 border-white object-cover shadow-sm"
                  />
                ))}
                {itemCount > 3 && (
                  <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 shadow-sm">
                    +{itemCount - 3}
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{itemCount}</span>{' '}
                {itemCount === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          {/* Right: Amount & Action */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">
                Total Amount
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatBDT(totalAmount)}
              </div>
            </div>
            {order.invoiceUrl && (
              <button
                onClick={handleDownloadInvoice}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 border border-green-200 text-green-700 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                Invoice
              </button>
            )}
            <ChevronRight
              size={24}
              className="text-gray-300 group-hover:text-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </Link>
  )
}

function EmptyState({
  hasFilters,
  onClearFilters,
}: {
  hasFilters: boolean
  onClearFilters: () => void
}) {
  return (
    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-16 text-center">
      <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
        <Package size={40} className="text-gray-300" />
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">
            Start shopping to see your orders here
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <ShoppingBag size={18} className="mr-2" />
            Start Shopping
          </Link>
        </>
      )}
    </div>
  )
}
