import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  ArrowUpDown,
  ChevronRight,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Search,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import type { MockRfq } from '@/data/mock-rfqs'
import { mockRfqs } from '@/data/mock-rfqs'
import { formatBDT } from '@/data/mock-products'

type RfqStatus = 'all' | 'pending' | 'quoted' | 'accepted' | 'expired'
type SortField = 'date' | 'expiry'

export default function BuyerRFQsSection() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold dark:text-white transition-colors">
            RFQ Inbox
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">
            Manage your requests for quotation
          </p>
        </div>
        <Link
          to="/"
          className="bg-orange-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-700 transition flex items-center justify-center gap-2 text-sm"
        >
          <PlusCircleIcon size={18} />
          Create New RFQ
        </Link>
      </div>

      {/* Tabs & Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
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
            <Link
              key={rfq.id}
              to="/buyer/rfqs/$rfqId"
              params={{ rfqId: String(rfq.id) }}
              className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all cursor-pointer group block"
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
                  </div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-xs sm:text-sm transition-colors">
                    View Details &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
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
