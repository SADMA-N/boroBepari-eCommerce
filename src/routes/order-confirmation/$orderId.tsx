import { createFileRoute, Link } from '@tanstack/react-router'
import {
  CheckCircle,
  Package,
  Download,
  Share2,
  Copy,
  Truck,
  Calendar,
  MapPin,
  CreditCard,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getOrder } from '@/lib/order-actions'
import { formatCurrency } from '@/lib/cart-utils'
import Toast from '@/components/Toast'
import { addDays } from 'date-fns'

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
  const [toast, setToast] = useState({ message: '', isVisible: false })

  useEffect(() => undefined, [])

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
  
  const estimatedDelivery = addDays(new Date(order.createdAt), 5)

  // Mock address linkage if missing (schema limitation workaround)
  const displayAddress = (order as any).user?.addresses?.find((a: any) => a.isDefault) || {
      name: 'Customer',
      address: 'Delivery Address',
      city: 'City',
      phone: 'Phone'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
        <div className="relative max-w-5xl mx-auto px-4 py-12 space-y-8">
          <div className="bg-white/90 backdrop-blur rounded-2xl border shadow-sm p-8 text-center">
            <div className="mx-auto mb-5 w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-emerald-600" strokeWidth={2.4} />
            </div>
            <p className="text-emerald-700 text-sm font-semibold tracking-wide uppercase">
              Thanks for your order
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 mt-2">
              Your order is confirmed
            </h1>
            <p className="text-slate-600 mt-3">
              Order <span className="font-semibold text-slate-900">#{order.id}</span> was placed
              successfully. We will notify you when the supplier confirms and ships it.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={handleCopyOrderNumber}
              >
                <Copy size={16} /> Copy Order ID
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={() => handleShare('copy')}
              >
                <Share2 size={16} /> Share Order
              </button>
              <Link
                to={`/buyer/orders/${order.id}`}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Track Order
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900">What happens next</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm">
                  {[
                    {
                      title: 'Supplier review',
                      detail: 'We are confirming stock with the supplier.',
                      icon: Package,
                    },
                    {
                      title: 'Packing & dispatch',
                      detail: 'Your items are prepared and handed to courier.',
                      icon: Truck,
                    },
                    {
                      title: 'Delivery window',
                      detail: `Estimated by ${estimatedDelivery.toLocaleDateString()}.`,
                      icon: Calendar,
                    },
                  ].map((step, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <step.icon className="text-emerald-600" size={18} />
                      <h3 className="mt-3 font-semibold text-slate-900">{step.title}</h3>
                      <p className="mt-2 text-slate-600">{step.detail}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-slate-50">
                  <h2 className="font-semibold text-slate-900">Order Items</h2>
                </div>
                <div className="p-6 divide-y">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="py-4 flex gap-4">
                      <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <Package size={22} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 text-sm">
                          {item.product?.name || 'Product'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900 text-sm">
                          {formatCurrency(Number(item.price))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">Total</p>
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatCurrency(Number(order.totalAmount))}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-slate-400" />
                    <span>Payment method: {order.paymentMethod ?? 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-slate-400" />
                    <span>{displayAddress.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span>Placed on {new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {isEscrow && (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                    <div className="flex items-start gap-2">
                      <ShieldCheck size={18} className="mt-0.5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-blue-800">Payment in escrow</p>
                        <p className="mt-1">
                          Funds are held securely and released after delivery confirmation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {isDeposit && balanceDue > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                    <p className="font-semibold text-amber-800">Balance due on delivery</p>
                    <p className="mt-1">
                      Remaining amount: <strong>{formatCurrency(balanceDue)}</strong>
                    </p>
                  </div>
                )}
                <div className="grid gap-3">
                  <Link
                    to={`/buyer/orders/${order.id}`}
                    className="w-full rounded-lg bg-slate-900 py-2.5 text-center text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Track Order
                  </Link>
                  <button className="w-full rounded-lg border border-slate-200 py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Download className="inline-block mr-2" size={16} />
                    Download Invoice
                  </button>
                  <Link
                    to="/"
                    className="w-full text-center text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>

              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h3 className="font-semibold text-slate-900">Need help?</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Our support team is ready if you need changes or updates.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <button
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                    onClick={() => handleShare('whatsapp')}
                  >
                    Share on WhatsApp
                  </button>
                  <Link
                    to="/buyer/orders"
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                  >
                    View all orders
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
