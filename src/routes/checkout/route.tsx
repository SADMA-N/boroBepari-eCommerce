import { createFileRoute, Outlet } from '@tanstack/react-router'
import { CheckoutProvider } from '@/contexts/CheckoutContext'

export const Route = createFileRoute('/checkout')({
  component: CheckoutLayoutWrapper,
})

function CheckoutLayoutWrapper() {
  return (
    <CheckoutProvider>
      <Outlet />
    </CheckoutProvider>
  )
}
