import { useEffect, useState } from 'react'
import { CheckCircle, X } from 'lucide-react'

export interface ToastProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, isVisible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
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
      <div className="bg-white border border-green-200 shadow-lg rounded-lg p-4 flex items-center gap-3 min-w-[300px]">
        <div className="bg-green-100 p-1.5 rounded-full">
          <CheckCircle size={20} className="text-green-600" />
        </div>
        <p className="flex-1 text-gray-800 font-medium">{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
