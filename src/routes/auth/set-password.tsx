import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ArrowRight, Check, Copy, Eye, EyeOff, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { setUserPassword } from '@/lib/auth-server'

export const Route = createFileRoute('/auth/set-password')({
  component: SetPasswordPage,
})

function ValidationItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full p-0.5 transition-colors ${isValid ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
        {isValid ? <Check size={10} /> : <X size={10} />}
      </div>
      <span className={`text-[12px] transition-colors ${isValid ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
        {text}
      </span>
    </div>
  )
}

function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const isValid = validations.length && validations.hasLetter && validations.hasNumber

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!isValid) return

    setLoading(true)
    setError('')

    try {
      await setUserPassword({ data: { password } })
      router.navigate({ to: '/' })
    } catch (err: any) {
      setError(err.message || 'Failed to set password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let newPassword = ''
    // Ensure at least one letter and one number
    newPassword += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]
    newPassword += '0123456789'[Math.floor(Math.random() * 10)]
    for (let i = 0; i < 10; i++) {
      newPassword += chars[Math.floor(Math.random() * chars.length)]
    }
    // Shuffle
    newPassword = newPassword.split('').sort(() => Math.random() - 0.5).join('')
    
    setPassword(newPassword)
    setShowPassword(true)
    setGeneratedMessage('Strong password generated! You can edit it or save it.')
    setTimeout(() => setGeneratedMessage(''), 5000)
  }

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-8 text-white text-center">
          <div className="inline-flex p-3 bg-white/20 rounded-full mb-4">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-2xl font-bold">Create a Strong Password</h2>
          <p className="text-orange-50 mt-2 text-sm opacity-90 leading-relaxed">
            Since you signed up with Google, let's add a password so you can also login with your email directly.
          </p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-widest">
                  Secure Password
                </label>
                <button 
                  type="button"
                  onClick={generatePassword}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={12} />
                  Auto-generate
                </button>
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  className="w-full px-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 font-medium"
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {generatedMessage && (
                <p className="mt-2 text-xs text-blue-600 font-medium animate-pulse">
                  {generatedMessage}
                </p>
              )}
            </div>

            {/* Validation Checklist */}
            <div className="bg-gray-50 rounded-xl p-5 space-y-3 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Requirements</p>
              
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
              <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl text-center font-semibold">
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
              
              <button
                type="button"
                onClick={() => {
                  document.cookie = "skippedPasswordSetup=true; path=/; max-age=86400" // 24 hours
                  router.navigate({ to: '/' })
                }}
                className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 font-bold transition-colors text-center"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}