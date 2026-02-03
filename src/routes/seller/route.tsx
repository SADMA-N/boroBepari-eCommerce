import { createFileRoute, Outlet } from '@tanstack/react-router'
import { SellerAuthProvider } from '@/contexts/SellerAuthContext'

export const Route = createFileRoute('/seller')({
  component: SellerRouteWrapper,
})

function SellerRouteWrapper() {
  return (
    <SellerAuthProvider>
      <Outlet />
    </SellerAuthProvider>
  )
}
