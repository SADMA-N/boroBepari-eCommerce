import { createFileRoute } from '@tanstack/react-router'
import { SellerRegistrationPage } from '@/components/seller/SellerRegistrationPage'

export const Route = createFileRoute('/seller/register')({
  component: SellerRegistrationPage,
})
