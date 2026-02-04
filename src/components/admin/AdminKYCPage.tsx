import { useState } from 'react'
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'

const MOCK_KYC_REQUESTS = [
  {
    id: '1',
    businessName: 'Chittagong Electronics',
    email: 'info@ctgelectronics.com',
    businessType: 'Wholesaler',
    submittedAt: '2024-04-20',
    documents: ['Trade License', 'TIN Certificate', 'Bank Statement'],
    status: 'pending',
    priority: 'high',
  },
  {
    id: '2',
    businessName: 'Barishal Traders',
    email: 'contact@barishaltraders.com',
    businessType: 'Manufacturer',
    submittedAt: '2024-04-18',
    documents: ['Trade License', 'TIN Certificate', 'Factory License'],
    status: 'pending',
    priority: 'medium',
  },
  {
    id: '3',
    businessName: 'Mymensingh Foods',
    email: 'sales@mmfoods.com',
    businessType: 'Distributor',
    submittedAt: '2024-04-15',
    documents: ['Trade License', 'Food License', 'TIN Certificate'],
    status: 'pending',
    priority: 'low',
  },
  {
    id: '4',
    businessName: 'Comilla Textiles',
    email: 'info@comillatex.com',
    businessType: 'Manufacturer',
    submittedAt: '2024-04-10',
    documents: ['Trade License', 'TIN Certificate'],
    status: 'under_review',
    priority: 'medium',
  },
  {
    id: '5',
    businessName: 'Rangpur Exports',
    email: 'export@rangpurex.com',
    businessType: 'Exporter',
    submittedAt: '2024-04-08',
    documents: ['Trade License', 'Export License', 'TIN Certificate'],
    status: 'under_review',
    priority: 'high',
  },
]

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

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
          <Clock size={12} />
          Pending
        </span>
      )
    case 'under_review':
      return (
        <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
          <Eye size={12} />
          Under Review
        </span>
      )
    default:
      return null
  }
}

export function AdminKYCPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedKYC, setSelectedKYC] = useState<string | null>(null)

  const filteredRequests = MOCK_KYC_REQUESTS.filter((req) => {
    const matchesSearch =
      req.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || req.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const selected = MOCK_KYC_REQUESTS.find((r) => r.id === selectedKYC)

  return (
    <AdminProtectedRoute requiredPermission="canReviewKYC">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">KYC Review Queue</h1>
          <p className="text-slate-600">Review and approve supplier KYC applications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {MOCK_KYC_REQUESTS.filter((r) => r.status === 'pending').length}
                </p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {MOCK_KYC_REQUESTS.filter((r) => r.status === 'under_review').length}
                </p>
                <p className="text-sm text-slate-500">Under Review</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {MOCK_KYC_REQUESTS.filter((r) => r.priority === 'high').length}
                </p>
                <p className="text-sm text-slate-500">High Priority</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">2.3</p>
                <p className="text-sm text-slate-500">Avg Days to Review</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6">
          {/* KYC List */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search applications..."
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
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => setSelectedKYC(request.id)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                    selectedKYC === request.id ? 'bg-orange-50 border-l-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center">
                        <Building2 size={20} className="text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{request.businessName}</p>
                        <p className="text-xs text-slate-500">{request.businessType}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(request.status)}
                          {getPriorityBadge(request.priority)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-xs">{request.submittedAt}</span>
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* KYC Detail Panel */}
          <div className="bg-white rounded-xl border border-slate-200">
            {selected ? (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">{selected.businessName}</h3>
                  <p className="text-sm text-slate-500">{selected.email}</p>
                </div>

                <div className="flex-1 p-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Business Type
                    </p>
                    <p className="text-sm text-slate-900">{selected.businessType}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Submitted Documents
                    </p>
                    <div className="space-y-2">
                      {selected.documents.map((doc) => (
                        <div
                          key={doc}
                          className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:bg-slate-50"
                        >
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm text-slate-700">{doc}</span>
                          <button className="ml-auto text-xs text-orange-600 hover:text-orange-700">
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                      Submitted On
                    </p>
                    <p className="text-sm text-slate-900">{selected.submittedAt}</p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200">
                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-center">
                <div>
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Select an application to review</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
