import { createFileRoute, Link } from '@tanstack/react-router'
import { Bell, CheckCircle, Archive, RotateCcw, Filter, Settings, ArrowLeft } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/buyer/notifications')({
  component: NotificationsPage,
})

type FilterType = 'all' | 'unread' | 'order' | 'rfq' | 'system' | 'archived'

function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    preferences,
    markAsRead,
    toggleRead,
    archiveNotification,
    restoreNotification,
    updatePreferences,
  } = useNotifications()
  const { user } = useAuth()
  const [filter, setFilter] = useState<FilterType>('all')
  const [orderFilter, setOrderFilter] = useState('')
  const [stockAlerts, setStockAlerts] = useState<any[]>([])
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const fetchAlerts = async () => {
      setIsLoadingAlerts(true)
      try {
        const response = await fetch(`/api/stock-alerts?userId=${user.id}`)
        const data = await response.json().catch(() => ({}))
        setStockAlerts(data?.alerts ?? [])
      } catch (error) {
        console.error('Failed to fetch stock alerts', error)
      } finally {
        setIsLoadingAlerts(false)
      }
    }
    fetchAlerts()
  }, [user?.id])

  const handleUnsubscribeAlert = async (alertId: number) => {
    try {
      await fetch('/api/stock-alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId }),
      })
      setStockAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
    } catch (error) {
      console.error('Failed to unsubscribe stock alert', error)
    }
  }

  const filteredNotifications = useMemo(() => {
    const orderIdFilter = orderFilter.trim()
    const byOrder = (items: typeof notifications) => {
      if (!orderIdFilter) return items
      return items.filter((n) =>
        n.orderId ? n.orderId.toString().includes(orderIdFilter) : false,
      )
    }

    switch (filter) {
      case 'unread':
        return byOrder(notifications.filter((n) => !n.isRead && !n.archived))
      case 'order':
      case 'rfq':
      case 'system':
        return byOrder(notifications.filter((n) => n.category === filter && !n.archived))
      case 'archived':
        return byOrder(notifications.filter((n) => n.archived))
      default:
        return byOrder(notifications.filter((n) => !n.archived))
    }
  }, [filter, notifications, orderFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/buyer/orders" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border p-4 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter size={16} />
                Filter
              </div>
              {(['all', 'unread', 'order', 'rfq', 'system', 'archived'] as FilterType[]).map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filter === item
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item === 'all'
                    ? 'All'
                    : item === 'rfq'
                    ? 'RFQ'
                    : item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
              <input
                value={orderFilter}
                onChange={(event) => setOrderFilter(event.target.value)}
                placeholder="Filter by order #"
                className="ml-auto text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="bg-white rounded-xl border p-10 text-center text-gray-500">
                <Bell size={36} className="mx-auto text-gray-300 mb-3" />
                <p>No notifications to show.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {filteredNotifications.map((notif) => (
                  <div key={notif.id} className="p-4 flex gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      notif.type === 'success'
                        ? 'bg-green-100 text-green-600'
                        : notif.type === 'warning'
                        ? 'bg-yellow-100 text-yellow-600'
                        : notif.type === 'error'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <Bell size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${notif.isRead ? 'font-medium text-gray-800' : 'font-bold text-gray-900'}`}>
                            {notif.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          {!notif.isRead && (
                            <button
                              onClick={() => markAsRead(notif.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              Mark read
                            </button>
                          )}
                          <button
                            onClick={() => toggleRead(notif.id)}
                            className="text-xs text-gray-400 hover:text-gray-600"
                          >
                            {notif.isRead ? 'Mark unread' : 'Mark read'}
                          </button>
                          {notif.archived ? (
                            <button
                              onClick={() => restoreNotification(notif.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                              <RotateCcw size={12} />
                              Restore
                            </button>
                          ) : (
                            <button
                              onClick={() => archiveNotification(notif.id)}
                              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                              <Archive size={12} />
                              Archive
                            </button>
                          )}
                        </div>
                      </div>
                      {notif.link && (
                        <Link to={notif.link} className="text-xs text-orange-600 hover:underline mt-2 inline-block">
                          View details
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
                <Settings size={16} />
                Notification Preferences
              </div>
              <div className="space-y-3 text-sm">
                <ToggleRow
                  label="Order placed"
                  value={preferences.orderPlaced}
                  onToggle={(value) => updatePreferences({ orderPlaced: value })}
                />
                <ToggleRow
                  label="Order confirmed"
                  value={preferences.orderConfirmed}
                  onToggle={(value) => updatePreferences({ orderConfirmed: value })}
                />
                <ToggleRow
                  label="Order shipped"
                  value={preferences.orderShipped}
                  onToggle={(value) => updatePreferences({ orderShipped: value })}
                />
                <ToggleRow
                  label="Out for delivery"
                  value={preferences.orderOutForDelivery}
                  onToggle={(value) => updatePreferences({ orderOutForDelivery: value })}
                />
                <ToggleRow
                  label="Delivered"
                  value={preferences.orderDelivered}
                  onToggle={(value) => updatePreferences({ orderDelivered: value })}
                />
                <ToggleRow
                  label="Order cancelled"
                  value={preferences.orderCancelled}
                  onToggle={(value) => updatePreferences({ orderCancelled: value })}
                />
                <ToggleRow
                  label="Refund processed"
                  value={preferences.refundProcessed}
                  onToggle={(value) => updatePreferences({ refundProcessed: value })}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Channels</h3>
              <div className="space-y-3 text-sm">
                <ToggleRow
                  label="In-app"
                  value={preferences.channels.inApp}
                  onToggle={(value) => updatePreferences({ channels: { ...preferences.channels, inApp: value } })}
                />
                <ToggleRow
                  label="Email"
                  value={preferences.channels.email}
                  onToggle={(value) => updatePreferences({ channels: { ...preferences.channels, email: value } })}
                />
                <ToggleRow
                  label="SMS"
                  value={preferences.channels.sms}
                  onToggle={(value) => updatePreferences({ channels: { ...preferences.channels, sms: value } })}
                />
                <ToggleRow
                  label="Push"
                  value={preferences.channels.push}
                  onToggle={(value) => updatePreferences({ channels: { ...preferences.channels, push: value } })}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Frequency</h3>
              <div className="flex gap-2">
                {(['immediate', 'daily'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => updatePreferences({ frequency: value })}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${
                      preferences.frequency === value
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value === 'immediate' ? 'Immediate' : 'Daily Digest'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Stock Alerts</h3>
              {isLoadingAlerts ? (
                <p className="text-sm text-gray-500">Loading alerts...</p>
              ) : stockAlerts.length === 0 ? (
                <p className="text-sm text-gray-500">No stock alerts set.</p>
              ) : (
                <div className="space-y-3">
                  {stockAlerts.map((alert) => (
                    <div key={alert.id} className="border border-gray-100 rounded-lg p-3 text-sm">
                      <p className="font-medium text-gray-900">
                        {alert.product?.name ?? 'Product'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Expires {alert.expiresAt ? new Date(alert.expiresAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {alert.product?.slug && (
                          <Link to={`/products/${alert.product.slug}`} className="text-xs text-orange-600 hover:underline">
                            View product
                          </Link>
                        )}
                        <button
                          onClick={() => handleUnsubscribeAlert(alert.id)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >
                          Unsubscribe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToggleRow({ label, value, onToggle }: { label: string; value: boolean; onToggle: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onToggle(!value)}
      className="w-full flex items-center justify-between text-sm text-gray-700"
    >
      <span>{label}</span>
      <span className={`w-10 h-5 rounded-full flex items-center px-1 transition-colors ${value ? 'bg-green-500' : 'bg-gray-200'}`}>
        <span className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${value ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  )
}
