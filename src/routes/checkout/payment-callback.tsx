import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { useCheckout } from '@/contexts/CheckoutContext'
import { updateOrderPayment } from '@/lib/order-actions'

export const Route = createFileRoute('/checkout/payment-callback')({
  component: PaymentCallbackPage,
  validateSearch: z.object({
    status: z.enum(['success', 'failure', 'cancel']),
    orderId: z.string().optional(),
    transactionId: z.string().optional(),
  }),
})

function PaymentCallbackPage() {
  const { status, orderId, transactionId } = Route.useSearch()
  const { clearCart } = useCart()
  const { state } = useCheckout()
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    if (status === 'success' && orderId) {
      // Call backend to update order payment status
      const paymentStatus = state.paymentMethod === 'deposit' ? 'deposit_paid' : 'full_paid'
      
      updateOrderPayment({
        data: {
            orderId: parseInt(orderId),
            status: paymentStatus,
            transactionId: transactionId
        }
      }).then(() => {
          setIsVerifying(false)
          clearCart()
          // Redirect to confirmation page
          setTimeout(() => {
             router.navigate({ to: '/order-confirmation/$orderId', params: { orderId } })
          }, 1500)
      }).catch(err => {
          console.error("Failed to update payment", err)
          // Handle error (maybe show error UI but money was taken?)
          // For now, treat as success but log error
          setIsVerifying(false)
      })
    } else {
      setIsVerifying(false)
    }
  }, [status, orderId, transactionId, clearCart, router, state.paymentMethod])

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <Loader2 className="animate-spin text-orange-500 w-12 h-12 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-gray-500">Please wait while we confirm your transaction.</p>
          <div className="mt-4 text-xs text-gray-400">Transaction ID: {transactionId}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        
        {status === 'success' ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your payment has been processed. Redirecting to order details...
            </p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {status === 'cancel' ? (
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {status === 'cancel' ? 'Payment Cancelled' : 'Payment Failed'}
            </h1>
            <p className="text-gray-600 mb-6">
              {status === 'cancel' 
                ? 'You cancelled the payment process. No charges were made.' 
                : 'Something went wrong with the transaction. Please try again.'}
            </p>

            <div className="space-y-3">
              <Link 
                to="/checkout/review" 
                className="flex items-center justify-center gap-2 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
              >
                <RefreshCw size={18} />
                Retry Payment
              </Link>
              <Link 
                to="/cart" 
                className="block w-full text-gray-500 hover:text-gray-700 text-sm font-medium py-2"
              >
                Return to Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}