import { useEffect, useRef, useState } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import type { Notification } from '@/contexts/NotificationContext';
import { useNotifications } from '@/contexts/NotificationContext'

export default function NotificationBell({
  showLabel = false,
  label = 'Notifications',
  className = '',
}: {
  showLabel?: boolean
  label?: string
  className?: string
}) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, archiveNotification } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    markAsRead(id)
  }

  const handleOpenNotification = (id: string) => {
    markAsRead(id)
    setIsOpen(false)
  }

  return (
    <div
      className={`relative ${showLabel ? 'flex flex-col items-center' : ''} ${className}`}
      ref={dropdownRef}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative text-gray-600 hover:text-orange-500 transition-colors ${
          showLabel ? 'flex flex-col items-center' : 'p-2 rounded-full hover:bg-gray-100'
        }`}
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {showLabel && <span className="text-xs">{label}</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.filter(n => !n.archived).map((notif) => (
                  <NotificationItem 
                    key={notif.id} 
                    notification={notif} 
                    onMarkRead={(e) => handleMarkAsRead(e, notif.id)} 
                    onArchive={() => archiveNotification(notif.id)}
                    onClose={() => setIsOpen(false)}
                    onOpen={() => handleOpenNotification(notif.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
            <Link to="/buyer/notifications" className="text-xs text-gray-500 hover:text-gray-900" onClick={() => setIsOpen(false)}>
              View Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification,
  onMarkRead,
  onArchive,
  onClose,
  onOpen,
}: {
  notification: Notification
  onMarkRead: (e: React.MouseEvent) => void
  onArchive: () => void
  onClose: () => void
  onOpen: () => void
}) {
  const Icon = notification.type === 'success' ? Check : 
               notification.type === 'warning' ? AlertTriangleIcon : 
               Bell

  const bgClass = notification.isRead ? 'bg-white' : 'bg-blue-50/50'

  const Content = (
    <div className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors ${bgClass}`}>
      <div className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        notification.type === 'success' ? 'bg-green-100 text-green-600' :
        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
        'bg-blue-100 text-blue-600'
      }`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
           <p className={`text-sm ${notification.isRead ? 'font-medium text-gray-900' : 'font-bold text-gray-900'}`}>
             {notification.title}
           </p>
          {!notification.isRead && (
             <button onClick={onMarkRead} className="text-blue-500 hover:text-blue-700 p-1" title="Mark as read">
               <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
             </button>
           )}
           <button onClick={onArchive} className="text-gray-300 hover:text-gray-500 p-1" title="Archive">
             <X size={14} />
           </button>
        </div>
        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
        <p className="text-xs text-gray-400 mt-1.5">{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</p>
      </div>
    </div>
  )

  if (notification.link) {
    return (
      <Link
        to={notification.link}
        className="block"
        onClick={() => {
          onOpen()
          onClose()
        }}
      >
        {Content}
      </Link>
    )
  }

  return Content
}

function AlertTriangleIcon({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
    )
}
