import { useEffect } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { SellerLayout } from './SellerLayout'
import { useSellerAuth } from '@/contexts/SellerAuthContext'

interface SellerProtectedRouteProps {
  children: React.ReactNode
  requireVerified?: boolean
}

export function SellerProtectedRoute({
  children,
  requireVerified = false,
}: SellerProtectedRouteProps) {
  const { seller, isAuthenticated, isLoading } = useSellerAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isLoading) return

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      navigate({
        to: '/seller/login',
        search: { redirect: location.pathname },
      })
      return
    }

    // Check verification status
    if (requireVerified && seller?.kycStatus !== 'approved') {
      // If not on KYC page, redirect to it
      if (location.pathname !== '/seller/kyc') {
        navigate({ to: '/seller/kyc' })
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    seller,
    requireVerified,
    navigate,
    location.pathname,
  ])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-orange-200 dark:border-orange-900/40 border-t-orange-600 dark:border-t-orange-400 rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null
  }

  // Requires verification but not approved
  if (requireVerified && seller?.kycStatus !== 'approved') {
    return null
  }

  return <SellerLayout>{children}</SellerLayout>
}
