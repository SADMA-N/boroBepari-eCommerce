import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import {
  Edit2,
  Eye,
  EyeOff,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { addresses, user as userTable } from '@/db/schema'
import { db } from '@/db'
import { authMiddleware } from '@/lib/auth-server'
import { api } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import BuyerRFQsSection from '@/components/buyer/BuyerRFQsSection'

// --- Server Functions ---

const getAccountData = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { session } = context
    if (!session) {
      throw redirect({ to: '/' })
    }
    const userId = session.user.id

    const userData = await db.query.user.findFirst({
      where: eq(userTable.id, userId),
      with: {
        addresses: true,
        rfqs: {
          orderBy: (rfqs, { desc: descFn }) => [descFn(rfqs.createdAt)],
          with: {
            product: true,
            quotes: {
              with: {
                supplier: true,
              },
            },
          },
        },
        orders: {
          orderBy: (orders, { desc: descFn }) => [descFn(orders.createdAt)],
          with: {
            items: {
              with: {
                product: true,
              },
            },
          },
        },
      },
    })

    if (!userData) throw new Error('User not found')

    return userData
  })

const updateProfile = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => {
    return z
      .object({
        name: z.string().min(1),
        dateOfBirth: z.string().optional().nullable(), // ISO date string
        gender: z.enum(['male', 'female']).optional().nullable(),
        phoneNumber: z
          .string()
          .regex(
            /^01[3-9]\d{8}$/,
            'Phone number must be 11 digits and start with 013-019',
          )
          .optional()
          .nullable(),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session) throw new Error('Unauthorized')

    await db
      .update(userTable)
      .set({
        name: data.name,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        phoneNumber: data.phoneNumber,
      })
      .where(eq(userTable.id, session.user.id))

    return { success: true }
  })

const upsertAddress = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => {
    return z
      .object({
        id: z.number().optional(),
        name: z.string().optional(),
        address: z.string().min(1),
        postcode: z.string().min(1),
        phone: z
          .string()
          .regex(
            /^01[3-9]\d{8}$/,
            'Phone number must be 11 digits and start with 013-019',
          ),
        isDefault: z.boolean().default(false),
      })
      .parse(data)
  })
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session) throw new Error('Unauthorized')

    if (data.isDefault) {
      // Unset other defaults
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, session.user.id))
    }

    let name = data.name
    if (!name) {
      const user = await db.query.user.findFirst({
        where: eq(userTable.id, session.user.id),
        columns: { name: true },
      })
      name = user?.name || 'My Address'
    }

    if (data.id) {
      // Update
      await db
        .update(addresses)
        .set({
          name: name,
          address: data.address,
          postcode: data.postcode,
          phone: data.phone,
          isDefault: data.isDefault,
          updatedAt: new Date(),
        })
        .where(
          and(eq(addresses.id, data.id), eq(addresses.userId, session.user.id)),
        )
    } else {
      // Insert
      await db.insert(addresses).values({
        userId: session.user.id,
        name: name,
        address: data.address,
        postcode: data.postcode,
        phone: data.phone,
        isDefault: data.isDefault,
      })
    }
    return { success: true }
  })

const deleteAddress = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .inputValidator((data: any) => z.object({ id: z.number() }).parse(data))
  .handler(async ({ data, context }) => {
    const { session } = context
    if (!session) throw new Error('Unauthorized')
    await db
      .delete(addresses)
      .where(
        and(eq(addresses.id, data.id), eq(addresses.userId, session.user.id)),
      )
    return { success: true }
  })

// --- Component ---

export const Route = createFileRoute('/account')({
  component: AccountPage,
  loader: () => getAccountData(),
  validateSearch: (search: Record<string, unknown>) => {
    return {
      tab:
        (search.tab as
          | 'profile'
          | 'address'
          | 'orders'
          | 'rfqs'
          | 'security'
          | undefined) ?? 'profile',
    }
  },
})

