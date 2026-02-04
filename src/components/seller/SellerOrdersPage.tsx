import { useEffect, useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ChevronDown,
  Package,
  Search,
  X,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

type OrderStatus =
  | 'New'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'

type PaymentStatus = 'Paid' | 'Deposit Paid' | 'COD'

type Order = {
  id: string
  buyer: string
  items: number
  total: number
  status: OrderStatus
  date: string
  paymentStatus: PaymentStatus
  buyerPhone: string
  buyerEmail: string
  address: string
  paymentMethod: string
  lineItems: {
    name: string
    image: string
    quantity: number
    unitPrice: number
  }[]
  timeline: { label: string; time: string }[]
}

const ORDERS: Order[] = [
  {
    id: 'BB-1048',
    buyer: 'Shahjalal Traders',
    items: 6,
    total: 125000,
    status: 'New',
    date: 'Feb 3, 2026',
    paymentStatus: 'Deposit Paid',
    buyerPhone: '+880 1700-112233',
    buyerEmail: 'purchase@shahjalal.com',
    address: 'Warehouse 5, Tejgaon Industrial Area, Dhaka',
    paymentMethod: 'Escrow + Deposit',
    lineItems: [
      {
        name: 'Industrial Safety Gloves',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=400&auto=format&fit=crop',
        quantity: 200,
        unitPrice: 120,
      },
      {
        name: 'HDPE Packaging Bags',
        image: 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?q=80&w=400&auto=format&fit=crop',
        quantity: 500,
        unitPrice: 18,
      },
    ],
    timeline: [
      { label: 'Order placed', time: 'Feb 3, 2026 09:12 AM' },
    ],
  },
  {
    id: 'BB-1043',
    buyer: 'Metro Retail',
    items: 4,
    total: 91000,
    status: 'Processing',
    date: 'Feb 2, 2026',
    paymentStatus: 'Paid',
    buyerPhone: '+880 1700-223344',
    buyerEmail: 'ops@metroretail.com',
    address: 'Mirpur DOHS, Dhaka',
    paymentMethod: 'Card',
    lineItems: [
      {
        name: 'Stainless Steel Cookware Set',
        image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?q=80&w=400&auto=format&fit=crop',
        quantity: 30,
        unitPrice: 1250,
      },
    ],
    timeline: [
      { label: 'Order placed', time: 'Feb 1, 2026 03:12 PM' },
      { label: 'Confirmed', time: 'Feb 1, 2026 04:20 PM' },
      { label: 'Processing', time: 'Feb 2, 2026 09:00 AM' },
    ],
  },
  {
    id: 'BB-1038',
    buyer: 'Rahim Wholesale',
    items: 3,
    total: 54000,
    status: 'Shipped',
    date: 'Jan 31, 2026',
    paymentStatus: 'Paid',
    buyerPhone: '+880 1700-445566',
    buyerEmail: 'orders@rahimwholesale.com',
    address: 'Agrabad Commercial Area, Chittagong',
    paymentMethod: 'Bank Transfer',
    lineItems: [
      {
        name: 'Cotton T-Shirts Bulk Pack',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
        quantity: 200,
        unitPrice: 210,
      },
    ],
    timeline: [
      { label: 'Order placed', time: 'Jan 29, 2026 10:05 AM' },
      { label: 'Confirmed', time: 'Jan 29, 2026 11:15 AM' },
      { label: 'Processing', time: 'Jan 30, 2026 09:30 AM' },
      { label: 'Shipped', time: 'Jan 31, 2026 03:45 PM' },
    ],
  },
]

const STATUS_TABS: OrderStatus[] = [
  'New',
  'Confirmed',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
]

const PAYMENT_STATUSES: PaymentStatus[] = ['Paid', 'Deposit Paid', 'COD']

export function SellerOrdersPage() {
  const { pushToast } = useSellerToast()
  const [orders, setOrders] = useState<Order[]>(ORDERS)
  const [tab, setTab] = useState<OrderStatus>('New')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })
  const [dateRange, setDateRange] = useState('Last 7 Days')
  const [sortBy, setSortBy] = useState('Date')
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 10
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<Order | null>(null)
  const [showShip, setShowShip] = useState<Order | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      pushToast('New order received: BB-1049', 'info')
      playNotificationSound()
    }, 20000)
    return () => window.clearInterval(interval)
  }, [pushToast])

  const counts = useMemo(() => {
    return STATUS_TABS.reduce((acc, status) => {
      acc[status] = orders.filter((order) => order.status === status).length
      return acc
    }, {} as Record<OrderStatus, number>)
  }, [orders])

  const filtered = useMemo(() => {
    return orders
      .filter((order) => order.status === tab)
      .filter((order) =>
        order.id.toLowerCase().includes(query.toLowerCase()) ||
        order.buyer.toLowerCase().includes(query.toLowerCase()),
      )
      .filter((order) => (statusFilter ? order.status === statusFilter : true))
      .filter((order) => (paymentFilter ? order.paymentStatus === paymentFilter : true))
      .filter((order) => {
        const min = amountRange.min ? Number(amountRange.min) : null
        const max = amountRange.max ? Number(amountRange.max) : null
        if (min && order.total < min) return false
        if (max && order.total > max) return false
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'Amount') return b.total - a.total
        return b.id.localeCompare(a.id)
      })
  }, [orders, tab, query, statusFilter, paymentFilter, amountRange, sortBy])

  const paged = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([])
    } else {
      setSelected(filtered.map((order) => order.id))
    }
  }

  const updateStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
            <p className="text-sm text-slate-500 mt-1">
              {filtered.length} orders with applied filters
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option>Today</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom Range</option>
            </select>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option>Export CSV</option>
              <option>Export PDF</option>
            </select>
          </div>
        </header>

        <section className="flex flex-wrap gap-2">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => setTab(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                tab === status ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {status}
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {counts[status]}
              </span>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="relative w-full lg:max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search order number or buyer"
                className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Order status</option>
                {STATUS_TABS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <select
                value={paymentFilter}
                onChange={(event) => setPaymentFilter(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Payment status</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <input
                value={amountRange.min}
                onChange={(event) => setAmountRange((prev) => ({ ...prev, min: event.target.value }))}
                placeholder="Min amount"
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <input
                value={amountRange.max}
                onChange={(event) => setAmountRange((prev) => ({ ...prev, max: event.target.value }))}
                placeholder="Max amount"
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="Date">Sort by Date</option>
                <option value="Amount">Sort by Amount</option>
              </select>
            </div>
          </div>

          {loading ? (
            <OrderSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState query={query} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                {selected.length > 0 && (
                  <>
                    <span>{selected.length} selected</span>
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1"
                      onChange={(event) => {
                        const value = event.target.value as OrderStatus
                        if (!value) return
                        setOrders((prev) =>
                          prev.map((order) =>
                            selected.includes(order.id) ? { ...order, status: value } : order,
                          ),
                        )
                      }}
                    >
                      <option value="">Bulk update status</option>
                      {STATUS_TABS.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button className="rounded-lg border border-slate-200 px-2 py-1">Bulk Print</button>
                    <button className="rounded-lg border border-slate-200 px-2 py-1">Bulk Export</button>
                  </>
                )}
              </div>
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-400">
                    <tr>
                    <th className="py-3">
                      <input
                        type="checkbox"
                        checked={selected.length === filtered.length}
                        onChange={toggleAll}
                      />
                    </th>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {paged.map((order) => (
                    <>
                  <tr key={order.id} className="hover:bg-slate-50">
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={selected.includes(order.id)}
                            onChange={() => toggleSelected(order.id)}
                          />
                        </td>
                        <td className="font-semibold text-slate-800">
                          <button
                            onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                            className="hover:text-orange-600"
                          >
                            {order.id}
                          </button>
                        </td>
                        <td>{order.buyer}</td>
                        <td>{order.items}</td>
                        <td>৳{order.total.toLocaleString()}</td>
                        <td>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td>{order.date}</td>
                        <td>{order.paymentStatus}</td>
                        <td>
                          <ActionMenu
                            status={order.status}
                            onConfirm={() => setShowConfirm(order)}
                            onShip={() => setShowShip(order)}
                            onUpdateStatus={(status) => updateStatus(order.id, status)}
                            onCancel={() => {
                              const reason = window.prompt('Cancellation reason?')
                              if (!reason) return
                              updateStatus(order.id, 'Cancelled')
                              pushToast(`Order ${order.id} cancelled`, 'info')
                            }}
                          />
                        </td>
                      </tr>
                      {expanded === order.id && (
                        <tr>
                          <td colSpan={9} className="bg-slate-50">
                            <OrderDetail order={order} />
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
                </table>
              </div>
              <div className="grid gap-4 lg:hidden">
                {paged.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-slate-400">{order.id}</p>
                        <p className="font-semibold text-slate-800">{order.buyer}</p>
                        <p className="text-xs text-slate-500">{order.date}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-3 text-sm text-slate-600">
                      ৳{order.total.toLocaleString()} · {order.items} items · {order.paymentStatus}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                      >
                        Details
                      </button>
                      {order.status === 'New' && (
                        <button
                          onClick={() => setShowConfirm(order)}
                          className="rounded-lg bg-orange-600 px-3 py-2 text-xs text-white"
                        >
                          Confirm
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {filtered.length > perPage && (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>
              Page {page} of {Math.ceil(filtered.length / perPage)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(filtered.length / perPage)}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {showConfirm && (
          <ConfirmModal
            order={showConfirm}
            onClose={() => setShowConfirm(null)}
            onConfirm={(processingTime) => {
              updateStatus(showConfirm.id, 'Confirmed')
              setShowConfirm(null)
              pushToast(`Order ${showConfirm.id} confirmed (${processingTime})`, 'success')
            }}
          />
        )}

        {showShip && (
          <ShipModal
            order={showShip}
            onClose={() => setShowShip(null)}
            onSubmit={() => {
              updateStatus(showShip.id, 'Shipped')
              setShowShip(null)
              pushToast(`Order ${showShip.id} marked as shipped`, 'success')
            }}
          />
        )}
      </div>
    </SellerProtectedRoute>
  )
}

function OrderDetail({ order }: { order: Order }) {
  return (
    <div className="p-6 space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Order Information</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Order: {order.id}</p>
            <p>Date: {order.date}</p>
            <p>Payment: {order.paymentMethod}</p>
            <p>Status: {order.paymentStatus}</p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-800">Buyer Details</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>{order.buyer}</p>
            <p>{order.buyerPhone}</p>
            <p>{order.buyerEmail}</p>
            <p>{order.address}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Ordered Items</h3>
        <div className="mt-3 space-y-3">
          {order.lineItems.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                </div>
              </div>
              <p className="text-sm text-slate-700">৳{(item.quantity * item.unitPrice).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-800">Order Timeline</h3>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          {order.timeline.map((event) => (
            <div key={event.label} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>{event.label}</span>
              <span className="ml-auto text-xs text-slate-400">{event.time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Print Packing Slip</button>
        <button className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">Contact Buyer</button>
      </div>
    </div>
  )
}

function ActionMenu({
  status,
  onConfirm,
  onShip,
  onUpdateStatus,
  onCancel,
}: {
  status: OrderStatus
  onConfirm: () => void
  onShip: () => void
  onUpdateStatus: (status: OrderStatus) => void
  onCancel: () => void
}) {
  return (
    <div className="relative inline-flex items-center gap-2 text-xs">
      <select
        className="appearance-none rounded-lg border border-slate-200 px-2 py-1 text-xs"
        onChange={(event) => {
          const action = event.target.value
          if (action === 'confirm') onConfirm()
          if (action === 'processing') onUpdateStatus('Processing')
          if (action === 'shipped') onShip()
          if (action === 'cancelled') onCancel()
        }}
      >
        <option value="">Actions</option>
        <option value="view">View Details</option>
        {status === 'New' && <option value="confirm">Confirm Order</option>}
        {status !== 'Shipped' && <option value="processing">Mark as Processing</option>}
        {status === 'Processing' && <option value="shipped">Mark as Shipped</option>}
        <option value="print">Print Invoice</option>
        <option value="contact">Contact Buyer</option>
        <option value="cancelled">Cancel Order</option>
      </select>
      <ChevronDown size={12} className="text-slate-400" />
    </div>
  )
}

function ConfirmModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order
  onClose: () => void
  onConfirm: (processingTime: string) => void
}) {
  const [processingTime, setProcessingTime] = useState('2-3 days')
  return (
    <Modal onClose={onClose} title={`Confirm Order ${order.id}`}>
      <p className="text-sm text-slate-600">Confirm this order?</p>
      <select
        value={processingTime}
        onChange={(event) => setProcessingTime(event.target.value)}
        className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        <option>1-2 days</option>
        <option>2-3 days</option>
        <option>3-5 days</option>
      </select>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
          Cancel
        </button>
        <button
          onClick={() => onConfirm(processingTime)}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white"
        >
          Confirm Order
        </button>
      </div>
    </Modal>
  )
}

function ShipModal({
  order,
  onClose,
  onSubmit,
}: {
  order: Order
  onClose: () => void
  onSubmit: () => void
}) {
  const [courier, setCourier] = useState('Pathao')
  const [tracking, setTracking] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  return (
    <Modal onClose={onClose} title={`Mark ${order.id} as shipped`}>
      <div className="space-y-3 text-sm text-slate-600">
        <select
          value={courier}
          onChange={(event) => setCourier(event.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option>BlueDart</option>
          <option>Pathao</option>
          <option>RedX</option>
          <option>SteadFast</option>
        </select>
        <input
          value={tracking}
          onChange={(event) => setTracking(event.target.value)}
          placeholder="Tracking number"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          value={deliveryDate}
          onChange={(event) => setDeliveryDate(event.target.value)}
          placeholder="Estimated delivery date"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input type="file" className="w-full text-sm" />
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={!tracking}
          className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          Submit
        </button>
      </div>
    </Modal>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" autoFocus>
            <X size={16} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
      <Package size={28} className="mx-auto text-slate-400" />
      <p className="mt-3 text-sm">
        {query ? `No orders match filters` : 'No orders yet'}
      </p>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="h-12 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}

function statusBadge(status: OrderStatus) {
  if (status === 'New') return 'bg-orange-50 text-orange-700'
  if (status === 'Confirmed') return 'bg-blue-50 text-blue-700'
  if (status === 'Processing') return 'bg-purple-50 text-purple-700'
  if (status === 'Shipped') return 'bg-teal-50 text-teal-700'
  if (status === 'Delivered') return 'bg-green-50 text-green-700'
  return 'bg-red-50 text-red-600'
}

function playNotificationSound() {
  try {
    const audioCtx = new window.AudioContext()
    const oscillator = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime)
    oscillator.connect(gain)
    gain.connect(audioCtx.destination)
    oscillator.start()
    oscillator.stop(audioCtx.currentTime + 0.2)
  } catch {
    // ignore audio errors
  }
}
