import { createFileRoute } from '@tanstack/react-router'
import { AddProductPage } from '@/components/seller/AddProductPage'

export const Route = createFileRoute('/seller/products/add')({
  component: AddProductPage,
})
