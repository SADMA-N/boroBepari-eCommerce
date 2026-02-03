import { createFileRoute, Link } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import {
  Package,
  Truck,
  Download,
  XCircle,
  HelpCircle,
  ChevronRight,
  Calendar,
  MapPin,
  Phone,
  CreditCard,
  CheckCircle,
  AlertCircle,
  BadgeCheck,
  MessageSquare,
  Star,
  ArrowLeft,
  Copy,
  FileText,
  Loader2,
  Home,
  ShoppingCart,
} from 'lucide-react'
import { format, addDays, addHours } from 'date-fns'
import { formatBDT } from '@/data/mock-products'
import { getOrder } from '@/lib/order-actions'
import Toast from '@/components/Toast'
import { useCart } from '@/contexts/CartContext'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'

export const Route = createFileRoute('/buyer/orders/$orderId')({
  component: OrderDetailPage,
  loader: async ({ params }) => {
    const orderId = parseInt(params.orderId)
    if (isNaN(orderId)) return null
    return await getOrder({ data: orderId })
  },
})

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  placed: { label: 'Placed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  confirmed: { label: 'Confirmed by Supplier', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  processing: { label: 'Processing/Packing', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  shipped: { label: 'Shipped', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
  delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
  returned: { label: 'Returned', color: 'text-orange-700', bgColor: 'bg-orange-100' },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Payment Pending', color: 'text-yellow-600' },
  deposit_paid: { label: 'Deposit Paid', color: 'text-blue-600' },
  full_paid: { label: 'Fully Paid', color: 'text-green-600' },
  escrow_hold: { label: 'In Escrow', color: 'text-purple-600' },
  released: { label: 'Released', color: 'text-green-600' },
}

