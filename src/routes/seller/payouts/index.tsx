import { createFileRoute } from '@tanstack/react-router'
import { SellerPayoutsPage } from '@/components/seller/SellerPayoutsPage'

export const Route = createFileRoute('/seller/payouts/')({
  component: SellerPayoutsPage,
})
