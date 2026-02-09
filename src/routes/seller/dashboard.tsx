import { createFileRoute } from '@tanstack/react-router'
import { SellerDashboardPage } from '@/components/seller/SellerDashboardPage'

export const Route = createFileRoute('/seller/dashboard')({
  component: SellerDashboardPage,
})
