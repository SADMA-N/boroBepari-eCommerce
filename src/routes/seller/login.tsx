import { createFileRoute } from '@tanstack/react-router'
import { SellerLoginPage } from '@/components/seller/SellerLoginPage'

export const Route = createFileRoute('/seller/login')({
  component: SellerLoginPage,
})
