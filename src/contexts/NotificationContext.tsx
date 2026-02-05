import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { subMinutes } from 'date-fns'
import { useAuth } from './AuthContext'
import Toast from '@/components/Toast'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  archived?: boolean
  createdAt: Date
  link?: string
  orderId?: number
  category?: 'order' | 'rfq' | 'system'
  status?: string
}

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push'

export interface NotificationPreferences {
  orderPlaced: boolean
  orderConfirmed: boolean
  orderShipped: boolean
  orderOutForDelivery: boolean
  orderDelivered: boolean
  orderCancelled: boolean
  refundProcessed: boolean
  channels: {
    email: boolean
    sms: boolean
    push: boolean
    inApp: boolean
  }
  frequency: 'immediate' | 'daily'
}

interface NotificationContextType {
  notifications: Array<Notification>
  unreadCount: number
  orderUnreadCount: number
  preferences: NotificationPreferences
  markAsRead: (id: string) => void
  toggleRead: (id: string) => void
  markAllAsRead: () => void
  archiveNotification: (id: string) => void
  restoreNotification: (id: string) => void
  addNotification: (
    notification: Omit<Notification, 'createdAt' | 'isRead'> & { id?: string },
  ) => void
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
)

const STORAGE_KEY = 'bb_notifications'
const PREFS_STORAGE_KEY = 'bb_notification_prefs'
const QUEUE_STORAGE_KEY = 'bb_notification_queue'

// Initial mock notifications
const initialNotifications: Array<Notification> = [
  {
    id: '1',
    title: 'New Quote Received',
    message: 'Dhaka Textiles Ltd sent a quote for "Cotton Fabric Roll"',
    type: 'info',
    isRead: false,
    createdAt: subMinutes(new Date(), 15),
    link: '/buyer/rfqs/1',
    category: 'rfq',
  },
  {
    id: '2',
    title: 'RFQ Expiring Soon',
    message: 'Your RFQ #1025 expires in 24 hours.',
    type: 'warning',
    isRead: false,
    createdAt: subMinutes(new Date(), 120),
    link: '/buyer/rfqs/2',
    category: 'rfq',
  },
]

const defaultPreferences: NotificationPreferences = {
  orderPlaced: true,
  orderConfirmed: true,
  orderShipped: true,
  orderOutForDelivery: true,
  orderDelivered: true,
  orderCancelled: true,
  refundProcessed: true,
  channels: {
    email: true,
    sms: true,
    push: false,
    inApp: true,
  },
  frequency: 'immediate',
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [notifications, setNotifications] = useState<Array<Notification>>(
    () => {
      try {
        if (typeof window === 'undefined') return initialNotifications
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored) as Array<
            Notification & { createdAt: string }
          >
          return parsed.map((n) => ({ ...n, createdAt: new Date(n.createdAt) }))
        }
      } catch (error) {
        console.error('Failed to load notifications', error)
      }
      return initialNotifications
    },
  )
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    () => {
      try {
        if (typeof window === 'undefined') return defaultPreferences
        const stored = localStorage.getItem(PREFS_STORAGE_KEY)
        if (stored) {
          return { ...defaultPreferences, ...JSON.parse(stored) }
        }
      } catch (error) {
        console.error('Failed to load notification preferences', error)
      }
      return defaultPreferences
    },
  )
  const { isAuthenticated, user } = useAuth()
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false,
  })

  const unreadCount = notifications.filter(
    (n) => !n.isRead && !n.archived,
  ).length
  const orderUnreadCount = useMemo(
    () =>
      notifications.filter(
        (n) => !n.isRead && !n.archived && n.category === 'order',
      ).length,
    [notifications],
  )

  // Persist notifications
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          notifications.map((n) => ({
            ...n,
            createdAt: n.createdAt.toISOString(),
          })),
        ),
      )
    } catch (error) {
      console.error('Failed to persist notifications', error)
    }
  }, [notifications])

  // Persist preferences
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error('Failed to persist notification preferences', error)
    }
  }, [preferences])

  // Poll for new notifications (queue + mock)
  useEffect(() => {
    if (!isAuthenticated) return
    if (typeof window === 'undefined') return

    const interval = setInterval(() => {
      flushNotificationQueue()
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleStorage = (event: StorageEvent) => {
      if (event.key === QUEUE_STORAGE_KEY) {
        flushNotificationQueue()
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const flushNotificationQueue = () => {
    try {
      if (typeof window === 'undefined') return
      const queued = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (!queued) return
      const parsed = JSON.parse(queued) as Array<
        Notification & { createdAt?: string }
      >
      if (!parsed.length) return
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id))
        const merged = parsed
          .filter((n) => !existingIds.has(n.id))
          .map((n) => ({
            ...n,
            createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
            isRead: n.isRead,
          }))
        return [...merged, ...prev]
      })
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify([]))
    } catch (error) {
      console.error('Failed to flush notification queue', error)
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    )
  }

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: !n.isRead } : n)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const archiveNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: true } : n)),
    )
  }

  const restoreNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, archived: false } : n)),
    )
  }

  const addNotification = (
    notif: Omit<Notification, 'createdAt' | 'isRead' | 'id'> & { id?: string },
  ) => {
    if (!preferences.channels.inApp) {
      return
    }
    const newNotif: Notification = {
      ...notif,
      id: notif.id ?? Date.now().toString(),
      isRead: false,
      createdAt: new Date(),
      archived: false,
    }
    setNotifications((prev) => {
      if (prev.some((n) => n.id === newNotif.id)) return prev
      return [newNotif, ...prev]
    })
    setToast({
      message: newNotif.title + ': ' + newNotif.message,
      isVisible: true,
    })
  }

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return
    if (typeof window === 'undefined') return

    const fetchStockAlerts = async () => {
      try {
        const response = await fetch(
          `/api/stock-alerts?userId=${user.id}&includeNotified=1`,
        )
        const data = await response.json().catch(() => ({}))
        const notified = data?.notified ?? []
        if (!Array.isArray(notified) || notified.length === 0) return

        const ids: Array<number> = []
        notified.forEach((alert: any) => {
          ids.push(alert.id)
          const product = alert.product
          addNotification({
            id: `stock-alert-${alert.id}`,
            title: `${product?.name ?? 'Product'} is back in stock`,
            message: 'The product you were waiting for is now available.',
            type: 'success',
            link: product?.slug ? `/products/${product.slug}` : undefined,
            category: 'system',
            orderId: undefined,
            status: 'restocked',
          })
        })

        if (ids.length) {
          await fetch('/api/stock-alerts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'acknowledge', ids }),
          })
        }
      } catch (error) {
        console.error('Failed to fetch stock alerts', error)
      }
    }

    fetchStockAlerts()
  }, [addNotification, isAuthenticated, user?.id])

  const updatePreferences = (prefs: Partial<NotificationPreferences>) => {
    setPreferences((prev) => ({
      ...prev,
      ...prefs,
      channels: {
        ...prev.channels,
        ...(prefs as NotificationPreferences).channels,
      },
    }))
  }

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        orderUnreadCount,
        preferences,
        markAsRead,
        toggleRead,
        markAllAsRead,
        archiveNotification,
        restoreNotification,
        addNotification,
        updatePreferences,
      }}
    >
      {children}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider',
    )
  }
  return context
}
