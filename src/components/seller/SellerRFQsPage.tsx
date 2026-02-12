import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, FileText, Filter, Search, Timer, X } from 'lucide-react'
import { format } from 'date-fns'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'
import { getSellerRfqs, sendQuote } from '@/lib/quote-server'

type RFQStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted'

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
  attachments: Array<string>
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

const RFQS: Array<RFQ> = [
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

const STATUS_TABS: Array<RFQStatus> = [
  'pending',
  'quoted',
  'accepted',
  'rejected',
  'expired',
  'converted',
]

const PAYMENT_TERMS = ['Full payment', '30% deposit', '50% deposit']
const DELIVERY_TIMES = ['2-3 days', '5-7 days', '7-10 days']

export function SellerRFQsPage() {
  const { pushToast } = useSellerToast()
  const [rfqs, setRfqs] = useState<Array<any>>([])
  const [tab, setTab] = useState<RFQStatus>('pending')
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
    const fetchRfqs = async () => {
      try {
        const token = localStorage.getItem('seller_token')
        const data = await getSellerRfqs({
          headers: { Authorization: `Bearer ${token}` },
        })
        setRfqs(data)
      } catch (error) {
        console.error('Failed to fetch seller RFQs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRfqs()
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      pushToast('New RFQ received: RFQ-3013', 'info')
    }, 25000)
    return () => window.clearInterval(interval)
  }, [pushToast])

  const counts = useMemo(() => {
    return STATUS_TABS.reduce(
      (acc, status) => {
        acc[status] = rfqs.filter((rfq) => rfq.status === status).length
        return acc
      },
      {} as Record<RFQStatus, number>,
    )
  }, [rfqs])

  const filtered = useMemo(() => {
    return rfqs
      .filter((rfq) => rfq.status === tab)
      .filter(
        (rfq) =>
          rfq.product?.name?.toLowerCase().includes(query.toLowerCase()) ||
          rfq.id.toString().includes(query.toLowerCase()),
      )
      .filter((rfq) => (category ? rfq.product?.category === category : true))
      .sort((a, b) => {
        if (sortBy === 'Quantity') return b.quantity - a.quantity
        if (sortBy === 'Target Price') return Number(b.targetPrice) - Number(a.targetPrice)
        return b.id - a.id
      })
  }, [rfqs, tab, query, category, sortBy])

  const paged = useMemo(() => {
    const start = (page - 1) * perPage
    return filtered.slice(start, start + perPage)
  }, [filtered, page])

  const analytics = useMemo(() => {
    const responded = rfqs.filter((rfq) => rfq.status !== 'pending').length
    const accepted = rfqs.filter(
      (rfq) => rfq.status === 'accepted' || rfq.status === 'converted',
    ).length
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
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100 transition-colors">
              RFQs
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1 transition-colors">
              Respond quickly to win more orders.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value)}
              className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-200 transition-colors"
            >
              <option className="dark:bg-slate-900">Today</option>
              <option className="dark:bg-slate-900">Last 7 Days</option>
              <option className="dark:bg-slate-900">Last 30 Days</option>
              <option className="dark:bg-slate-900">Custom Range</option>
            </select>
            <button className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-200 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
              Export
            </button>
          </div>
        </header>

        <section className="grid md:grid-cols-4 gap-4">
          <StatCard
            label="Response rate"
            value={`${analytics.responseRate}%`}
          />
          <StatCard
            label="Acceptance rate"
            value={`${analytics.acceptanceRate}%`}
          />
          <StatCard
            label="Avg response time"
            value={analytics.averageResponse}
          />
          <StatCard
            label="Conversion rate"
            value={`${analytics.conversionRate}%`}
          />
        </section>

        <section className="flex flex-wrap gap-2">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              onClick={() => setTab(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                tab === status
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                  : 'bg-card dark:bg-slate-900 border border-border dark:border-slate-800 text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-slate-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span
                className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === status ? 'bg-white/20' : 'bg-muted dark:bg-slate-800'}`}
              >
                {counts[status]}
              </span>
            </button>
          ))}
        </section>

        <section className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 space-y-4 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by product or RFQ #"
                  className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 text-sm text-foreground dark:text-gray-100 focus:border-orange-500 transition-all"
                />
                <SearchIcon />
              </div>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-200 transition-colors"
              >
                <option value="" className="dark:bg-slate-900">
                  All categories
                </option>
                <option className="dark:bg-slate-900">
                  Industrial Supplies
                </option>
                <option className="dark:bg-slate-900">Apparel & Fashion</option>
              </select>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-200 transition-colors"
              >
                <option className="dark:bg-slate-900">Date</option>
                <option className="dark:bg-slate-900">Quantity</option>
                <option className="dark:bg-slate-900">Target Price</option>
              </select>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-gray-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
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
              {paged.map((rfq) => {
                const acceptedQuote = rfq.status === 'accepted' ? rfq.quotes?.find((q: any) => q.status === 'accepted') : null
                const displayQuantity = acceptedQuote?.agreedQuantity || rfq.quantity
                const displayPrice = acceptedQuote?.unitPrice || rfq.targetPrice

                return (
                  <div
                    key={rfq.id}
                    className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900/50 p-4 transition-colors hover:border-orange-200 dark:hover:border-orange-900/50"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rfq.product?.images?.[0]}
                          alt={rfq.product?.name}
                          className="h-16 w-16 rounded-lg object-cover border border-border dark:border-slate-800"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                              RFQ #{rfq.id}
                            </p>
                            {rfq.quotes?.some((q: any) => q.status === 'countered') && (
                              <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                                Counter Received
                              </span>
                            )}
                          </div>
                          <p className="text-base font-semibold text-foreground dark:text-gray-100">
                            {rfq.product?.name}
                          </p>
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                            {rfq.buyer?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground dark:text-gray-300">
                        <InfoItem
                          label={acceptedQuote ? "Agreed Qty" : "Quantity"}
                          value={`${displayQuantity} units`}
                        />
                        <InfoItem
                          label={acceptedQuote ? "Accepted Price" : "Target Price"}
                          value={`৳${displayPrice}`}
                        />
                        {rfq.quotes?.find((q: any) => q.status === 'countered') && (
                          <InfoItem
                            label="Buyer's Counter"
                            value={`৳${rfq.quotes.find((q: any) => q.status === 'countered').counterPrice}`}
                          />
                        )}
                        <InfoItem label="Location" value={rfq.deliveryLocation} />
                        <InfoItem 
                          label="Date" 
                          value={format(new Date(rfq.createdAt), 'MMM d')} 
                        />
                      </div>
                      <div className="ml-auto flex items-center gap-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${statusBadge(rfq.status)}`}
                        >
                          {rfq.status}
                        </span>
                        {(rfq.status === 'pending' || rfq.quotes?.some((q: any) => q.status === 'countered')) && (
                          <button
                            type="button"
                            onClick={() => setQuoteModal(rfq)}
                            className="rounded-lg bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/10"
                          >
                            {rfq.status === 'pending' ? 'Send Quote' : 'Respond to Counter'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetail(rfq)}
                          className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-foreground dark:text-gray-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {filtered.length > perPage && (
          <div className="flex items-center justify-between text-sm text-muted-foreground dark:text-muted-foreground">
            <span>
              Page {page} of {Math.ceil(filtered.length / perPage)}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => prev - 1)}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-1 disabled:opacity-50 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page >= Math.ceil(filtered.length / perPage)}
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-1 disabled:opacity-50 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
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
            onSend={async (quoteData) => {
              try {
                const token = localStorage.getItem('seller_token')
                await sendQuote({
                  data: {
                    rfqId: quoteModal.id,
                    unitPrice: quoteData.unitPrice,
                    validityPeriod: quoteData.validityPeriod,
                    notes: quoteData.notes,
                  },
                  headers: { Authorization: `Bearer ${token}` },
                })
                
                // Refresh list
                const updated = await getSellerRfqs({
                  headers: { Authorization: `Bearer ${token}` },
                })
                setRfqs(updated)
                
                setQuoteModal(null)
                pushToast(`Quote sent for RFQ #${quoteModal.id}`, 'success')
              } catch (error: any) {
                pushToast(error.message || 'Failed to send quote', 'error')
              }
            }}
          />
        )}
      </div>
    </SellerProtectedRoute>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 transition-colors">
      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-foreground dark:text-gray-100">
        {value}
      </p>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground dark:text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground dark:text-gray-200">
        {value}
      </p>
    </div>
  )
}

