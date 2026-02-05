import { Link, createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Calendar,
  CheckCircle,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Home,
  Loader2,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  RefreshCw,
  Star,
  Truck,
  XCircle,
} from 'lucide-react'
import { addDays, addHours, format } from 'date-fns'
import { jsPDF } from 'jspdf'
import type { ReactNode } from 'react'
import type { NotificationPreferences } from '@/contexts/NotificationContext'
import {
  formatBDT,
  getProductById,
  getProductsByCategory,
  getSupplierById,
} from '@/data/mock-products'
import { getOrder } from '@/lib/order-actions'
import Toast from '@/components/Toast'
import { useCart } from '@/contexts/CartContext'
import OrderStatusTimeline from '@/components/OrderStatusTimeline'
import { useNotifications } from '@/contexts/NotificationContext'

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

type ReorderItem = {
  id: string
  productId: number
  productName: string
  productSlug?: string
  categoryId?: number
  supplierId: number | null
  supplierName: string
  quantity: number
  oldPrice: number
  newPrice: number
  priceChanged: boolean
  inStock: boolean
  supplierActive: boolean
  available: boolean
  image?: string
}

type SupplierGroup = {
  key: string
  supplierId: number | null
  supplierName: string
  itemCount: number
}

const REORDER_HIGHLIGHT_STORAGE_KEY = 'bb_reorder_highlight'
const REORDER_ANALYTICS_STORAGE_KEY = 'bb_reorder_analytics'

