import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, KeyRound, Loader2, Mail, Sparkles } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { verifyResetCode } from '@/lib/auth-server'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
    // We intentionally ignore the error result to prevent user enumeration
    // The generic message will always be shown
    // @ts-ignore -- intentionally ignoring unused return value to prevent enumeration
    await authClient.requestPasswordReset({
      email,
      redirectTo: '/reset-password',
    })
        setStep('otp')
    } catch (err: any) {
        // Better auth might not throw on generic errors to prevent enumeration,
        // but if it does, handle it.
        // For safety, we generally move to next step even if email not found (fake success)
        // But here we rely on the server actually sending a code.
        setStep('otp')
    } finally {
        setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
        const result = await verifyResetCode({ data: { email, code: otp } })
        
        if (result.token) {
            router.navigate({ 
                to: '/reset-password',
                search: { token: result.token, email }
            })
        }
    } catch (err: any) {
        setError(err.message || 'Invalid verification code')
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'email' ? 'Forgot Password?' : 'Check your email'}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {step === 'email' 
                ? "No worries, we'll send you a verification code." 
                : `We've sent a 6-digit code to ${email}`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                Email Address
                </label>
                <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail size={18} />
                </div>
                <input
                    type="email"
                    id="email"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 active:scale-[0.98]"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Code'}
            </button>
            </form>
        ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                    <label htmlFor="otp" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">
                        Verification Code
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <KeyRound size={18} />
                        </div>
                        <input
                            type="text"
                            id="otp"
                            required
                            maxLength={6}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-sm tracking-widest"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 active:scale-[0.98]"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Code'}
                </button>
                
                <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="w-full text-xs text-orange-600 font-bold hover:underline"
                >
                    Resend Code / Change Email
                </button>
            </form>
        )}

        <div className="mt-6">
            <button
                type="button"
                onClick={() => router.navigate({ to: '/login' })}
                className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 font-bold hover:text-orange-600 transition-colors"
            >
                <ArrowLeft size={16} />
                Back to Login
            </button>
        </div>
      </div>
    </div>
  )
}
