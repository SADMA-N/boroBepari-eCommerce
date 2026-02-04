import { useState } from 'react'
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  User,
  Building2,
  Package,
  ChevronRight,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'

const MOCK_DISPUTES = [
  {
    id: '1',
    orderId: 'ORD-45892',
    type: 'Product Quality',
    buyer: { name: 'Karim Hossain', email: 'karim@example.com' },
    supplier: { name: 'Rahim Textiles', email: 'contact@rahimtextiles.com' },
    amount: 25000,
    status: 'open',
    priority: 'high',
    createdAt: '2024-04-22',
    description: 'Received products with defects. Quality does not match the description.',
  },
  {
    id: '2',
    orderId: 'ORD-45756',
    type: 'Late Delivery',
    buyer: { name: 'Fatima Rahman', email: 'fatima@example.com' },
    supplier: { name: 'Chittagong Electronics', email: 'info@ctgelectronics.com' },
    amount: 15000,
    status: 'under_investigation',
    priority: 'medium',
    createdAt: '2024-04-20',
    description: 'Order was delivered 2 weeks late causing business loss.',
  },
  {
    id: '3',
    orderId: 'ORD-45601',
    type: 'Wrong Item',
    buyer: { name: 'Abdul Malik', email: 'abdul@example.com' },
    supplier: { name: 'Sylhet Traders', email: 'sales@sylhettraders.com' },
    amount: 8500,
    status: 'open',
    priority: 'low',
    createdAt: '2024-04-18',
    description: 'Received different product than what was ordered.',
  },
  {
    id: '4',
    orderId: 'ORD-45489',
    type: 'Refund Request',
    buyer: { name: 'Nasreen Akhter', email: 'nasreen@example.com' },
    supplier: { name: 'Rajshahi Exports', email: 'export@rajshahiexports.com' },
    amount: 45000,
    status: 'resolved',
    priority: 'high',
    createdAt: '2024-04-15',
    description: 'Requesting full refund due to damaged goods.',
    resolution: 'Full refund issued to buyer. Supplier compensated.',
  },
]

function getStatusBadge(status: string) {
  switch (status) {
    case 'open':
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          <AlertTriangle size={12} />
          Open
        </span>
      )
    case 'under_investigation':
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          <Clock size={12} />
          Investigating
        </span>
      )
    case 'resolved':
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
          <CheckCircle size={12} />
          Resolved
        </span>
      )
    default:
      return null
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case 'high':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">High</span>
    case 'medium':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Medium</span>
    case 'low':
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Low</span>
    default:
      return null
  }
}

export function AdminDisputesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null)

  const filteredDisputes = MOCK_DISPUTES.filter((dispute) => {
    const matchesSearch =
      dispute.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.buyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dispute.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selected = MOCK_DISPUTES.find((d) => d.id === selectedDispute)

  return (
    <AdminProtectedRoute requiredPermission="canResolveDisputes">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Disputes</h1>
          <p className="text-slate-600">Manage and resolve buyer-supplier disputes</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {MOCK_DISPUTES.filter((d) => d.status === 'open').length}
                </p>
                <p className="text-sm text-slate-500">Open Disputes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {MOCK_DISPUTES.filter((d) => d.status === 'under_investigation').length}
                </p>
                <p className="text-sm text-slate-500">Investigating</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {MOCK_DISPUTES.filter((d) => d.status === 'resolved').length}
                </p>
                <p className="text-sm text-slate-500">Resolved</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ৳{MOCK_DISPUTES.filter((d) => d.status !== 'resolved')
                    .reduce((sum, d) => sum + d.amount, 0)
                    .toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">Amount at Risk</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* Disputes List */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by order ID or parties..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="under_investigation">Investigating</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredDisputes.map((dispute) => (
                <div
                  key={dispute.id}
                  onClick={() => setSelectedDispute(dispute.id)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedDispute === dispute.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{dispute.orderId}</p>
                        <span className="text-xs text-slate-500">·</span>
                        <span className="text-xs text-slate-500">{dispute.type}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">
                        {dispute.buyer.name} vs {dispute.supplier.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(dispute.status)}
                        {getPriorityBadge(dispute.priority)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-xs">{dispute.createdAt}</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dispute Detail Panel */}
          <div className="bg-white rounded-xl border border-slate-200">
            {selected ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">{selected.orderId}</h3>
                    {getStatusBadge(selected.status)}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{selected.type}</p>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Disputed Amount
                    </p>
                    <p className="text-lg font-bold text-slate-900">৳{selected.amount.toLocaleString()}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Buyer
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                      <User size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{selected.buyer.name}</p>
                        <p className="text-xs text-slate-500">{selected.buyer.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Supplier
                    </p>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
                      <Building2 size={16} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{selected.supplier.name}</p>
                        <p className="text-xs text-slate-500">{selected.supplier.email}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Description
                    </p>
                    <p className="text-sm text-slate-700">{selected.description}</p>
                  </div>

                  {selected.resolution && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                        Resolution
                      </p>
                      <p className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                        {selected.resolution}
                      </p>
                    </div>
                  )}
                </div>

                {selected.status !== 'resolved' && (
                  <div className="p-4 border-t border-slate-200 space-y-3">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
                      <MessageSquare size={16} />
                      Contact Parties
                    </button>
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Refund Buyer
                      </button>
                      <button className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                        Side with Supplier
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center">
                <div>
                  <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Select a dispute to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
