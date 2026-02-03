import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout/payment')({
  component: PaymentPage,
})

function PaymentPage() {
  return <div>Payment Step (Coming Soon)</div>
}
