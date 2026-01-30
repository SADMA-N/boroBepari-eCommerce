import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { Eye, EyeOff, Check, X, Sparkles, RefreshCw, Loader2, Lock } from 'lucide-react'

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: search.token as string | undefined,
      email: search.email as string | undefined,
    }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const router = useRouter()
  // @ts-ignore - The email param was added in the link generation
  const { token, email } = Route.useSearch<{ token?: string, email?: string }>()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerationMessage, setShowGenerationMessage] = useState(false)

  // Validation states
  const [valLength, setValLength] = useState(false)
  const [valAlpha, setValAlpha] = useState(false)
  const [valNum, setValNum] = useState(false)
  const [valMatch, setValMatch] = useState(false)

  useEffect(() => {
    setValLength(password.length >= 8)
    setValAlpha(/[a-zA-Z]/.test(password))
    setValNum(/[0-9]/.test(password))
    setValMatch(password === confirmPassword && password !== '')
  }, [password, confirmPassword])

  const isPasswordValid = valLength && valAlpha && valNum && valMatch

  const generateStrongPassword = () => {
    setIsGenerating(true)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
    let retVal = ""
    
    retVal += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
    retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
    retVal += "0123456789"[Math.floor(Math.random() * 10)]
    retVal += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)]
    
    for (let i = 0; i < 8; i++) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    retVal = retVal.split('').sort(() => 0.5 - Math.random()).join('')
    
    setPassword(retVal)
    setConfirmPassword(retVal)
    setShowPassword(true)
    setShowGenerationMessage(true)
    setTimeout(() => setIsGenerating(false), 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError('Invalid or missing reset token.')
      return
    }

    setIsLoading(true)
    setError('')

    const { error: resError } = await authClient.resetPassword({
      newPassword: password,
      token,
    })

    if (resError) {
      setError(resError.message || 'Failed to reset password. The link may have expired.')
      setIsLoading(false)
    } else {
      setIsSuccess(true)
      setIsLoading(false)
      setTimeout(() => {
        router.navigate({ to: '/login' })
      }, 3000)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful</h2>
          <p className="text-gray-600 mb-8 text-sm">
            Your password has been updated. You will be redirected to the login page in a few seconds.
          </p>
          <button
            onClick={() => router.navigate({ to: '/login' })}
            className="w-full py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all"
          >
            Go to Login Now
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Reset Password</h2>
          <p className="text-gray-500 text-sm mt-2">
            Create a new strong password for your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg text-center font-medium animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {email && (
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Email Address
              </label>
              <input
                type="email"
                readOnly
                disabled
                className="appearance-none block w-full px-4 py-3 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl focus:outline-none cursor-not-allowed sm:text-sm font-medium"
                value={decodeURIComponent(email)}
              />
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1 ml-1">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                New Password
              </label>
              <button 
                 type="button" 
                 onClick={generateStrongPassword}
                 className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 uppercase tracking-tight transition-colors"
              >
                 {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                 Skip & Auto-generate
              </button>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm pr-12"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setShowGenerationMessage(false)
                }}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-orange-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {showGenerationMessage && (
              <div className="mt-2 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-2 rounded-lg animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  <span>System generated strong password. Save it or edit it.</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required
              className="appearance-none block w-full px-4 py-3 bg-gray-50 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Validation Checklist */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Requirements</p>
            <div className="flex flex-col gap-2">
              <RequirementItem isValid={valLength} text="At least 8 characters" />
              <RequirementItem isValid={valAlpha} text="Include at least one letter" />
              <RequirementItem isValid={valNum} text="Include at least one number" />
              <RequirementItem isValid={valMatch} text="Passwords must match" />
            </div>
          </div>

          <button
            type="submit"
            disabled={!isPasswordValid || isLoading}
            className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 ${
              isPasswordValid && !isLoading
              ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer' 
              : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

function RequirementItem({ isValid, text }: { isValid: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {isValid ? (
        <Check className="h-3.5 w-3.5 text-green-500 font-bold" />
      ) : (
        <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />
      )}
      <span className={`text-xs ${isValid ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
        {text}
      </span>
    </div>
  )
}
