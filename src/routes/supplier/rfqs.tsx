import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  MessageSquare,
  Search,
  Send,
  Timer,
  X,
} from 'lucide-react'
import { addDays, differenceInHours, format } from 'date-fns'
import type { MockRfq } from '@/data/mock-rfqs'
import { mockRfqs } from '@/data/mock-rfqs'
import { formatBDT } from '@/data/mock-products'
import Toast from '@/components/Toast'

export const Route = createFileRoute('/supplier/rfqs')({
  component: SupplierRFQInbox,
})

type SupplierTab = 'new' | 'quoted' | 'accepted' | 'expired'

function SupplierRFQInbox() {
  const [activeTab, setActiveTab] = useState<SupplierTab>('new')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRfq, setSelectedRfq] = useState<MockRfq | null>(null)
  const [toast, setToast] = useState({ message: '', isVisible: false })

  // Mock filtering: In a real app, this would be an API call filtering by supplierId
  const supplierRfqs = useMemo(() => {
    const now = new Date()
    // For demo, we treat 'pending' as 'new' for supplier
    // and assume some logic to determine if it's 'quoted' by THIS supplier
    return mockRfqs.filter((rfq) => {
      if (activeTab === 'new') return rfq.status === 'pending'
      if (activeTab === 'quoted') return rfq.status === 'quoted' // Or pending but has quote from us
      if (activeTab === 'accepted') return rfq.status === 'accepted'
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (activeTab === 'expired')
        return rfq.expiresAt ? rfq.expiresAt < now : false
      return true
    })
  }, [activeTab])

  const handleSendQuote = (rfq: MockRfq) => {
    setSelectedRfq(rfq)
  }

  const handleQuoteSuccess = () => {
    setToast({ message: 'Quote sent successfully!', isVisible: true })
    setSelectedRfq(null)
    // In real app, we would refresh the list here
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">RFQ Requests</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage incoming quote requests from buyers
          </p>
        </div>
      </div>

      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
        <div className="border-b px-4 overflow-x-auto">
          <div className="flex space-x-6 min-w-max">
            {(
              ['new', 'quoted', 'accepted', 'expired'] as Array<SupplierTab>
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {/* Mock counts */}
                  {tab === 'new' ? 5 : tab === 'quoted' ? 12 : 3}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search product, buyer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {supplierRfqs.map((rfq) => (
          <SupplierRFQCard
            key={rfq.id}
            rfq={rfq}
            onSendQuote={() => handleSendQuote(rfq)}
            isActionable={activeTab === 'new'}
          />
        ))}
        {supplierRfqs.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed text-gray-500">
            No RFQs found in this tab.
          </div>
        )}
      </div>

      {/* Quote Response Modal */}
      {selectedRfq && (
        <QuoteResponseModal
          isOpen={!!selectedRfq}
          onClose={() => setSelectedRfq(null)}
          rfq={selectedRfq}
          onSuccess={handleQuoteSuccess}
        />
      )}
    </div>
  )
}

function SupplierRFQCard({
  rfq,
  onSendQuote,
  isActionable,
}: {
  rfq: MockRfq
  onSendQuote: () => void
  isActionable: boolean
}) {
  const hoursLeft = differenceInHours(addDays(rfq.createdAt!, 1), new Date())
  const isUrgent = hoursLeft > 0 && hoursLeft < 24

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Urgent Badge */}
      {isUrgent && isActionable && (
        <div className="absolute top-0 right-0 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
          <Timer size={12} />
          Respond in {hoursLeft}h
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded">
              {rfq.rfqNumber}
            </span>
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-sm text-gray-500">
              {format(rfq.createdAt!, 'PP')}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {rfq.product.name}
          </h3>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 mt-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {rfq.quantity} {rfq.product.unit}s
              </span>
              <span className="bg-gray-100 px-1.5 rounded text-xs">Qty</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">
                {formatBDT(Number(rfq.targetPrice))}
              </span>
              <span className="bg-gray-100 px-1.5 rounded text-xs">Target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              <span
                className="truncate max-w-[150px]"
                title={rfq.deliveryLocation}
              >
                {rfq.deliveryLocation}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isActionable ? (
            <button
              onClick={onSendQuote}
              className="bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-orange-700 transition flex items-center gap-2 shadow-sm"
            >
              <Send size={18} />
              Send Quote
            </button>
          ) : (
            <button className="bg-gray-100 text-gray-500 px-6 py-2.5 rounded-lg font-medium cursor-not-allowed">
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function QuoteResponseModal({
  isOpen,
  onClose,
  rfq,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  rfq: MockRfq
  onSuccess: () => void
}) {
  const [unitPrice, setUnitPrice] = useState<string>('')
  const [validity, setValidity] = useState('7')
  const [terms, setTerms] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const totalPrice = Number(unitPrice) * rfq.quantity

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    onSuccess()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Send Quote</h2>
            <p className="text-sm text-gray-500">Ref: {rfq.rfqNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* Summary of Request */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-blue-900">{rfq.product.name}</h3>
              <span className="text-xs bg-white text-blue-700 px-2 py-1 rounded font-mono font-bold">
                Qty: {rfq.quantity}
              </span>
            </div>
            <div className="text-sm text-blue-800 flex gap-4">
              <span>
                Buyer Target:{' '}
                <span className="font-bold">
                  {formatBDT(Number(rfq.targetPrice))}
                </span>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price (BDT) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <span className="font-bold">৳</span>
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="0.00"
                  />
                </div>
                {/* Price Comparison Tip */}
                {Number(unitPrice) > Number(rfq.targetPrice) &&
                  unitPrice !== '' && (
                    <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} />
                      Higher than target price (
                      {formatBDT(Number(rfq.targetPrice))})
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Price
                </label>
                <div className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-bold">
                  {formatBDT(totalPrice)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Validity Period
                </label>
                <select
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days</option>
                  <option value="30">30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Est. Delivery Time
                </label>
                <input
                  type="text"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="e.g. 5-7 days"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions / Notes
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, warranty details, or specific notes..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              />
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !unitPrice}
                className="px-6 py-2.5 bg-orange-600 rounded-lg font-bold text-white hover:bg-orange-700 transition disabled:opacity-70 flex items-center gap-2"
              >
                {isLoading ? 'Sending...' : 'Send Quote to Buyer'}
                {!isLoading && <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
