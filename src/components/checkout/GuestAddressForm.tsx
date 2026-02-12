import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Loader2 } from 'lucide-react'
import { z } from 'zod'
import { BD_PHONE_REGEX } from '@/lib/validators'

const guestAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().min(5, 'Full address is required'),
  city: z.string().min(2, 'City is required'),
  postcode: z.string().min(2, 'Postal code is required'),
  phone: z
    .string()
    .regex(BD_PHONE_REGEX, 'Use BD format: 01XXXXXXXXX'),
})

type GuestAddressFormData = z.infer<typeof guestAddressSchema>

interface GuestAddressFormProps {
  onSubmit: (data: GuestAddressFormData) => void
}

export function GuestAddressForm({ onSubmit }: GuestAddressFormProps) {
  const form = useForm({
    defaultValues: {
      fullName: '',
      email: '',
      address: '',
      city: '',
      postcode: '',
      phone: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: guestAddressSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value)
    },
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-800 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Shipping Address</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-4"
      >
        {/* Full Name & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <form.Field name="fullName">
            {(field) => (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {field.state.meta.errors[0] && (
                  <p className="text-red-500 text-xs mt-1">
                    {field.state.meta.errors[0]?.message}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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

        {/* Address */}
        <form.Field name="address">
          {(field) => (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                Full Address
              </label>
              <textarea
                rows={2}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Street, House No, Flat No"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm resize-none border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {field.state.meta.errors[0] && (
                <p className="text-red-500 text-xs mt-1">
                  {field.state.meta.errors[0]?.message}
                </p>
              )}
            </div>
          )}
        </form.Field>

        {/* This form is auto-submitted or state controlled by parent in real app, but for now we'll rely on parent capturing state or add a hidden trigger if needed.
            However, usually we want the "Continue" button outside.
            The `useForm` hook manages state. We can expose state or valid status via context or props if we lift state up.
            For simplicity in this step, I'll let the user fill it and the "Continue" button in checkout page can trigger a ref submit or we just update parent state on change.
            Actually, let's keep it simple: The checkout page will have the "Continue" button.
            Ideally, we lift the form state up or use a form provider.
            Given the constraints, I will add a "Save & Continue" button inside here OR make the parent control the submission.
            Let's add a `onChange` listener to `useForm`? TanStack form supports `onChange`.
            For now, I'll add a "Confirm Address" button here which effectively selects it.
        */}
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
                  'Confirm Shipping Address'
                )}
              </button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
