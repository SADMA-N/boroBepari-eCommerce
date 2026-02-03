import { createFileRoute } from '@tanstack/react-router'
import { SellerAnalyticsPage } from '@/components/seller/SellerAnalyticsPage'

export const Route = createFileRoute('/seller/analytics/')({
  component: SellerAnalyticsPage,
})
