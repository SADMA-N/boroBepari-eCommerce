import { createFileRoute } from '@tanstack/react-router'
import { SellerProfilePage } from '@/components/seller/SellerProfilePage'

export const Route = createFileRoute('/seller/profile')({
  component: SellerProfilePage,
})
