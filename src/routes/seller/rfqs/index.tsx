import { createFileRoute } from '@tanstack/react-router'
import { SellerRFQsPage } from '@/components/seller/SellerRFQsPage'

export const Route = createFileRoute('/seller/rfqs/')({
  component: SellerRFQsPage,
})