function AccountPage() {
  const userData = Route.useLoaderData()
  const { tab } = Route.useSearch()
  const navigate = Route.useNavigate()

  const activeTab = tab

  const setActiveTab = (
    newTab: 'profile' | 'address' | 'orders' | 'rfqs' | 'security',
  ) => {
    navigate({ search: { tab: newTab } })
  }

  return (
    <div className="bg-gray-50 dark:bg-slate-950 min-h-screen py-8 transition-colors">
      <div className="max-w-[1440px] mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 transition-colors">
          Manage My Account
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4 sticky top-24 border dark:border-slate-800 transition-colors">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <User size={20} />
                  My Profile
                </button>
                <button
                  onClick={() => setActiveTab('address')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    activeTab === 'address'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <MapPin size={20} />
                  Address Book
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Package size={20} />
                  My Orders
                </button>
                <button
                  onClick={() => setActiveTab('rfqs')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    activeTab === 'rfqs'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <MessageSquare size={20} />
                  My RFQs
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Shield size={20} />
                  Security
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'profile' && <ProfileSection user={userData} />}
            {activeTab === 'address' && (
              <AddressSection addresses={userData.addresses} />
            )}
            {activeTab === 'orders' && (
              <OrdersSection orders={userData.orders} />
            )}
            {activeTab === 'rfqs' && (
              <BuyerRFQsSection rfqs={userData.rfqs} />
            )}
            {activeTab === 'security' && <SecuritySection />}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Sub-Components ---

function ProfileSection({ user }: { user: any }) {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const form = useForm({
    defaultValues: {
      name: user.name || '',
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split('T')[0]
        : '',
      gender: user.gender || '',
      phoneNumber: user.phoneNumber || '',
      email: user.email || '', // Readonly
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      setMessage(null)
      try {
        await updateProfile({
          data: {
            name: value.name,
            dateOfBirth: value.dateOfBirth || null,
            gender: value.gender || null,
            phoneNumber: value.phoneNumber || null,
          },
        })
        await refreshUser()
        setMessage({ type: 'success', text: 'Profile updated successfully' })
        router.invalidate()
      } catch (err: any) {
        console.error(err)
        const errorMsg = err.message || 'Failed to update profile'
        setMessage({ type: 'error', text: errorMsg })
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 border dark:border-slate-800 transition-colors">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100 dark:border-slate-800 dark:text-white transition-colors">
        My Profile
      </h2>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 transition-colors ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6 max-w-2xl"
      >
        <form.Field
          name="name"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Full Name
              </label>
              <input
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form.Field
            name="dateOfBirth"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}
          />

          <form.Field
            name="gender"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Gender
                </label>
                <select
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
              Email Address
            </label>
            <input
              value={form.getFieldValue('email')}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          <form.Field
            name="phoneNumber"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Phone Number
                </label>
                <input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d*$/.test(val) && val.length <= 11)
                      field.handleChange(val)
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  )
}

function AddressSection({
  addresses: userAddresses,
}: {
  addresses: Array<any>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)
  const router = useRouter()

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this address?')) {
      await deleteAddress({ data: { id } })
      router.invalidate()
    }
  }

  if (isEditing) {
    return (
      <AddressForm
        address={editingAddress}
        onCancel={() => {
          setIsEditing(false)
          setEditingAddress(null)
        }}
        onSuccess={() => {
          setIsEditing(false)
          setEditingAddress(null)
          router.invalidate()
        }}
      />
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 border dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-800 transition-colors">
        <h2 className="text-xl font-semibold dark:text-white">Address Book</h2>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 transition-colors"
        >
          <Plus size={18} />
          Add New Address
        </button>
      </div>

      <div className="space-y-4">
        {userAddresses.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No addresses found. Add one to get started.
          </div>
        ) : (
          userAddresses.map((addr) => (
            <div
              key={addr.id}
              className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 hover:border-orange-200 dark:hover:border-orange-900 transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {addr.name}
                    </span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium transition-colors">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {addr.address}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {addr.postcode}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1.5 text-sm transition-colors">
                    <Phone size={14} />
                    {addr.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingAddress(addr)
                      setIsEditing(true)
                    }}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function AddressForm({
  address,
  onCancel,
  onSuccess,
}: {
  address?: any
  onCancel: () => void
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const form = useForm({
    defaultValues: {
      name: address?.name || '',
      address: address?.address || '',
      postcode: address?.postcode || '',
      phone: address?.phone || '',
      isDefault: address?.isDefault || false,
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true)
      setMessage(null)
      try {
        await upsertAddress({ data: { ...value, id: address?.id } })
        onSuccess()
      } catch (err: any) {
        console.error(err)
        const errorMsg = err.message || 'Failed to save address'
        setMessage({ type: 'error', text: errorMsg })
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 border dark:border-slate-800 transition-colors">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100 dark:border-slate-800 dark:text-white transition-colors">
        {address ? 'Edit Address' : 'Add New Address'}
      </h2>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 transition-colors ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6 max-w-2xl"
      >
        <form.Field
          name="address"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Address
              </label>
              <textarea
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                rows={3}
              />
            </div>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form.Field
            name="postcode"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Postcode
                </label>
                <input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}
          />

          <form.Field
            name="phone"
            children={(field) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                  Phone Number
                </label>
                <input
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d*$/.test(val) && val.length <= 11)
                      field.handleChange(val)
                  }}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            )}
          />
        </div>

        <form.Field
          name="isDefault"
          children={(field) => (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name={field.name}
                checked={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 dark:border-slate-700 rounded focus:ring-orange-500 bg-white dark:bg-slate-800 transition-colors"
              />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                Make this my default address
              </label>
            </div>
          )}
        />

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            Save Address
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 focus:ring-4 focus:ring-gray-100 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function SecuritySection() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const generateStrongPassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    // Ensure at least one letter and one number
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    password += '0123456789'[Math.floor(Math.random() * 10)]

    for (let i = 2; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)]
    }
    // Shuffle the password
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('')
  }

  const form = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    onSubmit: async ({ value }) => {
      if (value.newPassword !== value.confirmPassword) {
        setMessage({ type: 'error', text: 'New passwords do not match' })
        return
      }

      setIsLoading(true)
      setMessage(null)
      try {
        await api.auth.buyer.updatePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        })
        setMessage({ type: 'success', text: 'Password updated successfully' })
        form.reset()
      } catch (err: any) {
        console.error(err)
        const errorMsg = err.message || 'Failed to update password'
        setMessage({ type: 'error', text: errorMsg })
      } finally {
        setIsLoading(false)
      }
    },
  })

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 border dark:border-slate-800 transition-colors">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100 dark:border-slate-800 dark:text-white transition-colors">
        Password & Security
      </h2>

      {message && (
        <div
          className={`p-4 rounded-lg mb-6 transition-colors ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6 max-w-2xl"
      >
        <form.Field
          name="currentPassword"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showCurrentPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          )}
        />

        <form.Field
          name="newPassword"
          children={(field) => (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                  New Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const pass = generateStrongPassword()
                    field.handleChange(pass)
                    setMessage({
                      type: 'success',
                      text: `Generated strong password: ${pass} (Save it or edit it)`,
                    })
                  }}
                  className="text-xs text-orange-600 dark:text-orange-500 hover:underline flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Generate Strong Password
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <p
                  className={`text-xs ${
                    field.state.value.length >= 8
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  • Minimum 8 characters
                </p>
                <p
                  className={`text-xs ${
                    /^(?=.*[a-zA-Z])(?=.*\d).+$/.test(field.state.value)
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  • Must include letters and numbers
                </p>
              </div>
            </div>
          )}
        />

        <form.Field
          name="confirmPassword"
          children={(field) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 transition-colors">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>
          )}
        />

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            Update Password
          </button>
        </div>
      </form>
    </div>
  )
}

function OrdersSection({ orders }: { orders: Array<any> }) {
  if (orders.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 text-center py-12 border dark:border-slate-800 transition-colors">
        <Package
          size={48}
          className="mx-auto text-gray-300 dark:text-gray-700 mb-4 transition-colors"
        />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 transition-colors">
          No Orders Yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 transition-colors">
          Looks like you haven't placed any orders yet.
        </p>
        <a
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all shadow-sm shadow-orange-500/20"
        >
          Start Shopping
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm p-6 border dark:border-slate-800 transition-colors">
      <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100 dark:border-slate-800 dark:text-white transition-colors">
        My Orders
      </h2>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden transition-colors"
          >
            <div className="bg-gray-50 dark:bg-slate-800/50 px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center transition-colors">
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider transition-colors">
                  Order Placed
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider transition-colors">
                  Total Amount
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                  ৳{Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider transition-colors">
                  Order ID
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                  #{order.id}
                </p>
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors
                                    ${
                                      order.status === 'delivered'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : order.status === 'cancelled'
                                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            <div className="p-6 transition-colors">
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 transition-colors"
                  >
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 transition-colors border dark:border-slate-700">
                      {/* Placeholder for product image */}
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 transition-colors">
                        <Package size={24} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 transition-colors">
                      ৳{Number(item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
