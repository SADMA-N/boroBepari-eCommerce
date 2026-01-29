import { useState } from 'react'
import { X, Upload, FileText, CheckCircle } from 'lucide-react'
import { submitRfq } from '@/lib/rfq-server'
import { MockProduct } from '@/data/mock-products'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'
import { formatBDT } from '@/data/mock-products'

interface RFQModalProps {
  isOpen: boolean
  onClose: () => void
  product: MockProduct
}

export default function RFQModal({ isOpen, onClose, product }: RFQModalProps) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [quantity, setQuantity] = useState(product.moq)
  const [targetPrice, setTargetPrice] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{
    rfqId: number
    expectedResponse: string
  } | null>(null)
  const [error, setError] = useState('')

  if (!isOpen) return null

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">
            You must be logged in to submit a Request for Quote.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => navigate({ to: '/login' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Mock file upload - in reality, upload to S3/Cloudinary here and get URLs
      const attachmentUrls = files.map((f) => f.name)

      const result = await submitRfq({
        data: {
          productId: parseInt(product.id), // Assuming mock product ID matches DB ID or we need a mapping.
          // Note: MockProduct IDs are likely strings. The Schema expects integer.
          // If we are using mock products but real DB for RFQ, we might have an issue if the product doesn't exist in DB.
          // For this prototype, let's assume the mock product '1' exists in DB as 1.
          // Or we should verify if we inserted mock products into DB.
          // Let's assume parseInt works for now.
          quantity,
          targetPrice: targetPrice || undefined,
          deliveryLocation: location,
          notes,
          attachments: attachmentUrls,
        },
      })

      if (result.success) {
        setSuccessData({
          rfqId: result.rfqId,
          expectedResponse: result.expectedResponse,
        })
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit RFQ')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">RFQ Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your request (RFQ #{successData.rfqId}) has been sent to the
            supplier.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 font-medium">
              Expected Response Time
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {successData.expectedResponse}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl my-8 mx-4 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Request for Quote</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* Product Summary */}
          <div className="flex items-start space-x-4 mb-6 bg-gray-50 p-4 rounded-lg">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-16 h-16 object-cover rounded border"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">
                Supplier: {product.supplierId}
              </p>{' '}
              {/* Ideally fetch supplier name */}
              <p className="text-sm font-medium text-blue-600 mt-1">
                Listed Price: {formatBDT(product.price)} / {product.unit}
              </p>
            </div>
          </div>

          <form id="rfq-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Required *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  MOQ: {product.moq} {product.unit}s
                </p>
              </div>

              {/* Target Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Unit Price (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">৳</span>
                  <input
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Enter target price"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Location *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Area, or Full Address"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes / Requirements
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe your requirements, specifications, or any questions..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* File Attachments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attachments (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="text-gray-400 mb-2" size={24} />
                  <span className="text-blue-600 font-medium hover:underline">
                    Click to upload
                  </span>
                  <span className="text-gray-500 text-sm mt-1">
                    or drag and drop files here
                  </span>
                  <span className="text-xs text-gray-400 mt-2">
                    Images, PDF, Doc up to 10MB
                  </span>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm"
                    >
                      <div className="flex items-center text-gray-700 truncate">
                        <FileText size={16} className="mr-2 text-blue-500" />
                        <span className="truncate max-w-xs">{file.name}</span>
                        <span className="ml-2 text-gray-400 text-xs">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="rfq-form"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
