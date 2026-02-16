import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'

type Toast = {
  id: string
  message: string
  tone?: 'success' | 'error' | 'info'
}

type ToastContextValue = {
  pushToast: (message: string, tone?: Toast['tone']) => void
}

/** Toast context for lightweight seller portal notifications. */
const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/**
 * Provides a toast queue for seller pages.
 */
export function SellerToastProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [toasts, setToasts] = useState<Array<Toast>>([])

  const pushToast = useCallback(
    (message: string, tone: Toast['tone'] = 'info') => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, tone }])
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id))
      }, 3000)
    },
    [],
  )

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl px-4 py-3 text-sm shadow-lg border ${
              toast.tone === 'success'
                ? 'bg-green-600 text-white border-green-700 dark:bg-green-500 dark:border-green-400'
                : toast.tone === 'error'
                  ? 'bg-red-600 text-white border-red-700 dark:bg-red-500 dark:border-red-400'
                  : 'bg-slate-900 text-white border-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:border-slate-300'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useSellerToast() {
  const context = useContext(ToastContext)
  if (!context)
    throw new Error('useSellerToast must be used within SellerToastProvider')
  return context
}