function OrderDetailPage() {
  const order = Route.useLoaderData()
  const { addItem } = useCart()
  const navigate = Route.useNavigate()
  const { addNotification, preferences } = useNotifications()
  const [toast, setToast] = useState({ message: '', isVisible: false })
  const [isReordering, setIsReordering] = useState(false)
  const [reorderItems, setReorderItems] = useState<Array<ReorderItem>>([])
  const [supplierGroups, setSupplierGroups] = useState<Array<SupplierGroup>>([])
  const [supplierSelection, setSupplierSelection] = useState<Record<string, boolean>>({})
  const [priceChangeItems, setPriceChangeItems] = useState<Array<ReorderItem>>([])
  const [unavailableItems, setUnavailableItems] = useState<Array<ReorderItem>>([])
  const [availableItems, setAvailableItems] = useState<Array<ReorderItem>>([])
  const [alternativeProducts, setAlternativeProducts] = useState<Array<ReorderItem>>([])
  const [reorderModal, setReorderModal] = useState<
    'supplier' | 'price' | 'unavailable' | 'alternatives' | null
  >(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(order?.invoiceUrl ?? null)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)
  const [isEmailingInvoice, setIsEmailingInvoice] = useState(false)
  const [isCancellingOrder, setIsCancellingOrder] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('ordered_by_mistake')
  const [cancelReasonNote, setCancelReasonNote] = useState('')
  const [itemsExpanded, setItemsExpanded] = useState(false)
  const previousStatusRef = useRef<string | null>(null)

  const cachedOrder = useMemo(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = sessionStorage.getItem(`bb_order_${order?.id}`)
      if (!stored) return null
      const parsed = JSON.parse(stored)
      if (!parsed?.id || parsed.id !== order?.id) return null
      return parsed
    } catch (error) {
      console.error('Failed to read cached order', error)
      return null
    }
  }, [order?.id])

  const [cancelledAt, setCancelledAt] = useState<Date | string | null>(
    cachedOrder?.cancelledAt ?? order?.cancelledAt ?? null,
  )
  const [cancellationReason, setCancellationReason] = useState<string | null>(
    cachedOrder?.cancellationReason ?? order?.cancellationReason ?? null,
  )

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

  const [statusState, setStatusState] = useState(cachedOrder?.status ?? order.status)
  const [statusUpdatedAt, setStatusUpdatedAt] = useState<Date | string | undefined>(
    cachedOrder?.updatedAt ?? order.updatedAt,
  )
  const [trackingInfo, setTrackingInfo] = useState(() =>
    buildMockTrackingInfo(createdAt, cachedOrder ?? order),
  )
  const [stageTimestamps, setStageTimestamps] = useState(() =>
    buildStageTimestamps(
      createdAt,
      cachedOrder?.status ?? order.status,
      cachedOrder?.updatedAt ?? order.updatedAt,
    ),
  )

  const isDelivered = statusState === 'delivered'
  const isShipped = ['shipped', 'out_for_delivery'].includes(statusState)
  const canCancel = ['placed', 'confirmed'].includes(statusState)
  const isCancelled = statusState === 'cancelled'
  const estimatedDelivery = trackingInfo.expectedDelivery

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.id.toString().padStart(6, '0'))
    setToast({ message: 'Order ID copied!', isVisible: true })
  }

  const canReorder = statusState === 'delivered'

  const handleReorder = () => {
    if (!canReorder) {
      setToast({
        message: 'Reorder is available once an order is delivered.',
        isVisible: true,
      })
      return
    }

    const items = buildReorderItems(order)
    const groups = buildSupplierGroups(items)
    setReorderItems(items)
    setSupplierGroups(groups)

    if (groups.length > 1) {
      const initialSelection: Record<string, boolean> = {}
      groups.forEach((group) => {
        initialSelection[group.key] = true
      })
      setSupplierSelection(initialSelection)
      setReorderModal('supplier')
      return
    }

    evaluateReorderSelection(items)
  }

  const evaluateReorderSelection = (items: Array<ReorderItem>) => {
    const available = items.filter((item) => item.available)
    const unavailable = items.filter((item) => !item.available)
    const priceChanges = available.filter((item) => item.priceChanged)

    setAvailableItems(available)
    setUnavailableItems(unavailable)
    setPriceChangeItems(priceChanges)

    if (unavailable.length > 0) {
      setReorderModal('unavailable')
      return
    }

    if (priceChanges.length > 0) {
      setReorderModal('price')
      return
    }

    void addItemsToCart(available)
  }

  const addItemsToCart = (items: Array<ReorderItem>) => {
    if (items.length === 0) {
      setToast({ message: 'No available items to add.', isVisible: true })
      return
    }

    setIsReordering(true)
    const addedProductIds: Array<number> = []
    const failedItems: Array<ReorderItem> = []

    items.forEach((item) => {
      const result = addItem({
        productId: item.productId,
        quantity: item.quantity,
        customPrice: item.newPrice,
      })
      if (result.success) {
        addedProductIds.push(item.productId)
      } else {
        failedItems.push(item)
      }
    })

    setIsReordering(false)

    if (failedItems.length > 0) {
      setToast({
        message: `${failedItems.length} item(s) could not be added due to stock limits.`,
        isVisible: true,
      })
    }

    if (addedProductIds.length > 0) {
      const orderLabel = formatOrderLabel(order)
      persistReorderHighlight(orderLabel, addedProductIds)
      trackReorderAnalytics(orderLabel, addedProductIds)
      navigate({ to: '/cart' })
    }

    setReorderModal(null)
  }

  const handleDownloadInvoice = () => {
    void downloadOrGenerateInvoice()
  }

  useEffect(() => {
    if (invoiceUrl) return
    const fetchInvoice = async () => {
      try {
        const response = await fetch(`/api/orders/${order.id}/invoice`)
        const data = await response.json().catch(() => ({}))
        if (data?.invoiceUrl) {
          setInvoiceUrl(data.invoiceUrl)
        }
      } catch (error) {
        console.error('Failed to load invoice url', error)
      }
    }
    fetchInvoice()
  }, [invoiceUrl, order.id])

  const downloadOrGenerateInvoice = async () => {
    if (invoiceUrl) {
      triggerInvoiceDownload(invoiceUrl, buildInvoiceFileName(order))
      return
    }

    setIsGeneratingInvoice(true)
    try {
      const invoiceMeta = buildInvoiceMeta(order, defaultAddress)
      const pdfDataUrl = await generateInvoicePdf(invoiceMeta)
      setInvoiceUrl(pdfDataUrl)
      triggerInvoiceDownload(pdfDataUrl, buildInvoiceFileName(order))

      await fetch(`/api/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'store', invoiceUrl: pdfDataUrl }),
      }).catch(() => null)
    } catch (error) {
      console.error('Failed to generate invoice:', error)
      setToast({ message: 'Failed to generate invoice. Please try again.', isVisible: true })
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  const handleEmailInvoice = async () => {
    setIsEmailingInvoice(true)
    try {
      let urlToEmail = invoiceUrl
      if (!urlToEmail) {
        const invoiceMeta = buildInvoiceMeta(order, defaultAddress)
        urlToEmail = await generateInvoicePdf(invoiceMeta)
        setInvoiceUrl(urlToEmail)
        await fetch(`/api/orders/${order.id}/invoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'store', invoiceUrl: urlToEmail }),
        }).catch(() => null)
      }

      await fetch(`/api/orders/${order.id}/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'email', invoiceUrl: urlToEmail }),
      })

      setToast({ message: 'Invoice emailed successfully.', isVisible: true })
    } catch (error) {
      console.error('Failed to email invoice:', error)
      setToast({ message: 'Failed to email invoice. Please try again.', isVisible: true })
    } finally {
      setIsEmailingInvoice(false)
    }
  }

  const handleCancelOrder = async () => {
    if (!canCancel || isCancelled) {
      setToast({ message: 'This order can no longer be cancelled.', isVisible: true })
      return
    }

    const reasonLabel = getCancelReasonLabel(cancelReason)
    const finalReason =
      cancelReason === 'other' && cancelReasonNote.trim()
        ? `Other: ${cancelReasonNote.trim()}`
        : reasonLabel

    setIsCancellingOrder(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: finalReason }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setToast({
          message: data?.error ?? 'Unable to cancel this order.',
          isVisible: true,
        })
        setIsCancellingOrder(false)
        return
      }

      setStatusState('cancelled')
      setCancellationReason(data?.cancellationReason ?? finalReason)
      setCancelledAt(data?.cancelledAt ?? new Date())
      setToast({
        message: 'Order cancelled. Refund will be processed within 3-5 business days.',
        isVisible: true,
      })
      setCancelModalOpen(false)
    } catch (error) {
      console.error('Failed to cancel order:', error)
      setToast({ message: 'Failed to cancel order. Please try again.', isVisible: true })
    } finally {
      setIsCancellingOrder(false)
    }
  }

  const status = statusConfig[statusState]
  const paymentStatus = paymentStatusConfig[order.paymentStatus]
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
        fetch(`/api/orders/${order.id}/status`),
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
      if (statusJson?.status === 'cancelled') {
        setCancellationReason(statusJson?.cancellationReason ?? cancellationReason)
        setCancelledAt(statusJson?.cancelledAt ?? cancelledAt ?? new Date())
      }

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
      setStatusState((prev) => ensureForwardStatus(prev, fallbackStatus))
      setStageTimestamps(() => mockTimestamps)
      setTrackingInfo(() => fallbackTracking)
      setStatusUpdatedAt(new Date())
    }
  }, [
    createdAt,
    order,
    showOutForDelivery,
    statusState,
    statusUpdatedAt,
  ])

  useEffect(() => {
    if (!statusState) return
    if (previousStatusRef.current && previousStatusRef.current !== statusState) {
      const payload = buildOrderStatusNotification(order, statusState, trackingInfo)
      if (shouldNotifyStatus(statusState, preferences)) {
        addNotification(payload)
      }
    }
    previousStatusRef.current = statusState
  }, [addNotification, order, preferences, statusState, trackingInfo])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem(
        `bb_order_${order.id}`,
        JSON.stringify({
          ...order,
          status: statusState,
          updatedAt: statusUpdatedAt,
          cancelledAt,
          cancellationReason,
        }),
      )
    } catch (error) {
      console.error('Failed to cache order', error)
    }
  }, [order, statusState, statusUpdatedAt, cancelledAt, cancellationReason])

  const handleSupplierSelectionChange = (key: string) => {
    setSupplierSelection((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSupplierContinue = () => {
    const selectedKeys = Object.keys(supplierSelection).filter(
      (key) => supplierSelection[key],
    )
    if (selectedKeys.length === 0) {
      setToast({ message: 'Select at least one supplier to continue.', isVisible: true })
      return
    }
    const selectedItems = reorderItems.filter((item) =>
      selectedKeys.includes(itemSupplierKey(item)),
    )
    setReorderModal(null)
    evaluateReorderSelection(selectedItems)
  }

  const handleSupplierQuickReorder = (key: string) => {
    const selectedItems = reorderItems.filter(
      (item) => itemSupplierKey(item) === key,
    )
    setSupplierSelection({ [key]: true })
    setReorderModal(null)
    evaluateReorderSelection(selectedItems)
  }

  const handleAddAvailableItemsOnly = () => {
    if (availableItems.length === 0) {
      setToast({ message: 'No available items to add.', isVisible: true })
      return
    }

    if (priceChangeItems.length > 0) {
      setReorderModal('price')
      return
    }

    void addItemsToCart(availableItems)
  }

  const handleViewAlternatives = () => {
    const suggestions = buildAlternatives(unavailableItems)
    setAlternativeProducts(suggestions)
    setReorderModal('alternatives')
  }

  const handleNotifyBackInStock = () => {
    setToast({
      message: 'We will notify you when unavailable items are back in stock.',
      isVisible: true,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />

      <div className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 transition-colors">
          <Link to="/" className="hover:text-orange-600 dark:hover:text-orange-500 flex items-center gap-1 transition-colors">
            <Home size={14} />
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />
          <Link to="/buyer/orders" className="hover:text-orange-600 dark:hover:text-orange-500 transition-colors">
            My Orders
          </Link>
          <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />
          <span className="text-gray-900 dark:text-gray-100 font-medium transition-colors">Order #{order.id.toString().padStart(6, '0')}</span>
        </nav>

        {/* Hero Section */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 mb-6 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white transition-colors">
                  Order #{order.id.toString().padStart(6, '0')}
                </h1>
                <button
                  onClick={handleCopyOrderId}
                  className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
                  title="Copy order ID"
                >
                  <Copy size={16} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {format(createdAt, 'MMMM d, yyyy')} at {format(createdAt, 'h:mm a')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${status.bgColor} ${status.color} dark:bg-opacity-20`}>
                  {status.label}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {canReorder && !isCancelled && (
                <button
                  onClick={handleReorder}
                  disabled={isReordering}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-60 shadow-sm shadow-green-600/20"
                >
                  {isReordering ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                  Reorder
                </button>
              )}
              {isShipped && (
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all font-medium shadow-sm shadow-orange-500/20">
                  <Truck size={18} />
                  Track Order
                </button>
              )}
              <button
                onClick={handleDownloadInvoice}
                disabled={isGeneratingInvoice}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-medium"
              >
                {isGeneratingInvoice ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
                {invoiceUrl ? 'Download Invoice' : 'Generate Invoice'}
              </button>
              <button
                onClick={handleEmailInvoice}
                disabled={isEmailingInvoice}
                className="flex items-center gap-2 px-4 py-2 border border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 transition-all font-medium"
              >
                {isEmailingInvoice ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MessageSquare size={18} />
                )}
                Email Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status Timeline */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 transition-colors">Order Status</h2>
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

            {isCancelled && (
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl p-5 transition-colors">
                <h3 className="text-sm font-semibold text-red-700 dark:text-red-400">Cancellation Details</h3>
                <p className="text-sm text-red-600 dark:text-red-300 mt-2 transition-colors">
                  Reason: {cancellationReason ?? 'Not provided'}
                </p>
                {cancelledAt && (
                  <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                    Cancelled on {format(new Date(cancelledAt), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
                <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                  Refund will be processed in 3-5 business days to the original payment method.
                </p>
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-red-700 dark:text-red-400 font-medium hover:underline transition-colors"
                >
                  Shop Similar Products
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}

            {/* Order Items by Supplier */}
            <div className="flex items-center justify-between md:hidden transition-colors">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Order Items</h3>
              <button
                onClick={() => setItemsExpanded((prev) => !prev)}
                className="text-xs text-orange-600 dark:text-orange-500 font-medium transition-colors"
              >
                {itemsExpanded ? 'Hide items' : 'Show items'}
              </button>
            </div>

            <div className={`${itemsExpanded ? 'block' : 'hidden'} md:block space-y-6`}>
              {Object.values(itemsBySupplier).map((supplier: any) => (
                <div key={supplier.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden transition-colors">
                  {/* Supplier Header */}
                  <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-slate-800 rounded-lg flex items-center justify-center transition-colors">
                        <Package size={20} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 transition-colors">{supplier.name}</h3>
                          {supplier.verified && (
                            <BadgeCheck size={16} className="text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 transition-colors">{supplier.items.length} item(s)</p>
                      </div>
                    </div>
                    {supplier.slug && (
                      <Link
                        to={`/suppliers/${supplier.slug}`}
                        className="text-sm text-orange-600 dark:text-orange-500 hover:underline flex items-center gap-1 transition-colors"
                      >
                        <MessageSquare size={14} />
                        Contact Supplier
                      </Link>
                    )}
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-gray-100 dark:divide-slate-800">
                    {supplier.items.map((item: any) => (
                      <div key={item.id} className="p-6 flex gap-4 transition-colors">
                        <Link
                          to={`/products/${item.product?.slug || item.productId}`}
                          className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200 dark:border-slate-700 transition-colors"
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
                            className="font-medium text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-500 line-clamp-2 transition-colors"
                          >
                            {item.product?.name || 'Product'}
                          </Link>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            Qty: <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity}</span>
                            {item.product?.unit && <span className="ml-1">{item.product.unit}(s)</span>}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                            Unit Price: <span className="font-medium text-gray-700 dark:text-gray-300">{formatBDT(parseFloat(item.price) / item.quantity)}</span>
                          </div>
                          {isDelivered && (
                            <button className="mt-2 text-sm text-orange-600 dark:text-orange-500 hover:underline flex items-center gap-1 transition-colors">
                              <Star size={14} />
                              Write Review
                            </button>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white transition-colors">{formatBDT(parseFloat(item.price))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 transition-colors">
                <MapPin size={18} className="text-gray-400 dark:text-gray-500" />
                Delivery Information
              </h3>

              {defaultAddress ? (
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{defaultAddress.name}</p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1 transition-colors">{defaultAddress.address}</p>
                    {defaultAddress.city && (
                      <p className="text-gray-600 dark:text-gray-400 transition-colors">{defaultAddress.city} {defaultAddress.postcode}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 transition-colors">
                    <Phone size={14} />
                    {defaultAddress.phone}
                  </div>
                  <hr className="border-gray-100 dark:border-slate-800" />
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-gray-400 dark:text-gray-500 mt-0.5" />
                    <div>
                      <p className="text-gray-500 dark:text-gray-500 text-xs uppercase font-semibold transition-colors">Estimated Delivery</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100 transition-colors">{format(estimatedDelivery, 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                  {isDelivered && order.updatedAt && (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-green-500 mt-0.5" />
                      <div>
                        <p className="text-gray-500 dark:text-gray-500 text-xs uppercase font-semibold transition-colors">Delivered On</p>
                        <p className="font-medium text-green-600 transition-colors">{format(new Date(order.updatedAt), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">No delivery address available</p>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 transition-colors">
                <CreditCard size={18} className="text-gray-400 dark:text-gray-500" />
                Payment Information
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 transition-colors">Method</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100 capitalize transition-colors">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' :
                     order.paymentMethod === 'deposit' ? '30% Deposit' :
                     order.paymentMethod || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 transition-colors">Status</span>
                  <span className={`font-medium ${paymentStatus.color} transition-colors`}>
                    {paymentStatus.label}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400 transition-colors">Transaction ID</span>
                    <span className="font-mono text-xs text-gray-700 dark:text-gray-300 transition-colors">{order.transactionId}</span>
                  </div>
                )}

                {/* Escrow Notice */}
                {isEscrow && (
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30 transition-colors">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={16} className="text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-semibold text-purple-800 dark:text-purple-300 transition-colors">Payment in Escrow</p>
                        <p className="text-purple-600 dark:text-purple-400 mt-0.5 transition-colors">
                          Your payment is held securely and will be released 3 days after delivery.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-colors">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2 transition-colors">
                <FileText size={18} className="text-gray-400 dark:text-gray-500" />
                Order Summary
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                  <span>Subtotal ({order.items.length} items)</span>
                  <span>{formatBDT(totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                  <span>Delivery</span>
                  <span className="text-green-600 dark:text-green-400 transition-colors">Free</span>
                </div>
                {isDeposit && depositAmount > 0 && (
                  <>
                    <hr className="border-gray-100 dark:border-slate-800 my-2 transition-colors" />
                    <div className="flex justify-between text-gray-600 dark:text-gray-400 transition-colors">
                      <span>Deposit Paid (30%)</span>
                      <span className="text-green-600 dark:text-green-400 transition-colors">-{formatBDT(depositAmount)}</span>
                    </div>
                  </>
                )}
                <hr className="border-gray-100 dark:border-slate-800 my-2 transition-colors" />
                <div className="flex justify-between font-bold text-lg dark:text-white transition-colors">
                  <span>{balanceDue > 0 ? 'Balance Due' : 'Total Paid'}</span>
                  <span className={balanceDue > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-gray-900 dark:text-white'}>
                    {formatBDT(balanceDue > 0 ? balanceDue : totalAmount)}
                  </span>
                </div>

                {balanceDue > 0 && (
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/30 transition-colors">
                    <p className="text-xs text-orange-700 dark:text-orange-400 transition-colors">
                      <strong>Note:</strong> Please pay the remaining balance of {formatBDT(balanceDue)} upon delivery.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 space-y-3 transition-colors">
              {canReorder && !isCancelled && (
                <button
                  onClick={handleReorder}
                  disabled={isReordering}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium disabled:opacity-50 shadow-sm shadow-green-600/20"
                >
                  {isReordering ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <RefreshCw size={18} />
                  )}
                  Buy Again
                </button>
              )}

              {canCancel && (
                <button
                  onClick={() => setCancelModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all font-medium"
                >
                  <AlertTriangle size={18} />
                  Cancel Order
                </button>
              )}

              <Link
                to="/help"
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-all font-medium"
              >
                <HelpCircle size={18} />
                Get Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Reorder Modals */}
      <ReorderModalShell
        isOpen={reorderModal === 'supplier'}
        title="Reorder by Supplier"
        subtitle="Select which suppliers you want to reorder from."
        onClose={() => setReorderModal(null)}
      >
        <div className="space-y-3">
          {supplierGroups.map((group) => (
            <div
              key={group.key}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
            >
              <label className="flex items-center gap-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={Boolean(supplierSelection[group.key])}
                  onChange={() => handleSupplierSelectionChange(group.key)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="font-medium text-gray-900">{group.supplierName}</span>
                <span className="text-xs text-gray-500">
                  {group.itemCount} item{group.itemCount > 1 ? 's' : ''}
                </span>
              </label>
              <button
                onClick={() => handleSupplierQuickReorder(group.key)}
                className="text-xs text-green-700 hover:text-green-800 font-semibold"
              >
                Reorder from {group.supplierName}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setReorderModal(null)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSupplierContinue}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
          >
            Continue
          </button>
        </div>
      </ReorderModalShell>

      <ReorderModalShell
        isOpen={reorderModal === 'unavailable'}
        title="Some items are unavailable"
        subtitle="You can still reorder available items or explore alternatives."
        onClose={() => setReorderModal(null)}
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 text-amber-600" />
            <span>Some items are out of stock or no longer available.</span>
          </div>

          <div className="space-y-2">
            {unavailableItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-800">{item.productName}</span>
                <span className="text-xs text-gray-500">
                  {!item.supplierActive ? 'Supplier inactive' : item.inStock ? 'Unavailable' : 'Out of stock'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleAddAvailableItemsOnly}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
          >
            Add available items only
          </button>
          <button
            onClick={handleViewAlternatives}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
          >
            View alternatives
          </button>
          <button
            onClick={handleNotifyBackInStock}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium"
          >
            Notify when back in stock
          </button>
        </div>
      </ReorderModalShell>

      <ReorderModalShell
        isOpen={reorderModal === 'price'}
        title="Prices have changed since your last order"
        subtitle="Review the updated prices before adding to cart."
        onClose={() => setReorderModal(null)}
      >
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-2 text-left font-semibold">Product</th>
                <th className="px-4 py-2 text-right font-semibold">Old Price</th>
                <th className="px-4 py-2 text-right font-semibold">New Price</th>
                <th className="px-4 py-2 text-right font-semibold">Difference</th>
              </tr>
            </thead>
            <tbody>
              {priceChangeItems.map((item) => {
                const diff = item.newPrice - item.oldPrice
                return (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2 text-gray-800">{item.productName}</td>
                    <td className="px-4 py-2 text-right text-gray-500">{formatBDT(item.oldPrice)}</td>
                    <td className="px-4 py-2 text-right text-gray-900">{formatBDT(item.newPrice)}</td>
                    <td className={`px-4 py-2 text-right ${diff >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {diff >= 0 ? '+' : '-'}{formatBDT(Math.abs(diff))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setReorderModal(null)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => addItemsToCart(availableItems)}
            className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
          >
            Add to Cart with New Prices
          </button>
        </div>
      </ReorderModalShell>

      <ReorderModalShell
        isOpen={reorderModal === 'alternatives'}
        title="Suggested Alternatives"
        subtitle="Here are similar products you can reorder instead."
        onClose={() => setReorderModal(null)}
      >
        {alternativeProducts.length === 0 ? (
          <div className="text-sm text-gray-500">
            We couldn't find close alternatives right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {alternativeProducts.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package size={20} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatBDT(item.newPrice)}</p>
                    {item.productSlug && (
                      <Link
                        to={`/products/${item.productSlug}`}
                        className="text-xs text-green-700 hover:underline inline-flex items-center gap-1 mt-2"
                      >
                        View product <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={() => setReorderModal(null)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
          >
            Close
          </button>
        </div>
      </ReorderModalShell>

      <ReorderModalShell
        isOpen={cancelModalOpen}
        title={`Cancel Order #${formatOrderLabel(order)}?`}
        subtitle="Are you sure you want to cancel this order? Refunds are processed to the original payment method within 3-5 business days."
        onClose={() => setCancelModalOpen(false)}
        position="bottom"
      >
        <div className="space-y-4">
          <label className="text-sm font-medium text-gray-700">Reason for cancellation</label>
          <select
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <option value="ordered_by_mistake">Ordered by mistake</option>
            <option value="better_price">Found better price elsewhere</option>
            <option value="changed_mind">Changed my mind</option>
            <option value="delivery_too_long">Delivery time too long</option>
            <option value="other">Other</option>
          </select>

          {cancelReason === 'other' && (
            <textarea
              value={cancelReasonNote}
              onChange={(event) => setCancelReasonNote(event.target.value)}
              placeholder="Tell us more"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-h-[90px]"
            />
          )}

          <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-600">
            Refunds are sent to the original payment method. Deposit payments will be refunded for the paid amount only.
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setCancelModalOpen(false)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
          >
            Keep Order
          </button>
          <button
            onClick={handleCancelOrder}
            disabled={isCancellingOrder}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium disabled:opacity-60"
          >
            {isCancellingOrder ? 'Cancelling...' : 'Cancel Order'}
          </button>
        </div>
      </ReorderModalShell>

      {isShipped && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden">
          <button
            onClick={() => {
              if (trackingInfo.trackingUrl) {
                window.open(trackingInfo.trackingUrl, '_blank', 'noopener,noreferrer')
              } else {
                setToast({ message: 'Tracking details are not available yet.', isVisible: true })
              }
            }}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <Truck size={18} />
            Track Order
          </button>
        </div>
      )}
    </div>
  )
}

function ReorderModalShell({
  isOpen,
  title,
  subtitle,
  onClose,
  children,
  position = 'center',
}: {
  isOpen: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  position?: 'center' | 'bottom'
}) {
  if (!isOpen) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex ${
        position === 'bottom' ? 'items-end sm:items-center' : 'items-center'
      } justify-center bg-black/50 p-4 animate-in fade-in duration-200`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reorder-modal-title"
    >
      <div className={`bg-white shadow-xl w-full max-w-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] ${
        position === 'bottom' ? 'rounded-t-2xl sm:rounded-xl' : 'rounded-xl'
      }`}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 id="reorder-modal-title" className="text-lg font-bold text-gray-900">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-200"
            aria-label="Close modal"
          >
            <XCircle size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

function itemSupplierKey(item: ReorderItem) {
  return item.supplierId ? `supplier-${item.supplierId}` : 'supplier-unknown'
}

function getCancelReasonLabel(value: string) {
  switch (value) {
    case 'ordered_by_mistake':
      return 'Ordered by mistake'
    case 'better_price':
      return 'Found better price elsewhere'
    case 'changed_mind':
      return 'Changed my mind'
    case 'delivery_too_long':
      return 'Delivery time too long'
    case 'other':
      return 'Other'
    default:
      return 'Other'
  }
}

function shouldNotifyStatus(status: string, preferences: NotificationPreferences) {
  switch (status) {
    case 'placed':
      return preferences.orderPlaced
    case 'confirmed':
      return preferences.orderConfirmed
    case 'shipped':
      return preferences.orderShipped
    case 'out_for_delivery':
      return preferences.orderOutForDelivery
    case 'delivered':
      return preferences.orderDelivered
    case 'cancelled':
      return preferences.orderCancelled
    case 'refund_processed':
      return preferences.refundProcessed
    default:
      return true
  }
}

function buildOrderStatusNotification(order: any, status: string, trackingInfo?: any) {
  const orderLabel = formatOrderLabel(order)
  const statusLabel = status.replace(/_/g, ' ')
  const base = {
    id: `order-${order.id}-${status}`,
    title: `Order #${orderLabel}`,
    message: `Status updated to ${statusLabel}.`,
    type: status === 'cancelled' ? 'warning' : status === 'delivered' ? 'success' : 'info',
    link: `/buyer/orders/${order.id}`,
    orderId: order.id,
    category: 'order' as const,
    status,
  }

  if (status === 'shipped' && trackingInfo?.trackingNumber) {
    return {
      ...base,
      message: `Shipped via ${trackingInfo.courierName ?? 'courier'} · Tracking ${trackingInfo.trackingNumber}. Track your delivery.`,
    }
  }

  if (status === 'out_for_delivery') {
    return {
      ...base,
      message: 'Out for delivery. Please keep your phone available to receive the package.',
    }
  }

  if (status === 'placed') {
    return {
      ...base,
      message: 'Order placed successfully. Supplier confirmation is pending.',
    }
  }

  if (status === 'confirmed') {
    return {
      ...base,
      message: 'Order confirmed by supplier. We are preparing your items.',
    }
  }

  if (status === 'delivered') {
    return {
      ...base,
      message: 'Delivered successfully. If there is any issue, contact support.',
    }
  }

  if (status === 'cancelled') {
    return {
      ...base,
      message: 'Order cancelled. Refund will be processed in 3-5 business days.',
    }
  }

  return base
}

function buildReorderItems(order: any): Array<ReorderItem> {
  return order.items.map((item: any, index: number) => {
    const fallbackProduct = item.product || {}
    const productId = item.productId ?? fallbackProduct.id ?? index
    const product = getProductById(productId) ?? fallbackProduct
    const supplierId = product?.supplierId ?? fallbackProduct?.supplierId ?? null
    const supplier = supplierId ? getSupplierById(supplierId) : undefined
    const supplierName =
      supplier?.name ??
      fallbackProduct?.supplier?.name ??
      fallbackProduct?.supplierName ??
      'Unknown Supplier'
    const oldPrice = parseFloat(item.price)
    const newPrice = product?.price ? Number(product.price) : oldPrice
    const productExists = Boolean(product?.id)
    const inStock = productExists && typeof product?.stock === 'number'
      ? product.stock >= item.quantity
      : false
    const supplierActive = Boolean(supplier) || Boolean(fallbackProduct?.supplier?.id)
    const available = productExists && inStock && supplierActive

    return {
      id: `${productId}-${index}`,
      productId,
      productName: product?.name || fallbackProduct?.name || 'Product',
      productSlug: product?.slug || fallbackProduct?.slug,
      categoryId: product?.categoryId || fallbackProduct?.categoryId,
      supplierId,
      supplierName,
      quantity: item.quantity,
      oldPrice,
      newPrice,
      priceChanged: Math.abs(newPrice - oldPrice) > 0.01,
      inStock,
      supplierActive,
      available,
      image: product?.images?.[0] || fallbackProduct?.images?.[0],
    }
  })
}

function buildSupplierGroups(items: Array<ReorderItem>): Array<SupplierGroup> {
  const grouped = new Map<string, SupplierGroup>()
  items.forEach((item) => {
    const key = itemSupplierKey(item)
    const existing = grouped.get(key)
    if (existing) {
      existing.itemCount += 1
    } else {
      grouped.set(key, {
        key,
        supplierId: item.supplierId,
        supplierName: item.supplierName,
        itemCount: 1,
      })
    }
  })
  return Array.from(grouped.values())
}

function buildAlternatives(unavailable: Array<ReorderItem>) {
  const suggestions: Array<ReorderItem> = []
  const seen = new Set<number>()

  unavailable.forEach((item) => {
    if (!item.categoryId) return
    const alternatives = getProductsByCategory(item.categoryId)
      .filter((product) => product.id !== item.productId)
      .slice(0, 3)

    alternatives.forEach((product) => {
      if (seen.has(product.id)) return
      seen.add(product.id)
      suggestions.push({
        id: `alt-${product.id}`,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        categoryId: product.categoryId,
        supplierId: product.supplierId,
        supplierName: getSupplierById(product.supplierId)?.name || 'Supplier',
        quantity: item.quantity,
        oldPrice: product.price,
        newPrice: product.price,
        priceChanged: false,
        inStock: product.stock >= item.quantity,
        supplierActive: true,
        available: product.stock >= item.quantity,
        image: product.images[0],
      })
    })
  })

  return suggestions.slice(0, 6)
}

function formatOrderLabel(order: any) {
  const year = order.createdAt ? new Date(order.createdAt).getFullYear() : new Date().getFullYear()
  return `BO-${year}-${order.id.toString().padStart(4, '0')}`
}

function persistReorderHighlight(orderLabel: string, productIds: Array<number>) {
  try {
    sessionStorage.setItem(
      REORDER_HIGHLIGHT_STORAGE_KEY,
      JSON.stringify({
        orderLabel,
        productIds,
        addedCount: productIds.length,
        timestamp: new Date().toISOString(),
      }),
    )
  } catch (error) {
    console.error('Failed to persist reorder highlight:', error)
  }
}

function trackReorderAnalytics(orderLabel: string, productIds: Array<number>) {
  try {
    const stored = localStorage.getItem(REORDER_ANALYTICS_STORAGE_KEY)
    const payload = stored ? JSON.parse(stored) : { events: [], productCounts: {}, hourlyCounts: {} }

    payload.events.push({
      orderLabel,
      productIds,
      timestamp: new Date().toISOString(),
    })

    productIds.forEach((id) => {
      payload.productCounts[id] = (payload.productCounts[id] || 0) + 1
    })

    const hour = new Date().getHours()
    payload.hourlyCounts[hour] = (payload.hourlyCounts[hour] || 0) + 1

    localStorage.setItem(REORDER_ANALYTICS_STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('Failed to track reorder analytics:', error)
  }
}

type InvoiceItem = {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

type InvoiceMeta = {
  invoiceNumber: string
  invoiceDate: Date
  orderNumber: string
  orderDate: Date
  paymentMethod: string
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  deliveryAddress: string
  companyAddress: string
  companyContact: string
  taxId: string
  items: Array<InvoiceItem>
  subtotal: number
  deliveryFee: number
  discount: number
  tax: number
  total: number
  amountPaid: number
  balanceDue: number
  paymentStatus: string
  transactionReference: string
}

function buildInvoiceMeta(order: any, address: any | null): InvoiceMeta {
  const createdAt = order.createdAt ? new Date(order.createdAt) : new Date()
  const year = createdAt.getFullYear()
  const invoiceNumber = `INV-${year}-${order.id.toString().padStart(5, '0')}`
  const orderNumber = `BO-${year}-${order.id.toString().padStart(4, '0')}`
  const items = order.items.map((item: any) => {
    const unitPrice = parseFloat(item.price) / item.quantity
    const total = parseFloat(item.price)
    return {
      name: item.product?.name || 'Product',
      quantity: item.quantity,
      unitPrice,
      total,
    }
  })
  const subtotal = items.reduce((sum, item) => sum + item.total, 0)
  const deliveryFee = 0
  const discount = 0
  const tax = 0
  const total = subtotal + deliveryFee - discount + tax
  const depositAmount = parseFloat(order.depositAmount || '0') || 0
  const balanceDue = parseFloat(order.balanceDue || '0') || 0
  const amountPaid = depositAmount > 0 && balanceDue > 0 ? depositAmount : total

  const addressLine = address
    ? `${address.address}${address.city ? `, ${address.city}` : ''} ${address.postcode ?? ''}`.trim()
    : 'No delivery address provided'

  return {
    invoiceNumber,
    invoiceDate: createdAt,
    orderNumber,
    orderDate: createdAt,
    paymentMethod: order.paymentMethod || 'N/A',
    buyerName: order.user?.name || 'Buyer',
    buyerEmail: order.user?.email || 'N/A',
    buyerPhone: address?.phone || order.user?.phoneNumber || 'N/A',
    deliveryAddress: addressLine,
    companyAddress: 'BoroBepari HQ, 120/A Gulshan Avenue, Dhaka-1212, Bangladesh',
    companyContact: 'support@borobepari.com · +880 1700-000000',
    taxId: 'GST/TAX ID: BB-1200-XYZ',
    items,
    subtotal,
    deliveryFee,
    discount,
    tax,
    total,
    amountPaid,
    balanceDue,
    paymentStatus: order.paymentStatus || 'pending',
    transactionReference: order.transactionId || 'N/A',
  }
}

async function generateInvoicePdf(meta: InvoiceMeta) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  const rowHeight = 18
  const tableTop = 320

  doc.setFillColor(243, 244, 246)
  doc.rect(0, 0, pageWidth, 110, 'F')

  const logoDataUrl = await loadImageAsDataUrl('/logo192.png')
  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, 20, 48, 48)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('TAX INVOICE', pageWidth - margin, 40, { align: 'right' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice: ${meta.invoiceNumber}`, pageWidth - margin, 60, { align: 'right' })
  doc.text(`Invoice Date: ${format(meta.invoiceDate, 'MMM d, yyyy')}`, pageWidth - margin, 76, { align: 'right' })

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('BoroBepari', margin, 90)
  doc.setFont('helvetica', 'normal')
  doc.text(meta.companyAddress, margin, 108)
  doc.text(meta.taxId, margin, 126)
  doc.text(meta.companyContact, margin, 144)

  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', margin, 190)
  doc.setFont('helvetica', 'normal')
  doc.text(meta.buyerName, margin, 208)
  doc.text(meta.deliveryAddress, margin, 226)
  doc.text(meta.buyerPhone, margin, 244)
  doc.text(meta.buyerEmail, margin, 262)

  doc.setFont('helvetica', 'bold')
  doc.text('ORDER DETAILS', pageWidth - margin, 190, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.text(`Order: ${meta.orderNumber}`, pageWidth - margin, 208, { align: 'right' })
  doc.text(`Order Date: ${format(meta.orderDate, 'MMM d, yyyy')}`, pageWidth - margin, 226, { align: 'right' })
  doc.text(`Payment: ${meta.paymentMethod}`, pageWidth - margin, 244, { align: 'right' })

  doc.setFillColor(229, 231, 235)
  doc.rect(margin, tableTop - 20, pageWidth - margin * 2, 24, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('S.No', margin + 8, tableTop - 4)
  doc.text('Product Name', margin + 60, tableTop - 4)
  doc.text('Qty', pageWidth - 210, tableTop - 4)
  doc.text('Unit Price', pageWidth - 150, tableTop - 4)
  doc.text('Total', pageWidth - 70, tableTop - 4, { align: 'right' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  let y = tableTop + 6
  meta.items.forEach((item, index) => {
    doc.text(String(index + 1), margin + 10, y)
    doc.text(item.name, margin + 60, y)
    doc.text(String(item.quantity), pageWidth - 210, y)
    doc.text(formatBDT(item.unitPrice), pageWidth - 150, y)
    doc.text(formatBDT(item.total), pageWidth - 70, y, { align: 'right' })
    y += rowHeight
  })

  const summaryStart = Math.max(y + 10, tableTop + 140)
  doc.setFont('helvetica', 'normal')
  doc.text(`Subtotal`, pageWidth - 220, summaryStart)
  doc.text(formatBDT(meta.subtotal), pageWidth - 70, summaryStart, { align: 'right' })
  doc.text(`Delivery`, pageWidth - 220, summaryStart + rowHeight)
  doc.text(formatBDT(meta.deliveryFee), pageWidth - 70, summaryStart + rowHeight, { align: 'right' })
  doc.text(`Discount`, pageWidth - 220, summaryStart + rowHeight * 2)
  doc.text(`-${formatBDT(meta.discount)}`, pageWidth - 70, summaryStart + rowHeight * 2, { align: 'right' })
  doc.text(`Tax`, pageWidth - 220, summaryStart + rowHeight * 3)
  doc.text(formatBDT(meta.tax), pageWidth - 70, summaryStart + rowHeight * 3, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.text('Grand Total', pageWidth - 220, summaryStart + rowHeight * 4)
  doc.text(formatBDT(meta.total), pageWidth - 70, summaryStart + rowHeight * 4, { align: 'right' })

  const paymentStart = summaryStart + rowHeight * 6
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT INFORMATION', margin, paymentStart)
  doc.setFont('helvetica', 'normal')
  doc.text(`Amount Paid: ${formatBDT(meta.amountPaid)}`, margin, paymentStart + rowHeight)
  doc.text(`Balance Due: ${formatBDT(meta.balanceDue)}`, margin, paymentStart + rowHeight * 2)
  doc.text(`Payment Status: ${meta.paymentStatus}`, margin, paymentStart + rowHeight * 3)
  doc.text(`Transaction Ref: ${meta.transactionReference}`, margin, paymentStart + rowHeight * 4)

  const footerStart = paymentStart + rowHeight * 6
  doc.setFontSize(9)
  doc.text('Terms: Payment due upon delivery unless otherwise agreed.', margin, footerStart)
  doc.text('Return policy: https://borobepari.com/returns', margin, footerStart + 14)
  doc.text('Thank you for your business!', margin, footerStart + 30)

  return doc.output('datauristring')
}

function buildInvoiceFileName(order: any) {
  const year = order.createdAt ? new Date(order.createdAt).getFullYear() : new Date().getFullYear()
  return `Invoice_BO-${year}-${order.id.toString().padStart(5, '0')}.pdf`
}

function triggerInvoiceDownload(url: string, filename: string) {
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

async function loadImageAsDataUrl(url: string) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error('Failed to load invoice logo', error)
    return null
  }
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
      current = stage
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
