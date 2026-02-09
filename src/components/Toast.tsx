import * as React from 'react'
import { CheckCircle, X } from 'lucide-react'

export interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({
  message,
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-24 right-4 z-50 animate-in slide-in-from-right fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 shadow-lg rounded-lg p-4 flex items-center gap-3 min-w-[300px]">
        <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
          <CheckCircle size={20} className="text-green-600 dark:text-green-400" />
        </div>
        <p className="flex-1 text-gray-800 dark:text-gray-100 font-medium">{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
