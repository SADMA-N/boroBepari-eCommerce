import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/seller/faq')({
  component: SellerFaqPage,
})

function SellerFaqPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Seller FAQ</h1>
      <div className="space-y-4 text-sm text-slate-600">
        <div>
          <p className="font-semibold text-slate-800">Why is my KYC pending?</p>
          <p>
            Verification usually takes 24-48 hours. Ensure documents are clear.
          </p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">
            My withdrawal is delayed.
          </p>
          <p>Withdrawals take 3-5 business days. Contact support if delayed.</p>
        </div>
        <div>
          <p className="font-semibold text-slate-800">
            How do I update bank details?
          </p>
          <p>Go to Profile → Bank Details tab.</p>
        </div>
      </div>
    </div>
  )
}
