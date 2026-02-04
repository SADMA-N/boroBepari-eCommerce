import {
  Users,
  Building2,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  FileCheck,
  DollarSign,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'

const STATS = [
  {
    label: 'Total Users',
    value: '12,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    label: 'Active Suppliers',
    value: '1,284',
    change: '+8.2%',
    trend: 'up',
    icon: Building2,
    color: 'bg-green-500',
  },
  {
    label: 'Pending KYC',
    value: '47',
    change: '-15.3%',
    trend: 'down',
    icon: FileCheck,
    color: 'bg-yellow-500',
  },
  {
    label: 'Open Disputes',
    value: '23',
    change: '+5.1%',
    trend: 'up',
    icon: AlertTriangle,
    color: 'bg-red-500',
  },
  {
    label: 'Total Orders',
    value: '45,892',
    change: '+18.7%',
    trend: 'up',
    icon: ShoppingCart,
    color: 'bg-purple-500',
  },
  {
    label: 'Revenue (MTD)',
    value: '৳8.2M',
    change: '+22.4%',
    trend: 'up',
    icon: DollarSign,
    color: 'bg-orange-500',
  },
]

const RECENT_ACTIVITIES = [
  { id: 1, action: 'New supplier registration', user: 'Rahim Textiles', time: '5 min ago', type: 'supplier' },
  { id: 2, action: 'KYC approved', user: 'Dhaka Electronics', time: '12 min ago', type: 'kyc' },
  { id: 3, action: 'Dispute opened', user: 'Order #45892', time: '25 min ago', type: 'dispute' },
  { id: 4, action: 'New user registered', user: 'karim@example.com', time: '1 hour ago', type: 'user' },
  { id: 5, action: 'KYC rejected', user: 'ABC Trading', time: '2 hours ago', type: 'kyc' },
]

const PENDING_KYC = [
  { id: 1, business: 'Rajshahi Garments', submitted: '2 days ago', type: 'Manufacturer' },
  { id: 2, business: 'Chittagong Exports', submitted: '3 days ago', type: 'Wholesaler' },
  { id: 3, business: 'Sylhet Trading Co.', submitted: '5 days ago', type: 'Distributor' },
]

export function AdminDashboardPage() {
  return (
    <AdminProtectedRoute>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {STATS.map((stat) => {
            const Icon = stat.icon
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium ${
                      stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {stat.trend === 'up' ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {stat.change}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">Recent Activity</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {RECENT_ACTIVITIES.map((activity) => (
                <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-sm text-slate-500">{activity.user}</p>
                  </div>
                  <span className="text-xs text-slate-400">{activity.time}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-200">
              <button className="text-sm font-medium text-orange-600 hover:text-orange-700">
                View all activity
              </button>
            </div>
          </div>

          {/* Pending KYC */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Pending KYC Reviews</h2>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                {PENDING_KYC.length} pending
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {PENDING_KYC.map((kyc) => (
                <div key={kyc.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{kyc.business}</p>
                    <p className="text-sm text-slate-500">
                      {kyc.type} · Submitted {kyc.submitted}
                    </p>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg">
                    Review
                  </button>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-200">
              <button className="text-sm font-medium text-orange-600 hover:text-orange-700">
                View all KYC requests
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <FileCheck className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-slate-700">Review KYC</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-slate-700">Handle Disputes</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <Users className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-slate-700">Manage Users</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <Building2 className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-slate-700">View Suppliers</span>
            </button>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
