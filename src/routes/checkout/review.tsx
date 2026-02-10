import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  MapPin,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Address } from '@/db/schema'
import type { PaymentMethod } from '@/contexts/CheckoutContext'
import { useCheckout } from '@/contexts/CheckoutContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { CheckoutLayout } from '@/components/checkout/CheckoutLayout'
import { formatCurrency } from '@/lib/cart-utils'
import { getAddresses } from '@/lib/address-actions'
import { createOrder } from '@/lib/order-actions'
import { validateCartServer } from '@/lib/cart-actions'
import Toast from '@/components/Toast'
import { useNotifications } from '@/contexts/NotificationContext'
import { useWishlist } from '@/contexts/WishlistContext'

export const Route = createFileRoute('/checkout/review')({
  component: ReviewPage,
})

function ReviewPage() {
  const { state } = useCheckout()
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const { addNotification, preferences } = useNotifications()
  const { removeFromWishlist } = useWishlist()

  const [shippingAddress, setShippingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState({ message: '', isVisible: false })
  const [debugStep, setDebugStep] = useState<string | null>(null)

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
      getAddresses({ data: user.id }).then((addresses) => {
        const addr = addresses.find((a) => a.id === state.shippingAddressId)
        if (addr) setShippingAddress(addr)
      })
    }
  }, [
    cart.items.length,
    state.shippingAddressId,
    state.paymentMethod,
    user?.id,
    router,
  ])

  const handlePlaceOrder = async () => {
    if (!user?.id) {
      setToast({ message: 'You must be logged in', isVisible: true })
      return
    }
    setIsSubmitting(true)

    try {
      setDebugStep('Validating cart')
      // 1. Validate Cart (Stock/Price)
      const validation = await validateCartServer({
        data: cart.items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          id: i.id,
        })),
      })

      if (!validation.valid) {
        setToast({
          message: 'Cart items have changed. Please review your cart.',
          isVisible: true,
        })
        setTimeout(() => {
          router.navigate({ to: '/cart' })
        }, 1500)
        setIsSubmitting(false)
        return
      }

      setDebugStep('Preparing order data')
      // 2. Prepare Order Data
      // Calculate deposit based on item-level deposit settings (from RFQs) or fallback to 30% if method is 'deposit'
      const totalDeposit = cart.items.reduce((acc, item) => {
        const itemDepositRate = (item.depositPercentage ?? 0) / 100
        // If specific deposit percentage is set (from RFQ), use it. 
        // If payment method is 'deposit' but item has 0 (standard product), assume 30%?
        // Actually, if method is 'deposit', we apply it to everything.
        const effectiveRate = itemDepositRate > 0 ? itemDepositRate : (state.paymentMethod === 'deposit' ? 0.3 : 0)
        return acc + (item.lineTotal * effectiveRate)
      }, 0)

      const depositAmount = Math.ceil(totalDeposit)
      const balanceDue = cart.total - depositAmount

      setDebugStep('Creating order')
      // 3. Create Order in DB
      const newOrder = await createOrder({
        data: {
          userId: user.id,
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.unitPrice,
            rfqId: item.rfqId,
            quoteId: item.quoteId,
          })),
          totalAmount: cart.total,
          paymentMethod: state.paymentMethod || 'cod',
          depositAmount,
          balanceDue,
          notes: state.notes,
        },
      })

      cart.items.forEach((item) => removeFromWishlist(item.productId))

      if (preferences.orderPlaced) {
        addNotification({
          id: `order-${newOrder.id}-placed`,
          title: `Order #BO-${new Date().getFullYear()}-${newOrder.id.toString().padStart(4, '0')}`,
          message:
            'Order placed successfully. We will notify you as it progresses.',
          type: 'success',
          link: `/buyer/orders/${newOrder.id}`,
          orderId: newOrder.id,
          category: 'order',
          status: 'placed',
        })
      }

      setDebugStep('Handling payment redirect')
      // 4. Redirect based on Payment Method
      if (state.paymentMethod === 'full' || state.paymentMethod === 'deposit') {
        const amountToPay =
          state.paymentMethod === 'deposit' ? depositAmount : cart.total

        const mockPaymentUrl = `/mock-payment/bkash?amount=${amountToPay}&orderId=${newOrder.id}&callbackUrl=${encodeURIComponent(window.location.origin + '/checkout/payment-callback')}`

        window.location.href = mockPaymentUrl
      } else {
        // COD
        await new Promise((resolve) => setTimeout(resolve, 1000))
        clearCart()
        setToast({ message: 'Order placed successfully!', isVisible: true })
        setTimeout(() => {
          router.navigate({
            to: '/order-confirmation/$orderId',
            params: { orderId: newOrder.id.toString() },
          })
        }, 1500)
      }
    } catch (error) {
      console.error('Place order failed at step:', debugStep, error)
      setToast({
        message: `Failed to place order (${debugStep ?? 'unknown step'})`,
        isVisible: true,
      })
      setIsSubmitting(false)
    }
  }

  const getPaymentMethodLabel = (method: PaymentMethod | null) => {
    switch (method) {
      case 'full':
        return 'Full Payment (Online)'
      case 'deposit':
        return '30% Deposit (Rest on Delivery)'
      case 'cod':
        return 'Cash on Delivery'
      default:
        return 'Unknown'
    }
  }

  if (!state.shippingAddressId || !state.paymentMethod) return null

  return (
    <CheckoutLayout currentStep="review">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Your Order</h2>

          {/* Shipping Info */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <MapPin size={18} className="text-orange-500" />
                Shipping Address
              </h3>
              <Link
                to="/checkout"
                className="text-sm text-blue-600 hover:underline"
              >
                Change
              </Link>
            </div>
            {shippingAddress ? (
              <div className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                <p className="font-medium text-gray-900 dark:text-white">
                  {shippingAddress.name}
                </p>
                <p>{shippingAddress.address}</p>
                <p>
                  {shippingAddress.city} - {shippingAddress.postcode}
                </p>
                <p className="mt-1">{shippingAddress.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 ml-6">Loading address...</p>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-5">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                <CreditCard size={18} className="text-orange-500" />
                Payment Method
              </h3>
              <Link
                to="/checkout/payment"
                className="text-sm text-blue-600 hover:underline"
              >
                Change
              </Link>
            </div>
            <div className="ml-6">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {getPaymentMethodLabel(state.paymentMethod)}
              </p>
              {(state.paymentMethod === 'deposit' || cart.items.some(i => (i.depositPercentage ?? 0) > 0)) && (
                <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30 max-w-sm">
                  <p className="text-xs text-orange-800 font-bold">Advance Payment Details</p>
                  <p className="text-[11px] text-orange-700 mt-1">
                    Order Total: {formatCurrency(cart.total)}
                  </p>
                  <p className="text-sm text-orange-600 font-bold mt-0.5">
                    Pay Now: {formatCurrency(cart.items.reduce((acc, i) => acc + (i.lineTotal * (i.depositPercentage || (state.paymentMethod === 'deposit' ? 30 : 0)) / 100), 0))}
                  </p>
                </div>
              )}
              {state.poNumber && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  PO Number: {state.poNumber}
                </p>
              )}
              {state.notes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Notes: {state.notes}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-5">
            <h3 className="font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-4">
              <ShoppingBag size={18} className="text-orange-500" />
              Items ({cart.items.length})
            </h3>
            <div className="divide-y">
              {cart.items.map((item) => (
                <div key={item.id} className="py-3 flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-md overflow-hidden flex-shrink-0">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                      {item.productName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h3>
            <div className="space-y-3 text-sm pb-4 border-b dark:border-slate-800">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Delivery</span>
                <span>
                  {cart.deliveryFee === 0
                    ? 'Free'
                    : formatCurrency(cart.deliveryFee)}
                </span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(cart.discount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center py-4 font-bold text-lg text-gray-900 dark:text-white border-b dark:border-slate-800">
              <span>Total</span>
              <span className="text-orange-600">
                {formatCurrency(cart.total)}
              </span>
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

            {debugStep && (
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                Debug: {debugStep}
              </p>
            )}

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
              By placing this order, you agree to our Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </CheckoutLayout>
  )
}
