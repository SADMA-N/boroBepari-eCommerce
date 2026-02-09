import * as React from 'react'
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Loader2,
  X,
} from 'lucide-react'
import { formatBDT } from '@/data/mock-products'

interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

// --- Accept Quote Modal ---
interface AcceptQuoteModalProps extends BaseModalProps {
  supplierName: string
  price: string | number
  onConfirm: () => void
}

export function AcceptQuoteModal({
  isOpen,
  onClose,
  isLoading,
  supplierName,
  price,
  onConfirm,
}: AcceptQuoteModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 mb-4 text-green-600">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
            <CheckCircle size={24} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accept Quote</h2>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to accept the quote from{' '}
          <span className="font-bold text-gray-900 dark:text-white">{supplierName}</span>?
        </p>

        <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Locked Price:</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatBDT(Number(price))}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 flex items-center gap-1">
            <AlertTriangle size={12} />
            This price will be locked for your order.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-green-600 rounded-lg font-bold text-white hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Confirm & Lock Price'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Reject Quote Modal ---
interface RejectQuoteModalProps extends BaseModalProps {
  supplierName: string
  onConfirm: (reason: string) => void
}

export function RejectQuoteModal({
  isOpen,
  onClose,
  isLoading,
  supplierName,
  onConfirm,
}: RejectQuoteModalProps) {
  const [reason, setReason] = React.useState('')

  React.useEffect(() => {
    if (isOpen) {
      setReason('')
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Decline Quote</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You are declining the quote from{' '}
          <span className="font-bold text-gray-900 dark:text-gray-100">{supplierName}</span>. This
          action will notify the supplier that you do not wish to proceed with their quote for this RFQ.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reason for declining (Optional)
          </label>
          <select
            className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm mb-3 focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">Select a reason...</option>
            <option value="price_too_high">Price is too high</option>
            <option value="delivery_time">Delivery time too long</option>
            <option value="spec_mismatch">
              Product specification mismatch
            </option>
            <option value="other">Other</option>
          </select>
          {reason === 'other' && (
            <textarea
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder="Please specify..."
            />
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-red-600 rounded-lg font-bold text-white hover:bg-red-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Decline & Notify'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Counter Offer Modal ---
interface CounterOfferModalProps extends BaseModalProps {
  currentPrice: string | number
  onConfirm: (price: number, notes: string) => void
}

export function CounterOfferModal({
  isOpen,
  onClose,
  isLoading,
  currentPrice,
  onConfirm,
}: CounterOfferModalProps) {
  const [counterPrice, setCounterPrice] = React.useState<string>('')
  const [notes, setNotes] = React.useState('')
  const [error, setError] = React.useState('')

  // Sync state when currentPrice changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      setCounterPrice(String(currentPrice))
      setNotes('')
      setError('')
    }
  }, [isOpen, currentPrice])

  const handleSubmit = () => {
    const price = Number(counterPrice)
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price')
      return
    }
    if (price === Number(currentPrice)) {
      setError('Counter offer must be different from current price')
      return
    }
    setError('')
    onConfirm(price, notes)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Make Counter Offer
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-blue-800 dark:text-blue-300 text-sm mb-4 flex items-center gap-2">
          <DollarSign size={16} />
          Current Price:{' '}
          <span className="font-bold">{formatBDT(Number(currentPrice))}</span>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Your Counter Price (BDT)
            </label>
            <input
              type="number"
              value={counterPrice}
              onChange={(e) => setCounterPrice(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              placeholder="0.00"
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Note to Supplier
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              rows={3}
              placeholder="I can order immediately if price is..."
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 py-2.5 bg-blue-600 rounded-lg font-bold text-white hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              'Send Counter Offer'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
