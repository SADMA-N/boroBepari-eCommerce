import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  ExternalLink,
  Home,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Truck,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'

// Order status stages configuration
const ORDER_STAGES = [
  {
    key: 'placed',
    label: 'Order Placed',
    description: 'Your order has been received',
    icon: Package,
  },
  {
    key: 'confirmed',
    label: 'Confirmed by Supplier',
    description: 'Order confirmed by supplier',
    icon: CheckCircle,
  },
  {
    key: 'processing',
    label: 'Processing/Packing',
    description: 'Your order is being prepared',
    icon: Clock,
  },
  {
    key: 'shipped',
    label: 'Shipped',
    description: 'Your order is on the way',
    icon: Truck,
  },
  {
    key: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Package is out for delivery',
    icon: MapPin,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Order delivered successfully',
    icon: Home,
  },
]

// Status to stage index mapping
const STATUS_TO_INDEX: Record<string, number> = {
  pending: 0,
  placed: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
}

interface TrackingInfo {
  courierName?: string
  trackingNumber?: string
  trackingUrl?: string
  expectedDelivery?: Date
}

type OrderStageKey =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'

type StageTimestamps = Partial<Record<OrderStageKey, Date | string>>

interface OrderStatusTimelineProps {
  orderId: number
  status: string
  createdAt: Date | string
  updatedAt?: Date | string
  trackingInfo?: TrackingInfo
  onRefresh?: () => Promise<void>
  autoRefreshInterval?: number // in milliseconds, default 5 minutes
  showTrackingDetails?: boolean
  stageTimestamps?: StageTimestamps
  showOutForDelivery?: boolean
}

