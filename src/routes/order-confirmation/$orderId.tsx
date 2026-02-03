import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle, Package, ArrowRight, Download, Share2, Copy, MessageCircle, Truck, Calendar, MapPin, CreditCard, UserPlus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOrder } from '@/lib/order-actions'
import { formatCurrency } from '@/lib/cart-utils'
import { useAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'

export const Route = createFileRoute('/order-confirmation/$orderId')({
  component: OrderConfirmationPage,
  loader: async ({ params }) => {
    // In a real app, this would fetch from DB
    // For demo/mock flow where DB might not be populated by the mock checkout:
    // We'll return a mock order if DB returns null, ensuring the UI can be reviewed.
    const orderId = parseInt(params.orderId)
    if (isNaN(orderId)) {
        // Fallback for mock IDs like "timestamp"
        return null 
    }
    return await getOrder({ data: orderId })
  }
})

function OrderConfirmationPage() {
  const dbOrder = Route.useLoaderData()
  const { orderId } = Route.useParams()
  const { isAuthenticated } = useAuth()
  const [toast, setToast] = useState({ message: '', isVisible: false })
  const [showConfetti, setShowConfetti] = useState(true)

  // Mock data if DB order not found (for demo continuity)
  const order = dbOrder || {
    id: orderId,
    createdAt: new Date(),
    totalAmount: 15500,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'pending',
    items: [
      {
        id: 1,
        quantity: 2,
        price: 5000,
        product: {
          name: 'Industrial Safety Helmet',
          images: []
        }
      },
      {
        id: 2,
        quantity: 1,
        price: 5500,
        product: {
          name: 'Heavy Duty Gloves',
          images: []
        }
      }
    ],
    // Mock address since it's not directly on order in schema yet (linked via user usually)
    mockAddress: {
        name: 'John Doe',
        address: '123 Industrial Area',
        city: 'Dhaka',
        phone: '01700000000'
    }
  }

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleCopyOrderNumber = () => {
    navigator.clipboard.writeText(order.id.toString())
    setToast({ message: 'Order ID copied to clipboard', isVisible: true })
  }

  const handleShare = (platform: 'whatsapp' | 'copy') => {
    const text = `I just placed an order #${order.id} on BoroBepari! Total: ${formatCurrency(Number(order.totalAmount))}`
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    } else {
      navigator.clipboard.writeText(text)
      setToast({ message: 'Link copied to clipboard', isVisible: true })
    }
  }

  const estimatedDelivery = new Date()
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 3)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative overflow-hidden">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {/* Confetti Animation (CSS-based simplified) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden">
            <div className="w-full h-full absolute top-0 left-0 bg-[url('https://cdn.confetti.js.org/confetti.gif')] opacity-20 bg-cover"></div> 
            {/* Note: In production, use a proper canvas confetti library like canvas-confetti */}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500 delay-150">
            <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. We've received your order and will begin processing it right away.
          </p>
          
          <div className="inline-flex items-center justify-center gap-3 bg-gray-50 px-6 py-3 rounded-lg border border-gray-200">
            <span className="text-sm text-gray-500">Order Number:</span>
            <span className="font-mono font-bold text-lg text-gray-900">#{order.id}</span>
            <button 
                onClick={handleCopyOrderNumber}
                className="text-gray-400 hover:text-orange-600 transition-colors"
                title="Copy Order ID"
            >
                <Copy size={16} />
            </button>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-gray-500">
             <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-green-600" />
                Confirmation sent to email
             </span>
             <span className="hidden sm:inline">•</span>
             <span className="flex items-center gap-1">
                <CheckCircle size={14} className="text-green-600" />
                SMS notification sent
             </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Order Details */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Order Summary Card */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Package size={18} className="text-orange-500" />
                            Order Summary
                        </h2>
                        <span className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="p-6">
                        {/* Items */}
                        <div className="space-y-4 mb-6">
                            {order.items.map((item: any) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        {/* Placeholder image logic */}
                                        <Package size={24} className="text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-gray-900 text-sm">{formatCurrency(Number(item.price))}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Delivery</span>
                                <span className="font-medium text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t mt-2">
                                <span>Total</span>
                                <span className="text-orange-600">{formatCurrency(Number(order.totalAmount))}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery & Payment Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-gray-400" />
                            Delivery Address
                        </h3>
                        {/* Mock or Real Address Display */}
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-medium text-gray-900">
                                {(order as any).mockAddress?.name || 'Customer'}
                            </p>
                            <p>{(order as any).mockAddress?.address || '123 Street'}</p>
                            <p>{(order as any).mockAddress?.city || 'City'} - {(order as any).mockAddress?.postcode || '1000'}</p>
                            <p>{(order as any).mockAddress?.phone || '01XXXXXXXXX'}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-blue-600">
                            <Truck size={16} />
                            <span>Est. Delivery: <strong>{estimatedDelivery.toLocaleDateString()}</strong></span>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={18} className="text-gray-400" />
                            Payment Information
                        </h3>
                        <div className="text-sm text-gray-600 space-y-2">
                            <div className="flex justify-between">
                                <span>Method:</span>
                                <span className="font-medium capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                                    order.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                    {order.paymentStatus}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Amount:</span>
                                <span className="font-medium">{formatCurrency(Number(order.totalAmount))}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Actions */}
            <div className="space-y-6">
                {/* Next Steps */}
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
                    <button className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium">
                        Track Your Order
                        <ArrowRight size={16} />
                    </button>
                    <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                        Download Invoice
                        <Download size={16} />
                    </button>
                    <Link to="/" className="w-full flex items-center justify-center px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium mt-2">
                        Continue Shopping
                    </Link>
                </div>

                {/* Share */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Share2 size={18} className="text-gray-400" />
                        Share Order
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => handleShare('whatsapp')}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366]/10 text-[#25D366] rounded-lg hover:bg-[#25D366]/20 transition-colors text-sm font-medium"
                        >
                            <MessageCircle size={16} />
                            WhatsApp
                        </button>
                        <button 
                            onClick={() => handleShare('copy')}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                            <Copy size={16} />
                            Copy Link
                        </button>
                    </div>
                </div>

                {/* Guest Account Prompt */}
                {!isAuthenticated && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-100 p-6">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-blue-600">
                            <UserPlus size={20} />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Create an Account</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Save your details for faster checkout next time and track your orders easily.
                        </p>
                        <Link 
                            to="/register" 
                            className="block w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg text-sm font-medium transition-colors"
                        >
                            Create Account
                        </Link>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
