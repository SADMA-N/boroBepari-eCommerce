import { createFileRoute, Link } from '@tanstack/react-router'
import { CheckCircle, Package, ArrowRight, Download, Share2, Copy, MessageCircle, Truck, Calendar, MapPin, CreditCard, UserPlus, Clock, AlertCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOrder } from '@/lib/order-actions'
import { formatCurrency } from '@/lib/cart-utils'
import { useAuth } from '@/contexts/AuthContext'
import Toast from '@/components/Toast'
import { differenceInDays, addDays } from 'date-fns'

export const Route = createFileRoute('/order-confirmation/$orderId')({
  component: OrderConfirmationPage,
  loader: async ({ params }) => {
    const orderId = parseInt(params.orderId)
    if (isNaN(orderId)) return null
    return await getOrder({ data: orderId })
  }
})

function OrderConfirmationPage() {
  const order = Route.useLoaderData()
  const { isAuthenticated } = useAuth()
  const [toast, setToast] = useState({ message: '', isVisible: false })
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  if (!order) return <div className="p-8 text-center">Order not found</div>

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

  // Derived State
  const isDeposit = Number(order.depositAmount) > 0
  const balanceDue = Number(order.balanceDue)
  const isEscrow = order.paymentStatus === 'escrow_hold'
  
  // Timeline Logic
  const timeline = [
    { 
      label: 'Order Placed', 
      date: order.createdAt, 
      completed: true,
      icon: Package 
    },
    { 
      label: isDeposit ? 'Deposit Paid' : 'Payment Processing', 
      date: order.depositPaidAt || order.fullPaymentPaidAt || order.createdAt, 
      completed: !!(order.depositPaidAt || order.fullPaymentPaidAt),
      icon: CreditCard 
    },
    { 
      label: 'Delivered', 
      date: null, // Future
      completed: order.status === 'delivered',
      icon: Truck 
    },
    { 
      label: 'Escrow Release', 
      date: order.escrowReleaseDeadline, 
      completed: !!order.escrowReleasedAt,
      icon: ShieldCheck 
    }
  ]

  // Mock address linkage if missing (schema limitation workaround)
  const displayAddress = (order as any).user?.addresses?.find((a: any) => a.isDefault) || {
      name: 'Customer',
      address: 'Delivery Address',
      city: 'City',
      phone: 'Phone'
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 relative overflow-hidden">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none flex justify-center overflow-hidden">
            <div className="w-full h-full absolute top-0 left-0 bg-[url('https://cdn.confetti.js.org/confetti.gif')] opacity-20 bg-cover"></div> 
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Success Header */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" strokeWidth={3} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your purchase. Your order #{order.id} has been received.
          </p>
          
          {/* Payment Status Banner */}
          <div className="max-w-lg mx-auto mb-6">
             {isEscrow && (
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 text-left">
                 <ShieldCheck className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
                 <div>
                   <h4 className="font-bold text-blue-800">Payment in Escrow</h4>
                   <p className="text-sm text-blue-700 mt-1">
                     Your payment is held securely in escrow. It will be released to the supplier 3 days after delivery confirmation.
                   </p>
                 </div>
               </div>
             )}
             {isDeposit && balanceDue > 0 && (
               <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg flex items-start gap-3 text-left mt-3">
                 <AlertCircle className="text-orange-600 mt-0.5 flex-shrink-0" size={20} />
                 <div>
                   <h4 className="font-bold text-orange-800">Balance Pending</h4>
                   <p className="text-sm text-orange-700 mt-1">
                     You have paid a 30% deposit. Please pay the remaining <strong>{formatCurrency(balanceDue)}</strong> upon delivery.
                   </p>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
                
                {/* Timeline */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                   <h3 className="font-semibold text-gray-900 mb-6">Order Status</h3>
                   <div className="relative flex justify-between">
                      {/* Line */}
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100 -z-10"></div>
                      
                      {timeline.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center w-1/4">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white ${step.completed ? 'border-green-500 text-green-600' : 'border-gray-200 text-gray-300'}`}>
                              <step.icon size={14} />
                           </div>
                           <span className={`text-xs font-medium mt-2 ${step.completed ? 'text-gray-900' : 'text-gray-400'}`}>
                             {step.label}
                           </span>
                           {step.date && (
                             <span className="text-[10px] text-gray-400 mt-0.5">
                               {new Date(step.date).toLocaleDateString()}
                             </span>
                           )}
                        </div>
                      ))}
                   </div>
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                        <h2 className="font-semibold text-gray-900">Order Items</h2>
                    </div>
                    <div className="p-6 divide-y">
                        {order.items.map((item: any) => (
                            <div key={item.id} className="py-3 flex gap-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center text-gray-400">
                                    <Package size={24} />
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
                </div>
            </div>

            <div className="space-y-6">
                {/* Summary */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
                    <div className="space-y-2 text-sm text-gray-600 pb-4 border-b">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{formatCurrency(Number(order.totalAmount))}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Deposit Paid</span>
                            <span className="text-green-600">-{formatCurrency(Number(order.depositAmount))}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 font-bold text-lg">
                        <span>Total Due</span>
                        <span className="text-orange-600">{formatCurrency(balanceDue)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
                    <Link to="/orders" className="block w-full py-2.5 bg-gray-900 text-white text-center rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium">
                        Track Order
                    </Link>
                    <button className="block w-full py-2.5 border border-gray-200 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                        Download Invoice
                    </button>
                    <Link to="/" className="block w-full py-2.5 text-orange-600 text-center text-sm font-medium hover:underline">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
