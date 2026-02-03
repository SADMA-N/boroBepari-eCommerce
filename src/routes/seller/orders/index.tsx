import { createFileRoute } from '@tanstack/react-router'
import { SellerOrdersPage } from '@/components/seller/SellerOrdersPage'

export const Route = createFileRoute('/seller/orders/')({
  component: SellerOrdersPage,
})
