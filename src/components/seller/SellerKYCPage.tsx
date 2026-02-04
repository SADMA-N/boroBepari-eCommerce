import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearch } from '@tanstack/react-router'
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  FileText,
  Info,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from 'lucide-react'
import type { KycStatus } from '@/types/seller'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerAuth } from '@/contexts/SellerAuthContext'
import { submitSellerKyc } from '@/lib/seller-kyc-server'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

type UploadKey =
  | 'tradeLicense'
  | 'nidFront'
  | 'nidBack'
  | 'bankProof'

type UploadItem = {
  file: File
  previewUrl?: string
  progress: number
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

const CATEGORIES = [
  'Apparel & Fashion',
  'Electronics',
  'Home & Kitchen',
  'Industrial Supplies',
  'Health & Beauty',
  'Grocery & FMCG',
  'Construction Materials',
]

const INVENTORY_RANGES = [
  'Below ৳50,000',
  '৳50,000 - ৳200,000',
  '৳200,000 - ৳500,000',
  '৳500,000 - ৳1,000,000',
  'Above ৳1,000,000',
]

export function SellerKYCPage() {
  const { pushToast } = useSellerToast()
  const { seller, refreshSeller } = useSellerAuth()
  const search = useSearch({ from: '/seller/kyc', strict: false })
  const [localStatus, setLocalStatus] = useState<KycStatus | null>(null)
  const [uploads, setUploads] = useState<Record<UploadKey, UploadItem | null>>({
    tradeLicense: null,
    nidFront: null,
    nidBack: null,
    bankProof: null,
  })
  const [uploadErrors, setUploadErrors] = useState<Record<UploadKey, string | null>>({
    tradeLicense: null,
    nidFront: null,
    nidBack: null,
    bankProof: null,
  })
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Array<string>>([])
  const [inventoryRange, setInventoryRange] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)
  const [successMessage, setSuccessMessage] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const rejectionReason = useMemo(() => {
    if (seller?.kycRejectionReason) return seller.kycRejectionReason
    if (typeof search.reason === 'string') return search.reason
    return 'Missing or unclear documents'
  }, [search, seller?.kycRejectionReason])

  useEffect(() => {
    if (seller?.kycSubmittedAt) {
      setSubmittedAt(new Date(seller.kycSubmittedAt))
    }
  }, [seller?.kycSubmittedAt])

  useEffect(() => {
    if (successMessage) {
      const timer = window.setTimeout(() => setSuccessMessage(false), 4000)
      return () => window.clearTimeout(timer)
    }
  }, [successMessage])

  const status = localStatus ?? seller?.kycStatus ?? 'pending'
  const isVerified = status === 'approved'
  const isRejected = status === 'rejected'
  const isUnderReview = status === 'submitted'
  const canSubmit = !isSubmitting && (!isUnderReview || isRejected)

  const updateUpload = async (key: UploadKey, file: File) => {
    const error = validateFile(file)
    if (error) {
      setUploadErrors((prev) => ({ ...prev, [key]: error }))
      return
    }

    const processedFile = await compressImageIfNeeded(file)
    const previewUrl = processedFile.type.startsWith('image/')
      ? URL.createObjectURL(processedFile)
      : undefined
    setUploads((prev) => ({ ...prev, [key]: { file: processedFile, previewUrl, progress: 0 } }))
    setUploadErrors((prev) => ({ ...prev, [key]: null }))
    simulateProgress(key)
  }

  const simulateProgress = (key: UploadKey) => {
    let value = 0
    const interval = window.setInterval(() => {
      value += 10
      setUploads((prev) => {
        const item = prev[key]
        if (!item) return prev
        return { ...prev, [key]: { ...item, progress: Math.min(value, 100) } }
      })
      if (value >= 100) {
        window.clearInterval(interval)
      }
    }, 120)
  }

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, or PDF files are allowed.'
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File must be under 5MB.'
    }
    return null
  }

  const handleDrop = (key: UploadKey, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files.item(0)
    if (file) void updateUpload(key, file)
  }

  const handleBrowse = (key: UploadKey, files: FileList | null) => {
    const file = files?.item(0)
    if (file) void updateUpload(key, file)
  }

  const clearUpload = (key: UploadKey) => {
    const item = uploads[key]
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    setUploads((prev) => ({ ...prev, [key]: null }))
  }

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    )
  }

  const validateSubmission = () => {
    const requiredMissing = ['tradeLicense', 'nidFront', 'nidBack'].some(
      (key) => !uploads[key as UploadKey],
    )
    if (requiredMissing) return false
    if (!description.trim() || description.length > 500) return false
    if (!selectedCategories.length) return false
    if (!inventoryRange) return false
    return true
  }

  const handleSubmit = () => {
    if (!canSubmit) return
    if (!validateSubmission()) return
    setShowConfirm(true)
  }

  const confirmSubmit = async () => {
    setShowConfirm(false)
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const token = localStorage.getItem('seller_token')
      if (!token) throw new Error('Unauthorized')

      const payload = await buildSubmissionPayload(token, uploads, description, selectedCategories, inventoryRange)
      const result = await submitSellerKyc({ data: payload })
      setSubmittedAt(new Date(result.submittedAt))
      setLocalStatus('submitted')
      setSuccessMessage(true)
      pushToast('Documents submitted successfully', 'success')
      await refreshSeller()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit documents')
      pushToast('Submission failed. Please retry.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SellerProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Complete Your Verification
              </h1>
              <p className="mt-2 text-slate-600">
                Verify your business to start selling
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm text-orange-700">
                <ShieldCheck size={16} />
                Get verified badge, increase buyer trust
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={status} />
            </div>
          </div>

          {isRejected && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">Verification Rejected</p>
                  <p className="mt-1">
                    Reason: {rejectionReason}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalStatus('pending')
                      setSubmittedAt(null)
                      setSubmitError('')
                    }}
                    className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white text-sm font-semibold hover:bg-red-700"
                  >
                    Resubmit Documents
                  </button>
                </div>
              </div>
            </div>
          )}

          {isVerified && (
            <div className="mt-6 rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">Verified</p>
                  <p className="mt-1">Your business is verified. You can access all seller features.</p>
                  <Link
                    to="/seller/dashboard"
                    className="mt-3 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-semibold hover:bg-green-700"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isUnderReview && submittedAt && (
            <div className="mt-6 rounded-xl border border-yellow-100 bg-yellow-50 p-4 text-sm text-yellow-700">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">Your documents are under review</p>
                  <p className="mt-1">
                    Submitted on {submittedAt.toLocaleString()}
                  </p>
                  <p className="mt-1">
                    We&apos;ll review within 24-48 hours. Need help?{' '}
                    <Link to="/support" className="font-semibold underline">
                      Contact support
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Required Documents</h2>
            <p className="text-sm text-slate-500">JPEG, PNG, PDF · Max 5MB</p>
          </div>

          <DocumentUploader
            label="Trade License"
            description="Upload clear image of trade license"
            required
            item={uploads.tradeLicense}
            error={uploadErrors.tradeLicense}
            onDrop={(event) => handleDrop('tradeLicense', event)}
            onBrowse={(files) => handleBrowse('tradeLicense', files)}
            onClear={() => clearUpload('tradeLicense')}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <DocumentUploader
              label="National ID (Front)"
              description="Owner/Manager NID required"
              required
              item={uploads.nidFront}
              error={uploadErrors.nidFront}
              onDrop={(event) => handleDrop('nidFront', event)}
              onBrowse={(files) => handleBrowse('nidFront', files)}
              onClear={() => clearUpload('nidFront')}
            />
            <DocumentUploader
              label="National ID (Back)"
              description="Owner/Manager NID required"
              required
              item={uploads.nidBack}
              error={uploadErrors.nidBack}
              onDrop={(event) => handleDrop('nidBack', event)}
              onBrowse={(files) => handleBrowse('nidBack', files)}
              onClear={() => clearUpload('nidBack')}
            />
          </div>

          <DocumentUploader
            label="Bank Account Proof (Optional)"
            description="Cancelled cheque or bank statement for faster payout verification"
            item={uploads.bankProof}
            error={uploadErrors.bankProof}
            onDrop={(event) => handleDrop('bankProof', event)}
            onBrowse={(files) => handleBrowse('bankProof', files)}
            onClear={() => clearUpload('bankProof')}
          />
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">Additional Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Business description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="Tell buyers about your business, specialities, and capabilities..."
            />
            <p className="mt-1 text-xs text-slate-400">
              {description.length}/500 characters
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">
              Product categories you&apos;ll sell <span className="text-red-500">*</span>
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {CATEGORIES.map((category) => (
                <label
                  key={category}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    selectedCategories.includes(category)
                      ? 'border-orange-300 bg-orange-50 text-orange-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estimated monthly inventory value <span className="text-red-500">*</span>
            </label>
            <select
              value={inventoryRange}
              onChange={(event) => setInventoryRange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            >
              <option value="">Select range</option>
              {INVENTORY_RANGES.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">
              Uploading documents helps us verify your business faster.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Make sure each document is clear and legible.
            </p>
          </div>
          <button
            type="button"
            disabled={!canSubmit || !validateSubmission()}
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </section>

        {submitError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-700">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5" size={18} />
              <div>
                <p className="font-semibold">Documents submitted successfully!</p>
                <p className="mt-1">We&apos;ll review within 24-48 hours. You&apos;ll receive email/SMS notification.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {showConfirm && (
        <ConfirmationModal
          uploads={uploads}
          onClose={() => setShowConfirm(false)}
          onConfirm={confirmSubmit}
        />
      )}
    </SellerProtectedRoute>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-semibold text-green-700">
        <CheckCircle2 size={16} />
        Verified
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
        <XCircle size={16} />
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 px-4 py-2 text-sm font-semibold text-yellow-700">
      <AlertCircle size={16} />
      Pending Review
    </span>
  )
}

function DocumentUploader({
  label,
  description,
  required,
  item,
  error,
  onDrop,
  onBrowse,
  onClear,
}: {
  label: string
  description: string
  required?: boolean
  item: UploadItem | null
  error: string | null
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
  onBrowse: (files: FileList | null) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </p>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400">
          <Info size={12} /> {description}
        </span>
      </div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500"
      >
        {item ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700">{item.file.name}</p>
              <p className="text-xs text-slate-400">
                {(item.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-orange-500"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
            {item.previewUrl ? (
              <img
                src={item.previewUrl}
                alt={label}
                className="h-20 w-28 rounded-lg object-cover border border-slate-200"
              />
            ) : (
              <div className="h-20 w-28 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                <FileText size={20} />
              </div>
            )}
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-red-500 hover:text-red-600"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600">
                Drag & drop files here, or{' '}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-semibold text-orange-600 hover:text-orange-700"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-400">JPEG, PNG, PDF · Max 5MB</p>
            </div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(event) => onBrowse(event.target.files)}
        />
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ConfirmationModal({
  uploads,
  onClose,
  onConfirm,
}: {
  uploads: Record<UploadKey, UploadItem | null>
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            Review your documents before submitting
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" autoFocus>
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {Object.entries(uploads).map(([key, item]) => (
            <div key={key} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
              <span className="font-medium text-slate-700 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="text-slate-500">
                {item ? item.file.name : 'Not uploaded'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-lg bg-orange-600 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            Confirm & Submit
          </button>
        </div>
      </div>
    </div>
  )
}

async function compressImageIfNeeded(file: File) {
  if (!file.type.startsWith('image/')) return file
  if (file.size <= 1.5 * 1024 * 1024) return file

  const bitmap = await createImageBitmap(file)
  const maxWidth = 1600
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.8)
  })

  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
}

async function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Failed to read file'))
        return
      }
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.readAsDataURL(file)
  })
}

async function buildSubmissionPayload(
  token: string,
  uploads: Record<UploadKey, UploadItem | null>,
  description: string,
  categories: Array<string>,
  inventoryRange: string,
) {
  const tradeLicense = uploads.tradeLicense?.file
  const nidFront = uploads.nidFront?.file
  const nidBack = uploads.nidBack?.file
  const bankProof = uploads.bankProof?.file

  if (!tradeLicense || !nidFront || !nidBack) {
    throw new Error('Please upload all required documents.')
  }

  const payloadDocuments = {
    tradeLicense: {
      filename: tradeLicense.name,
      mimeType: tradeLicense.type,
      data: await fileToBase64(tradeLicense),
    },
    nidFront: {
      filename: nidFront.name,
      mimeType: nidFront.type,
      data: await fileToBase64(nidFront),
    },
    nidBack: {
      filename: nidBack.name,
      mimeType: nidBack.type,
      data: await fileToBase64(nidBack),
    },
    bankProof: bankProof
      ? {
          filename: bankProof.name,
          mimeType: bankProof.type,
          data: await fileToBase64(bankProof),
        }
      : undefined,
  }

  return {
    token,
    description,
    categories,
    inventoryRange,
    documents: payloadDocuments,
  }
}
