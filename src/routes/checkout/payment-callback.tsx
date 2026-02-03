import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ArrowRight, Loader2 } from 'lucide-react'
import { z } from 'zod'
import { useEffect, useState } from 'react'
import { useCart } from '@/contexts/CartContext'

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
  const router = useRouter()
  const [isVerifying, setIsVerifying] = useState(true)

  useEffect(() => {
    if (status === 'success') {
      // Simulate backend verification delay
      setTimeout(() => {
        setIsVerifying(false)
        clearCart()
        // Redirect to confirmation page
        if (orderId) {
             router.navigate({ to: '/order-confirmation/$orderId', params: { orderId } })
        }
      }, 2000)
    } else {
      setIsVerifying(false)
    }
  }, [status, clearCart])

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
              Your order has been placed successfully. Thank you for shopping with BoroBepari.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-medium text-gray-900">#{orderId || 'PENDING'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction ID:</span>
                <span className="font-mono font-medium text-gray-900">{transactionId}</span>
              </div>
            </div>

            <div className="space-y-3">
              <Link 
                to="/order-confirmation/$orderId" 
                params={{ orderId: orderId || '0' }}
                className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md"
              >
                View Order Details
              </Link>
              <Link 
                to="/" 
                className="block w-full bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
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
