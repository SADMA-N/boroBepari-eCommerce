import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import { useSellerAuth } from '@/contexts/SellerAuthContext'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const BD_MOBILE_REGEX = /^01\d{9}$/

export function SellerLoginPage() {
  const navigate = useNavigate()
  const { login } = useSellerAuth()
  const { pushToast } = useSellerToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const identifierType = useMemo(() => {
    if (EMAIL_REGEX.test(identifier.trim())) return 'email'
    if (BD_MOBILE_REGEX.test(identifier.trim())) return 'phone'
    return 'unknown'
  }, [identifier])

  const validate = () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email/mobile and password.')
      return false
    }
    if (identifierType === 'unknown') {
      setError('Enter a valid email or BD mobile number (01XXXXXXXXX).')
      return false
    }
    return true
  }

  const mapErrorMessage = (message: string) => {
    const normalized = message.toLowerCase()
    if (normalized.includes('failed query') || normalized.includes('sellers')) {
      return 'You are not registered as a seller. Please register to continue.'
    }
    if (normalized.includes('suspended')) return 'Account suspended'
    if (normalized.includes('not verified')) return 'Account not verified'
    if (normalized.includes('invalid')) return 'Invalid credentials'
    return message
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      const seller = await login({ identifier: identifier.trim(), password })

      if (!rememberMe) {
        // Placeholder for future session-only behavior.
      }

      if (seller.kycStatus === 'approved') {
        navigate({ to: '/seller/dashboard' })
        return
      }

      if (seller.kycStatus === 'rejected') {
        navigate({ to: '/seller/kyc', search: { reason: 'rejected' } })
        return
      }

      navigate({ to: '/seller/kyc' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials'
      const friendly = mapErrorMessage(message)
      setError(friendly)
      pushToast(friendly, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="grid lg:grid-cols-[2fr_3fr] min-h-screen">
        <div className="flex items-center justify-center px-6 py-12 lg:py-0">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <Link to="/" className="text-2xl font-bold text-orange-600">
                BoroBepari
              </Link>
              <p className="mt-2 text-sm text-slate-500">
                Seller Central Login
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
              <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-500">
                Sign in to manage your store and orders.
              </p>

              {error && (
                <div className="mt-6 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email or mobile
                  </label>
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                    placeholder="you@business.com or 01XXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    Remember me
                  </label>
                  <Link to="/seller/forgot-password" className="text-orange-600 hover:text-orange-700">
                    Forgot Password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-orange-600 text-white py-3 text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-wide text-slate-400">
                  Or sign in with
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Google
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-slate-500">
                Don&apos;t have a seller account?{' '}
                <Link to="/seller/register" className="font-semibold text-orange-600 hover:text-orange-700">
                  Register Now
                </Link>
              </div>
              <div className="mt-2 text-center text-sm">
                <Link to="/" className="text-slate-500 hover:text-slate-700">
                  Continue as Buyer
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-slate-50 px-10 py-16">
          <div className="max-w-xl w-full space-y-8">
            <div className="rounded-3xl border border-orange-100 bg-white/80 p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-orange-500">Seller Success</p>
                  <h2 className="mt-2 text-3xl font-bold text-slate-900">
                    Grow your wholesale business with confidence.
                  </h2>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Sparkles size={22} />
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <StatCard value="10,000+" label="Active Sellers" />
                <StatCard value="৳50 Crore+" label="Monthly GMV" />
                <StatCard value="95%" label="On-time Settlement" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <BenefitTile
                icon={ShieldCheck}
                title="Verified buyer network"
                description="Connect with buyers who are ready to order at scale."
              />
              <BenefitTile
                icon={TrendingUp}
                title="Data-driven insights"
                description="Track trends, margins, and repeat orders in one place."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <p className="text-sm text-slate-500 uppercase tracking-wide">Seller spotlight</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">
                “BoroBepari doubled our monthly wholesale revenue within 90 days.”
              </p>
              <p className="mt-2 text-sm text-slate-500">
                — Rahim Textiles, Dhaka
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
      <p className="text-lg font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function BenefitTile({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
        <Icon size={18} />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  )
}
