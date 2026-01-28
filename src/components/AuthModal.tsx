import { X, CheckCircle, LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  redirectPath?: string
}

export default function AuthModal({ isOpen, onClose, redirectPath }: AuthModalProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')

  if (!isOpen) return null

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(email || 'user@example.com')
    onClose()
    if (redirectPath) {
      window.location.href = redirectPath
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden relative animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Sign in to BoroBepari
            </h2>
            <p className="text-gray-500">
              Unlock the full potential of your wholesale business
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-orange-800 mb-2">Why create an account?</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <span>Save products to your wishlist for later</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <span>Track your orders and view purchase history</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                <span>Get personalized wholesale recommendations</span>
              </li>
            </ul>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 mb-4">Don't have an account?</p>
            <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              <UserPlus size={20} />
              Create Free Account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
