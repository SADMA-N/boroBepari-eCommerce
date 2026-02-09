import * as React from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from '@tanstack/react-router'
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
  XCircle,
} from 'lucide-react'
import { differenceInDays, format } from 'date-fns'
import { formatBDT } from '@/data/mock-products'
import {
  AcceptQuoteModal,
  CounterOfferModal,
  RejectQuoteModal,
} from '@/components/QuoteActionModals'
import Toast from '@/components/Toast'
import { useCart } from '@/contexts/CartContext'
import { getRfqById, updateQuoteStatus } from '@/lib/quote-server'

export const Route = createFileRoute('/buyer/rfqs/$rfqId')({
  loader: async ({ params }) => {
    const rfqId = parseInt(params.rfqId)
    if (isNaN(rfqId)) throw notFound()
    
    try {
      const rfq = await getRfqById({ data: rfqId })
      return { rfq }
    } catch (error) {
      throw notFound()
    }
  },
  component: RFQDetailPage,
})

type ViewMode = 'cards' | 'table'
type SortOption = 'price-asc' | 'price-desc' | 'date'

function RFQDetailPage() {
  const { rfq: initialRfq } = Route.useLoaderData()
  const [rfq, setRfq] = React.useState<any>(initialRfq)
  const [viewMode, setViewMode] = React.useState<ViewMode>('cards')
  const [sortOption, setSortOption] = React.useState<SortOption>('price-asc')
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const { addItem, clearCart } = useCart()
  const router = useRouter()

  // Modal State
  const [selectedQuote, setSelectedQuote] = React.useState<any | null>(null)
  const [actionType, setActionType] = React.useState<
    'accept' | 'reject' | 'counter' | null
  >(null)
  const [isLoading, setIsLoading] = React.useState(false)

  // Toast State
  const [toast, setToast] = React.useState({ message: '', isVisible: false })

  const isExpired =
    differenceInDays(new Date(rfq.expiresAt), new Date()) < 0 || rfq.status === 'expired'
  const isAccepted = rfq.status === 'accepted'

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const updated = await getRfqById({ data: rfq.id })
      setRfq(updated)
    } finally {
      setIsRefreshing(false)
    }
  }

  const sortedQuotes = React.useMemo(() => {
    const quotes = [...(rfq.quotes || [])]
    return quotes.sort((a, b) => {
      if (sortOption === 'price-asc')
        return Number(a.unitPrice) - Number(b.unitPrice)
      if (sortOption === 'price-desc')
        return Number(b.unitPrice) - Number(a.unitPrice)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [rfq.quotes, sortOption])

  const openActionModal = (
    quote: any,
    action: 'accept' | 'reject' | 'counter',
  ) => {
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

    try {
      await updateQuoteStatus({
        data: {
          quoteId: selectedQuote.id,
          status: 'accepted',
        },
      })

      await handleRefresh()
      setToast({ message: 'Quote accepted successfully!', isVisible: true })
      closeActionModal()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to accept quote', isVisible: true })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmReject = async (reason: string) => {
    if (!selectedQuote) return
    setIsLoading(true)

    try {
      await updateQuoteStatus({
        data: {
          quoteId: selectedQuote.id,
          status: 'rejected',
        },
      })

      await handleRefresh()
      setToast({ message: 'Quote rejected.', isVisible: true })
      closeActionModal()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to reject quote', isVisible: true })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmCounter = async (price: number, notes: string) => {
    if (!selectedQuote) return
    setIsLoading(true)

    try {
      await updateQuoteStatus({
        data: {
          quoteId: selectedQuote.id,
          status: 'countered',
          counterPrice: price.toString(),
          counterNote: notes,
        },
      })

      await handleRefresh()
      setToast({ message: 'Counter offer sent successfully!', isVisible: true })
      closeActionModal()
    } catch (error: any) {
      setToast({ message: error.message || 'Failed to send counter offer', isVisible: true })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckout = (quote: any) => {
    // Clear cart first to ensure only the negotiated RFQ item is in the checkout
    clearCart()

    const result = addItem({
      productId: rfq.productId!,
      quantity: quote.agreedQuantity || rfq.quantity!,
      customPrice: Number(quote.unitPrice),
      rfqId: rfq.id,
      quoteId: quote.id,
      depositPercentage: quote.depositPercentage || 0,
      productData: {
        name: rfq.product?.name || 'Product',
        image: rfq.product?.images?.[0] || '',
        supplierId: rfq.supplierId!,
        moq: rfq.product?.moq || 1,
        stock: rfq.product?.stock || 1000,
        unit: rfq.product?.unit || 'piece',
      }
    })

    if (result.success) {
      router.navigate({ to: '/checkout' })
    } else {
      setToast({ message: result.error || 'Failed to add to cart', isVisible: true })
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      {/* Navigation */}
      <Link
        to="/buyer/rfqs"
        className="inline-flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} className="mr-2" /> Back to RFQs
      </Link>

      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <AcceptQuoteModal
        isOpen={!!selectedQuote && actionType === 'accept'}
        onClose={closeActionModal}
        isLoading={isLoading}
        supplierName={selectedQuote?.supplier?.name || ''}
        price={selectedQuote?.unitPrice || 0}
        onConfirm={handleConfirmAccept}
      />

      <RejectQuoteModal
        isOpen={!!selectedQuote && actionType === 'reject'}
        onClose={closeActionModal}
        isLoading={isLoading}
        supplierName={selectedQuote?.supplier?.name || ''}
        onConfirm={handleConfirmReject}
      />

      <CounterOfferModal
        isOpen={!!selectedQuote && actionType === 'counter'}
        onClose={closeActionModal}
        isLoading={isLoading}
        currentPrice={Number(selectedQuote?.unitPrice || 0)}
        onConfirm={handleConfirmCounter}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: RFQ Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">RFQ Status</h2>
              <StatusBadge status={rfq.status} />
            </div>

            {isExpired ? (
              <div className="flex items-start bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-3 rounded-lg text-sm mb-4">
                <AlertTriangle
                  size={18}
                  className="mr-2 flex-shrink-0 mt-0.5"
                />
                <div>
                  <span className="font-bold block">This RFQ has expired</span>
                  No new quotes can be submitted.
                </div>
              </div>
            ) : isAccepted ? (
              <div className="flex items-start bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 p-3 rounded-lg text-sm mb-4">
                <CheckCircle size={18} className="mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Quote Accepted</span>
                  Proceed to place your order.
                </div>
              </div>
            ) : (
              <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
                <Clock size={18} className="mr-2 text-orange-500" />
                <span>
                  Expires in{' '}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {differenceInDays(new Date(rfq.expiresAt), new Date())} days
                  </span>
                </span>
              </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-400 flex justify-between border-t dark:border-slate-800 pt-4">
              <span>Created</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {format(new Date(rfq.createdAt), 'PPP')}
              </span>
            </div>
          </div>

          {/* Product Details Card */}
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="aspect-video bg-gray-50 dark:bg-slate-800 p-4 flex items-center justify-center">
              {rfq.product?.images?.[0] ? (
                <img
                  src={rfq.product.images[0]}
                  alt={rfq.product?.name}
                  className="max-h-full object-contain"
                />
              ) : (
                <div className="text-gray-300 dark:text-gray-600 text-4xl">No Image</div>
              )}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">
                {rfq.product.name}
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Requested Qty</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {rfq.quantity} {rfq.product.unit}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Target Price</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {formatBDT(Number(rfq.targetPrice))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Location</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">
                    {rfq.deliveryLocation}
                  </span>
                </div>
              </div>

              {/* Attachments */}
              <div className="mt-6 pt-4 border-t dark:border-slate-800">
                <h4 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 mb-3">
                  Attachments
                </h4>
                {rfq.attachments && rfq.attachments.length > 0 ? (
                  <div className="space-y-2">
                    {rfq.attachments.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-slate-800 transition"
                      >
                        <FileText size={16} /> File {idx + 1}
                        <Download size={14} className="ml-auto text-gray-400 dark:text-gray-500" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">No attachments provided</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quotes */}
        <div className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Received Quotes
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {sortedQuotes.length} supplier{sortedQuotes.length !== 1 && 's'}{' '}
                responded
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1 rounded-lg border dark:border-slate-800 shadow-sm">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="text-sm border-none focus:ring-0 bg-transparent py-1 pl-2 pr-8 font-medium text-gray-600 dark:text-gray-400 cursor-pointer dark:bg-slate-900"
              >
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="date">Date: Newest</option>
              </select>
              <div className="w-px h-6 bg-gray-200 dark:bg-slate-700 mx-1"></div>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              >
                <LayoutList size={18} />
              </button>
            </div>
          </div>

          {/* Quotes List */}
          {sortedQuotes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-dashed border-gray-300 dark:border-slate-700 p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4 text-blue-500 animate-pulse">
                <RefreshCw
                  size={24}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                Waiting for quotes...
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                We've sent your request to relevant suppliers. Responses usually
                arrive within 24 hours.
              </p>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
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
                      rfq={rfq}
                      isExpired={isExpired || isAccepted}
                      onAction={(id, action) => openActionModal(quote, action)}
                      onCheckout={() => handleCheckout(quote)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-6 py-3 font-medium">Supplier</th>
                          <th className="px-6 py-3 font-medium">Unit Price</th>
                          <th className="px-6 py-3 font-medium">Total</th>
                          <th className="px-6 py-3 font-medium">Validity</th>
                          <th className="px-6 py-3 font-medium text-right">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {sortedQuotes.map((quote) => (
                          <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-slate-800">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {quote.supplier?.logo ? (
                                  <img
                                    src={quote.supplier.logo}
                                    className="w-8 h-8 rounded-full bg-gray-200"
                                    alt=""
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-700 flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm font-bold">
                                    {quote.supplier?.name?.charAt(0) ?? '?'}
                                  </div>
                                )}
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {quote.supplier?.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                              {formatBDT(Number(quote.unitPrice))}
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                              {formatBDT(Number(quote.totalPrice))}
                            </td>
                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                              {format(new Date(quote.validityPeriod), 'MMM d')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {quote.status === 'accepted' ? (
                                  <button
                                    onClick={() => handleCheckout(quote)}
                                    className="text-white bg-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700"
                                  >
                                    Checkout
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      disabled={isExpired || isAccepted}
                                      onClick={() =>
                                        openActionModal(quote, 'accept')
                                      }
                                      className="text-green-600 hover:bg-green-50 p-1.5 rounded disabled:opacity-50"
                                      title="Accept"
                                    >
                                      <CheckCircle size={18} />
                                    </button>
                                    <button
                                      disabled={isExpired || isAccepted}
                                      onClick={() =>
                                        openActionModal(quote, 'reject')
                                      }
                                      className="text-red-500 hover:bg-red-50 p-1.5 rounded disabled:opacity-50"
                                      title="Reject"
                                    >
                                      <XCircle size={18} />
                                    </button>
                                  </>
                                )}
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
  rfq,
  isExpired,
  onAction,
  onCheckout,
}: {
  quote: any
  rfq: any
  isExpired: boolean
  onAction: (id: number, action: 'accept' | 'reject' | 'counter') => void
  onCheckout: () => void
}) {
  const daysValid = differenceInDays(new Date(quote.validityPeriod), new Date())

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
        quote.status === 'accepted'
          ? 'border-green-500 ring-1 ring-green-500'
          : 'border-gray-100 dark:border-slate-800'
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
        {/* Supplier Info */}
        <div className="flex items-start gap-4">
          {quote.supplier?.logo ? (
            <img
              src={quote.supplier.logo}
              alt={quote.supplier.name}
              className="w-12 h-12 rounded-full border dark:border-slate-700 bg-gray-50 dark:bg-slate-800"
            />
          ) : (
            <div className="w-12 h-12 rounded-full border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-gray-500 text-lg font-bold">
              {quote.supplier?.name?.charAt(0) ?? '?'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                {quote.supplier?.name}
              </h3>
              <BadgeCheck size={16} className="text-blue-500" />
              {quote.status && quote.status !== 'pending' && (
                <StatusBadge status={quote.status} />
              )}
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
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
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatBDT(Number(quote.unitPrice))}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">per unit</div>
          <div className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            Total: {formatBDT(Number(quote.unitPrice) * (quote.agreedQuantity || rfq.quantity))}
          </div>
          {quote.agreedQuantity && quote.agreedQuantity !== rfq.quantity && (
            <div className="mt-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
              Agreed Qty: {quote.agreedQuantity} units
            </div>
          )}
          {quote.status === 'countered' && quote.counterPrice && (
            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/10 rounded border border-purple-100 dark:border-purple-900/30 text-right">
              <p className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Your Counter Offer</p>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{formatBDT(Number(quote.counterPrice))}</p>
              {quote.counterNote && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 italic">"{quote.counterNote}"</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quote Details */}
      <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Validity:</span>
            <span
              className={`font-medium ${daysValid < 2 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
            >
              {daysValid} Days Left
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Received:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {format(new Date(quote.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {quote.deliveryTime || '7-10 days'}
            </span>
          </div>
          {quote.depositPercentage > 0 && (
            <div className="flex items-center gap-2">
              <BadgeCheck size={16} className="text-orange-500" />
              <span className="text-gray-600 dark:text-gray-400">Deposit:</span>
              <span className="font-medium text-orange-600">
                {quote.depositPercentage}% required
              </span>
            </div>
          )}
        </div>
        {quote.terms && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-slate-700 pt-2">
            <span className="font-medium text-gray-900 dark:text-white mr-2">Note:</span>
            {quote.terms}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {quote.status === 'accepted' ? (
          <button 
            onClick={onCheckout}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2"
          >
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
              className="flex-1 bg-white dark:bg-slate-900 border border-blue-600 text-blue-600 dark:text-blue-400 py-2.5 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Counter Offer
            </button>
            <button
              disabled={isExpired || quote.status === 'rejected'}
              onClick={() => onAction(quote.id!, 'reject')}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 text-gray-600 dark:text-gray-400 py-2.5 rounded-lg font-semibold hover:text-red-600 hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-900/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ThumbsDown size={18} /> Decline Quote
            </button>
          </>
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
    countered:
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
