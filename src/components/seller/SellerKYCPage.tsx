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
  | 'trade_license'
  | 'nid_front'
  | 'nid_back'
  | 'bank_proof'
  | 'selfie'

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
    trade_license: null,
    nid_front: null,
    nid_back: null,
    bank_proof: null,
    selfie: null,
  })
  const [uploadErrors, setUploadErrors] = useState<
    Record<UploadKey, string | null>
  >({
    trade_license: null,
    nid_front: null,
    nid_back: null,
    bank_proof: null,
    selfie: null,
  })
  const [description, setDescription] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<Array<string>>(
    [],
  )
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
    setUploads((prev) => ({
      ...prev,
      [key]: { file: processedFile, previewUrl, progress: 0 },
    }))
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

  const handleDrop = (
    key: UploadKey,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
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
    const requiredMissing = ['trade_license', 'nid_front', 'nid_back'].some(
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

      const payload = await buildSubmissionPayload(
        uploads,
        description,
        selectedCategories,
        inventoryRange,
      )
      const result = await submitSellerKyc({
        data: payload,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setSubmittedAt(new Date(result.submittedAt))
      setLocalStatus('submitted')
      setSuccessMessage(true)
      pushToast('Documents submitted successfully', 'success')
      await refreshSeller()
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit documents',
      )
      pushToast('Submission failed. Please retry.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SellerProtectedRoute>
      <div className="max-w-5xl mx-auto space-y-8">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-gray-100 transition-colors">
                Complete Your Verification
              </h1>
              <p className="mt-2 text-slate-600 dark:text-gray-400 transition-colors">
                Verify your business to start selling
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-50 dark:bg-orange-900/20 px-4 py-2 text-sm text-orange-700 dark:text-orange-400 transition-colors">
                <ShieldCheck size={16} />
                Get verified badge, increase buyer trust
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={status} />
            </div>
          </div>

          {isRejected && (
            <div className="mt-6 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-700 dark:text-red-400 transition-colors">
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">Verification Rejected</p>
                  <p className="mt-1">Reason: {rejectionReason}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalStatus('pending')
                      setSubmittedAt(null)
                      setSubmitError('')
                    }}
                    className="mt-3 inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                  >
                    Resubmit Documents
                  </button>
                </div>
              </div>
            </div>
          )}

          {isVerified && (
            <div className="mt-6 rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 p-4 text-sm text-green-700 dark:text-green-400 transition-colors">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">Verified</p>
                  <p className="mt-1">
                    Your business is verified. You can access all seller
                    features.
                  </p>
                  <Link
                    to="/seller/dashboard"
                    className="mt-3 inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isUnderReview && submittedAt && (
            <div className="mt-6 rounded-xl border border-yellow-100 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 p-4 text-sm text-yellow-700 dark:text-yellow-400 transition-colors">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5" size={18} />
                <div>
                  <p className="font-semibold">
                    Your documents are under review
                  </p>
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

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100 transition-colors">
              Required Documents
            </h2>
            <p className="text-sm text-slate-500 dark:text-gray-400 transition-colors">
              JPEG, PNG, PDF · Max 5MB
            </p>
          </div>

          <DocumentUploader
            label="Trade License"
            description="Upload clear image of trade license"
            required
            item={uploads.trade_license}
            error={uploadErrors.trade_license}
            onDrop={(event) => handleDrop('trade_license', event)}
            onBrowse={(files) => handleBrowse('trade_license', files)}
            onClear={() => clearUpload('trade_license')}
          />

          <div className="grid md:grid-cols-2 gap-6">
            <DocumentUploader
              label="National ID (Front)"
              description="Owner/Manager NID required"
              required
              item={uploads.nid_front}
              error={uploadErrors.nid_front}
              onDrop={(event) => handleDrop('nid_front', event)}
              onBrowse={(files) => handleBrowse('nid_front', files)}
              onClear={() => clearUpload('nid_front')}
            />
            <DocumentUploader
              label="National ID (Back)"
              description="Owner/Manager NID required"
              required
              item={uploads.nid_back}
              error={uploadErrors.nid_back}
              onDrop={(event) => handleDrop('nid_back', event)}
              onBrowse={(files) => handleBrowse('nid_back', files)}
              onClear={() => clearUpload('nid_back')}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <DocumentUploader
              label="Selfie with NID (Optional)"
              description="Helps verify identity faster"
              item={uploads.selfie}
              error={uploadErrors.selfie}
              onDrop={(event) => handleDrop('selfie', event)}
              onBrowse={(files) => handleBrowse('selfie', files)}
              onClear={() => clearUpload('selfie')}
            />
            <DocumentUploader
              label="Bank Account Proof (Optional)"
              description="Cancelled cheque or bank statement"
              item={uploads.bank_proof}
              error={uploadErrors.bank_proof}
              onDrop={(event) => handleDrop('bank_proof', event)}
              onBrowse={(files) => handleBrowse('bank_proof', files)}
              onClear={() => clearUpload('bank_proof')}
            />
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 transition-colors">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
            Additional Information
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
              Business description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="Tell buyers about your business, specialities, and capabilities..."
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 transition-colors">
              {description.length}/500 characters
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-3 transition-colors">
              Product categories you&apos;ll sell{' '}
              <span className="text-red-500">*</span>
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {CATEGORIES.map((category) => (
                <label
                  key={category}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer ${
                    selectedCategories.includes(category)
                      ? 'border-orange-300 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
                  />
                  {category}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
              Estimated monthly inventory value{' '}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={inventoryRange}
              onChange={(event) => setInventoryRange(event.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all"
            >
              <option value="" className="dark:bg-slate-950">
                Select range
              </option>
              {INVENTORY_RANGES.map((range) => (
                <option key={range} value={range} className="dark:bg-slate-950">
                  {range}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
          <div>
            <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors">
              Uploading documents helps us verify your business faster.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 transition-colors">
              Make sure each document is clear and legible.
            </p>
          </div>
          <button
            type="button"
            disabled={!canSubmit || !validateSubmission()}
            onClick={handleSubmit}
            className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-600/10"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
          </button>
        </section>

        {submitError && (
          <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-700 dark:text-red-400 transition-colors">
            {submitError}
          </div>
        )}

        {successMessage && (
          <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 p-4 text-sm text-green-700 dark:text-green-400 transition-colors">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5" size={18} />
              <div>
                <p className="font-semibold">
                  Documents submitted successfully!
                </p>
                <p className="mt-1">
                  We&apos;ll review within 24-48 hours. You&apos;ll receive
                  email/SMS notification.
                </p>
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
      <span className="inline-flex items-center gap-2 rounded-full bg-green-50 dark:bg-green-900/20 px-4 py-2 text-sm font-semibold text-green-700 dark:text-green-400 transition-colors">
        <CheckCircle2 size={16} />
        Verified
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-700 dark:text-red-400 transition-colors">
        <XCircle size={16} />
        Rejected
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 text-sm font-semibold text-yellow-700 dark:text-yellow-400 transition-colors">
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
        <p className="text-sm font-semibold text-slate-700 dark:text-gray-300 transition-colors">
          {label} {required && <span className="text-red-500">*</span>}
        </p>
        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 transition-colors">
          <Info size={12} /> {description}
        </span>
      </div>
      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="mt-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 text-sm text-slate-500 dark:text-gray-400 transition-colors"
      >
        {item ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200 transition-colors">
                {item.file.name}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                {(item.file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800 transition-colors">
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
                className="h-20 w-28 rounded-lg object-cover border border-slate-200 dark:border-slate-800 transition-colors"
              />
            ) : (
              <div className="h-20 w-28 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 transition-colors">
                <FileText size={20} />
              </div>
            )}
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-600 transition-colors">
              <UploadCloud size={20} />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors">
                Drag & drop files here, or{' '}
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-500 transition-colors"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                JPEG, PNG, PDF · Max 5MB
              </p>
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
      {error && (
        <p className="mt-2 text-xs text-red-500 dark:text-red-400 transition-colors">
          {error}
        </p>
      )}
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 px-4 backdrop-blur-sm transition-all"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl border border-gray-200 dark:border-slate-800 transition-all">
        <div className="flex items-center justify-between border-b dark:border-slate-800 pb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 transition-colors">
            Review your documents
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200 transition-colors"
            aria-label="Close modal"
            autoFocus
          >
            ✕
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-gray-400 transition-colors">
          {Object.entries(uploads).map(([key, item]) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 bg-gray-50 dark:bg-slate-950/50 transition-colors"
            >
              <span className="font-medium text-slate-700 dark:text-gray-300 capitalize transition-colors">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="text-slate-500 dark:text-gray-500 truncate ml-4 transition-colors">
                {item ? item.file.name : 'Not uploaded'}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 py-2.5 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-lg bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
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
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
    type: 'image/jpeg',
  })
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
  uploads: Record<UploadKey, UploadItem | null>,
  description: string,
  categories: Array<string>,
  inventoryRange: string,
) {
  const trade_license = uploads.trade_license?.file
  const nid_front = uploads.nid_front?.file
  const nid_back = uploads.nid_back?.file
  const bank_proof = uploads.bank_proof?.file
  const selfie = uploads.selfie?.file

  if (!trade_license || !nid_front || !nid_back) {
    throw new Error('Please upload all required documents.')
  }

  const payloadDocuments = {
    trade_license: {
      filename: trade_license.name,
      mimeType: trade_license.type,
      data: await fileToBase64(trade_license),
    },
    nid_front: {
      filename: nid_front.name,
      mimeType: nid_front.type,
      data: await fileToBase64(nid_front),
    },
    nid_back: {
      filename: nid_back.name,
      mimeType: nid_back.type,
      data: await fileToBase64(nid_back),
    },
    bank_proof: bank_proof
      ? {
          filename: bank_proof.name,
          mimeType: bank_proof.type,
          data: await fileToBase64(bank_proof),
        }
      : undefined,
    selfie: selfie
      ? {
          filename: selfie.name,
          mimeType: selfie.type,
          data: await fileToBase64(selfie),
        }
      : undefined,
  }

  return {
    description,
    categories,
    inventoryRange,
    documents: payloadDocuments,
  }
}
