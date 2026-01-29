import { createFileRoute, redirect } from '@tanstack/react-router'
import { getSupplierRfqs } from '@/lib/supplier-server'
import { useState } from 'react'
import { formatBDT } from '@/data/mock-products'
import QuoteResponseModal from '@/components/QuoteResponseModal'
import { getAuthSession } from '@/lib/auth-server'

export const Route = createFileRoute('/supplier/dashboard')({
  beforeLoad: async ({ context }) => {
    // Basic auth check, ideally check for supplier role too
    const session: any = await getAuthSession()
    if (!session?.user) {
      throw redirect({ to: '/login' })
    }
  },
  loader: async () => {
    const rfqs = await getSupplierRfqs()
    return { rfqs }
  },
  component: SupplierDashboard,
})

function SupplierDashboard() {
  const { rfqs } = Route.useLoaderData()
  const [selectedRfq, setSelectedRfq] = useState<any>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)

  const handleOpenQuote = (rfq: any) => {
    setSelectedRfq(rfq)
    setIsQuoteModalOpen(true)
  }

  const handleQuoteSuccess = () => {
    // Ideally revalidate loader here to refresh list
    window.location.reload()
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Supplier Dashboard
      </h1>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Received RFQs</h2>
          <span className="text-sm text-gray-500">{rfqs.length} Requests</span>
        </div>

        {rfqs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No RFQs received yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Product</th>
                  <th className="px-6 py-3 font-medium">Buyer</th>
                  <th className="px-6 py-3 font-medium">Quantity</th>
                  <th className="px-6 py-3 font-medium">Target Price</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rfqs.map((rfq) => (
                  <tr
                    key={rfq.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {rfq.product.name}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{rfq.user.name}</td>
                    <td className="px-6 py-4 text-gray-600">{rfq.quantity}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {rfq.targetPrice ? formatBDT(rfq.targetPrice) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rfq.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : rfq.status === 'responded'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rfq.status.charAt(0).toUpperCase() +
                          rfq.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {rfq.status === 'pending' && (
                        <button
                          onClick={() => handleOpenQuote(rfq)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Send Quote
                        </button>
                      )}
                      {rfq.status === 'responded' && (
                        <span className="text-gray-400">Quote Sent</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <QuoteResponseModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        rfq={selectedRfq}
        onSuccess={handleQuoteSuccess}
      />
    </div>
  )
}
