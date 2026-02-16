import {
  createFileRoute,
  redirect,
  useRouter,
  useSearch,
} from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react'
import { z } from 'zod'
import { api } from '@/api/client'

const setPasswordSearchSchema = z.object({
  token: z.string().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
})

export const Route = createFileRoute('/auth/set-password')({
  component: SetPasswordPage,
  validateSearch: (search) => setPasswordSearchSchema.parse(search),
  beforeLoad: async ({ search }) => {
    // If it's a seller verification token, always allow it
    if (search.type === 'seller' && search.token) return

    try {
      const status = await api.auth.buyer.passwordStatus()
      // If user doesn't need a password (already has one or not logged in), redirect to home
      if (!status.needsPassword) {
        throw redirect({ to: '/' })
      }
    } catch (err) {
      // Re-throw redirect errors
      if ((err as any).status === 307 || (err as any).status === 302) throw err
      // Default fallback
      return
    }
  },
})

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`rounded-full p-0.5 transition-colors ${isValid ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500'}`}
      >
        {isValid ? <Check size={10} /> : <X size={10} />}
      </div>
      <span
        className={`text-[12px] transition-colors ${isValid ? 'text-green-700 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
      >
        {text}
      </span>
    </div>
  )
}

function SetPasswordPage() {
  const router = useRouter()
  const search = useSearch({ from: '/auth/set-password' })
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')

  // Validation states
  const [validations, setValidations] = useState({
    length: false,
    hasLetter: false,
    hasNumber: false,
  })

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    })
  }, [password])

  const isValid =
    validations.length && validations.hasLetter && validations.hasNumber

  const isReset = search.type === 'seller' && (search as any).mode === 'reset'

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!isValid) return
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError('')

    try {
      if (search.type === 'seller' && search.token && search.email) {
        const result = await api.auth.seller.setPassword({
          email: search.email,
          token: search.token,
          password,
        })

        // On success, set the seller token and redirect to dashboard
        if (typeof window !== 'undefined') {
          if (isReset) {
            // If it's a reset, we don't necessarily want to log them in automatically
            // but the prompt says "Update the user's password... Show a success message and redirect the user to the Login page."
            localStorage.removeItem('seller_token') // Clear old token if any
            window.location.href = '/seller/login?reset=success'
          } else {
            localStorage.setItem('seller_token', result.token)
            window.location.href = '/seller/dashboard'
          }
        }
      } else {
        await api.auth.buyer.setPassword({ password })
        router.navigate({ to: '/' })
      }
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let newPassword = ''
    // Ensure at least one letter and one number
    newPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    newPassword += '0123456789'[Math.floor(Math.random() * 10)]
    for (let i = 0; i < 10; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)]
    }
    // Shuffle
    newPassword = newPassword
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('')

    setPassword(newPassword)
    setShowPassword(true)
    setGeneratedMessage(
      'Strong password generated! You can edit it or save it.',
    )
    setTimeout(() => setGeneratedMessage(''), 5000)
  }

  const isSeller = search.type === 'seller'

  const handleSkip = () => {
    // Set a cookie to remember skip choice for 24 hours
    document.cookie =
      'skippedPasswordSetup=true; path=/; max-age=' + 24 * 60 * 60
    if (isSeller) {
      router.navigate({ to: '/seller/dashboard' })
    } else {
      router.navigate({ to: '/' })
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
          {/* Header Card */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white text-center">
            <div className="inline-flex p-3 bg-white/20 dark:bg-white/20 rounded-full mb-4">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-2xl font-bold">
              {isReset ? 'Reset Your Password' : 'Create a Strong Password'}
            </h2>
            <p className="text-orange-50 mt-2 text-sm opacity-90 leading-relaxed">
              {isSeller
                ? isReset
                  ? 'Enter a new secure password for your seller account.'
                  : 'Complete your seller registration by setting a secure password for your account.'
                : "Since you signed up with Google, let's add a password so you can also login with your email directly."}
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <input
                  type="text"
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-2 border-gray-100 dark:border-slate-800 rounded-xl text-gray-500 dark:text-gray-400 font-medium transition-colors"
                  value={search.email || ''}
                />
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                    New Password
                  </label>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-bold flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw size={12} />
                    Auto-generate
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium"
                    placeholder="Enter your new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {generatedMessage && (
                  <p className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                    {generatedMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3.5 bg-gray-50 dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white font-medium"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Validation Checklist */}
              <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-5 space-y-3 border border-gray-100 dark:border-slate-800 transition-colors">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  Requirements
                </p>

                <div className="flex flex-col gap-2">
                  <ValidationItem
                    isValid={validations.length}
                    text="At least 8 characters long"
                  />
                  <ValidationItem
                    isValid={validations.hasLetter}
                    text="Contains letters (A-Z)"
                  />
                  <ValidationItem
                    isValid={validations.hasNumber}
                    text="Contains numbers (0-9)"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-xl text-center font-semibold transition-colors">
                  {error}
                </div>
              )}

              <div className="space-y-4 pt-2">
                <button
                  type="submit"
                  disabled={!isValid || loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <RefreshCw className="animate-spin" size={20} />
                  ) : (
                    <>
                      Save and Continue
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>

                {!isSeller && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-semibold transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
