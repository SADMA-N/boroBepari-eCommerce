import { Link, useLocation } from '@tanstack/react-router'
import { Check, ChevronRight } from 'lucide-react'

interface CheckoutLayoutProps {
  children: React.ReactNode
  currentStep: 'address' | 'payment' | 'review'
}

const steps = [
  { id: 'address', label: 'Address', path: '/checkout' },
  { id: 'payment', label: 'Payment', path: '/checkout/payment' },
  { id: 'review', label: 'Review', path: '/checkout/review' },
] as const

export function CheckoutLayout({ children, currentStep }: CheckoutLayoutProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Checkout Header */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-orange-600">
            BoroBepari
          </Link>
          <div className="flex items-center text-sm text-gray-600">
            Secure Checkout
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const isCompleted = index < currentStepIndex
              const isCurrent = index === currentStepIndex

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                        ${isCompleted ? 'bg-green-600 text-white' : ''}
                        ${isCurrent ? 'bg-orange-600 text-white' : ''}
                        ${!isCompleted && !isCurrent ? 'bg-gray-200 text-gray-500' : ''}
                      `}
                    >
                      {isCompleted ? <Check size={16} /> : index + 1}
                    </div>
                    <span
                      className={`
                        absolute -bottom-6 text-xs font-medium whitespace-nowrap
                        ${isCurrent ? 'text-gray-900' : 'text-gray-500'}
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                        w-16 sm:w-32 h-1 mx-2 rounded-full
                        ${index < currentStepIndex ? 'bg-green-600' : 'bg-gray-200'}
                      `}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