function UrgencyBadge({ hoursLeft }: { hoursLeft: number }) {
  if (hoursLeft < 6)
    return (
      <Badge
        label="Urgent"
        className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
      />
    )
  if (hoursLeft < 12)
    return (
      <Badge
        label="Respond Soon"
        className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
      />
    )
  return (
    <Badge
      label="New"
      className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
    />
  )
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  )
}

function SearchIcon() {
  return (
    <Search
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground pointer-events-none"
    />
  )
}

function statusBadge(status: RFQStatus) {
  if (status === 'pending')
    return 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
  if (status === 'quoted')
    return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
  if (status === 'accepted')
    return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
  if (status === 'rejected')
    return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  if (status === 'expired')
    return 'bg-muted dark:bg-slate-800 text-muted-foreground dark:text-muted-foreground'
  return 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
}

function RFQDetailPanel({
  rfq,
  onClose,
  onSendQuote,
}: {
  rfq: any
  onClose: () => void
  onSendQuote: () => void
}) {
  const hoursLeft = useMemo(() => {
    if (!rfq?.expiresAt) return 0
    const diff = new Date(rfq.expiresAt).getTime() - Date.now()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60)))
  }, [rfq?.expiresAt])

  if (!rfq) return null

  const acceptedQuote = rfq.status === 'accepted' ? rfq.quotes?.find((q: any) => q.status === 'accepted') : null
  const displayQuantity = acceptedQuote?.agreedQuantity || rfq.quantity
  const displayPrice = acceptedQuote?.unitPrice || rfq.targetPrice

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-all"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl bg-card dark:bg-slate-900 p-6 overflow-y-auto border-l border-border dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">
              RFQ #{rfq.id}
            </h2>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase transition-colors ${statusBadge(rfq.status)}`}
            >
              {rfq.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground dark:hover:text-gray-200 transition-colors"
            aria-label="Close details"
            autoFocus
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={rfq.product?.images?.[0]}
              alt={rfq.product?.name}
              className="h-16 w-16 rounded-lg object-cover border border-border dark:border-slate-800"
            />
            <div>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Product
              </p>
              <p className="text-base font-semibold text-foreground dark:text-gray-100">
                {rfq.product?.name}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground dark:text-gray-300">
            <InfoItem 
              label={acceptedQuote ? "Agreed Quantity" : "Quantity"} 
              value={`${displayQuantity} ${rfq.product?.unit || 'units'}`} 
            />
            <InfoItem 
              label={acceptedQuote ? "Accepted Price" : "Target Price"} 
              value={`৳${displayPrice}`} 
            />
            <InfoItem label="Delivery Location" value={rfq.deliveryLocation} />
            <InfoItem label="Time remaining" value={`${hoursLeft} hours`} />
          </div>

          {acceptedQuote && (
            <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 p-4 text-sm transition-colors">
              <p className="font-bold text-green-800 dark:text-green-400 mb-2 uppercase text-[10px]">Negotiated Terms</p>
              <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <InfoItem label="Unit Price" value={`৳${acceptedQuote.unitPrice}`} />
                <InfoItem label="Delivery Time" value={acceptedQuote.deliveryTime || 'N/A'} />
                <InfoItem label="Deposit" value={`${acceptedQuote.depositPercentage}%`} />
                <InfoItem label="Total Contract" value={`৳${(Number(acceptedQuote.unitPrice) * acceptedQuote.agreedQuantity).toLocaleString()}`} />
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-foreground dark:text-gray-200">
              Additional Notes
            </p>
            <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
              {rfq.notes || 'No additional notes provided.'}
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground dark:text-gray-200">
              Attachments
            </p>
            {!rfq.attachments || rfq.attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                No attachments
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {rfq.attachments.map((file: string) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 text-sm text-muted-foreground dark:text-gray-300"
                  >
                    <FileText size={16} />
                    <a href={file} target="_blank" rel="noreferrer" className="hover:text-orange-600 underline">
                      {file.split('/').pop()}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
          {rfq.buyerStats && (
            <div className="rounded-xl border border-border dark:border-slate-800 bg-muted dark:bg-slate-900/50 p-4 text-sm text-muted-foreground dark:text-gray-300 transition-colors">
              <p className="font-semibold text-foreground dark:text-gray-200">
                Buyer history
              </p>
              <div className="mt-2 grid grid-cols-3 gap-3">
                <InfoItem
                  label="Past orders"
                  value={`${rfq.buyerStats.pastOrders}`}
                />
                <InfoItem
                  label="Response rate"
                  value={`${rfq.buyerStats.responseRate}%`}
                />
                <InfoItem
                  label="Acceptance rate"
                  value={`${rfq.buyerStats.acceptanceRate}%`}
                />
              </div>
            </div>
          )}
          {rfq.counterOffer && (
            <div className="rounded-xl border border-orange-100 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 p-4 text-sm text-orange-700 dark:text-orange-400 transition-colors">
              Buyer countered with ৳{rfq.counterOffer}. Respond with a new offer
              or accept.
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onSendQuote}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/10"
            >
              Send Quote
            </button>
            <button className="rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm dark:text-gray-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
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
  rfq: any
  onClose: () => void
  onSend: (quote: any) => Promise<void>
}) {
  const [unitPrice, setUnitPrice] = useState('')
  const [agreedQuantity, setAgreedQuantity] = useState(rfq.quantity.toString())
  const [validity, setValidity] = useState('14 days')
  const [paymentTerms, setPaymentTerms] = useState('Full payment')
  const [deliveryTime, setDeliveryTime] = useState('5-7 days')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = unitPrice ? Number(unitPrice) * Number(agreedQuantity) : 0
  const diff = unitPrice ? Number(unitPrice) - rfq.targetPrice : 0
  const diffPercent = unitPrice ? Math.round((diff / rfq.targetPrice) * 100) : 0

  const counterQuote = rfq.quotes?.find((q: any) => q.status === 'countered')

  const getDepositPercentage = (terms: string) => {
    if (terms.includes('30%')) return 30
    if (terms.includes('50%')) return 50
    return 0
  }

  return (
    <Modal onClose={onClose} title={counterQuote ? `Respond to Counter for ${rfq.id}` : `Send Quote for ${rfq.id}`}>
      <div className="space-y-4 text-sm text-muted-foreground dark:text-gray-300">
        {counterQuote && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
            <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400 mb-1">Buyer's Counter Offer</p>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300">৳{Number(counterQuote.counterPrice).toLocaleString()}</p>
            {counterQuote.counterNote && (
              <p className="mt-1 text-xs italic">"{counterQuote.counterNote}"</p>
            )}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Agreed Quantity</label>
            <input
              type="number"
              value={agreedQuantity}
              onChange={(event) => setAgreedQuantity(event.target.value)}
              placeholder="Quantity"
              className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 dark:text-gray-100 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Unit Price (৳)</label>
            <input
              value={unitPrice}
              onChange={(event) => setUnitPrice(event.target.value)}
              placeholder="Unit price (৳)"
              className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 dark:text-gray-100 transition-colors"
            />
          </div>
        </div>
        <div className="rounded-lg border border-border dark:border-slate-800 bg-muted dark:bg-slate-900 px-3 py-2 text-foreground dark:text-gray-200 flex items-center justify-between transition-colors">
          <span>Total amount:</span>
          <span className="font-bold">৳{total.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Quote Validity</label>
            <select
              value={validity}
              onChange={(event) => setValidity(event.target.value)}
              className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 dark:text-gray-100 transition-colors"
            >
              <option className="dark:bg-slate-950">7 days</option>
              <option className="dark:bg-slate-950">14 days</option>
              <option className="dark:bg-slate-950">30 days</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Payment Terms</label>
            <select
              value={paymentTerms}
              onChange={(event) => setPaymentTerms(event.target.value)}
              className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 dark:text-gray-100 transition-colors"
            >
              {PAYMENT_TERMS.map((term) => (
                <option key={term} className="dark:bg-slate-950">
                  {term}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Delivery Time</label>
          <select
            value={deliveryTime}
            onChange={(event) => setDeliveryTime(event.target.value)}
            className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 dark:text-gray-100 transition-colors"
          >
            {DELIVERY_TIMES.map((time) => (
              <option key={time} className="dark:bg-slate-950">
                {time}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Additional terms & notes"
          className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 dark:text-gray-100 transition-colors"
          rows={3}
        />
        <input type="file" className="text-sm dark:text-muted-foreground" />
        <div className="rounded-xl border border-border dark:border-slate-800 bg-muted dark:bg-slate-900/50 p-3 text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
          Buyer target: ৳{rfq.targetPrice} · Your quote: ৳{unitPrice || '--'}
          {unitPrice && (
            <span
              className={`ml-2 font-semibold ${diff > 0 ? 'text-red-500' : 'text-green-600'}`}
            >
              {diff > 0 ? '+' : ''}
              {diffPercent}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!unitPrice || isSubmitting}
            onClick={async () => {
              setIsSubmitting(true)
              const expiryDate = new Date()
              const days = parseInt(validity) || 14
              expiryDate.setDate(expiryDate.getDate() + days)

              await onSend({
                unitPrice: Number(unitPrice),
                agreedQuantity: Number(agreedQuantity),
                depositPercentage: getDepositPercentage(paymentTerms),
                deliveryTime,
                validityPeriod: expiryDate.toISOString(),
                notes,
              })
              setIsSubmitting(false)
            }}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/10 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Quote'}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            className="rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm font-semibold dark:text-gray-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 px-4 backdrop-blur-sm transition-all"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl rounded-2xl bg-card dark:bg-slate-900 p-6 shadow-xl border border-border dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-muted-foreground dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
            autoFocus
          >
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
    <div className="rounded-2xl border border-dashed border-border dark:border-slate-800 bg-muted dark:bg-slate-900/50 p-8 text-center text-muted-foreground dark:text-muted-foreground transition-colors">
      <Timer size={28} className="mx-auto text-muted-foreground dark:text-muted-foreground" />
      <p className="mt-3 text-sm">No RFQs match filters</p>
    </div>
  )
}

function RfqSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          className="h-20 rounded-lg bg-muted dark:bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  )
}
