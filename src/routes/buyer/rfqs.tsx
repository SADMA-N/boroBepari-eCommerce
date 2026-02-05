import { Link, createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Calendar,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  MapPin,
  MessageSquare,
  MoreVertical,
  Search,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import type { MockRfq } from '@/data/mock-rfqs'
import { mockRfqs } from '@/data/mock-rfqs'
import { formatBDT } from '@/data/mock-products'

export const Route = createFileRoute('/buyer/rfqs')({
  component: BuyerRFQInbox,
})

type RfqStatus = 'all' | 'pending' | 'quoted' | 'accepted' | 'expired'
type SortField = 'date' | 'expiry'

function BuyerRFQInbox() {
  const [activeTab, setActiveTab] = useState<RfqStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortAsc, setSortAsc] = useState(false)
  const [selectedRfq, setSelectedRfq] = useState<MockRfq | null>(null)

  // Filter and Sort Logic
  const filteredRfqs = useMemo(() => {
    let result = mockRfqs

    // Filter by Tab
    if (activeTab !== 'all') {
      result = result.filter((rfq) => rfq.status === activeTab)
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (rfq) =>
          rfq.rfqNumber.toLowerCase().includes(q) ||
          rfq.product.name.toLowerCase().includes(q),
      )
    }

    // Sort
    result = [...result].sort((a, b) => {
      let valA, valB

      if (sortField === 'date') {
        valA = a.createdAt!.getTime()
        valB = b.createdAt!.getTime()
      } else {
        // Expiry
        valA = a.expiresAt?.getTime() ?? 0
        valB = b.expiresAt?.getTime() ?? 0
      }

      return sortAsc ? valA - valB : valB - valA
    })

    return result
  }, [activeTab, searchQuery, sortField, sortAsc])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false) // Default to newest/soonest
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
            RFQ Inbox
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Manage your requests for quotation
          </p>
        </div>
        <Link
          to="/"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2"
        >
          <PlusCircleIcon size={18} />
          Create New RFQ
        </Link>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 mb-6 transition-colors">
        <div className="border-b dark:border-slate-800 px-4 overflow-x-auto transition-colors">
          <div className="flex space-x-6 min-w-max">
            {(
              [
                'all',
                'pending',
                'quoted',
                'accepted',
                'expired',
              ] as Array<RfqStatus>
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-slate-700'
                }`}
              >
                {tab}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs transition-colors ${
                    activeTab === tab
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tab === 'all'
                    ? mockRfqs.length
                    : mockRfqs.filter((r) => r.status === tab).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search by RFQ # or Product Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-slate-950 text-gray-900 dark:text-white placeholder-gray-400 transition-colors"
            />
          </div>

          <div className="flex gap-2 self-end sm:self-auto">
            <button
              onClick={() => toggleSort('date')}
              className={`px-3 py-2 border rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                sortField === 'date'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
                  : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Date <ArrowUpDown size={14} />
            </button>
            <button
              onClick={() => toggleSort('expiry')}
              className={`px-3 py-2 border rounded-md text-sm font-medium flex items-center gap-2 transition-colors ${
                sortField === 'expiry'
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
                  : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Expiry <ArrowUpDown size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* RFQ List */}
      <div className="space-y-4">
        {filteredRfqs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center transition-colors">
            <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <FileText size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No RFQs Found
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery
                ? 'Try adjusting your search terms.'
                : "You haven't submitted any RFQs yet."}
            </p>
          </div>
        ) : (
          filteredRfqs.map((rfq) => (
            <div
              key={rfq.id}
              onClick={() => setSelectedRfq(rfq)}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-4">
                  {/* Left: Basic Info */}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded transition-colors">
                        {rfq.rfqNumber}
                      </span>
                      <span className="text-sm text-gray-400">
                        {format(rfq.createdAt!, 'MMM d, yyyy')}
                      </span>
                      <StatusBadge status={rfq.status} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                      {rfq.product.name}
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-4 transition-colors">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {rfq.quantity}
                        </span>{' '}
                        {rfq.product.unit}s
                      </span>
                      <span className="w-1 h-1 bg-gray-300 dark:bg-slate-700 rounded-full" />
                      <span className="flex items-center gap-1">
                        Target:{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {formatBDT(Number(rfq.targetPrice))}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right: Stats & Countdown */}
                  <div className="flex items-center gap-6 md:text-right">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1 transition-colors">
                        Quotes Received
                      </div>
                      <div className="flex items-center md:justify-end gap-1.5">
                        <MessageSquare
                          size={18}
                          className="text-blue-500 dark:text-blue-400"
                        />
                        <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                          {rfq.quoteCount}
                        </span>
                      </div>
                    </div>

                    {['pending', 'quoted'].includes(rfq.status || '') && (
                      <div className="border-l dark:border-slate-700 pl-6 transition-colors">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1 transition-colors">
                          Expires In
                        </div>
                        <div className="flex items-center md:justify-end gap-1.5">
                          <Clock size={18} className="text-orange-500" />
                          <span
                            className={`text-xl font-bold transition-colors ${
                              differenceInDays(rfq.expiresAt!, new Date()) < 2
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-gray-900 dark:text-white'
                            }`}
                          >
                            {differenceInDays(rfq.expiresAt!, new Date())} Days
                          </span>
                        </div>
                      </div>
                    )}

                    <ChevronRight className="text-gray-300 dark:text-slate-700 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors hidden md:block" />
                  </div>
                </div>

                {/* Footer: Quick Preview */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-slate-800 text-sm transition-colors">
                  <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      {rfq.deliveryLocation}
                    </div>
                    {/* Attachments indicator if any */}
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs sm:text-sm transition-colors">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal / Slide-over */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setSelectedRfq(null)}
          />

          {/* Content */}
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300 border-l dark:border-slate-800">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
                      {selectedRfq.rfqNumber}
                    </h2>
                    <StatusBadge status={selectedRfq.status} />
                  </div>
                  <Link
                    to={`/products/${selectedRfq.product.slug}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                  >
                    {selectedRfq.product.name}
                  </Link>
                </div>
                <button
                  onClick={() => setSelectedRfq(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-gray-100 dark:bg-slate-800 rounded-full transition-colors"
                >
                  <ArrowRight className="rotate-180" size={20} />
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">
                    Quantity
                  </div>
                  <div className="font-bold text-lg dark:text-gray-100">
                    {selectedRfq.quantity}{' '}
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400 transition-colors">
                      {selectedRfq.product.unit}s
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">
                    Target Price
                  </div>
                  <div className="font-bold text-lg text-blue-600 dark:text-blue-400 transition-colors">
                    {formatBDT(Number(selectedRfq.targetPrice))}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">
                    Created Date
                  </div>
                  <div className="font-medium dark:text-gray-200">
                    {format(selectedRfq.createdAt!, 'PP')}
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg transition-colors">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1 transition-colors">
                    Delivery Location
                  </div>
                  <div
                    className="font-medium dark:text-gray-200 truncate"
                    title={selectedRfq.deliveryLocation}
                  >
                    {selectedRfq.deliveryLocation}
                  </div>
                </div>
              </div>

              {/* Quotes Section */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-between transition-colors">
                  Received Quotes
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-1 rounded-full transition-colors">
                    {selectedRfq.quotes.length}
                  </span>
                </h3>

                {selectedRfq.quotes.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-lg border border-dashed border-gray-200 dark:border-slate-700 transition-colors">
                    <MessageSquare
                      size={32}
                      className="mx-auto text-gray-300 dark:text-gray-600 mb-2"
                    />
                    <p className="text-gray-500 dark:text-gray-400">
                      No quotes received yet.
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Suppliers typically respond within 24-48 hours.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedRfq.quotes.map((quote) => (
                      <div
                        key={quote.id}
                        className="border dark:border-slate-700 rounded-lg p-4 hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={quote.supplierLogo}
                              alt=""
                              className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700"
                            />
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white transition-colors">
                                {quote.supplierName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                                Valid until{' '}
                                {format(quote.validityPeriod!, 'PP')}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-orange-600 dark:text-orange-500 transition-colors">
                              {formatBDT(Number(quote.unitPrice))}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                              per unit
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Accept Quote
                          </button>
                          <button className="flex-1 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                            Negotiate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const styles = {
    pending:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    quoted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    accepted:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    expired: 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400',
    converted:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  }

  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1)
    : 'Unknown'
  const style =
    styles[status as keyof typeof styles] ||
    'bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-gray-400'

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent transition-colors ${style}`}
    >
      {label}
    </span>
  )
}

function PlusCircleIcon({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  )
}
