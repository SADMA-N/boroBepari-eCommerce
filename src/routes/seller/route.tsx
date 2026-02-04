import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SellerAuthProvider } from '@/contexts/SellerAuthContext'
import { SellerToastProvider } from '@/components/seller/SellerToastProvider'

export const Route = createFileRoute('/seller')({
  component: SellerRouteWrapper,
})

function SellerRouteWrapper() {
  return (
    <SellerAuthProvider>
      <SellerToastProvider>
        <Outlet />
      </SellerToastProvider>
    </SellerAuthProvider>
  )
}
