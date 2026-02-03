import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/seller/help')({
  component: SellerHelpPage,
})

function SellerHelpPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Seller Help Guide</h1>
      <p className="text-slate-600">
        Visit the Seller Guide and FAQ in the docs folder for detailed steps.
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-600">
        <li>`docs/seller-portal-guide.md`</li>
        <li>`docs/seller-faq.md`</li>
        <li>`docs/seller-video-tutorials.md`</li>
      </ul>
    </div>
  )
}
