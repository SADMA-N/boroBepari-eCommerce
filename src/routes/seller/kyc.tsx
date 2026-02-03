import { createFileRoute } from '@tanstack/react-router'
import { SellerKYCPage } from '@/components/seller/SellerKYCPage'

export const Route = createFileRoute('/seller/kyc')({
  component: SellerKYCPage,
})
