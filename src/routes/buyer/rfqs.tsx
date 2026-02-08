import { createFileRoute } from '@tanstack/react-router'
import BuyerRFQsSection from '@/components/buyer/BuyerRFQsSection'

export const Route = createFileRoute('/buyer/rfqs')({
  component: BuyerRFQInbox,
})

function BuyerRFQInbox() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <BuyerRFQsSection />
    </div>
  )
}