function OrderDetailPage() {
  const order = Route.useLoaderData()
  const { addItem } = useCart()
  const [toast, setToast] = useState({ message: '', isVisible: false })
  const [isReordering, setIsReordering] = useState(false)

  if (!order) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-16 text-center">
        <Package size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">The order you're looking for doesn't exist or has been removed.</p>
        <Link
          to="/buyer/orders"
          className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Orders
        </Link>
      </div>
    )
  }

  // Derived data
  const totalAmount = parseFloat(order.totalAmount) || 0
  const depositAmount = parseFloat(order.depositAmount as string) || 0
  const balanceDue = parseFloat(order.balanceDue as string) || 0
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date()
  const isDeposit = depositAmount > 0
  const isEscrow = order.paymentStatus === 'escrow_hold'

  // Get default address
  const defaultAddress = (order as any).user?.addresses?.find((a: any) => a.isDefault) ||
    (order as any).user?.addresses?.[0] || null

  // Group items by supplier
  const itemsBySupplier = order.items.reduce((acc: any, item: any) => {
    const supplierId = item.product?.supplier?.id || 'unknown'
    const supplierName = item.product?.supplier?.name || 'Unknown Supplier'
    const supplierVerified = item.product?.supplier?.verified || false

    if (!acc[supplierId]) {
      acc[supplierId] = {
        id: supplierId,
        name: supplierName,
        verified: supplierVerified,
        slug: item.product?.supplier?.slug,
        items: [],
      }
    }
    acc[supplierId].items.push(item)
    return acc
  }, {})

  const [statusState, setStatusState] = useState(order.status)
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<Date | string | undefined>(
    order.updatedAt,
  )
  const [trackingInfo, setTrackingInfo] = useState(() =>
    buildMockTrackingInfo(createdAt, order),
  )
  const [stageTimestamps, setStageTimestamps] = useState(() =>
    buildStageTimestamps(createdAt, order.status, order.updatedAt),
  )

  const isDelivered = statusState === 'delivered'
  const isShipped = ['shipped', 'out_for_delivery'].includes(statusState)
  const canCancel = ['pending', 'placed', 'confirmed'].includes(statusState)
  const estimatedDelivery =
    trackingInfo?.expectedDelivery ?? addDays(createdAt, 7)

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id.toString().padStart(6, '0'))
    setToast({ message: 'Order ID copied!', isVisible: true })
  }

  const handleReorder = async () => {
    setIsReordering(true)
    try {
      for (const item of order.items) {
        if (item.product) {
          addItem({
            id: item.product.id,
            name: item.product.name,
            price: parseFloat(item.price),
            quantity: item.quantity,
            image: item.product.images?.[0] || '',
            supplierId: item.product.supplierId || 0,
            supplierName: item.product.supplier?.name || 'Unknown',
            moq: item.product.moq || 1,
            unit: item.product.unit || 'piece',
          })
        }
      }
      setToast({ message: 'Items added to cart!', isVisible: true })
    } catch (error) {
      setToast({ message: 'Failed to add items to cart', isVisible: true })
    } finally {
      setIsReordering(false)
    }
  }

  const handleDownloadInvoice = () => {
    // TODO: Implement PDF generation
    setToast({ message: 'Invoice download will be available soon', isVisible: true })
  }

  const status = statusConfig[statusState] || statusConfig.pending
  const paymentStatus = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending
  const showOutForDelivery = Boolean(
    (order as any).outForDeliveryEligible ??
    ['out_for_delivery', 'delivered'].includes(statusState),
  )

  const handleRefreshStatus = useCallback(async () => {
    const mockTimestamps = buildStageTimestamps(createdAt, statusState, statusUpdatedAt, true)
    const fallbackTracking = buildMockTrackingInfo(createdAt, order)
    const fallbackStatus = getMockStatusByNow(
      new Date(),
      mockTimestamps,
      showOutForDelivery,
    )

    try {
      const [statusResponse, trackingResponse] = await Promise.allSettled([
        fetch(`/api/orders/${order.id}/status`, { method: 'PATCH' }),
        fetch(`/api/orders/${order.id}/track`, { method: 'POST' }),
      ])

      const statusJson =
        statusResponse.status === 'fulfilled'
          ? await statusResponse.value.json().catch(() => null)
          : null
      const trackingJson =
        trackingResponse.status === 'fulfilled'
          ? await trackingResponse.value.json().catch(() => null)
          : null

      const nextStatus = ensureForwardStatus(
        statusState,
        statusJson?.status ?? fallbackStatus ?? statusState,
      )

      setStatusState(nextStatus)
      setStatusUpdatedAt(statusJson?.updatedAt ?? new Date())

      const nextStageTimestamps =
        statusJson?.stageTimestamps ??
        buildStageTimestamps(
          createdAt,
          nextStatus,
          statusJson?.updatedAt ?? statusUpdatedAt,
          true,
        )
      setStageTimestamps(nextStageTimestamps)

      const nextTracking = trackingJson?.trackingInfo ?? fallbackTracking
      setTrackingInfo(nextTracking)
    } catch (error) {
      console.error('Failed to refresh order status:', error)
      setStatusState((prev) => ensureForwardStatus(prev, fallbackStatus ?? prev))
      setStageTimestamps((prev) => prev ?? mockTimestamps)
      setTrackingInfo((prev) => prev ?? fallbackTracking)
      setStatusUpdatedAt(new Date())
    }
  }, [
    createdAt,
    order,
    showOutForDelivery,
    statusState,
    statusUpdatedAt,
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-orange-600 flex items-center gap-1">
            <Home size={14} />
            Home
          </Link>
          <ChevronRight size={14} />
          <Link to="/buyer/orders" className="hover:text-orange-600">
            My Orders
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900 font-medium">Order #{order.id.toString().padStart(6, '0')}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Order #{order.id.toString().padStart(6, '0')}
                </h1>
                <button
                  onClick={handleCopyOrderId}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="Copy order ID"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {format(createdAt, 'MMMM d, yyyy')} at {format(createdAt, 'h:mm a')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
                  {status.label}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {isShipped && (
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium">
                  <Truck size={18} />
                  Track Order
                </button>
              )}
              <button
                onClick={handleDownloadInvoice}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Download size={18} />
                Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Status</h2>
              <OrderStatusTimeline
                orderId={order.id}
                status={statusState}
                createdAt={createdAt}
                updatedAt={statusUpdatedAt}
                trackingInfo={trackingInfo}
                onRefresh={handleRefreshStatus}
                stageTimestamps={stageTimestamps}
                showOutForDelivery={showOutForDelivery}
              />
            </div>

            {/* Order Items by Supplier */}
            {Object.values(itemsBySupplier).map((supplier: any) => (
              <div key={supplier.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Supplier Header */}
                <div className="px-6 py-4 bg-gray-50 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                        {supplier.verified && (
                          <BadgeCheck size={16} className="text-blue-500" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{supplier.items.length} item(s)</p>
                    </div>
                  </div>
                  {supplier.slug && (
                    <Link
                      to={`/suppliers/${supplier.slug}`}
                      className="text-sm text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare size={14} />
                      Contact Supplier
                    </Link>
                  )}
                </div>

                {/* Items */}
                <div className="divide-y">
                  {supplier.items.map((item: any) => (
                    <div key={item.id} className="p-6 flex gap-4">
                      <Link
                        to={`/products/${item.product?.slug || item.productId}`}
                        className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden"
                      >
                        <img
                          src={item.product?.images?.[0] || `https://picsum.photos/seed/product${item.productId}/200/200`}
                          alt={item.product?.name}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/products/${item.product?.slug || item.productId}`}
                          className="font-medium text-gray-900 hover:text-orange-600 line-clamp-2"
                        >
                          {item.product?.name || 'Product'}
                        </Link>
                        <div className="mt-1 text-sm text-gray-500">
                          Qty: <span className="font-medium text-gray-700">{item.quantity}</span>
                          {item.product?.unit && <span className="ml-1">{item.product.unit}(s)</span>}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Unit Price: <span className="font-medium text-gray-700">{formatBDT(parseFloat(item.price) / item.quantity)}</span>
                        </div>
                        {isDelivered && (
                          <button className="mt-2 text-sm text-orange-600 hover:underline flex items-center gap-1">
                            <Star size={14} />
                            Write Review
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatBDT(parseFloat(item.price))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={18} className="text-gray-400" />
                Delivery Information
              </h3>

              {defaultAddress ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{defaultAddress.name}</p>
                    <p className="text-gray-600 mt-1">{defaultAddress.address}</p>
                    {defaultAddress.city && (
                      <p className="text-gray-600">{defaultAddress.city} {defaultAddress.postcode}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={14} />
                    {defaultAddress.phone}
                  </div>
                  <hr className="border-gray-100" />
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-semibold">Estimated Delivery</p>
                      <p className="font-medium text-gray-900">{format(estimatedDelivery, 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  {isDelivered && order.updatedAt && (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 text-xs uppercase font-semibold">Delivered On</p>
                        <p className="font-medium text-green-600">{format(new Date(order.updatedAt), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No delivery address available</p>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-gray-400" />
                Payment Information
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium text-gray-900 capitalize">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                     order.paymentMethod === 'deposit' ? '30% Deposit' :
                     order.paymentMethod || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-medium ${paymentStatus.color}`}>
                    {paymentStatus.label}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-700">{order.transactionId}</span>
                  </div>
                )}

                {/* Escrow Notice */}
                {isEscrow && (
                  <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-purple-600 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold text-purple-800">Payment in Escrow</p>
                        <p className="text-purple-600 mt-0.5">
                          Your payment is held securely and will be released 3 days after delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={18} className="text-gray-400" />
                Order Summary
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({order.items.length} items)</span>
                  <span>{formatBDT(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery</span>
                  <span className="text-green-600">Free</span>
                </div>
                {isDeposit && depositAmount > 0 && (
                  <>
                    <hr className="border-gray-100 my-2" />
                    <div className="flex justify-between text-gray-600">
                      <span>Deposit Paid (30%)</span>
                      <span className="text-green-600">-{formatBDT(depositAmount)}</span>
                    </div>
                  </>
                )}
                <hr className="border-gray-100 my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>{balanceDue > 0 ? 'Balance Due' : 'Total Paid'}</span>
                  <span className={balanceDue > 0 ? 'text-orange-600' : 'text-gray-900'}>
                    {formatBDT(balanceDue > 0 ? balanceDue : totalAmount)}
                  </span>
                </div>

                {balanceDue > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
                    <p className="text-xs text-orange-700">
                      <strong>Note:</strong> Please pay the remaining balance of {formatBDT(balanceDue)} upon delivery.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl shadow-sm border p-6 space-y-3">
              <button
                onClick={handleReorder}
                disabled={isReordering}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50"
              >
                {isReordering ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                Reorder
              </button>

              {canCancel && (
                <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium">
                  <XCircle size={18} />
                  Cancel Order
                </button>
              )}

              <Link
                to="/help"
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <HelpCircle size={18} />
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const STAGE_SEQUENCE = [
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
] as const

type StageKey = (typeof STAGE_SEQUENCE)[number]
type StageTimestamps = Partial<Record<StageKey, Date | string>>

function buildStageTimestamps(
  createdAt: Date,
  status: string,
  updatedAt?: Date | string,
  includeAllStages = false,
): StageTimestamps {
  const base = createdAt
  const timestamps: StageTimestamps = {
    placed: base,
    confirmed: addHours(base, 4),
    processing: addDays(base, 1),
    shipped: addDays(base, 2),
    out_for_delivery: addDays(base, 3),
    delivered: addDays(base, 4),
  }

  const statusIndex = STAGE_SEQUENCE.indexOf(status as StageKey)
  if (statusIndex === -1) return { placed: base }

  if (includeAllStages) {
    if (updatedAt && STAGE_SEQUENCE.includes(status as StageKey)) {
      timestamps[status as StageKey] = updatedAt
    }
    return timestamps
  }

  const visible: StageTimestamps = {}
  STAGE_SEQUENCE.forEach((key, index) => {
    if (index <= statusIndex) {
      visible[key] =
        key === (status as StageKey) && updatedAt ? updatedAt : timestamps[key]
    }
  })
  return visible
}

function getMockStatusByNow(
  now: Date,
  timestamps: StageTimestamps,
  includeOutForDelivery: boolean,
) {
  const filtered = includeOutForDelivery
    ? STAGE_SEQUENCE
    : STAGE_SEQUENCE.filter((stage) => stage !== 'out_for_delivery')

  let current: StageKey = 'placed'
  filtered.forEach((stage) => {
    const stageTime = timestamps[stage]
    if (stageTime && new Date(stageTime) <= now) {
      current = stage as StageKey
    }
  })
  return current
}

function ensureForwardStatus(current: string, next: string) {
  if (['cancelled', 'returned'].includes(current)) return current
  if (['cancelled', 'returned'].includes(next)) return next
  const currentIndex = STAGE_SEQUENCE.indexOf(current as StageKey)
  const nextIndex = STAGE_SEQUENCE.indexOf(next as StageKey)
  if (nextIndex === -1) return current
  if (currentIndex === -1) return next
  return nextIndex >= currentIndex ? next : current
}

function buildMockTrackingInfo(createdAt: Date, order: any) {
  const trackingNumber = `BB-${order.id.toString().padStart(6, '0')}-TRK`
  return {
    courierName: 'Sundarban Courier',
    trackingNumber,
    trackingUrl: `https://track.sundarbancourier.com/?tn=${trackingNumber}`,
    expectedDelivery: addDays(createdAt, 7),
  }
}
