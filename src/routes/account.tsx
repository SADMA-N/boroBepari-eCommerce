import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Calendar, Edit2, Loader2, Mail, MapPin, Package, Phone, Plus, Trash2, User } from 'lucide-react'
import { addresses, orderItems, orders as ordersTable, products, suppliers, user as userTable } from '@/db/schema'
import { db } from '@/db'
import { authMiddleware } from '@/lib/auth-server'

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
                orders: {
                    orderBy: (orders, { desc: descFn }) => [descFn(orders.createdAt)],
                    with: {
                        items: {
                            with: {
                                product: true
                            }
                        }
                    }
                }
            }
        })

        if (!userData) throw new Error('User not found')

        return userData
    })

const updateProfile = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator((data: any) => {
        return z.object({
            name: z.string().min(1),
            dateOfBirth: z.string().optional().nullable(), // ISO date string
            gender: z.enum(['male', 'female']).optional().nullable(),
            phoneNumber: z.string().optional().nullable(),
        }).parse(data)
    })
    .handler(async ({ data, context }) => {
        const { session } = context
        if (!session) throw new Error('Unauthorized')
        
        await db.update(userTable)
            .set({
                name: data.name,
                dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
                gender: data.gender,
                phoneNumber: data.phoneNumber
            })
            .where(eq(userTable.id, session.user.id))

        return { success: true }
    })

