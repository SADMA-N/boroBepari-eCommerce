import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, KeyRound, Mail, Sparkles } from 'lucide-react'
import {
  requestSellerPasswordReset,
  verifySellerResetCode,
} from '@/lib/seller-auth-server'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

export const Route = createFileRoute('/seller/forgot-password')({
  component: SellerForgotPasswordPage,
})

function SellerForgotPasswordPage() {
  const navigate = useNavigate()
  const { pushToast } = useSellerToast()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<'email' | 'code'>('email')

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)
    try {
      const result = await requestSellerPasswordReset({ data: { email } })
      setStep('code')
      pushToast(result.message, 'success')
    } catch (err) {
      pushToast('An error occurred. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      pushToast('Please enter a 6-digit code.', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await verifySellerResetCode({ data: { email, code } })
      pushToast('Code verified successfully!', 'success')

      // Redirect to set-password page with temporary token
      navigate({
        to: '/auth/set-password',
        search: {
          token: result.token,
          email: email,
          type: 'seller',
          mode: 'reset',
        },
      })
    } catch (err: any) {
      pushToast(err.message || 'Verification failed.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-bold text-orange-600">
            BoroBepari
          </Link>
          <p className="mt-2 text-sm text-slate-500">Seller Central</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
          {step === 'email' ? (
            <>
              <h1 className="text-2xl font-bold text-slate-900">
                Forgot Password?
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Enter your registered email address and we'll send you a 6-digit
                code to reset your password.
              </p>

              <form onSubmit={handleSubmitEmail} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="you@business.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending code...' : 'Send Verification Code'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                <KeyRound className="text-orange-600" size={28} />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                Enter Verification Code
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                A 6-digit code has been sent to{' '}
                <span className="font-semibold">{email}</span>.
              </p>

              <form onSubmit={handleVerifyCode} className="mt-6 space-y-5">
                <div>
                  <div className="flex justify-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, ''))
                      }
                      className="w-full text-center tracking-[1em] font-bold text-2xl rounded-lg border border-slate-200 py-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="000000"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || code.length !== 6}
                  className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <p className="mt-6 text-sm text-slate-500">
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  try again
                </button>
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              to="/seller/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-orange-600"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
