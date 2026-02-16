import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, RefreshCw, Search } from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { api } from '@/api/client'

type AdminOrderListItem = any
type AdminOrderStatus = string
type AdminOrdersResult = any

const PAYMENT_FILTERS = [
  'all',
  'pending',
  'deposit_paid',
  'full_paid',
  'escrow_hold',
  'released',
  'failed',
] as const

function formatStatus(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function formatCurrency(value: number) {
  return `৳${Math.round(value).toLocaleString()}`
}

function statusBadgeClass(status: string) {
  if (status === 'delivered') {
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  }
  if (status === 'cancelled' || status === 'returned') {
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
  if (status === 'processing' || status === 'shipped' || status === 'out_for_delivery') {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  }
  if (status === 'confirmed') {
    return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
}

function paymentBadgeClass(status: string) {
  if (status === 'released' || status === 'full_paid') {
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  }
  if (status === 'failed') {
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  }
  if (status === 'escrow_hold' || status === 'deposit_paid') {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  }
  return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
}

function orderStatusOptions(order: AdminOrderListItem): Array<AdminOrderStatus> {
  const merged = [order.status, ...order.availableNextStatuses]
  return Array.from(new Set(merged))
}

export function AdminOrdersPage() {
  const { getToken, can } = useAdminAuth()
  const canUpdateOrders = can('orders.update')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | AdminOrderStatus>('all')
  const [paymentFilter, setPaymentFilter] =
    useState<(typeof PAYMENT_FILTERS)[number]>('all')
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'amount_desc' | 'amount_asc'
  >('newest')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null)
  const [result, setResult] = useState<AdminOrdersResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [statusDrafts, setStatusDrafts] = useState<
    Record<number, AdminOrderStatus>
  >({})
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, paymentFilter, sortBy, fromDate, toDate, limit])

  const loadOrders = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setError('Admin session not found. Please login again.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await api.admin.orders.list(token, {
        page,
        limit,
        search: search || undefined,
        status: statusFilter,
        paymentStatus: paymentFilter,
        sortBy,
        from: fromDate || undefined,
        to: toDate || undefined,
      })

      setResult(data)
      setStatusDrafts((prev) => {
        const next = { ...prev }
        for (const order of data.orders) {
          next[order.id] = order.status
        }
        return next
      })

      if (page > data.pagination.totalPages) {
        setPage(data.pagination.totalPages)
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err)
      setError('Could not load orders right now.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [
    getToken,
    page,
    limit,
    search,
    statusFilter,
    paymentFilter,
    sortBy,
    fromDate,
    toDate,
  ])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  const orders = result?.orders ?? []
  const pagination = result?.pagination
  const counts = result?.counts ?? { all: 0, active: 0, completed: 0, cancelled: 0 }

  const summaryCards = useMemo(
    () => [
      { label: 'All Orders', value: counts.all },
      { label: 'Active', value: counts.active },
      { label: 'Delivered', value: counts.completed },
      { label: 'Cancelled/Returned', value: counts.cancelled },
    ],
    [counts],
  )

  const handleUpdateOrderStatus = async (order: AdminOrderListItem) => {
    const token = getToken()
    if (!token) {
      setError('Admin session not found. Please login again.')
      return
    }

    const nextStatus = statusDrafts[order.id] ?? order.status
    if (nextStatus === order.status) {
      setNotice('Select a different status before updating.')
      return
    }

    setUpdatingOrderId(order.id)
    setError(null)
    setNotice(null)

    try {
      const response = await api.admin.orders.updateStatus(
        order.id.toString(),
        {
          status: nextStatus,
          note: noteDrafts[order.id]?.trim() || undefined, // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        },
        token,
      )

      setNotice(
        `${response.orderNumber} updated to ${formatStatus(response.status)}${response.restocked ? ' and stock restored.' : '.'}`,
      )

      void loadOrders()
    } catch (err: any) {
      console.error('Failed to update order status:', err)
      setError(err?.message || 'Failed to update order status.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatusFilter('all')
    setPaymentFilter('all')
    setSortBy('newest')
    setFromDate('')
    setToDate('')
    setLimit(20)
    setPage(1)
  }

  return (
    <AdminProtectedRoute requiredPermission="orders.view">
      <div className="space-y-6">
        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Filter platform orders and update fulfillment status.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>
        </section>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-4"
            >
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-semibold mt-1">
                {card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Search</span>
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Order #, buyer, email..."
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>
            </label>

            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Order Status</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as 'all' | AdminOrderStatus)
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </label>

            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Payment Status</span>
              <select
                value={paymentFilter}
                onChange={(event) =>
                  setPaymentFilter(
                    event.target.value as (typeof PAYMENT_FILTERS)[number],
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                {PAYMENT_FILTERS.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All' : formatStatus(option)}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Sort</span>
              <select
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as
                      | 'newest'
                      | 'oldest'
                      | 'amount_desc'
                      | 'amount_asc',
                  )
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_desc">Amount High to Low</option>
                <option value="amount_asc">Amount Low to High</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
              />
            </label>
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
              />
            </label>
            <label className="text-sm space-y-1">
              <span className="text-muted-foreground">Per Page</span>
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm hover:bg-muted"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-green-200 dark:border-green-900/40 bg-green-50 dark:bg-green-900/20 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {notice}
          </div>
        )}

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-auto">
            <table className="min-w-[1200px] w-full">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Items</th>
                  <th className="px-4 py-3">Suppliers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Update Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      <div className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Loading orders...
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      No orders matched the selected filters.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const selectedStatus = statusDrafts[order.id] ?? order.status
                    const updateDisabled =
                      !canUpdateOrders ||
                      !order.canUpdate ||
                      updatingOrderId === order.id ||
                      selectedStatus === order.status

                    return (
                      <tr
                        key={order.id}
                        className="border-t border-border align-top text-sm"
                      >
                        <td className="px-4 py-3">
                          <p className="font-semibold">{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            ID #{order.id}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{order.buyer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.buyer.email}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right">{order.itemCount}</td>
                        <td className="px-4 py-3">
                          {order.supplierNames.length > 0 ? (
                            <div className="space-y-1">
                              {order.supplierNames.slice(0, 2).map((name) => (
                                <p key={name} className="text-xs">
                                  {name}
                                </p>
                              ))}
                              {order.supplierNames.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{order.supplierNames.length - 2} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Unknown
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(
                              order.status,
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${paymentBadgeClass(
                              order.paymentStatus,
                            )}`}
                          >
                            {formatStatus(order.paymentStatus)}
                          </span>
                        </td>
                        <td className="px-4 py-3 min-w-[270px]">
                          {canUpdateOrders ? (
                            <div className="space-y-2">
                              <select
                                value={selectedStatus}
                                onChange={(event) =>
                                  setStatusDrafts((prev) => ({
                                    ...prev,
                                    [order.id]: event.target.value as AdminOrderStatus,
                                  }))
                                }
                                disabled={!order.canUpdate || updatingOrderId === order.id}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40 disabled:opacity-60"
                              >
                                {orderStatusOptions(order).map((statusOption) => (
                                  <option key={statusOption} value={statusOption}>
                                    {formatStatus(statusOption)}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                value={noteDrafts[order.id] ?? ''}
                                onChange={(event) =>
                                  setNoteDrafts((prev) => ({
                                    ...prev,
                                    [order.id]: event.target.value,
                                  }))
                                }
                                placeholder="Optional note"
                                maxLength={300}
                                disabled={!order.canUpdate || updatingOrderId === order.id}
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-400/40 disabled:opacity-60"
                              />
                              <button
                                type="button"
                                onClick={() => void handleUpdateOrderStatus(order)}
                                disabled={updateDisabled}
                                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 dark:bg-orange-500 px-3 py-2 text-xs font-medium text-white hover:bg-orange-700 dark:hover:bg-orange-400 disabled:opacity-50"
                              >
                                {updatingOrderId === order.id ? (
                                  <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update'
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No update permission
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            {pagination
              ? `Showing page ${pagination.page} of ${pagination.totalPages} (${pagination.total.toLocaleString()} total orders)`
              : 'No pagination data'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!pagination || pagination.page <= 1 || loading}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((prev) =>
                  Math.min(pagination?.totalPages ?? prev, prev + 1),
                )
              }
              disabled={
                !pagination || pagination.page >= pagination.totalPages || loading
              }
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </AdminProtectedRoute>
  )
}
