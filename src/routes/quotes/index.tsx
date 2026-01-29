import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { getBuyerQuotes, updateQuoteStatus } from '@/lib/quote-server'
import { useState } from 'react'
import { formatBDT } from '@/data/mock-products'
import { getAuthSession } from '@/lib/auth-server'
import {
  Check,
  X,
  MessageSquare,
  Clock,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react'

export const Route = createFileRoute('/quotes/')({
  beforeLoad: async ({ context }) => {
    const session: any = await getAuthSession()
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const quotes = await getBuyerQuotes()
    return { quotes }
  },
  component: QuotesPage,
})

function QuotesPage() {
  const { quotes } = Route.useLoaderData()
  const router = useRouter()
  const [counterQuote, setCounterQuote] = useState<any>(null)
  const [counterPrice, setCounterPrice] = useState('')
  const [counterNote, setCounterNote] = useState('')
  const [isCounterSubmitting, setIsCounterSubmitting] = useState(false)

  const handleStatusUpdate = async (
    quoteId: number,
    status: 'accepted' | 'rejected',
  ) => {
    if (!confirm(`Are you sure you want to ${status} this quote?`)) return
    try {
      await updateQuoteStatus({ data: { quoteId, status } })
      router.invalidate()
    } catch (err) {
      alert('Failed to update status')
    }
  }

  const handleCounterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!counterQuote) return
    setIsCounterSubmitting(true)
    try {
      await updateQuoteStatus({
        data: {
          quoteId: counterQuote.id,
          status: 'countered',
          counterPrice,
          counterNote,
        },
      })
      setCounterQuote(null)
      router.invalidate()
    } catch (err) {
      alert('Failed to submit counter offer')
    } finally {
      setIsCounterSubmitting(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Quotes</h1>

      <div className="space-y-4">
        {quotes.length === 0 ? (
          <div className="text-center text-gray-500 py-12 bg-white border rounded-lg">
            No quotes received yet.
          </div>
        ) : (
          quotes.map((quote) => {
            const isExpired =
              quote.validityDate && new Date(quote.validityDate) < new Date()
            const canAction = quote.status === 'pending' && !isExpired

            return (
              <div
                key={quote.id}
                className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">
                        {quote.rfq.product.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          quote.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : quote.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : quote.status === 'countered'
                                ? 'bg-orange-100 text-orange-800'
                                : isExpired
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isExpired && quote.status === 'pending'
                          ? 'Expired'
                          : quote.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      Supplier: {quote.supplier.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      RFQ Qty: {quote.rfq.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatBDT(quote.unitPrice)}
                    </div>
                    <span className="text-xs text-gray-500">per unit</span>
                    {quote.totalPrice && (
                      <div className="text-sm font-medium text-gray-700 mt-1">
                        Total: {formatBDT(quote.totalPrice)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-sm text-gray-600 space-y-1">
                    {quote.validityDate && (
                      <div
                        className={`flex items-center ${isExpired ? 'text-red-500 font-medium' : ''}`}
                      >
                        <Clock size={16} className="mr-2" />
                        Valid until:{' '}
                        {new Date(quote.validityDate).toLocaleDateString()}
                      </div>
                    )}
                    {quote.terms && (
                      <div className="flex items-start">
                        <FileTextIcon className="mr-2 mt-0.5 flex-shrink-0" />
                        <span>Terms: {quote.terms}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-end gap-2 items-center">
                    {canAction && (
                      <>
                        <button
                          onClick={() => {
                            setCounterQuote(quote)
                            setCounterPrice(quote.unitPrice)
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center"
                        >
                          <MessageSquare size={16} className="mr-2" />
                          Counter
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(quote.id, 'rejected')
                          }
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium flex items-center"
                        >
                          <X size={16} className="mr-2" />
                          Reject
                        </button>
                        <button
                          onClick={() =>
                            handleStatusUpdate(quote.id, 'accepted')
                          }
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center"
                        >
                          <Check size={16} className="mr-2" />
                          Accept Quote
                        </button>
                      </>
                    )}

                    {quote.status === 'accepted' && (
                      <button
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold flex items-center shadow-sm"
                        onClick={() =>
                          alert(
                            'Proceeding to checkout with price: ' +
                              formatBDT(quote.unitPrice),
                          )
                        }
                      >
                        <ShoppingCart size={16} className="mr-2" />
                        Place Order
                      </button>
                    )}

                    {isExpired && quote.status === 'pending' && (
                      <div className="flex items-center text-gray-500 text-sm bg-gray-100 px-3 py-2 rounded">
                        <AlertTriangle size={16} className="mr-2" />
                        Quote Expired
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Counter Offer Modal */}
      {counterQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Counter Offer</h2>
            <p className="text-sm text-gray-600 mb-4">
              Propose a new price for {counterQuote.rfq.product.name}.
            </p>

            <form onSubmit={handleCounterSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Price (BDT)
                </label>
                <input
                  type="number"
                  required
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (Optional)
                </label>
                <textarea
                  rows={3}
                  value={counterNote}
                  onChange={(e) => setCounterNote(e.target.value)}
                  placeholder="Reason for counter offer..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCounterQuote(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCounterSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Submit Counter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
