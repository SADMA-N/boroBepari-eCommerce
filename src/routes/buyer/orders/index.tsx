import { Link, createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowUpDown,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Loader2,
  Package,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { format } from 'date-fns'
import type { MouseEvent } from 'react'
import type { BuyerOrdersFilter } from '@/lib/order-actions'
import { formatBDT } from '@/data/mock-products'
import { getBuyerOrders } from '@/lib/order-actions'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'

export const Route = createFileRoute('/buyer/orders/')({
  component: BuyerOrderHistoryPage,
})

type FilterTab = 'all' | 'active' | 'delivered' | 'cancelled'
type SortOption =
  | 'date_desc'
  | 'date_asc'
  | 'amount_desc'
  | 'amount_asc'
  | 'status'

const sortOptions: Array<{ value: SortOption; label: string }> = [
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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [orders, setOrders] = useState<Array<any>>([])
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
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

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
    if (page === 1) {
      setIsLoading(true)
    } else {
      setIsLoadingMore(true)
    }
    try {
      const result = await getBuyerOrders({
        filter: activeTab,
        search: debouncedSearch,
        sortBy,
        page,
        limit: 10,
      })
      const filteredOrders = filterOrdersByTab(result.orders, activeTab)
      setOrders((prev) => {
        if (page === 1) return filteredOrders
        const existingIds = new Set(prev.map((o) => o.id))
        const merged = filteredOrders.filter((o) => !existingIds.has(o.id))
        return [...prev, ...merged]
      })
      setPagination(result.pagination)
      setCounts(result.counts)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [activeTab, debouncedSearch, page, sortBy])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return

    fetchOrders()
  }, [
    isAuthenticated,
    authLoading,
    activeTab,
    debouncedSearch,
    sortBy,
    page,
    fetchOrders,
  ])

  useEffect(() => {
    if (!isAuthenticated || authLoading) return
    const interval = setInterval(() => {
      fetchOrders()
    }, 60000)
    return () => clearInterval(interval)
  }, [fetchOrders, isAuthenticated, authLoading])

  useEffect(() => {
    if (!loadMoreRef.current) return
    if (!pagination.hasNext) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isLoading) {
          setPage((prev) => Math.min(prev + 1, pagination.totalPages))
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [isLoading, isLoadingMore, pagination.hasNext, pagination.totalPages])

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
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Sign in to view your orders
          </h2>
          <p className="text-muted-foreground mb-6">
            Please log in to access your order history
          </p>
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
    <div className="max-w-[1440px] mx-auto px-6 py-8 transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-white flex items-center gap-2 transition-colors">
            Order History
            {orderUnreadCount > 0 && (
              <span className="text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full transition-colors">
                {orderUnreadCount} updates
              </span>
            )}
          </h1>
          <p className="text-muted-foreground dark:text-muted-foreground text-sm mt-1 transition-colors">
            Track and manage your orders
          </p>
        </div>
        <Link
          to="/"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 transition flex items-center justify-center gap-2 shadow-sm shadow-orange-500/20"
        >
          <ShoppingBag size={18} />
          Continue Shopping
        </Link>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-card dark:bg-slate-900 rounded-lg shadow-sm border border-border dark:border-slate-800 mb-6 transition-colors">
        {/* Filter Tabs */}
        <div className="border-b dark:border-slate-800 px-4 overflow-x-auto">
          <div className="flex space-x-6 min-w-max">
            {(
              [
                { key: 'all', label: 'All Orders' },
                { key: 'active', label: 'Active' },
                { key: 'delivered', label: 'Delivered' },
                { key: 'cancelled', label: 'Cancelled/Returned' },
              ] as Array<{ key: FilterTab; label: string }>
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-orange-500 text-orange-600 dark:text-orange-500'
                    : 'border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-gray-200 hover:border-border dark:hover:border-slate-700'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    activeTab === tab.key
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500'
                      : 'bg-gray-100 dark:bg-slate-800 text-muted-foreground dark:text-muted-foreground'
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
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground dark:text-muted-foreground">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by order number or product name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border dark:border-slate-700 bg-card dark:bg-slate-800 text-foreground dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all"
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
                className="appearance-none pl-3 pr-10 py-2 border border-border dark:border-slate-700 rounded-lg text-sm bg-card dark:bg-slate-800 text-foreground dark:text-white focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer transition-all"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground pointer-events-none"
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
          <div ref={loadMoreRef} />
          {isLoadingMore && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground dark:text-muted-foreground">
              Loading more orders...
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && orders.length > 0 && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between transition-colors">
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(
              pagination.page * pagination.limit,
              pagination.totalCount,
            )}{' '}
            of {pagination.totalCount} orders
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="p-2 border border-border dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted dark:hover:bg-slate-800 text-muted-foreground dark:text-muted-foreground transition-all"
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
                        <span className="px-2 text-muted-foreground dark:text-muted-foreground">
                          ...
                        </span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          p === pagination.page
                            ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                            : 'hover:bg-muted dark:hover:bg-slate-800 text-foreground dark:text-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  )
                })}
            </div>

            <button
              onClick={() =>
                setPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={!pagination.hasNext}
              className="p-2 border border-border dark:border-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted dark:hover:bg-slate-800 text-muted-foreground dark:text-muted-foreground transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function filterOrdersByTab(orders: Array<any>, tab: FilterTab) {
  const currentTab = String(tab)
  if (currentTab === 'all') return orders

  const activeStatuses = [
    'placed',
    'confirmed',
    'processing',
    'shipped',
    'out_for_delivery',
    'pending',
  ]
  const deliveredStatuses = ['delivered']
  const cancelledStatuses = ['cancelled', 'returned']

  if (currentTab === 'active') {
    return orders.filter((order) => activeStatuses.includes(order.status))
  }

  if (currentTab === 'delivered') {
    return orders.filter((order) => deliveredStatuses.includes(order.status))
  }

  if (currentTab === 'cancelled') {
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
  const productImages =
    order.items?.slice(0, 3).map((item: any) => ({
      name: item.product?.name || 'Product',
      image:
        item.product?.images?.[0] ||
        `https://picsum.photos/seed/product${item.productId}/100/100`,
    })) || []

  return (
    <Link
      to={`/buyer/orders/${order.id}`}
      className="block bg-card dark:bg-slate-900 rounded-lg shadow-sm border border-border dark:border-slate-800 hover:shadow-md hover:border-border dark:hover:border-slate-700 transition-all group"
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Order info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-sm font-mono font-bold text-muted-foreground dark:text-muted-foreground bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded transition-colors">
                #{order.id.toString().padStart(6, '0')}
              </span>
              <span className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center gap-1 transition-colors">
                <Calendar size={14} />
                {format(createdAt, 'MMM d, yyyy')}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                  statusStyles[order.status] ||
                  'bg-gray-100 dark:bg-slate-800 text-foreground dark:text-gray-200'
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
                    className="w-12 h-12 rounded-lg border-2 border-white dark:border-slate-900 object-cover shadow-sm transition-colors"
                  />
                ))}
                {itemCount > 3 && (
                  <div className="w-12 h-12 rounded-lg border-2 border-white dark:border-slate-900 bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-xs font-medium text-muted-foreground dark:text-muted-foreground shadow-sm transition-colors">
                    +{itemCount - 3}
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                <span className="font-medium text-foreground dark:text-gray-200">
                  {itemCount}
                </span>{' '}
                {itemCount === 1 ? 'item' : 'items'}
              </div>
            </div>
          </div>

          {/* Right: Amount & Action */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-muted-foreground dark:text-muted-foreground uppercase font-semibold mb-1 transition-colors">
                Total Amount
              </div>
              <div className="text-xl font-bold text-foreground dark:text-white transition-colors">
                {formatBDT(totalAmount)}
              </div>
            </div>
            {order.invoiceUrl && (
              <button
                onClick={handleDownloadInvoice}
                className="hidden sm:inline-flex items-center gap-2 px-3 py-2 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors text-sm font-medium"
              >
                <FileText size={16} />
                Invoice
              </button>
            )}
            <ChevronRight
              size={24}
              className="text-gray-300 dark:text-foreground group-hover:text-orange-500 transition-colors"
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
    <div className="bg-card dark:bg-slate-900 rounded-lg border border-dashed border-border dark:border-slate-700 p-16 text-center transition-colors">
      <div className="mx-auto w-20 h-20 bg-muted dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 transition-colors">
        <Package
          size={40}
          className="text-gray-300 dark:text-muted-foreground transition-colors"
        />
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-2 transition-colors">
            No orders found
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground mb-6 transition-colors">
            Try adjusting your search or filter criteria
          </p>
          <button
            onClick={onClearFilters}
            className="inline-flex items-center px-4 py-2 border border-border dark:border-slate-700 text-foreground dark:text-gray-300 font-medium rounded-lg hover:bg-muted dark:hover:bg-slate-800 transition-all"
          >
            Clear Filters
          </button>
        </>
      ) : (
        <>
          <h3 className="text-xl font-bold text-foreground dark:text-white mb-2 transition-colors">
            No orders yet
          </h3>
          <p className="text-muted-foreground dark:text-muted-foreground mb-6 transition-colors">
            Start shopping to see your orders here
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20"
          >
            <ShoppingBag size={18} className="mr-2" />
            Start Shopping
          </Link>
        </>
      )}
    </div>
  )
}
