import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Loader2, Lock, Phone } from 'lucide-react'
import { z } from 'zod'

export const Route = createFileRoute('/mock-payment/bkash')({
  component: MockBkashPage,
  validateSearch: z.object({
    amount: z.number().optional(),
    orderId: z.string().optional(),
    callbackUrl: z.string().optional(),
  }),
})

function MockBkashPage() {
  const { amount, orderId, callbackUrl } = Route.useSearch()
  const router = useRouter()
  
  const [step, setStep] = useState<'mobile' | 'otp' | 'pin'>('mobile')
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')

  const handleNext = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      if (step === 'mobile') setStep('otp')
      else if (step === 'otp') setStep('pin')
      else handleConfirm()
    }, 1000)
  }

  const handleConfirm = () => {
    // Redirect to callback with success
    if (callbackUrl) {
      const successUrl = new URL(callbackUrl)
      successUrl.searchParams.set('status', 'success')
      successUrl.searchParams.set('transactionId', `TRX-${Math.floor(Math.random() * 1000000)}`)
      if (orderId) successUrl.searchParams.set('orderId', orderId)
      
      window.location.href = successUrl.toString()
    } else {
        alert('Payment Successful (No callback URL provided)')
    }
  }

  const handleCancel = () => {
    if (callbackUrl) {
      const cancelUrl = new URL(callbackUrl)
      cancelUrl.searchParams.set('status', 'cancel')
      if (orderId) cancelUrl.searchParams.set('orderId', orderId)
      window.location.href = cancelUrl.toString()
    }
  }

  return (
    <div className="min-h-screen bg-[#E2136E] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#E2136E] p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded">
               {/* Mock Logo */}
               <span className="font-bold text-lg">bKash</span>
            </div>
            <span className="text-sm opacity-90">Payment Gateway</span>
          </div>
          <div className="text-right">
             <p className="text-xs opacity-80">Merchant: BoroBepari</p>
             <p className="font-bold text-lg">৳{amount?.toLocaleString()}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 relative min-h-[300px]">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#E2136E 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="text-center mb-6">
               <div className="inline-block p-3 bg-pink-50 rounded-full mb-3">
                 <img src="/img/bkash-bird.png" alt="" className="w-12 h-12 object-contain opacity-50" onError={(e) => e.currentTarget.style.display = 'none'} /> 
                 {/* Fallback Icon if image missing */}
                 <Phone className="w-8 h-8 text-[#E2136E]" />
               </div>
               <h3 className="text-gray-800 font-medium">
                 {step === 'mobile' && 'Enter your bKash Account Number'}
                 {step === 'otp' && 'Enter Verification Code'}
                 {step === 'pin' && 'Enter PIN to Confirm'}
               </h3>
            </div>

            {step === 'mobile' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Your bKash Account Number</label>
                <div className="flex border-b-2 border-[#E2136E] pb-1">
                   <span className="text-gray-500 mr-2">+88</span>
                   <input 
                     type="tel" 
                     value={mobile}
                     onChange={(e) => setMobile(e.target.value)}
                     placeholder="01XXXXXXXXX"
                     className="w-full outline-none text-lg text-gray-800 font-medium placeholder-gray-300"
                     autoFocus
                   />
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  By proceeding you agree to the terms and conditions
                </p>
              </div>
            )}

            {step === 'otp' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Verification Code (sent to {mobile})</label>
                <input 
                   type="text" 
                   placeholder="1 2 3 4 5 6"
                   className="w-full text-center text-2xl tracking-[0.5em] border-b-2 border-[#E2136E] pb-2 outline-none font-bold text-gray-800"
                   maxLength={6}
                   autoFocus
                />
                <button className="text-xs text-[#E2136E] mt-3 font-medium hover:underline w-full text-center">
                  Resend Code
                </button>
              </div>
            )}

            {step === 'pin' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Enter PIN</label>
                <div className="flex items-center border-b-2 border-[#E2136E] pb-1">
                   <Lock size={16} className="text-gray-400 mr-2" />
                   <input 
                     type="password" 
                     value={pin}
                     onChange={(e) => setPin(e.target.value)}
                     className="w-full outline-none text-lg text-gray-800 font-bold"
                     maxLength={5}
                     autoFocus
                   />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 p-4 flex gap-3 border-t border-gray-100">
          <button 
            onClick={handleCancel}
            className="flex-1 py-3 text-gray-500 font-bold text-sm hover:bg-gray-200 rounded transition-colors"
          >
            CLOSE
          </button>
          <button 
            onClick={handleNext}
            disabled={loading || (step === 'mobile' && mobile.length < 10) || (step === 'pin' && pin.length < 4)}
            className="flex-1 py-3 bg-[#E2136E] text-white font-bold text-sm rounded shadow-lg hover:shadow-xl hover:bg-pink-700 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : (step === 'pin' ? 'CONFIRM' : 'PROCEED')}
          </button>
        </div>
      </div>
      
      {/* Mock Sandbox Banner */}
      <div className="fixed bottom-4 left-0 right-0 text-center pointer-events-none">
        <span className="bg-black/50 text-white px-4 py-1 rounded-full text-xs backdrop-blur-md">
          Sandbox Mode - Do not use real credentials
        </span>
      </div>
    </div>
  )
}
