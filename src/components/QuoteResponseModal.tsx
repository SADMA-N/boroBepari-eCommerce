import { useState } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { respondToRfq } from '@/lib/supplier-server'
import { formatBDT } from '@/data/mock-products'

interface QuoteResponseModalProps {
  isOpen: boolean
  onClose: () => void
  rfq: any // Replace with proper type inference later
  onSuccess?: () => void
}

export default function QuoteResponseModal({
  isOpen,
  onClose,
  rfq,
  onSuccess,
}: QuoteResponseModalProps) {
  const [unitPrice, setUnitPrice] = useState('')
  const [totalPrice, setTotalPrice] = useState('')
  const [validity, setValidity] = useState('')
  const [terms, setTerms] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen || !rfq) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await respondToRfq({
        data: {
          rfqId: rfq.id,
          unitPrice,
          totalPrice,
          validityPeriod: validity,
          terms,
        },
      })

      setIsSuccess(true)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to send quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setIsSuccess(false)
    onClose()
  }

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Quote Sent!</h2>
          <p className="text-gray-600 mb-6">
            Your quote has been sent to the buyer.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-lg my-8 mx-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Send Quote</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-sm">
            <p>
              <span className="font-semibold">Product:</span> {rfq.product.name}
            </p>
            <p>
              <span className="font-semibold">Requested Qty:</span>{' '}
              {rfq.quantity}
            </p>
            <p>
              <span className="font-semibold">Target Price:</span>{' '}
              {rfq.targetPrice ? formatBDT(rfq.targetPrice) : 'N/A'}
            </p>
          </div>

          <form id="quote-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (BDT) *
              </label>
              <input
                type="number"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Price (Optional)
              </label>
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="Auto-calculated if empty"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validity Period
              </label>
              <input
                type="date"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions / Notes
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-4 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quote-form"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center disabled:opacity-70"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Quote'}
          </button>
        </div>
      </div>
    </div>
  )
}
