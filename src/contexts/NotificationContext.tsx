import React, { createContext, useContext, useEffect, useState } from 'react'
import { subMinutes } from 'date-fns'
import { useAuth } from './AuthContext'
import Toast from '@/components/Toast'

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: Date
  link?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

// Initial mock notifications
const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Quote Received',
    message: 'Dhaka Textiles Ltd sent a quote for "Cotton Fabric Roll"',
    type: 'info',
    isRead: false,
    createdAt: subMinutes(new Date(), 15),
    link: '/buyer/rfqs/1'
  },
  {
    id: '2',
    title: 'RFQ Expiring Soon',
    message: 'Your RFQ #1025 expires in 24 hours.',
    type: 'warning',
    isRead: false,
    createdAt: subMinutes(new Date(), 120),
    link: '/buyer/rfqs/2'
  }
]

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const { isAuthenticated } = useAuth()
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false })

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Poll for new notifications (mock)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      // Simulate random incoming notification (10% chance every 30s)
      if (Math.random() > 0.9) {
        const newNotif: Notification = {
          id: Date.now().toString(),
          title: 'New Message',
          message: 'You have a new message from a supplier.',
          type: 'info',
          isRead: false,
          createdAt: new Date(),
          link: '/buyer/rfqs'
        }
        setNotifications(prev => [newNotif, ...prev])
        setToast({ message: newNotif.title + ': ' + newNotif.message, isVisible: true })
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const addNotification = (notif: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date()
    }
    setNotifications(prev => [newNotif, ...prev])
    setToast({ message: newNotif.title + ': ' + newNotif.message, isVisible: true })
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      addNotification
    }}>
      {children}
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))} 
      />
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
