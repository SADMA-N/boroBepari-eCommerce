import { createFileRoute } from '@tanstack/react-router'
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerAuth } from '@/contexts/SellerAuthContext'

export const Route = createFileRoute('/seller/dashboard')({
  component: SellerDashboardPage,
})

function SellerDashboardPage() {
  const { seller } = useSellerAuth()

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {seller?.businessName}
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your store today
            </p>
          </div>

          {seller?.kycStatus !== 'approved' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle size={18} className="text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Complete KYC to unlock all features
              </span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Products"
            value="0"
            change="+0%"
            icon={Package}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Total Orders"
            value="0"
            change="+0%"
            icon={ShoppingCart}
            iconBg="bg-green-100"
            iconColor="text-green-600"
          />
          <StatCard
            title="Revenue"
            value="৳0"
            change="+0%"
            icon={DollarSign}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
          />
          <StatCard
            title="Growth"
            value="0%"
            change="+0%"
            icon={TrendingUp}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionCard
              title="Add Product"
              description="List a new product in your store"
              href="/seller/products/new"
              disabled={seller?.kycStatus !== 'approved'}
            />
            <QuickActionCard
              title="View Orders"
              description="Check and manage your orders"
              href="/seller/orders"
              disabled={seller?.kycStatus !== 'approved'}
            />
            <QuickActionCard
              title="Respond to RFQs"
              description="Quote on buyer requests"
              href="/seller/rfqs"
              disabled={seller?.kycStatus !== 'approved'}
            />
            <QuickActionCard
              title="View Analytics"
              description="Track your store performance"
              href="/seller/analytics"
              disabled={seller?.kycStatus !== 'approved'}
            />
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500">No recent activity yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your recent orders and activities will appear here
            </p>
          </div>
        </div>
      </div>
    </SellerProtectedRoute>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}

function StatCard({ title, value, change, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon size={20} className={iconColor} />
        </div>
        <span className="text-xs text-green-600 font-medium">{change}</span>
      </div>
      <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  )
}

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  disabled?: boolean
}

function QuickActionCard({ title, description, disabled }: QuickActionCardProps) {
  return (
    <button
      disabled={disabled}
      className={`
        text-left p-4 rounded-lg border transition-colors
        ${disabled
          ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-60'
          : 'bg-white border-gray-200 hover:border-orange-300 hover:bg-orange-50'
        }
      `}
    >
      <h3 className="font-medium text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      {disabled && (
        <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
          KYC Required
        </span>
      )}
    </button>
  )
}
