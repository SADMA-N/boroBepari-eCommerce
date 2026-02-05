import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim() || !otp.trim()) {
      setError('Please enter your email, password, and 2FA code.')
      return
    }

    setIsSubmitting(true)
    try {
      await login({ email: email.trim(), password, otp })
      navigate({ to: '/admin/dashboard' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 dark:bg-slate-950 flex items-center justify-center px-4 transition-colors">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-600 mb-4 shadow-lg shadow-orange-600/20">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">BoroBepari Admin</h1>
          <p className="mt-2 text-slate-400">Sign in to access the admin console</p>
        </div>

        <div className="bg-slate-800 dark:bg-slate-900 border border-slate-700 dark:border-slate-800 rounded-2xl p-8 shadow-xl transition-colors">
          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-600 dark:border-slate-700 bg-slate-700 dark:bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                placeholder="admin@borobepari.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 dark:border-slate-700 bg-slate-700 dark:bg-slate-800 px-4 py-3 pr-12 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                2FA Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-lg border border-slate-600 dark:border-slate-700 bg-slate-700 dark:bg-slate-800 px-4 py-3 text-white placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all"
                placeholder="Enter 6-digit code"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-600/20"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <Lock size={14} />
            <span>Admin access only. Contact IT for credentials.</span>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
            Back to BoroBepari
          </Link>
        </div>
      </div>
    </div>
  )
}
