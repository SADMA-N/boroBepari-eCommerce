import { createFileRoute, redirect } from '@tanstack/react-router'
import { Package } from 'lucide-react'

export const Route = createFileRoute('/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 p-3 rounded-full">
          <Package size={24} className="text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
      </div>

      <div className="text-center py-20 bg-gray-50 rounded-lg border border-gray-100">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-medium text-gray-800 mb-2">
          No orders yet
        </h2>
        <p className="text-gray-500 mb-6">
          When you place an order, it will appear here.
        </p>
        <a
          href="/"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Start Shopping
        </a>
      </div>
    </div>
  )
}
