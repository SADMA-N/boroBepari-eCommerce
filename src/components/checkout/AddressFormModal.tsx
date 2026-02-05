import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Briefcase, Home, Loader2, MapPin, Warehouse, X } from 'lucide-react'
import { z } from 'zod'
import type { NewAddress } from '@/db/schema'

// Schema
const addressSchema = z.object({
  name: z.string().min(1, 'Label is required'),
  address: z.string().min(5, 'Full address is required'),
  city: z.string().min(2, 'City is required'),
  postcode: z.string().min(2, 'Postal code is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  isDefault: z.boolean(),
})

type AddressFormData = z.infer<typeof addressSchema>

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Omit<NewAddress, 'userId'>) => Promise<void>
  initialData?: Partial<AddressFormData>
  title?: string
}

export function AddressFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title = 'Add New Address',
}: AddressFormModalProps) {
  const form = useForm({
    defaultValues: {
      name: initialData?.name || 'Home',
      address: initialData?.address || '',
      city: initialData?.city || '',
      postcode: initialData?.postcode || '',
      phone: initialData?.phone || '',
      isDefault: initialData?.isDefault || false,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: addressSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
      onClose()
    },
  })

  if (!isOpen) return null

  const labels = [
    { value: 'Home', icon: Home },
    { value: 'Office', icon: Briefcase },
    { value: 'Warehouse', icon: Warehouse },
    { value: 'Other', icon: MapPin },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-4"
          >
            {/* Label Selection */}
            <form.Field name="name">
              {(field) => (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                    Address Label
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {labels.map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.handleChange(value)}
                        className={`
                          flex flex-col items-center justify-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all
                          ${
                            field.state.value === value
                              ? 'border-orange-500 bg-orange-50 text-orange-700 ring-1 ring-orange-500'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                          }
                        `}
                      >
                        <Icon size={16} />
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form.Field>

            {/* Full Address */}
            <form.Field name="address">
              {(field) => (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Full Address
                  </label>
                  <textarea
                    rows={3}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Street, House No, Flat No"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm resize-none border-gray-300"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-red-500 text-xs mt-1">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-4">
              {/* City */}
              <form.Field name="city">
                {(field) => (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300"
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-red-500 text-xs mt-1">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Postcode */}
              <form.Field name="postcode">
                {(field) => (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300"
                    />
                    {field.state.meta.errors[0] && (
                      <p className="text-red-500 text-xs mt-1">
                        {field.state.meta.errors[0]?.message}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>
            </div>

            {/* Phone */}
            <form.Field name="phone">
              {(field) => (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300"
                  />
                  {field.state.meta.errors[0] && (
                    <p className="text-red-500 text-xs mt-1">
                      {field.state.meta.errors[0]?.message}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Is Default */}
            <form.Field name="isDefault">
              {(field) => (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={field.state.value}
                    onChange={(e) => field.handleChange(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="isDefault" className="text-sm text-gray-700">
                    Set as default address
                  </label>
                </div>
              )}
            </form.Field>

            {/* Actions */}
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canSubmit || isSubmitting}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      'Save Address'
                    )}
                  </button>
                </div>
              )}
            </form.Subscribe>
          </form>
        </div>
      </div>
    </div>
  )
}
