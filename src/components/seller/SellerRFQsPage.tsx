import { useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  FileText,
  Filter,
  Timer,
  X,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

type RFQStatus =
  | 'New'
  | 'Quoted'
  | 'Accepted'
  | 'Rejected'
  | 'Expired'
  | 'Converted'

type RFQ = {
  id: string
  product: string
  productImage: string
  buyer: string
  quantity: number
  targetPrice: number
  location: string
  hoursLeft: number
  status: RFQStatus
  notes: string
  attachments: string[]
  category: string
  counterOffer?: number
  quote?: {
    unitPrice: number
    totalPrice: number
    validity: string
    paymentTerms: string
    deliveryTime: string
    notes: string
  }
  buyerStats?: {
    pastOrders: number
    responseRate: number
    acceptanceRate: number
  }
}

const RFQS: RFQ[] = [
  {
    id: 'RFQ-3012',
    product: 'Industrial Safety Gloves',
    productImage:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=400&auto=format&fit=crop',
    buyer: 'Shahjalal Traders',
    quantity: 1200,
    targetPrice: 110,
    location: 'Dhaka',
    hoursLeft: 4,
    status: 'New',
    notes: 'Need nitrile coated gloves, size L.',
    attachments: ['specs.pdf'],
    category: 'Industrial Supplies',
    buyerStats: {
      pastOrders: 12,
      responseRate: 82,
      acceptanceRate: 64,
    },
  },
  {
    id: 'RFQ-3009',
    product: 'HDPE Packaging Bags',
    productImage:
      'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?q=80&w=400&auto=format&fit=crop',
    buyer: 'Anonymous Buyer #2451',
    quantity: 5000,
    targetPrice: 16,
    location: 'Chittagong',
    hoursLeft: 10,
    status: 'Quoted',
    notes: 'Need delivery within 7 days.',
    attachments: [],
    category: 'Industrial Supplies',
    quote: {
      unitPrice: 18,
      totalPrice: 90000,
      validity: '14 days',
      paymentTerms: '30% deposit',
      deliveryTime: '5-7 days',
      notes: 'Includes packaging and freight.',
    },
  },
  {
    id: 'RFQ-3001',
    product: 'Cotton T-Shirts Bulk Pack',
    productImage:
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400&auto=format&fit=crop',
    buyer: 'Metro Retail',
    quantity: 800,
    targetPrice: 200,
    location: 'Khulna',
    hoursLeft: 20,
    status: 'Accepted',
    notes: 'Prefer mixed colors.',
    attachments: ['design.ai'],
    category: 'Apparel & Fashion',
    counterOffer: 205,
  },
]

const STATUS_TABS: RFQStatus[] = [
  'New',
  'Quoted',
  'Accepted',
  'Rejected',
  'Expired',
  'Converted',
]

const PAYMENT_TERMS = ['Full payment', '30% deposit', '50% deposit']
const DELIVERY_TIMES = ['2-3 days', '5-7 days', '7-10 days']

export function SellerRFQsPage() {
  const { pushToast } = useSellerToast()
  const [rfqs, setRfqs] = useState<RFQ[]>(RFQS)
  const [tab, setTab] = useState<RFQStatus>('New')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [sortBy, setSortBy] = useState('Date')
  const [dateRange, setDateRange] = useState('Last 7 Days')
  const [detail, setDetail] = useState<RFQ | null>(null)
  const [quoteModal, setQuoteModal] = useState<RFQ | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const perPage = 8

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      pushToast('New RFQ received: RFQ-3013', 'info')
    }, 25000)
    return () => window.clearInterval(interval)
  }, [pushToast])

  const counts = useMemo(() => {
    return STATUS_TABS.reduce((acc, status) => {
      acc[status] = rfqs.filter((rfq) => rfq.status === status).length
      return acc
    }, {} as Record<RFQStatus, number>)
  }, [rfqs])

  const filtered = useMemo(() => {
    return rfqs
      .filter((rfq) => rfq.status === tab)
      .filter((rfq) =>
        rfq.product.toLowerCase().includes(query.toLowerCase()) ||
        rfq.id.toLowerCase().includes(query.toLowerCase()),
      )
      .filter((rfq) => (category ? rfq.category === category : true))
      .sort((a, b) => {
        if (sortBy === 'Quantity') return b.quantity - a.quantity
        if (sortBy === 'Target Price') return b.targetPrice - a.targetPrice
        return a.id.localeCompare(b.id)
      })
  }, [rfqs, tab, query, category, sortBy])

  const paged = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  const analytics = useMemo(() => {
    const responded = rfqs.filter((rfq) => rfq.status !== 'New').length
    const accepted = rfqs.filter((rfq) => rfq.status === 'Accepted' || rfq.status === 'Converted').length
    const responseRate = Math.round((responded / rfqs.length) * 100) || 0
    const acceptanceRate = Math.round((accepted / rfqs.length) * 100) || 0
    return {
      responseRate,
      acceptanceRate,
      averageResponse: '3h 20m',
      conversionRate: Math.round((accepted / rfqs.length) * 100) || 0,
    }
  }, [rfqs])

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">RFQs</h1>
            <p className="text-sm text-slate-500 mt-1">Respond quickly to win more orders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Export</button>
          </div>
        </header>

        <section className="grid md:grid-cols-4 gap-4">
          <StatCard label="Response rate" value={`${analytics.responseRate}%`} />
          <StatCard label="Acceptance rate" value={`${analytics.acceptanceRate}%`} />
          <StatCard label="Avg response time" value={analytics.averageResponse} />
          <StatCard label="Conversion rate" value={`${analytics.conversionRate}%`} />
        </section>

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
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by product or RFQ #"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <SearchIcon />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">All categories</option>
                <option>Industrial Supplies</option>
                <option>Apparel & Fashion</option>
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option>Date</option>
                <option>Quantity</option>
                <option>Target Price</option>
              </select>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <Filter size={16} />
              Filters
            </button>
          </div>

          {loading ? (
            <RfqSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4">
              {paged.map((rfq) => (
                <div key={rfq.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <img src={rfq.productImage} alt={rfq.product} className="h-16 w-16 rounded-lg object-cover" />
                      <div>
                        <p className="text-sm text-slate-400">{rfq.id}</p>
                        <p className="text-base font-semibold text-slate-800">{rfq.product}</p>
                        <p className="text-xs text-slate-500">{rfq.buyer}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                      <InfoItem label="Quantity" value={`${rfq.quantity} units`} />
                      <InfoItem label="Target Price" value={`৳${rfq.targetPrice}`} />
                      <InfoItem label="Location" value={rfq.location} />
                      <InfoItem label="Time left" value={`${rfq.hoursLeft}h`} />
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <UrgencyBadge hoursLeft={rfq.hoursLeft} />
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(rfq.status)}`}>
                        {rfq.status}
                      </span>
                      {rfq.status === 'New' && (
                        <button
                          type="button"
                          onClick={() => setQuoteModal(rfq)}
                          className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Send Quote
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDetail(rfq)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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

        {detail && (
          <RFQDetailPanel
            rfq={detail}
            onClose={() => setDetail(null)}
            onSendQuote={() => {
              setDetail(null)
              setQuoteModal(detail)
            }}
          />
        )}

        {quoteModal && (
          <SendQuoteModal
            rfq={quoteModal}
            onClose={() => setQuoteModal(null)}
            onSend={(quote) => {
              setRfqs((prev) =>
                prev.map((item) => (item.id === quoteModal.id ? { ...item, status: 'Quoted', quote } : item)),
              )
              setQuoteModal(null)
              pushToast(`Quote sent for ${quoteModal.id}`, 'success')
            }}
          />
        )}
      </div>
    </SellerProtectedRoute>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-800">{value}</p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  )
}

function UrgencyBadge({ hoursLeft }: { hoursLeft: number }) {
  if (hoursLeft < 6) return <Badge label="Urgent" className="bg-red-50 text-red-600" />
  if (hoursLeft < 12) return <Badge label="Respond Soon" className="bg-orange-50 text-orange-600" />
  return <Badge label="New" className="bg-green-50 text-green-600" />
}

function Badge({ label, className }: { label: string; className: string }) {
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{label}</span>
}

function SearchIcon() {
  return <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
}

function statusBadge(status: RFQStatus) {
  if (status === 'New') return 'bg-orange-50 text-orange-700'
  if (status === 'Quoted') return 'bg-blue-50 text-blue-700'
  if (status === 'Accepted') return 'bg-green-50 text-green-700'
  if (status === 'Rejected') return 'bg-red-50 text-red-600'
  if (status === 'Expired') return 'bg-slate-100 text-slate-500'
  return 'bg-purple-50 text-purple-700'
}

function RFQDetailPanel({
  rfq,
  onClose,
  onSendQuote,
}: {
  rfq: RFQ
  onClose: () => void
  onSendQuote: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl bg-white p-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{rfq.id}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close details" autoFocus>
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <img src={rfq.productImage} alt={rfq.product} className="h-16 w-16 rounded-lg object-cover" />
            <div>
              <p className="text-sm text-slate-400">Product</p>
              <p className="text-base font-semibold text-slate-800">{rfq.product}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
            <InfoItem label="Quantity" value={`${rfq.quantity}`} />
            <InfoItem label="Target Price" value={`৳${rfq.targetPrice}`} />
            <InfoItem label="Delivery Location" value={rfq.location} />
            <InfoItem label="Time remaining" value={`${rfq.hoursLeft} hours`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Additional Notes</p>
            <p className="mt-1 text-sm text-slate-500">{rfq.notes}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">Attachments</p>
            {rfq.attachments.length === 0 ? (
              <p className="text-sm text-slate-400 mt-1">No attachments</p>
            ) : (
              <div className="mt-2 space-y-2">
                {rfq.attachments.map((file) => (
                  <div key={file} className="flex items-center gap-2 text-sm text-slate-600">
                    <FileText size={16} />
                    {file}
                  </div>
                ))}
              </div>
            )}
          </div>
          {rfq.buyerStats && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">Buyer history</p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <InfoItem label="Past orders" value={`${rfq.buyerStats.pastOrders}`} />
                <InfoItem label="Response rate" value={`${rfq.buyerStats.responseRate}%`} />
                <InfoItem label="Acceptance rate" value={`${rfq.buyerStats.acceptanceRate}%`} />
              </div>
            </div>
          )}
          {rfq.counterOffer && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4 text-sm text-orange-700">
              Buyer countered with ৳{rfq.counterOffer}. Respond with a new offer or accept.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSendQuote}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Send Quote
            </button>
            <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm">
              Contact Buyer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SendQuoteModal({
  rfq,
  onClose,
  onSend,
}: {
  rfq: RFQ
  onClose: () => void
  onSend: (quote: RFQ['quote']) => void
}) {
  const [unitPrice, setUnitPrice] = useState('')
  const [validity, setValidity] = useState('14 days')
  const [paymentTerms, setPaymentTerms] = useState('30% deposit')
  const [deliveryTime, setDeliveryTime] = useState('5-7 days')
  const [notes, setNotes] = useState('')

  const total = unitPrice ? Number(unitPrice) * rfq.quantity : 0
  const diff = unitPrice ? Number(unitPrice) - rfq.targetPrice : 0
  const diffPercent = unitPrice ? Math.round((diff / rfq.targetPrice) * 100) : 0

  return (
    <Modal onClose={onClose} title={`Send Quote for ${rfq.id}`}>
      <div className="space-y-4 text-sm text-slate-600">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            placeholder="Unit price (৳)"
            className="rounded-lg border border-slate-200 px-3 py-2"
          />
          <div className="rounded-lg border border-slate-200 px-3 py-2 text-slate-700">
            Total: ৳{total.toLocaleString()}
          </div>
        </div>
        <select value={validity} onChange={(event) => setValidity(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2">
          <option>7 days</option>
          <option>14 days</option>
          <option>30 days</option>
        </select>
        <select value={paymentTerms} onChange={(event) => setPaymentTerms(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2">
          {PAYMENT_TERMS.map((term) => (
            <option key={term}>{term}</option>
          ))}
        </select>
        <select value={deliveryTime} onChange={(event) => setDeliveryTime(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2">
          {DELIVERY_TIMES.map((time) => (
            <option key={time}>{time}</option>
          ))}
        </select>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Additional terms & notes"
          className="w-full rounded-lg border border-slate-200 px-3 py-2"
          rows={3}
        />
        <input type="file" className="text-sm" />
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Buyer target: ৳{rfq.targetPrice} · Your quote: ৳{unitPrice || '--'}
          {unitPrice && (
            <span className={`ml-2 font-semibold ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {diff > 0 ? '+' : ''}{diffPercent}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              onSend({
                unitPrice: Number(unitPrice),
                totalPrice: total,
                validity,
                paymentTerms,
                deliveryTime,
                notes,
              })
            }
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Send Quote
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
          >
            Save as Draft
          </button>
        </div>
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
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
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

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
      <Timer size={28} className="mx-auto text-slate-400" />
      <p className="mt-3 text-sm">No RFQs match filters</p>
    </div>
  )
}

function RfqSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((row) => (
        <div key={row} className="h-20 rounded-lg bg-slate-100 animate-pulse" />
      ))}
    </div>
  )
}