export default function OrderStatusTimeline({
  orderId,
  status,
  createdAt,
  updatedAt,
  trackingInfo,
  onRefresh,
  autoRefreshInterval = 5 * 60 * 1000, // 5 minutes
  showTrackingDetails = true,
  stageTimestamps,
  showOutForDelivery,
}: OrderStatusTimelineProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [copiedTracking, setCopiedTracking] = useState(false)
  const [statusNotification, setStatusNotification] = useState<string | null>(null)
  const previousStatus = useRef<string | null>(null)
  const lastRefreshRef = useRef<number>(0)

  const isCancelled = status === 'cancelled'
  const isReturned = status === 'returned'
  const isTerminal = isCancelled || isReturned

  // Get current stage index
  const currentStageIndex = isTerminal ? -1 : (STATUS_TO_INDEX[status] ?? 0)

  // Filter stages - hide "Out for Delivery" if order hasn't reached shipped yet
  const visibleStages = useMemo(
    () =>
      ORDER_STAGES.filter((stage) => {
        if (stage.key !== 'out_for_delivery') return true
        if (showOutForDelivery) return true
        if (status === 'out_for_delivery' || status === 'delivered') return true
        return currentStageIndex >= 3
      }),
    [currentStageIndex, showOutForDelivery, status],
  )

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || !onRefresh) return
    const now = Date.now()
    if (now - lastRefreshRef.current < 15000) {
      return
    }
    lastRefreshRef.current = now

    setIsRefreshing(true)
    try {
      await onRefresh()
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh order status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh, isRefreshing])

  // Auto-refresh effect
  useEffect(() => {
    if (!onRefresh || autoRefreshInterval <= 0) return

    const interval = setInterval(() => {
      handleRefresh()
    }, autoRefreshInterval)

    return () => clearInterval(interval)
  }, [autoRefreshInterval, handleRefresh, onRefresh])

  // Sync last updated with external updates
  useEffect(() => {
    if (updatedAt) {
      setLastUpdated(new Date(updatedAt))
    }
  }, [updatedAt])

  // Copy tracking number
  const handleCopyTracking = () => {
    if (trackingInfo?.trackingNumber) {
      navigator.clipboard.writeText(trackingInfo.trackingNumber)
      setCopiedTracking(true)
      setTimeout(() => setCopiedTracking(false), 2000)
    }
  }

  // Show notification effect
  useEffect(() => {
    if (statusNotification) {
      const timer = setTimeout(() => setStatusNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [statusNotification])

  // Announce status changes
  useEffect(() => {
    if (previousStatus.current && previousStatus.current !== status) {
      const stageLabel =
        ORDER_STAGES.find((stage) => stage.key === status)?.label ??
        status.replace(/_/g, ' ')
      setStatusNotification(`Order status updated: ${stageLabel}`)
    }
    previousStatus.current = status
  }, [status])

  // Check if stage is completed
  const isStageCompleted = (stageIndex: number) => {
    if (isTerminal) return false
    return stageIndex < currentStageIndex
  }

  // Check if stage is current
  const isStageCurrent = (stageIndex: number) => {
    if (isTerminal) return false
    return stageIndex === currentStageIndex
  }

  // Get stage date (mock - in real app would come from order events)
  const getStageDate = (stageIndex: number) => {
    const stageKey = visibleStages[stageIndex]?.key as OrderStageKey | undefined
    if (stageKey && stageTimestamps?.[stageKey]) {
      return new Date(stageTimestamps[stageKey])
    }
    if (stageIndex === 0) return new Date(createdAt)
    if (stageIndex <= currentStageIndex && updatedAt) {
      return new Date(updatedAt)
    }
    return null
  }

  return (
    <div className="space-y-6 transition-colors">
      {/* Status Notification */}
      {statusNotification && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300 transition-colors">
          <AlertCircle size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{statusNotification}</p>
          </div>
          {trackingInfo?.trackingUrl && (
            <a
              href={trackingInfo.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
            >
              Track Package <ExternalLink size={14} />
            </a>
          )}
          <button
            onClick={() => setStatusNotification(null)}
            className="text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
            aria-label="Dismiss notification"
          >
            <XCircle size={18} />
          </button>
        </div>
      )}

      {/* Cancelled/Returned Status */}
      {isTerminal && (
        <div
          className={`rounded-xl p-6 flex items-center gap-4 transition-colors ${
            isCancelled
              ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20'
              : 'bg-orange-50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/20'
          }`}
        >
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isCancelled ? 'bg-red-100 dark:bg-red-900/30' : 'bg-orange-100 dark:bg-orange-950/30'
            }`}
          >
            {isCancelled ? (
              <XCircle className="text-red-600 dark:text-red-500" size={28} />
            ) : (
              <RotateCcw className="text-orange-600 dark:text-orange-500" size={28} />
            )}
          </div>
          <div>
            <h3
              className={`text-lg font-bold transition-colors ${
                isCancelled ? 'text-red-800 dark:text-red-400' : 'text-orange-800 dark:text-orange-400'
              }`}
            >
              Order {isCancelled ? 'Cancelled' : 'Returned'}
            </h3>
            <p
              className={`text-sm transition-colors ${
                isCancelled ? 'text-red-600 dark:text-red-300' : 'text-orange-600 dark:text-orange-300'
              }`}
            >
              {isCancelled
                ? 'This order has been cancelled. Contact support for more information.'
                : 'This order has been returned. Refund will be processed shortly.'}
            </p>
            {updatedAt && (
              <p
                className={`text-xs mt-1 transition-colors ${
                  isCancelled ? 'text-red-500 dark:text-red-500' : 'text-orange-500 dark:text-orange-500'
                }`}
              >
                {format(new Date(updatedAt), 'MMM d, yyyy at h:mm a')}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {!isTerminal && (
        <>
          {/* Desktop Horizontal Timeline */}
          <div className="hidden md:block">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 dark:bg-slate-800 rounded-full transition-colors">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(currentStageIndex / (visibleStages.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Stages */}
              <div className="relative flex justify-between">
                {visibleStages.map((stage, index) => {
                  const completed = isStageCompleted(index)
                  const current = isStageCurrent(index)
                  const stageDate = getStageDate(index)
                  const StageIcon = stage.icon

                  return (
                    <div
                      key={stage.key}
                      className="flex flex-col items-center text-center"
                      style={{ width: `${100 / visibleStages.length}%` }}
                    >
                      {/* Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : current
                            ? 'bg-orange-500 border-orange-500 text-white animate-pulse'
                            : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle size={20} />
                        ) : (
                          <StageIcon size={18} />
                        )}
                      </div>

                      {/* Label */}
                      <h4
                        className={`mt-3 text-sm font-medium transition-colors ${
                          completed || current ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {stage.label}
                      </h4>

                      {/* Date */}
                      {stageDate && (completed || current) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                          {format(stageDate, 'MMM d, h:mm a')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Mobile Vertical Timeline */}
          <div className="md:hidden">
            <div className="relative pl-8">
              {/* Vertical Line */}
              <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-slate-800 transition-colors">
                <div
                  className="w-full bg-green-500 transition-all duration-500"
                  style={{
                    height: `${(currentStageIndex / (visibleStages.length - 1)) * 100}%`,
                  }}
                />
              </div>

              {/* Stages */}
              <div className="space-y-6">
                {visibleStages.map((stage, index) => {
                  const completed = isStageCompleted(index)
                  const current = isStageCurrent(index)
                  const stageDate = getStageDate(index)
                  const StageIcon = stage.icon

                  return (
                    <div key={stage.key} className="relative flex gap-4">
                      {/* Icon */}
                      <div
                        className={`absolute -left-8 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                          completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : current
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 text-gray-400 dark:text-gray-600'
                        }`}
                      >
                        {completed ? (
                          <CheckCircle size={16} />
                        ) : (
                          <StageIcon size={14} />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <h4
                            className={`font-medium transition-colors ${
                              completed || current ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-600'
                            }`}
                          >
                            {stage.label}
                          </h4>
                          {stageDate && (completed || current) && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 transition-colors">
                              {format(stageDate, 'MMM d, h:mm a')}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-sm transition-colors ${
                            completed || current ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'
                          }`}
                        >
                          {stage.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tracking Details */}
      {showTrackingDetails && trackingInfo && status === 'shipped' && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-xl p-5 space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 transition-colors">
              <Truck size={18} />
              Shipment Details
            </h4>
            {trackingInfo.trackingUrl && (
              <a
                href={trackingInfo.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 transition-colors"
              >
                Track on courier website
                <ExternalLink size={14} />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trackingInfo.courierName && (
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500 uppercase font-semibold transition-colors">Courier</p>
                <p className="font-medium text-blue-900 dark:text-blue-200 transition-colors">{trackingInfo.courierName}</p>
              </div>
            )}

            {trackingInfo.trackingNumber && (
              <div>
                <p className="text-xs text-blue-600 dark:text-blue-500 uppercase font-semibold transition-colors">Tracking Number</p>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-medium text-blue-900 dark:text-blue-200 transition-colors">
                    {trackingInfo.trackingNumber}
                  </p>
                  <button
                    onClick={handleCopyTracking}
                    className="p-1 text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    title="Copy tracking number"
                    aria-live="polite"
                  >
                    {copiedTracking ? (
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {trackingInfo.expectedDelivery && (
              <div className="sm:col-span-2">
                <p className="text-xs text-blue-600 dark:text-blue-500 uppercase font-semibold transition-colors">Expected Delivery</p>
                <p className="font-medium text-blue-900 dark:text-blue-200 transition-colors">
                  {format(new Date(trackingInfo.expectedDelivery), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Last Updated & Refresh */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-800 transition-colors">
        <span>
          Last updated: {format(lastUpdated, 'MMM d, h:mm a')}
        </span>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>
    </div>
  )
}

// Compact version for order cards
export function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    placed: { label: 'Placed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    confirmed: { label: 'Confirmed', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    processing: { label: 'Processing', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    shipped: { label: 'Shipped', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    delivered: { label: 'Delivered', color: 'text-green-700', bgColor: 'bg-green-100' },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100' },
    returned: { label: 'Returned', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  }

  const config = statusConfig[status]

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.color}`}>
      {config.label}
    </span>
  )
}

// Mini progress indicator
export function OrderProgressIndicator({ status }: { status: string }) {
  const isCancelled = status === 'cancelled'
  const isReturned = status === 'returned'

  if (isCancelled || isReturned) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {isCancelled ? (
          <XCircle size={16} className="text-red-500" />
        ) : (
          <RotateCcw size={16} className="text-orange-500" />
        )}
        <span className={isCancelled ? 'text-red-600' : 'text-orange-600'}>
          {isCancelled ? 'Cancelled' : 'Returned'}
        </span>
      </div>
    )
  }

  const currentIndex = STATUS_TO_INDEX[status] ?? 0
  const totalSteps = 5 // Excluding out_for_delivery for simplicity
  const progress = ((currentIndex + 1) / totalSteps) * 100

  return (
    <div className="flex items-center gap-3 transition-colors">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap transition-colors">
        {currentIndex + 1}/{totalSteps}
      </span>
    </div>
  )
}