const upsertAddress = createServerFn({ method: 'POST' })
    .middleware([authMiddleware])
    .inputValidator((data: any) => {
        return z.object({
            id: z.number().optional(),
            name: z.string().min(1),
            address: z.string().min(1),
            postcode: z.string().min(1),
            phone: z.string().min(1),
            isDefault: z.boolean().default(false),
        }).parse(data)
    })
    .handler(async ({ data, context }) => {
        const { session } = context
        if (!session) throw new Error('Unauthorized')
        
        if (data.isDefault) {
            // Unset other defaults
            await db.update(addresses)
                .set({ isDefault: false })
                .where(eq(addresses.userId, session.user.id))
        }

        if (data.id) {
            // Update
            await db.update(addresses)
                .set({
                    name: data.name,
                    address: data.address,
                    postcode: data.postcode,
                    phone: data.phone,
                    isDefault: data.isDefault,
                    updatedAt: new Date()
                })
                .where(and(eq(addresses.id, data.id), eq(addresses.userId, session.user.id)))
        } else {
            // Insert
            await db.insert(addresses).values({
                userId: session.user.id,
                name: data.name,
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
        await db.delete(addresses)
            .where(and(eq(addresses.id, data.id), eq(addresses.userId, session.user.id)))
        return { success: true }
    })

// --- Component ---

export const Route = createFileRoute('/account')({
    component: AccountPage,
    loader: () => getAccountData(),
    validateSearch: (search: Record<string, unknown>) => {
        return {
            tab: (search.tab as 'profile' | 'address' | 'orders' | undefined) ?? 'profile',
        }
    },
})

function AccountPage() {
    const userData = Route.useLoaderData()
    const { tab } = Route.useSearch()
    const navigate = Route.useNavigate()
    
    const activeTab = tab
    
    const setActiveTab = (newTab: 'profile' | 'address' | 'orders') => {
        navigate({ search: { tab: newTab } })
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8">
            <div className="max-w-[1440px] mx-auto px-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Manage My Account</h1>
                
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
                            <nav className="space-y-1">
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        activeTab === 'profile' 
                                            ? 'bg-orange-50 text-orange-600' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <User size={20} />
                                    My Profile
                                </button>
                                <button
                                    onClick={() => setActiveTab('address')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        activeTab === 'address' 
                                            ? 'bg-orange-50 text-orange-600' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <MapPin size={20} />
                                    Address Book
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                                        activeTab === 'orders' 
                                            ? 'bg-orange-50 text-orange-600' 
                                            : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <Package size={20} />
                                    My Orders
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        {activeTab === 'profile' && <ProfileSection user={userData} />}
                        {activeTab === 'address' && <AddressSection addresses={userData.addresses} />}
                        {activeTab === 'orders' && <OrdersSection orders={userData.orders} />}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- Sub-Components ---

function ProfileSection({ user }: { user: any }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const form = useForm({
        defaultValues: {
            name: user.name || '',
            dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
            gender: user.gender || '',
            phoneNumber: user.phoneNumber || '',
            email: user.email || '', // Readonly
        },
        onSubmit: async ({ value }) => {
            setIsLoading(true)
            setMessage(null)
            try {
                await updateProfile({ data: {
                    name: value.name,
                    dateOfBirth: value.dateOfBirth || null,
                    gender: value.gender || null,
                    phoneNumber: value.phoneNumber || null,
                }})
                setMessage({ type: 'success', text: 'Profile updated successfully' })
                router.invalidate()
            } catch (err) {
                setMessage({ type: 'error', text: 'Failed to update profile' })
            } finally {
                setIsLoading(false)
            }
        },
    })

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100">My Profile</h2>
            
            {message && (
                <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }} className="space-y-6 max-w-2xl">
                <form.Field
                    name="name"
                    children={(field) => (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form.Field
                        name="dateOfBirth"
                        children={(field) => (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                <input
                                    type="date"
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>
                        )}
                    />

                    <form.Field
                        name="gender"
                        children={(field) => (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                <select
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            value={form.getFieldValue('email')}
                            disabled
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <form.Field
                        name="phoneNumber"
                        children={(field) => (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>
                        )}
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={18} />}
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    )
}

function AddressSection({ addresses: userAddresses }: { addresses: Array<any> }) {
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
                onCancel={() => { setIsEditing(false); setEditingAddress(null) }} 
                onSuccess={() => { setIsEditing(false); setEditingAddress(null); router.invalidate() }}
            />
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold">Address Book</h2>
                <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700"
                >
                    <Plus size={18} />
                    Add New Address
                </button>
            </div>

            <div className="space-y-4">
                {userAddresses.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No addresses found. Add one to get started.
                    </div>
                ) : (
                    userAddresses.map((addr) => (
                        <div key={addr.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-200 transition-colors">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900">{addr.name}</span>
                                        {addr.isDefault && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Default</span>
                                        )}
                                    </div>
                                    <p className="text-gray-600">{addr.address}</p>
                                    <p className="text-gray-600">{addr.postcode}</p>
                                    <p className="text-gray-600 mt-1 flex items-center gap-1.5 text-sm">
                                        <Phone size={14} />
                                        {addr.phone}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setEditingAddress(addr); setIsEditing(true) }}
                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(addr.id)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

function AddressForm({ address, onCancel, onSuccess }: { address?: any, onCancel: () => void, onSuccess: () => void }) {
    const [isLoading, setIsLoading] = useState(false)
    
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
            try {
                await upsertAddress({ data: { ...value, id: address?.id } })
                onSuccess()
            } catch (err) {
                alert('Failed to save address')
            } finally {
                setIsLoading(false)
            }
        },
    })

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100">
                {address ? 'Edit Address' : 'Add New Address'}
            </h2>
            
            <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit() }} className="space-y-6 max-w-2xl">
                <form.Field
                    name="name"
                    children={(field) => (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            />
                        </div>
                    )}
                />

                <form.Field
                    name="address"
                    children={(field) => (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <textarea
                                name={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                <input
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>
                        )}
                    />

                    <form.Field
                        name="phone"
                        children={(field) => (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                <input
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
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
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                            <label className="text-sm font-medium text-gray-700">Make this my default address</label>
                        </div>
                    )}
                />

                <div className="flex items-center gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2.5 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:ring-4 focus:ring-orange-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="animate-spin" size={18} />}
                        Save Address
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    )
}

function OrdersSection({ orders }: { orders: Array<any> }) {
    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Orders Yet</h3>
                <p className="text-gray-500">Looks like you haven't placed any orders yet.</p>
                <a href="/" className="inline-block mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                    Start Shopping
                </a>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-6 pb-4 border-b border-gray-100">My Orders</h2>
            
            <div className="space-y-6">
                {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Order Placed</p>
                                <p className="text-sm font-medium text-gray-900">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Total Amount</p>
                                <p className="text-sm font-medium text-gray-900">
                                    ৳{Number(order.totalAmount).toFixed(2)}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Order ID</p>
                                <p className="text-sm font-medium text-gray-900">#{order.id}</p>
                            </div>
                            <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize
                                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                      'bg-blue-100 text-blue-700'}`}
                                >
                                    {order.status}
                                </span>
                            </div>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-4">
                                {order.items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                            {/* Placeholder for product image */}
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Package size={24} />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">{item.product.name}</h4>
                                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900">
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
