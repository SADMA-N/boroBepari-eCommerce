import { Outlet, createFileRoute } from '@tanstack/react-router'
import { SellerAuthProvider } from '@/contexts/SellerAuthContext'
import { SellerToastProvider } from '@/components/seller/SellerToastProvider'
import { NotificationProvider } from '@/contexts/NotificationContext'

export const Route = createFileRoute('/seller')({
  component: SellerRouteWrapper,
})

function SellerRouteWrapper() {
  return (
    <SellerAuthProvider>
      <NotificationProvider>
        <SellerToastProvider>
          <Outlet />
        </SellerToastProvider>
      </NotificationProvider>
    </SellerAuthProvider>
  )
}
