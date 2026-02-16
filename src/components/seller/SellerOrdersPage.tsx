import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Package, Search } from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'
import { api } from '@/api/client'

type SellerOrderListItem = any
type SellerOrderActionStatus = string

type OrderStatus =
  | 'pending'
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned'

type TabKey = 'all' | OrderStatus

const STATUS_TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
]

const statusLabelMap: Record<string, string> = {
  pending: 'New',
  placed: 'Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

const transitionMap: Partial<Record<OrderStatus, Array<SellerOrderActionStatus>>> = {
  pending: ['confirmed', 'cancelled'],
  placed: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered'],
  out_for_delivery: ['delivered'],
}

export function SellerOrdersPage() {
  const { pushToast } = useSellerToast()
  const [orders, setOrders] = useState<Array<SellerOrderListItem>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [actioningOrderId, setActioningOrderId] = useState<number | null>(null)

  const refreshOrders = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('seller_token') || ''
      const data = await api.seller.orders.list(token)
      setOrders(data)
    } catch (error) {
      console.error('Failed to load seller orders:', error)
      pushToast('Failed to load orders', 'error')
    } finally {
      setLoading(false)
    }
  }, [pushToast])

  useEffect(() => {
    void refreshOrders()
  }, [refreshOrders])

  const counts = useMemo(() => {
    const acc: Record<TabKey, number> = {
      all: orders.length,
      pending: 0,
      placed: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      returned: 0,
    }

    for (const order of orders) {
      const status = order.status
      if (Object.prototype.hasOwnProperty.call(acc, status)) {
        acc[status as TabKey] += 1
      }
    }

    return acc
  }, [orders])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return orders
      .filter((order) => (tab === 'all' ? true : order.status === tab))
      .filter((order) => {
        if (!q) return true

        const productMatch = order.lineItems.some((item) =>
          item.name.toLowerCase().includes(q),
        )

        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.buyer.name.toLowerCase().includes(q) ||
          order.buyer.email.toLowerCase().includes(q) ||
          productMatch
        )
      })
  }, [orders, query, tab])

  const handleStatusUpdate = useCallback(
    async (
      order: SellerOrderListItem,
      nextStatus: SellerOrderActionStatus,
      cancellationReason?: string,
    ) => {
      setActioningOrderId(order.id)
      try {
        const token = localStorage.getItem('seller_token') || ''
        const result = await api.seller.orders.updateStatus(
          order.id.toString(),
          { nextStatus, cancellationReason },
          token,
        )

        setOrders((prev) =>
          prev.map((item) =>
            item.id === order.id
              ? {
                  ...item,
                  status: result.order.status,
                  updatedAt: result.order.updatedAt,
                }
              : item,
          ),
        )

        pushToast(
          `Order ${order.orderNumber} updated to ${statusLabelMap[nextStatus] || nextStatus}`,
          'success',
        )
      } catch (error) {
        console.error('Order status update failed:', error)
        pushToast(
          error instanceof Error ? error.message : 'Failed to update order',
          'error',
        )
      } finally {
        setActioningOrderId(null)
      }
    },
    [pushToast],
  )

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 transition-colors">
              Orders
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 transition-colors">
              {filtered.length} orders
            </p>
          </div>
          <button
            type="button"
            onClick={() => void refreshOrders()}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Refresh
          </button>
        </header>

        <section className="flex flex-wrap gap-2">
          {STATUS_TABS.map((status) => (
            <button
              key={status.key}
              onClick={() => setTab(status.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                tab === status.key
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {status.label}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                  tab === status.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {counts[status.key]}
              </span>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 transition-colors">
          <div className="relative w-full lg:max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order, buyer, or product"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 transition-all"
            />
          </div>

          {loading ? (
            <OrderSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                      <th className="py-3 px-4">Order</th>
                      <th>Buyer</th>
                      <th>Items</th>
                      <th>Seller Total</th>
                      <th>Status</th>
                      <th>Payment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-gray-300">
                    {filtered.map((order) => (
                      <Fragment key={order.id}>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-gray-100">
                            <button
                              onClick={() =>
                                setExpanded(expanded === order.id ? null : order.id)
                              }
                              className="hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                            >
                              {order.orderNumber}
                            </button>
                          </td>
                          <td>
                            <p className="font-medium text-slate-800 dark:text-gray-100">
                              {order.buyer.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {order.buyer.email}
                            </p>
                          </td>
                          <td>{order.sellerItemsCount}</td>
                          <td>{formatBdt(order.sellerSubtotal)}</td>
                          <td>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold transition-colors ${statusBadge(
                                order.status,
                              )}`}
                            >
                              {statusLabelMap[order.status] || order.status}
                            </span>
                          </td>
                          <td className="capitalize">
                            {order.paymentStatus.replace(/_/g, ' ')}
                          </td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>
                            <ActionMenu
                              order={order}
                              disabled={actioningOrderId === order.id}
                              onAction={async (action) => {
                                if (action === 'cancelled') {
                                  const reason = window.prompt('Cancellation reason')
                                  if (reason === null) return
                                  if (!reason.trim()) {
                                    pushToast('Cancellation reason is required', 'error')
                                    return
                                  }
                                  await handleStatusUpdate(order, action, reason)
                                  return
                                }

                                await handleStatusUpdate(order, action)
                              }}
                            />
                          </td>
                        </tr>
                        {expanded === order.id && (
                          <tr>
                            <td colSpan={8} className="bg-slate-50 dark:bg-slate-900/50">
                              <OrderDetail order={order} />
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 lg:hidden">
                {filtered.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <button
                          onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                          className="text-left text-sm font-semibold text-slate-800 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-500"
                        >
                          {order.orderNumber}
                        </button>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                          {order.buyer.name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-gray-500">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold transition-colors ${statusBadge(
                          order.status,
                        )}`}
                      >
                        {statusLabelMap[order.status] || order.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-slate-600 dark:text-gray-400">
                      <span>{order.sellerItemsCount} items</span>
                      <span>{formatBdt(order.sellerSubtotal)}</span>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <ActionMenu
                        order={order}
                        disabled={actioningOrderId === order.id}
                        onAction={async (action) => {
                          if (action === 'cancelled') {
                            const reason = window.prompt('Cancellation reason')
                            if (reason === null) return
                            if (!reason.trim()) {
                              pushToast('Cancellation reason is required', 'error')
                              return
                            }
                            await handleStatusUpdate(order, action, reason)
                            return
                          }

                          await handleStatusUpdate(order, action)
                        }}
                      />

                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="text-xs text-orange-600 dark:text-orange-400"
                      >
                        {expanded === order.id ? 'Hide details' : 'View details'}
                      </button>
                    </div>

                    {expanded === order.id && (
                      <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <OrderDetail order={order} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </SellerProtectedRoute>
  )
}

function OrderDetail({ order }: { order: SellerOrderListItem }) {
  return (
    <div className="p-6 space-y-6">
      {!order.canManageStatus && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          This order contains items from multiple suppliers. Status updates are disabled for this seller.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Buyer Details</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-gray-400">
            <p>{order.buyer.name}</p>
            <p>{order.buyer.phone || 'No phone available'}</p>
            <p>{order.buyer.email}</p>
            <p>{order.buyer.address}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Order Summary</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-gray-400">
            <p>Total order amount: {formatBdt(order.totalAmount)}</p>
            <p>Seller line-item total: {formatBdt(order.sellerSubtotal)}</p>
            <p>Items for this seller: {order.sellerItemsCount}</p>
            <p>Payment: {order.paymentStatus.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-gray-100">Ordered Items</h3>
        <div className="mt-3 space-y-3">
          {order.lineItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{item.name}</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    Qty: {item.quantity} · Unit: {formatBdt(item.unitPrice)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-gray-200">{formatBdt(item.lineTotal)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ActionMenu({
  order,
  onAction,
  disabled,
}: {
  order: SellerOrderListItem
  onAction: (status: SellerOrderActionStatus) => Promise<void>
  disabled: boolean
}) {
  const options = order.canManageStatus
    ? transitionMap[order.status as OrderStatus] || []
    : []

  return (
    <div className="relative inline-flex items-center gap-2 text-xs">
      <select
        className="appearance-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-600 dark:text-gray-300 transition-colors disabled:opacity-60"
        disabled={disabled || options.length === 0}
        onChange={(event) => {
          const value = event.target.value
          if (!value) return
          event.target.value = ''
          void onAction(value as SellerOrderActionStatus)
        }}
      >
        <option value="" className="dark:bg-slate-900">
          {disabled ? 'Updating...' : options.length ? 'Actions' : 'No actions'}
        </option>
        {options.map((option) => (
          <option key={option} value={option} className="dark:bg-slate-900">
            {actionLabel(option)}
          </option>
        ))}
      </select>
      <ChevronDown size={12} className="text-slate-400 dark:text-gray-500" />
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 text-center text-slate-500 dark:text-gray-400 transition-colors">
      <Package size={28} className="mx-auto text-slate-400 dark:text-gray-500" />
      <p className="mt-3 text-sm">
        {query ? 'No orders match your search.' : 'No orders yet.'}
      </p>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  )
}

function statusBadge(status: string) {
  if (status === 'pending' || status === 'placed') {
    return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
  }
  if (status === 'confirmed') {
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
  }
  if (status === 'processing') {
    return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
  }
  if (status === 'shipped' || status === 'out_for_delivery') {
    return 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400'
  }
  if (status === 'delivered') {
    return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
  }
  return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
}

function actionLabel(status: SellerOrderActionStatus) {
  if (status === 'confirmed') return 'Confirm Order'
  if (status === 'processing') return 'Mark as Processing'
  if (status === 'shipped') return 'Mark as Shipped'
  if (status === 'out_for_delivery') return 'Mark as Out for Delivery'
  if (status === 'delivered') return 'Mark as Delivered'
  return 'Cancel Order'
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatBdt(value: number) {
  return `৳${Number(value || 0).toLocaleString('en-BD', {
    maximumFractionDigits: 2,
  })}`
}
