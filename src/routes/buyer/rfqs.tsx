import { createFileRoute } from '@tanstack/react-router'
import BuyerRFQsSection from '@/components/buyer/BuyerRFQsSection'
import { getBuyerRfqs } from '@/lib/quote-server'

export const Route = createFileRoute('/buyer/rfqs')({
  loader: () => getBuyerRfqs(),
  component: BuyerRFQInbox,
})

function BuyerRFQInbox() {
  const rfqs = Route.useLoaderData()
  
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <BuyerRFQsSection rfqs={rfqs || []} />
    </div>
  )
}