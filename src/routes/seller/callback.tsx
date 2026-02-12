import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useSellerAuth } from '@/contexts/SellerAuthContext'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

export const Route = createFileRoute('/seller/callback')({
  component: SellerCallback,
})

function SellerCallback() {
  const navigate = useNavigate()
  const { googleLogin } = useSellerAuth()
  const { pushToast } = useSellerToast()
  const [error, setError] = useState<string | null>(null)
  const isChecking = useRef(false)

  useEffect(() => {
    const checkSeller = async () => {
      if (isChecking.current) return
      isChecking.current = true

      try {
        const session = await authClient.getSession()

        if (session.data.user.email) {
          try {
            const seller = await googleLogin(session.data.user.email)

            // Success! Redirect based on KYC status
            if (seller.kycStatus === 'approved') {
              navigate({ to: '/seller/dashboard' })
            } else if (seller.kycStatus === 'rejected') {
              navigate({ to: '/seller/kyc', search: { reason: 'rejected' } })
            } else {
              navigate({ to: '/seller/kyc' })
            }
          } catch (err: any) {
            const message =
              err.message || 'This email is not registered as a seller account.'
            setError(message)
            pushToast(message, 'error')

            // Sign out from buyer session to keep it clean if they aren't a seller
            await authClient.signOut()
            navigate({ to: '/seller/login' })
          }
        } else {
          // No session found, redirect back to login
          navigate({ to: '/seller/login' })
        }
      } catch (err) {
        console.error('Callback error:', err)
        setError('An unexpected error occurred during Google sign-in.')
        navigate({ to: '/seller/login' })
      } finally {
        isChecking.current = false
      }
    }

    checkSeller()
  }, [googleLogin, navigate, pushToast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Verifying your seller account...
        </h2>
        <p className="mt-2 text-muted-foreground">
          Please wait while we check your credentials.
        </p>
        {error && <p className="mt-4 text-red-500 font-medium">{error}</p>}
      </div>
    </div>
  )
}
