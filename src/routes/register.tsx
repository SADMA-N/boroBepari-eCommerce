import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import { Eye, EyeOff, Check, X, Sparkles, RefreshCw } from 'lucide-react'
import { z } from 'zod'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: async () => {
     try {
        const session = await authClient.getSession();
        if (session.data) {
            throw redirect({ to: '/' })
        }
     } catch (err) {
        // If it's a redirect, re-throw it
        if ((err as any).status === 307 || (err as any).status === 302) throw err
        console.error("Register beforeLoad failed:", err)
     }
  }
})

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string()
    .email("Invalid email address")
    .refine(email => email === email.toLowerCase(), "Email must be lowercase")
    .refine(email => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email), "Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must include at least one letter")
    .regex(/[0-9]/, "Password must include at least one number")
})

function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerationMessage, setShowGenerationMessage] = useState(false)
  const router = useRouter()

  // Real-time validation states
  const [valLength, setValLength] = useState(false)
  const [valAlpha, setValAlpha] = useState(false)
  const [valNum, setValNum] = useState(false)

  useEffect(() => {
    setValLength(password.length >= 8)
    setValAlpha(/[a-zA-Z]/.test(password))
    setValNum(/[0-9]/.test(password))
  }, [password])

  const isPasswordValid = valLength && valAlpha && valNum

  const generateStrongPassword = () => {
    setIsGenerating(true)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+"
    let retVal = ""
    
    // Ensure at least one of each required type
    retVal += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
    retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
    retVal += "0123456789"[Math.floor(Math.random() * 10)]
    retVal += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)]
    
    for (let i = 0; i < 8; i++) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    // Shuffle the result
    retVal = retVal.split('').sort(() => 0.5 - Math.random()).join('')
    
    setPassword(retVal)
    setShowPassword(true)
    setShowGenerationMessage(true)
    setTimeout(() => setIsGenerating(false), 500)
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/',
    })
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    const result = registerSchema.safeParse({ name, email, password })
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/',
    }, {
        onSuccess: async () => {
            // Ensure no session is active (double safety)
            await authClient.signOut() 
            setIsSuccess(true)
        },
        onError: (ctx) => {
            setError(ctx.error.message || 'Registration failed')
        }
    })
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-10 shadow-xl text-center border border-gray-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Check your email
            </h2>
            <p className="mt-2 text-base text-gray-600">
                We sent a verification link to <span className="font-semibold text-gray-900">{email}</span>.
                <br/>
                Please check your inbox to verify your account.
            </p>
            <div className="mt-8">
                <button
                    onClick={() => router.navigate({ to: '/login' })}
                    className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg transition-all"
                >
                    Go to Login
                </button>
            </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 md:p-10 shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
             <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Create an Account
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Join BoroBepari wholesale marketplace
          </p>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-lg text-sm text-center font-medium animate-in fade-in slide-in-from-top-1">
                {error}
            </div>
        )}
        
        <form className="mt-8 space-y-5" onSubmit={handleEmailSignUp}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Full Name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                className="appearance-none block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.toLowerCase())}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 ml-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Create a Strong Password
                </label>
                <button 
                   type="button" 
                   onClick={generateStrongPassword}
                   className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 uppercase tracking-tight transition-colors"
                   title="System will generate a strong password for you"
                >
                   {isGenerating ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                   Skip & Auto-generate
                </button>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className={`appearance-none block w-full px-4 py-3 border ${isPasswordValid ? 'border-gray-300' : 'border-gray-300'} placeholder-gray-400 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all sm:text-sm pr-12`}
                  placeholder="Enter your password"
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

              {/* Password Requirements UI */}
              <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Security Requirements</p>
                <div className="flex items-center gap-2">
                  {valLength ? <Check className="h-3.5 w-3.5 text-green-500 font-bold" /> : <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />}
                  <span className={`text-xs ${valLength ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Minimum 8 characters</span>
                </div>
                <div className="flex items-center gap-2">
                  {valAlpha ? <Check className="h-3.5 w-3.5 text-green-500 font-bold" /> : <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />}
                  <span className={`text-xs ${valAlpha ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Include at least one letter</span>
                </div>
                <div className="flex items-center gap-2">
                  {valNum ? <Check className="h-3.5 w-3.5 text-green-500 font-bold" /> : <div className="h-3.5 w-3.5 rounded-full border border-gray-300" />}
                  <span className={`text-xs ${valNum ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Include at least one number</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isPasswordValid || !name || !email}
              className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white shadow-lg transition-all transform active:scale-[0.98] ${
                isPasswordValid && name && email 
                ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer' 
                : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              Create Wholesale Account
            </button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-white text-gray-500 font-medium">Or join with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.21.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            Google Account
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => router.navigate({ to: '/login' })}
              className="font-bold text-orange-600 hover:text-orange-700 transition-colors underline underline-offset-4"
            >
              Sign in here
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}