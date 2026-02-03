import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ArrowLeft, Loader2, MapPin, CreditCard, ShoppingBag, ShieldCheck } from 'lucide-react'
import { useCheckout, type PaymentMethod } from '@/contexts/CheckoutContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout'
import { formatCurrency } from '@/lib/cart-utils'
import { useEffect, useState } from 'react'
import { getAddresses } from '@/lib/address-actions'
import { createOrder } from '@/lib/order-actions'
import type { Address } from '@/db/schema'
import Toast from '@/components/Toast'

export const Route = createFileRoute('/checkout/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { state } = useCheckout()
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()

  const [shippingAddress, setShippingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', isVisible: false })

  useEffect(() => {
    if (!cart.items.length) {
      router.navigate({ to: '/cart' })
      return
    }
    if (!state.shippingAddressId) {
      router.navigate({ to: '/checkout' })
      return
    }
    if (!state.paymentMethod) {
      router.navigate({ to: '/checkout/payment' })
      return
    }

    // Fetch address details
    if (user?.id && state.shippingAddressId) {
      getAddresses({ data: user.id }).then(addresses => {
        const addr = addresses.find(a => a.id === state.shippingAddressId)
        if (addr) setShippingAddress(addr)
      })
    }
  }, [cart.items.length, state.shippingAddressId, state.paymentMethod, user?.id, router])

  const handlePlaceOrder = async () => {
    if (!user?.id) {
        setToast({ message: 'You must be logged in', isVisible: true })
        return
    }
    setIsSubmitting(true)
    
    try {
      const depositAmount = state.paymentMethod === 'deposit' 
          ? Math.ceil(cart.total * 0.3) 
          : 0
      const balanceDue = state.paymentMethod === 'deposit' 
          ? cart.total - depositAmount
          : 0

      // 1. Create Order in DB
      const newOrder = await createOrder({
        data: {
            userId: user.id,
            items: cart.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.unitPrice
            })),
            totalAmount: cart.total,
            paymentMethod: state.paymentMethod || 'cod',
            depositAmount,
            balanceDue,
            notes: state.notes
        }
      })

      if (state.paymentMethod === 'full' || state.paymentMethod === 'deposit') {
        // Redirect to Mock Payment Gateway with REAL Order ID
        const amountToPay = state.paymentMethod === 'deposit' 
          ? depositAmount 
          : cart.total
          
        const mockPaymentUrl = `/mock-payment/bkash?amount=${amountToPay}&orderId=${newOrder.id}&callbackUrl=${encodeURIComponent(window.location.origin + '/checkout/payment-callback')}`
        
        window.location.href = mockPaymentUrl
      } else {
        // COD
        await new Promise(resolve => setTimeout(resolve, 1000))
        clearCart()
        setToast({ message: 'Order placed successfully!', isVisible: true })
        setTimeout(() => {
            router.navigate({ to: '/order-confirmation/$orderId', params: { orderId: newOrder.id.toString() } })
        }, 1500)
      }
    } catch (error) {
      console.error(error)
      setToast({ message: 'Failed to place order', isVisible: true })
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    switch (method) {
      case 'full': return 'Full Payment (Online)'
      case 'deposit': return '30% Deposit (Rest on Delivery)'
      case 'cod': return 'Cash on Delivery'
      default: return 'Unknown'
    }
  }

  if (!state.shippingAddressId || !state.paymentMethod) return null

  return (
    <CheckoutLayout currentStep="review">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900">Review Your Order</h2>

          {/* Shipping Info */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                <MapPin size={18} className="text-orange-500" />
                Shipping Address
              </h3>
              <Link to="/checkout" className="text-sm text-blue-600 hover:underline">Change</Link>
            </div>
            {shippingAddress ? (
              <div className="text-sm text-gray-600 ml-6">
                <p className="font-medium text-gray-900">{shippingAddress.name}</p>
                <p>{shippingAddress.address}</p>
                <p>{shippingAddress.city} - {shippingAddress.postcode}</p>
                <p className="mt-1">{shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 ml-6">Loading address...</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white border rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900">
                <CreditCard size={18} className="text-orange-500" />
                Payment Method
              </h3>
              <Link to="/checkout/payment" className="text-sm text-blue-600 hover:underline">Change</Link>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-900">
                {getPaymentMethodLabel(state.paymentMethod)}
              </p>
              {state.paymentMethod === 'deposit' && (
                  <p className="text-xs text-orange-600 font-medium mt-1">
                      Paying 30% Deposit Now
                  </p>
              )}
              {state.poNumber && (
                <p className="text-xs text-gray-500 mt-1">PO Number: {state.poNumber}</p>
              )}
              {state.notes && (
                <p className="text-xs text-gray-500 mt-1">Notes: {state.notes}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 text-gray-900 mb-4">
              <ShoppingBag size={18} className="text-orange-500" />
              Items ({cart.items.length})
            </h3>
            <div className="divide-y">
              {cart.items.map(item => (
                <div key={item.id} className="py-3 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(item.lineTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
           <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-24">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h3>
             <div className="space-y-3 text-sm pb-4 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span>{cart.deliveryFee === 0 ? 'Free' : formatCurrency(cart.deliveryFee)}</span>
                </div>
                {cart.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatCurrency(cart.discount)}</span>
                    </div>
                )}
             </div>
             
             <div className="flex justify-between items-center py-4 font-bold text-lg text-gray-900 border-b">
               <span>Total</span>
               <span className="text-orange-600">{formatCurrency(cart.total)}</span>
             </div>

             <button
               onClick={handlePlaceOrder}
               disabled={isSubmitting}
               className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-lg font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98] flex items-center justify-center gap-2"
             >
               {isSubmitting ? (
                 <>
                   <Loader2 className="animate-spin" size={20} />
                   Processing...
                 </>
               ) : (
                 <>
                   <ShieldCheck size={20} />
                   Place Order
                 </>
               )}
             </button>
             
             <p className="text-xs text-center text-gray-500 mt-3">
               By placing this order, you agree to our Terms and Conditions.
             </p>
           </div>
        </div>
      </div>
    </CheckoutLayout>
  )
}