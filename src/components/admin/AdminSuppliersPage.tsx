import { useState } from 'react'
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  MapPin,
  Star,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'

const MOCK_SUPPLIERS = [
  {
    id: '1',
    businessName: 'Rahim Textiles Ltd.',
    email: 'contact@rahimtextiles.com',
    phone: '01711111111',
    location: 'Dhaka',
    kycStatus: 'approved',
    verificationBadge: 'verified',
    products: 156,
    orders: 1240,
    rating: 4.8,
    joinedAt: '2023-06-15',
  },
  {
    id: '2',
    businessName: 'Chittagong Electronics',
    email: 'info@ctgelectronics.com',
    phone: '01822222222',
    location: 'Chittagong',
    kycStatus: 'pending',
    verificationBadge: 'none',
    products: 0,
    orders: 0,
    rating: 0,
    joinedAt: '2024-04-20',
  },
  {
    id: '3',
    businessName: 'Sylhet Traders',
    email: 'sales@sylhettraders.com',
    phone: '01933333333',
    location: 'Sylhet',
    kycStatus: 'approved',
    verificationBadge: 'basic',
    products: 45,
    orders: 320,
    rating: 4.2,
    joinedAt: '2023-09-10',
  },
  {
    id: '4',
    businessName: 'Khulna Garments',
    email: 'info@khulnagarments.com',
    phone: '01644444444',
    location: 'Khulna',
    kycStatus: 'rejected',
    verificationBadge: 'none',
    products: 0,
    orders: 0,
    rating: 0,
    joinedAt: '2024-03-05',
  },
  {
    id: '5',
    businessName: 'Rajshahi Exports',
    email: 'export@rajshahiexports.com',
    phone: '01755555555',
    location: 'Rajshahi',
    kycStatus: 'approved',
    verificationBadge: 'premium',
    products: 289,
    orders: 2150,
    rating: 4.9,
    joinedAt: '2022-12-01',
  },
]

function getKycBadge(status: string) {
  switch (status) {
    case 'approved':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Approved</span>
    case 'pending':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>
    case 'rejected':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Rejected</span>
    default:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">Unknown</span>
  }
}

function getVerificationBadge(badge: string) {
  switch (badge) {
    case 'premium':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">Premium</span>
    case 'verified':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Verified</span>
    case 'basic':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-700">Basic</span>
    default:
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-50 text-slate-500">None</span>
  }
}

export function AdminSuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState('all')

  const filteredSuppliers = MOCK_SUPPLIERS.filter((supplier) => {
    const matchesSearch =
      supplier.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesKyc = kycFilter === 'all' || supplier.kycStatus === kycFilter
    return matchesSearch && matchesKyc
  })

  return (
    <AdminProtectedRoute requiredPermission="canManageSuppliers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Suppliers Management</h1>
            <p className="text-slate-600">Manage supplier accounts and verification</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Total Suppliers</p>
            <p className="text-2xl font-bold text-slate-900">{MOCK_SUPPLIERS.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Verified</p>
            <p className="text-2xl font-bold text-green-600">
              {MOCK_SUPPLIERS.filter((s) => s.kycStatus === 'approved').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Pending KYC</p>
            <p className="text-2xl font-bold text-yellow-600">
              {MOCK_SUPPLIERS.filter((s) => s.kycStatus === 'pending').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="text-2xl font-bold text-red-600">
              {MOCK_SUPPLIERS.filter((s) => s.kycStatus === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="all">All KYC Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Badge
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                          <Building2 size={20} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{supplier.businessName}</p>
                          <p className="text-sm text-slate-500">{supplier.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <MapPin size={14} />
                        {supplier.location}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getKycBadge(supplier.kycStatus)}</td>
                    <td className="px-6 py-4">{getVerificationBadge(supplier.verificationBadge)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{supplier.products}</td>
                    <td className="px-6 py-4">
                      {supplier.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-slate-600">{supplier.rating}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <Eye size={16} />
                        </button>
                        {supplier.kycStatus === 'pending' && (
                          <>
                            <button className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded">
                              <CheckCircle size={16} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
