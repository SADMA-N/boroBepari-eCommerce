import { createFileRoute, notFound, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { 
  AlertTriangle, 
  ArrowLeft, 
  BadgeCheck, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Download, 
  FileText, 
  LayoutGrid, 
  LayoutList, 
  MapPin, 
  RefreshCw, 
  Star, 
  ThumbsDown, 
  ThumbsUp,
  XCircle
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { mockRfqs, MockRfq, MockQuote } from '@/data/mock-rfqs'
import { formatBDT } from '@/data/mock-products'
import { AcceptQuoteModal, RejectQuoteModal, CounterOfferModal } from '@/components/QuoteActionModals'
import Toast from '@/components/Toast'

export const Route = createFileRoute('/buyer/rfqs/$rfqId')({
  loader: ({ params }) => {
    // In a real app, this would be an API call
    const rfq = mockRfqs.find(r => r.id === Number(params.rfqId)) || mockRfqs.find(r => r.rfqNumber === params.rfqId)
    if (!rfq) {
      throw notFound()
    }
    return { rfq }
  },
  component: RFQDetailPage,
})

type ViewMode = 'cards' | 'table'
type SortOption = 'price-asc' | 'price-desc' | 'date'

function RFQDetailPage() {
  const { rfq: initialRfq } = Route.useLoaderData()
  const [rfq, setRfq] = useState(initialRfq)
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [sortOption, setSortOption] = useState<SortOption>('price-asc')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal State
  const [selectedQuote, setSelectedQuote] = useState<MockQuote | null>(null)
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'counter' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Toast State
  const [toast, setToast] = useState({ message: '', isVisible: false })

  const isExpired = differenceInDays(rfq.expiresAt!, new Date()) < 0 || rfq.status === 'expired'
  const isAccepted = rfq.status === 'accepted'

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const sortedQuotes = useMemo(() => {
    const quotes = [...(rfq.quotes || [])]
    return quotes.sort((a, b) => {
      if (sortOption === 'price-asc') return Number(a.unitPrice) - Number(b.unitPrice)
      if (sortOption === 'price-desc') return Number(b.unitPrice) - Number(a.unitPrice)
      return a.createdAt!.getTime() - b.createdAt!.getTime()
    })
  }, [rfq.quotes, sortOption])

  const openActionModal = (quote: MockQuote, action: 'accept' | 'reject' | 'counter') => {
    setSelectedQuote(quote)
    setActionType(action)
  }

  const closeActionModal = () => {
    setSelectedQuote(null)
    setActionType(null)
    setIsLoading(false)
  }

  const handleConfirmAccept = async () => {
    if (!selectedQuote) return
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update local state
    const updatedQuotes = rfq.quotes.map(q => 
      q.id === selectedQuote.id ? { ...q, status: 'accepted' } : { ...q, status: 'rejected' } // Auto reject others? Usually yes or keep pending. Let's keep pending for now or reject.
    ) as MockQuote[]

    setRfq(prev => ({
      ...prev,
      status: 'accepted',
      quotes: updatedQuotes
    }))

    setToast({ message: 'Quote accepted successfully!', isVisible: true })
    closeActionModal()
  }

  const handleConfirmReject = async (reason: string) => {
    if (!selectedQuote) return
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1000))

    const updatedQuotes = rfq.quotes.map(q => 
      q.id === selectedQuote.id ? { ...q, status: 'rejected' } : q
    ) as MockQuote[]

    setRfq(prev => ({ ...prev, quotes: updatedQuotes }))
    setToast({ message: 'Quote rejected.', isVisible: true })
    closeActionModal()
  }

  const handleConfirmCounter = async (price: number, notes: string) => {
    if (!selectedQuote) return
    setIsLoading(true)
    
    await new Promise(resolve => setTimeout(resolve, 1500))

    // In real app, this might create a new quote entry or update status
    const updatedQuotes = rfq.quotes.map(q => 
      q.id === selectedQuote.id ? { ...q, status: 'countered' } : q
    ) as MockQuote[]

    setRfq(prev => ({ ...prev, quotes: updatedQuotes }))
    setToast({ message: 'Counter offer sent successfully!', isVisible: true })
    closeActionModal()
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Navigation */}
      <Link 
        to="/buyer/rfqs" 
        className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to RFQs
      </Link>

      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <AcceptQuoteModal 
        isOpen={!!selectedQuote && actionType === 'accept'}
        onClose={closeActionModal}
        isLoading={isLoading}
        supplierName={selectedQuote?.supplierName || ''}
        price={selectedQuote?.totalPrice || 0}
        onConfirm={handleConfirmAccept}
      />

      <RejectQuoteModal 
        isOpen={!!selectedQuote && actionType === 'reject'}
        onClose={closeActionModal}
        isLoading={isLoading}
        supplierName={selectedQuote?.supplierName || ''}
        onConfirm={handleConfirmReject}
      />

      <CounterOfferModal 
        isOpen={!!selectedQuote && actionType === 'counter'}
        onClose={closeActionModal}
        isLoading={isLoading}
        currentPrice={selectedQuote?.unitPrice || 0}
        onConfirm={handleConfirmCounter}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: RFQ Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">RFQ Status</h2>
              <StatusBadge status={rfq.status} />
            </div>
            
            {isExpired ? (
               <div className="flex items-start bg-red-50 text-red-800 p-3 rounded-lg text-sm mb-4">
                 <AlertTriangle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                 <div>
                   <span className="font-bold block">This RFQ has expired</span>
                   No new quotes can be submitted.
                 </div>
               </div>
            ) : isAccepted ? (
               <div className="flex items-start bg-green-50 text-green-800 p-3 rounded-lg text-sm mb-4">
                 <CheckCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                 <div>
                   <span className="font-bold block">Quote Accepted</span>
                   Proceed to place your order.
                 </div>
               </div>
            ) : (
               <div className="flex items-center text-gray-600 mb-4">
                 <Clock size={18} className="mr-2 text-orange-500" />
                 <span>Expires in <span className="font-bold text-gray-900">{differenceInDays(rfq.expiresAt!, new Date())} days</span></span>
               </div>
            )}
            
            <div className="text-sm text-gray-500 flex justify-between border-t pt-4">
              <span>Created</span>
              <span className="font-medium text-gray-900">{format(rfq.createdAt!, 'PPP')}</span>
            </div>
          </div>

          {/* Product Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="aspect-video bg-gray-50 p-4 flex items-center justify-center">
              <img src={rfq.product.images[0]} alt={rfq.product.name} className="max-h-full object-contain" />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 text-lg mb-2">{rfq.product.name}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Requested Qty</span>
                  <span className="font-bold text-gray-900">{rfq.quantity} {rfq.product.unit}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Target Price</span>
                  <span className="font-bold text-blue-600">{formatBDT(Number(rfq.targetPrice))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%]">{rfq.deliveryLocation}</span>
                </div>
              </div>
              
              {/* Attachments */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-xs font-semibold uppercase text-gray-500 mb-3">Attachments</h4>
                <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                  <FileText size={16} /> Technical Spec.pdf
                  <Download size={14} className="ml-auto text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quotes */}
        <div className="lg:col-span-2">
           <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
             <div>
               <h1 className="text-2xl font-bold text-gray-900">Received Quotes</h1>
               <p className="text-sm text-gray-500">
                 {sortedQuotes.length} supplier{sortedQuotes.length !== 1 && 's'} responded
               </p>
             </div>
             
             {/* Controls */}
             <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
                <select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-sm border-none focus:ring-0 bg-transparent py-1 pl-2 pr-8 font-medium text-gray-600 cursor-pointer"
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="date">Date: Newest</option>
                </select>
                <div className="w-px h-6 bg-gray-200 mx-1"></div>
                <button 
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <LayoutList size={18} />
                </button>
             </div>
           </div>

           {/* Quotes List */}
           {sortedQuotes.length === 0 ? (
             <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12 text-center">
               <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500 animate-pulse">
                 <RefreshCw size={24} className={isRefreshing ? "animate-spin" : ""} />
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-1">Waiting for quotes...</h3>
               <p className="text-gray-500 mb-6">
                 We've sent your request to relevant suppliers. Responses usually arrive within 24 hours.
               </p>
               <button 
                 onClick={handleRefresh}
                 disabled={isRefreshing}
                 className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
               >
                 <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                 Refresh Status
               </button>
             </div>
           ) : (
             <>
               {viewMode === 'cards' ? (
                 <div className="space-y-4">
                   {sortedQuotes.map((quote) => (
                     <QuoteCard 
                       key={quote.id} 
                       quote={quote} 
                       isExpired={isExpired || isAccepted} 
                       onAction={(id, action) => openActionModal(quote, action)} 
                     />
                   ))}
                 </div>
               ) : (
                 <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm">
                       <thead className="bg-gray-50 text-gray-500">
                         <tr>
                           <th className="px-6 py-3 font-medium">Supplier</th>
                           <th className="px-6 py-3 font-medium">Unit Price</th>
                           <th className="px-6 py-3 font-medium">Total</th>
                           <th className="px-6 py-3 font-medium">Validity</th>
                           <th className="px-6 py-3 font-medium text-right">Action</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {sortedQuotes.map((quote) => (
                           <tr key={quote.id} className="hover:bg-gray-50">
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <img src={quote.supplierLogo} className="w-8 h-8 rounded-full bg-gray-200" alt="" />
                                 <span className="font-medium text-gray-900">{quote.supplierName}</span>
                               </div>
                             </td>
                             <td className="px-6 py-4 text-gray-600">{formatBDT(Number(quote.unitPrice))}</td>
                             <td className="px-6 py-4 font-bold text-gray-900">{formatBDT(Number(quote.totalPrice))}</td>
                             <td className="px-6 py-4 text-gray-500">
                               {format(quote.validityPeriod!, 'MMM d')}
                             </td>
                             <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <button 
                                   disabled={isExpired || isAccepted}
                                   onClick={() => openActionModal(quote, 'accept')}
                                   className="text-green-600 hover:bg-green-50 p-1.5 rounded disabled:opacity-50"
                                   title="Accept"
                                 >
                                   <CheckCircle size={18} />
                                 </button>
                                 <button 
                                   disabled={isExpired || isAccepted}
                                   onClick={() => openActionModal(quote, 'reject')}
                                   className="text-red-500 hover:bg-red-50 p-1.5 rounded disabled:opacity-50"
                                   title="Reject"
                                 >
                                   <XCircle size={18} />
                                 </button>
                               </div>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
               )}
             </>
           )}
        </div>
      </div>
    </div>
  )
}

function QuoteCard({ 
  quote, 
  isExpired, 
  onAction 
}: { 
  quote: MockQuote
  isExpired: boolean
  onAction: (id: number, action: 'accept' | 'reject' | 'counter') => void 
}) {
  const daysValid = differenceInDays(quote.validityPeriod!, new Date())
  
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
      quote.status === 'accepted' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-100'
    }`}>
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
        {/* Supplier Info */}
        <div className="flex items-start gap-4">
          <img src={quote.supplierLogo} alt={quote.supplierName} className="w-12 h-12 rounded-full border bg-gray-50" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-lg">{quote.supplierName}</h3>
              <BadgeCheck size={16} className="text-blue-500" />
              {quote.status && quote.status !== 'pending' && (
                <StatusBadge status={quote.status} />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Star size={14} className="text-yellow-400 fill-current" /> 4.8
              </span>
              <span>•</span>
              <span>98% Response Rate</span>
            </div>
          </div>
        </div>

        {/* Price Info */}
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{formatBDT(Number(quote.unitPrice))}</div>
          <div className="text-sm text-gray-500">per unit</div>
          <div className="mt-1 text-sm font-medium text-gray-700">Total: {formatBDT(Number(quote.totalPrice))}</div>
        </div>
      </div>

      {/* Quote Details */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-gray-600">Validity:</span>
            <span className={`font-medium ${daysValid < 2 ? 'text-red-600' : 'text-gray-900'}`}>
              {daysValid} Days Left
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <span className="text-gray-600">Received:</span>
            <span className="font-medium text-gray-900">{format(quote.createdAt!, 'MMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400" />
            <span className="text-gray-600">Shipping:</span>
            <span className="font-medium text-green-600">Included</span>
          </div>
        </div>
        {quote.terms && (
           <div className="mt-3 text-sm text-gray-600 border-t border-gray-200 pt-2">
             <span className="font-medium text-gray-900 mr-2">Note:</span>
             {quote.terms || "Standard payment terms apply. Delivery within 7 days of order confirmation."}
           </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {quote.status === 'accepted' ? (
           <button className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
             Proceed to Checkout
           </button>
        ) : (
          <>
            <button 
              disabled={isExpired || quote.status === 'rejected'}
              onClick={() => onAction(quote.id!, 'accept')}
              className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ThumbsUp size={18} /> Accept Quote
            </button>
            <button 
              disabled={isExpired || quote.status === 'rejected'}
              onClick={() => onAction(quote.id!, 'counter')}
              className="flex-1 bg-white border border-blue-600 text-blue-600 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Counter Offer
            </button>
            <button 
              disabled={isExpired || quote.status === 'rejected'}
              onClick={() => onAction(quote.id!, 'reject')}
              className="flex-none px-4 bg-white border border-gray-300 text-gray-600 py-2.5 rounded-lg font-semibold hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reject Quote"
            >
              <ThumbsDown size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    quoted: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-gray-100 text-gray-600',
    converted: 'bg-purple-100 text-purple-800',
    countered: 'bg-purple-100 text-purple-800'
  }
  
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
  const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${style}`}>
      {label}
    </span>
  )
}
