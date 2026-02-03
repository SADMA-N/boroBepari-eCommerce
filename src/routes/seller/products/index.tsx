import { createFileRoute } from '@tanstack/react-router'
import { SellerProductsPage } from '@/components/seller/SellerProductsPage'

export const Route = createFileRoute('/seller/products/')({
  component: SellerProductsPage,
})
