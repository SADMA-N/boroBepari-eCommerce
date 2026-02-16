import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  MapPin,
  Paperclip,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'

import Toast from './Toast'
import { createRfqSchema } from '@/lib/rfq-validation'
import { api } from '@/api/client'

// Schema for the form fields only (subset of createRfqSchema or modified for UI)
// We need to handle file uploads separately or as part of the form state if we convert them.
const rfqFormSchema = createRfqSchema.pick({
  quantity: true,
  targetPrice: true,
  deliveryLocation: true,
  notes: true,
})

interface RFQFormModalProps {
  isOpen: boolean
  onClose: () => void
  productId: number
  productName: string
}

export default function RFQFormModal({
  isOpen,
  onClose,
  productId,
  productName,
}: RFQFormModalProps) {
  const [isToastVisible, setIsToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [rfqNumber, setRfqNumber] = useState<string | null>(null)

  // Custom file state since file inputs are often uncontrolled or need special handling
  const [files, setFiles] = useState<Array<File>>([])
  const [fileError, setFileError] = useState('')

  const form = useForm({
    defaultValues: {
      quantity: 1,
      targetPrice: 0,
      deliveryLocation: '',
      notes: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: rfqFormSchema,
    },
    onSubmit: async ({ value }) => {
      // Validate files
      if (files.length > 5) {
        setFileError('Maximum 5 files allowed')
        return
      }

      try {
        // Upload files first
        const attachmentUrls: Array<string> = []
        
        if (files.length > 0) {
          const uploadPromises = files.map(async (file) => {
            const formData = new FormData()
            formData.append('file', file)
            const result = await api.rfq.uploadAttachment(formData)
            return result.url
          })

          const uploaded = await Promise.all(uploadPromises)
          attachmentUrls.push(...uploaded)
        }

        const result = await api.rfq.submit({
          productId,
          quantity: value.quantity,
          targetPrice: value.targetPrice,
          deliveryLocation: value.deliveryLocation,
          notes: value.notes,
          attachments: attachmentUrls,
        })

        if (result.success) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
          // Success handling
          const newRfqNumber = `RFQ-${result.rfqId || Math.floor(Math.random() * 10000)}`
          setRfqNumber(newRfqNumber)
          setToastMessage('RFQ submitted successfully!')
          setIsToastVisible(true)

          // Auto close after 2 seconds
          setTimeout(() => {
            onClose()
            // Reset state after close
            setTimeout(() => {
              setRfqNumber(null)
              setFiles([])
              form.reset()
            }, 300)
          }, 2000)
        }
      } catch (error: any) {
        setToastMessage(error.message || 'Failed to submit RFQ')
        setIsToastVisible(true)
      }
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('')
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)

      // Validate count
      if (files.length + selectedFiles.length > 5) {
        setFileError('You can only upload up to 5 files in total.')
        return
      }

      // Validate size (5MB)
      const invalidFile = selectedFiles.find((f) => f.size > 5 * 1024 * 1024)
      if (invalidFile) {
        setFileError(`File ${invalidFile.name} exceeds 5MB limit.`)
        return
      }

      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rfq-modal-title"
      >
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] transition-colors border border-gray-200 dark:border-slate-800">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors">
            <div>
              <h2
                id="rfq-modal-title"
                className="text-xl font-bold text-gray-900 dark:text-white transition-colors"
              >
                Request for Quote
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors">
                Submit your requirements for {productName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Success State */}
          {rfqNumber ? (
            <div className="flex flex-col items-center justify-center p-10 text-center h-full transition-colors">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 text-green-600 dark:text-green-400 transition-colors">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
                Request Submitted!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 transition-colors">
                Your RFQ{' '}
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {rfqNumber}
                </span>{' '}
                has been sent to suppliers.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-lg text-sm font-medium transition-colors border dark:border-blue-900/50">
                Expected response in 24 hours
              </div>
            </div>
          ) : (
            /* Form */
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-5"
              >
                {/* Product Name (Read-only) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 transition-colors">
                    Product
                  </label>
                  <div className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm transition-colors">
                    {productName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity */}
                  <form.Field
                    name="quantity"
                    validators={{
                      onChange: z
                        .number()
                        .int()
                        .positive('Quantity must be greater than 0'),
                    }}
                  >
                    {(field) => (
                      <div>
                        <label
                          htmlFor="quantity"
                          className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 transition-colors"
                        >
                          Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id="quantity"
                          min="1"
                          value={field.state.value}
                          onChange={(e) =>
                            field.handleChange(Number(e.target.value))
                          }
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            field.state.meta.errors.length
                              ? 'border-red-300 dark:border-red-900/50 focus:ring-red-200 dark:focus:ring-red-900/20'
                              : 'border-gray-300 dark:border-slate-700'
                          }`}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-red-500 dark:text-red-400 text-xs mt-1 transition-colors">
                            {field.state.meta.errors[0]?.message}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>

                  {/* Target Price */}
                  <form.Field
                    name="targetPrice"
                    validators={{
                      onChange: z
                        .number()
                        .positive('Price must be greater than 0'),
                    }}
                  >
                    {(field) => (
                      <div>
                        <label
                          htmlFor="targetPrice"
                          className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 transition-colors"
                        >
                          Target Price (BDT)
                        </label>
                        <input
                          type="number"
                          id="targetPrice"
                          min="0"
                          step="0.01"
                          value={field.state.value || ''}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value ? Number(e.target.value) : 0,
                            )
                          }
                          placeholder="0.00"
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            field.state.meta.errors.length
                              ? 'border-red-300 dark:border-red-900/50 focus:ring-red-200 dark:focus:ring-red-900/20'
                              : 'border-gray-300 dark:border-slate-700'
                          }`}
                        />
                        {field.state.meta.errors.length > 0 && (
                          <p className="text-red-500 dark:text-red-400 text-xs mt-1 transition-colors">
                            {field.state.meta.errors[0]?.message}
                          </p>
                        )}
                      </div>
                    )}
                  </form.Field>
                </div>

                {/* Delivery Location */}
                <form.Field
                  name="deliveryLocation"
                  validators={{
                    onChange: z
                      .string()
                      .min(5, 'Delivery location is required (min 5 chars)'),
                  }}
                >
                  {(field) => (
                    <div>
                      <label
                        htmlFor="deliveryLocation"
                        className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 transition-colors"
                      >
                        Delivery Location{' '}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 transition-colors">
                          <MapPin size={16} />
                        </div>
                        <input
                          type="text"
                          id="deliveryLocation"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Enter city, area, or address"
                          className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white ${
                            field.state.meta.errors.length
                              ? 'border-red-300 dark:border-red-900/50 focus:ring-red-200 dark:focus:ring-red-900/20'
                              : 'border-gray-300 dark:border-slate-700'
                          }`}
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-red-500 dark:text-red-400 text-xs mt-1 transition-colors">
                          {field.state.meta.errors[0]?.message}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                {/* Additional Notes */}
                <form.Field name="notes">
                  {(field) => (
                    <div>
                      <label
                        htmlFor="notes"
                        className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 transition-colors"
                      >
                        Additional Notes{' '}
                        <span className="text-gray-400 dark:text-gray-500 font-normal normal-case transition-colors">
                          (Optional)
                        </span>
                      </label>
                      <textarea
                        id="notes"
                        rows={3}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Any specific requirements, packaging instructions, etc."
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  )}
                </form.Field>

                {/* File Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1 transition-colors">
                    Attachments{' '}
                    <span className="text-gray-400 dark:text-gray-500 font-normal normal-case transition-colors">
                      (Max 5 files, 5MB each)
                    </span>
                  </label>

                  <div
                    className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer relative ${
                      fileError
                        ? 'border-red-300 bg-red-50 dark:bg-red-900/10'
                        : 'border-gray-300 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="file"
                      multiple
                      id="file-upload"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="image/*,.pdf,.doc,.docx"
                      aria-label="Upload files"
                      aria-invalid={!!fileError}
                      aria-describedby={fileError ? 'file-error' : undefined}
                    />
                    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                      <Paperclip size={20} className="mb-2" />
                      <span className="text-xs font-medium">
                        Click or drag files here
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                        PDF, DOC, Images (Max 5MB)
                      </span>
                    </div>
                  </div>

                  {fileError && (
                    <p
                      id="file-error"
                      className="text-red-500 dark:text-red-400 text-xs mt-1 flex items-center gap-1 transition-colors"
                    >
                      <AlertCircle size={12} /> {fileError}
                    </p>
                  )}

                  {/* File List */}
                  {files.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {files.map((file, index) => (
                        <li
                          key={index}
                          className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 px-3 py-2 rounded text-sm text-gray-700 dark:text-gray-300 transition-colors border dark:border-slate-700"
                        >
                          <span className="truncate max-w-[200px]">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-2 transition-colors"
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Submit Button */}
                <form.Subscribe
                  selector={(state) => [state.canSubmit, state.isSubmitting]}
                >
                  {([canSubmit, isSubmitting]) => (
                    <button
                      type="submit"
                      disabled={!canSubmit || isSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4 active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        'Submit Quote Request'
                      )}
                    </button>
                  )}
                </form.Subscribe>
              </form>
            </div>
          )}
        </div>
      </div>

      <Toast
        message={toastMessage}
        isVisible={isToastVisible}
        onClose={() => setIsToastVisible(false)}
      />
    </>
  )
}
