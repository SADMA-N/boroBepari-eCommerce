import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  Ban,
  MessageSquare,
  User,
  Building2,
  FileText,
  Flag,
  ChevronDown,
  X,
  Mail,
  DollarSign,
  Scale,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'
import { AdminProtectedRoute } from './AdminProtectedRoute'

type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed' | 'awaiting_response' | 'escalated'
type Priority = 'normal' | 'high'
type IssueType =
  | 'Product not received'
  | 'Product damaged'
  | 'Wrong product received'
  | 'Quality issues'
  | 'Refund not processed'
  | 'Seller unresponsive'
  | 'Payment issues'
  | 'Other'

type Dispute = {
  id: string
  orderNumber: string
  buyer: { name: string; email: string; phone: string; totalOrders: number; disputes: number }
  seller: { name: string; email: string; phone: string; totalOrders: number; disputes: number; rating: number }
  issueType: IssueType
  filedDate: string
  priority: Priority
  assignedTo?: string
  status: DisputeStatus
  amountPaid: number
  escrowAmount: number
  deliveryStatus: string
  trackingInfo: string
  description: string
  evidence: { images: string[]; documents: string[] }
  products: Array<{ name: string; qty: number; price: number }>
  timeline: Array<{ id: string; label: string; time: string }>
  conversation: Array<{ id: string; author: string; role: 'buyer' | 'seller' | 'admin'; message: string; time: string }>
  auditTrail: Array<{ id: string; actor: string; action: string; time: string; notes?: string }>
}

const DISPUTES: Dispute[] = [
  {
    id: 'DSP-1001',
    orderNumber: 'ORD-45892',
    buyer: {
      name: 'Karim Hossain',
      email: 'karim@example.com',
      phone: '01712345678',
      totalOrders: 24,
      disputes: 1,
    },
    seller: {
      name: 'Rahim Textiles Ltd.',
      email: 'contact@rahimtextiles.com',
      phone: '01711111111',
      totalOrders: 1240,
      disputes: 4,
      rating: 4.8,
    },
    issueType: 'Product damaged',
    filedDate: '2026-01-20',
    priority: 'high',
    assignedTo: 'Admin Sumi',
    status: 'open',
    amountPaid: 25000,
    escrowAmount: 25000,
    deliveryStatus: 'Delivered',
    trackingInfo: 'TRK-889213',
    description: 'Received products with visible defects and stains.',
    evidence: {
      images: ['/img/disputes/img-1.png', '/img/disputes/img-2.png'],
      documents: ['Damage report.pdf'],
    },
    products: [
      { name: 'Cotton Bedsheets', qty: 50, price: 500 },
    ],
    timeline: [
      { id: 'tl-1', label: 'Order placed', time: '2026-01-05 10:12' },
      { id: 'tl-2', label: 'Payment made', time: '2026-01-05 10:20' },
      { id: 'tl-3', label: 'Order shipped', time: '2026-01-07 15:30' },
      { id: 'tl-4', label: 'Delivered', time: '2026-01-15 11:05' },
      { id: 'tl-5', label: 'Dispute filed', time: '2026-01-20 09:42' },
    ],
    conversation: [
      { id: 'msg-1', author: 'Karim Hossain', role: 'buyer', message: 'Items arrived damaged.', time: '2 days ago' },
      { id: 'msg-2', author: 'Rahim Textiles', role: 'seller', message: 'Please share photos.', time: '1 day ago' },
    ],
    auditTrail: [
      { id: 'aud-1', actor: 'System', action: 'Dispute created', time: '2026-01-20 09:42' },
      { id: 'aud-2', actor: 'Admin Sumi', action: 'Assigned', time: '2026-01-20 11:10' },
    ],
  },
  {
    id: 'DSP-1002',
    orderNumber: 'ORD-45756',
    buyer: {
      name: 'Fatima Rahman',
      email: 'fatima@example.com',
      phone: '01812345678',
      totalOrders: 18,
      disputes: 2,
    },
    seller: {
      name: 'Chittagong Electronics',
      email: 'info@ctgelectronics.com',
      phone: '01822222222',
      totalOrders: 320,
      disputes: 6,
      rating: 4.2,
    },
    issueType: 'Product not received',
    filedDate: '2026-01-18',
    priority: 'normal',
    status: 'under_review',
    amountPaid: 15000,
    escrowAmount: 15000,
    deliveryStatus: 'In transit',
    trackingInfo: 'TRK-889102',
    description: 'Order is delayed beyond SLA.',
    evidence: { images: [], documents: [] },
    products: [{ name: 'LED Panel 24W', qty: 30, price: 500 }],
    timeline: [
      { id: 'tl-1', label: 'Order placed', time: '2026-01-10 09:00' },
      { id: 'tl-2', label: 'Payment made', time: '2026-01-10 09:08' },
      { id: 'tl-3', label: 'Dispute filed', time: '2026-01-18 14:20' },
    ],
    conversation: [
      { id: 'msg-3', author: 'Fatima Rahman', role: 'buyer', message: 'No tracking update.', time: '3 days ago' },
      { id: 'msg-4', author: 'Admin', role: 'admin', message: 'We are investigating.', time: '2 days ago' },
    ],
    auditTrail: [
      { id: 'aud-3', actor: 'System', action: 'Dispute created', time: '2026-01-18 14:20' },
    ],
  },
  {
    id: 'DSP-1003',
    orderNumber: 'ORD-45601',
    buyer: {
      name: 'Abdul Malik',
      email: 'abdul@example.com',
      phone: '01912345678',
      totalOrders: 5,
      disputes: 1,
    },
    seller: {
      name: 'Sylhet Traders',
      email: 'sales@sylhettraders.com',
      phone: '01933333333',
      totalOrders: 120,
      disputes: 9,
      rating: 3.8,
    },
    issueType: 'Wrong product received',
    filedDate: '2026-01-12',
    priority: 'high',
    status: 'resolved',
    amountPaid: 8500,
    escrowAmount: 0,
    deliveryStatus: 'Delivered',
    trackingInfo: 'TRK-889001',
    description: 'Received wrong item.',
    evidence: { images: ['/img/disputes/img-3.png'], documents: [] },
    products: [{ name: 'Industrial Gloves', qty: 50, price: 170 }],
    timeline: [
      { id: 'tl-1', label: 'Dispute filed', time: '2026-01-12 10:00' },
      { id: 'tl-2', label: 'Resolved', time: '2026-01-13 15:15' },
    ],
    conversation: [
      { id: 'msg-5', author: 'Admin', role: 'admin', message: 'Refund processed.', time: '1 week ago' },
    ],
    auditTrail: [
      { id: 'aud-4', actor: 'Admin Nayeem', action: 'Full refund', time: '2026-01-13 15:15' },
    ],
  },
]

const ISSUE_TYPES: Array<IssueType> = [
  'Product not received',
  'Product damaged',
  'Wrong product received',
  'Quality issues',
  'Refund not processed',
  'Seller unresponsive',
  'Payment issues',
  'Other',
]

const STATUS_TABS: Array<{ label: string; value: DisputeStatus }> = [
  { label: 'Open', value: 'open' },
  { label: 'Under Review', value: 'under_review' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
]

const ISSUE_CHART = [
  { name: 'Not received', value: 12 },
  { name: 'Damaged', value: 9 },
  { name: 'Wrong item', value: 7 },
  { name: 'Refund', value: 5 },
]

const REFUND_TRENDS = [
  { month: 'Oct', refund: 120000 },
  { month: 'Nov', refund: 98000 },
  { month: 'Dec', refund: 150000 },
  { month: 'Jan', refund: 112000 },
]

const sellerDisputes = [
  { name: 'Sylhet Traders', count: 9 },
  { name: 'Chittagong Electronics', count: 6 },
  { name: 'Rahim Textiles', count: 4 },
]

const buyerDisputes = [
  { name: 'Abdul Malik', count: 3 },
  { name: 'Fatima Rahman', count: 2 },
  { name: 'Karim Hossain', count: 2 },
]

function statusBadge(status: DisputeStatus) {
  switch (status) {
    case 'open':
      return <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700">Open</span>
    case 'under_review':
      return <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs text-yellow-700">Under Review</span>
    case 'resolved':
      return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700">Resolved</span>
    case 'closed':
      return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">Closed</span>
    case 'awaiting_response':
      return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs text-blue-700">Awaiting Response</span>
    case 'escalated':
      return <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs text-orange-700">Escalated</span>
  }
}

export function AdminDisputesPage() {
  const [activeTab, setActiveTab] = useState<DisputeStatus>('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [issueFilter, setIssueFilter] = useState<IssueType | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null)
  const [fullRefundOpen, setFullRefundOpen] = useState(false)
  const [partialRefundOpen, setPartialRefundOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [requestInfoOpen, setRequestInfoOpen] = useState(false)
  const [escalateOpen, setEscalateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [fullRefundNotify, setFullRefundNotify] = useState(true)
  const [partialAmount, setPartialAmount] = useState('')
  const [partialReason, setPartialReason] = useState('')
  const [rejectReason, setRejectReason] = useState('Insufficient evidence')
  const [rejectDetails, setRejectDetails] = useState('')
  const [requestRecipient, setRequestRecipient] = useState('Buyer')
  const [requestDeadline, setRequestDeadline] = useState('24 hours')
  const [requestMessage, setRequestMessage] = useState('')
  const [escalateReason, setEscalateReason] = useState('')
  const [adminNote, setAdminNote] = useState('')

  useEffect(() => {
    setOpenMenuId(null)
  }, [activeTab])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return DISPUTES.filter((dispute) => {
      const matchesTab = dispute.status === activeTab
      const matchesSearch =
        !query ||
        dispute.orderNumber.toLowerCase().includes(query) ||
        dispute.buyer.name.toLowerCase().includes(query) ||
        dispute.seller.name.toLowerCase().includes(query)
      const matchesIssue = issueFilter === 'all' || dispute.issueType === issueFilter
      const matchesPriority = priorityFilter === 'all' || dispute.priority === priorityFilter
      const filedDate = new Date(dispute.filedDate)
      const withinFrom = dateFrom ? filedDate >= new Date(dateFrom) : true
      const withinTo = dateTo ? filedDate <= new Date(dateTo) : true
      return matchesTab && matchesSearch && matchesIssue && matchesPriority && withinFrom && withinTo
    })
  }, [activeTab, searchQuery, issueFilter, priorityFilter, dateFrom, dateTo])

  const sortedDisputes = [...filtered].sort(
    (a, b) => new Date(a.filedDate).getTime() - new Date(b.filedDate).getTime(),
  )

  const openCount = DISPUTES.filter((d) => d.status === 'open').length
  const underReviewCount = DISPUTES.filter((d) => d.status === 'under_review').length
  const resolvedCount = DISPUTES.filter((d) => d.status === 'resolved').length
  const closedCount = DISPUTES.filter((d) => d.status === 'closed').length

  const stats = {
    open: openCount,
    resolvedToday: 6,
    avgResolution: 48,
    refundToday: 125000,
    myResolved: 4,
  }

  return (
    <AdminProtectedRoute requiredPermission="canResolveDisputes">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dispute Resolution</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                openCount > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {openCount} open disputes
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={14} />
                Avg resolution time: {stats.avgResolution} hours (target &lt;72h)
              </span>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm text-slate-700">
            <ChevronDown size={16} />
            Export
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === 'open'
                ? openCount
                : tab.value === 'under_review'
                  ? underReviewCount
                  : tab.value === 'resolved'
                    ? resolvedCount
                    : closedCount
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                  activeTab === tab.value
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order, buyer, seller"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value as IssueType | 'all')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">Issue Type: All</option>
                {ISSUE_TYPES.map((issue) => (
                  <option key={issue} value={issue}>
                    {issue}
                  </option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">Priority: All</option>
                <option value="normal">Priority: Normal</option>
                <option value="high">Priority: High</option>
              </select>
              <div className="flex items-center gap-2 text-sm text-slate-600">Date range</div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              <span className="text-sm text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Dispute ID</th>
                  <th className="px-4 py-3 text-left">Order Number</th>
                  <th className="px-4 py-3 text-left">Buyer</th>
                  <th className="px-4 py-3 text-left">Seller</th>
                  <th className="px-4 py-3 text-left">Issue Type</th>
                  <th className="px-4 py-3 text-left">Filed Date</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Assigned To</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedDisputes.map((dispute) => (
                  <tr key={dispute.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{dispute.id}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <button className="text-orange-600 hover:text-orange-700">{dispute.orderNumber}</button>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dispute.buyer.name}</td>
                    <td className="px-4 py-3 text-slate-600">{dispute.seller.name}</td>
                    <td className="px-4 py-3 text-slate-600">{dispute.issueType}</td>
                    <td className="px-4 py-3 text-slate-600">{dispute.filedDate}</td>
                    <td className="px-4 py-3">
                      {dispute.priority === 'high' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                          <Flag size={12} />
                          High
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Normal</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{dispute.assignedTo || 'Unassigned'}</td>
                    <td className="px-4 py-3">{statusBadge(dispute.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedDispute(dispute)}
                        className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedDisputes.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-500">
                      No disputes found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Open disputes</p>
            <p className={`mt-2 text-xl font-semibold ${stats.open > 10 ? 'text-red-600' : 'text-slate-900'}`}>
              {stats.open}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Resolved today</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{stats.resolvedToday}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Average resolution</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{stats.avgResolution}h</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Refund issued today</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">₹{stats.refundToday.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">My disputes resolved</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{stats.myResolved}</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Common Dispute Reasons</h3>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ISSUE_CHART} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                    {ISSUE_CHART.map((entry, index) => (
                      <Cell key={entry.name} fill={['#f97316', '#facc15', '#ef4444', '#22c55e'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Disputes by Seller</h3>
            <div className="mt-3 space-y-2">
              {sellerDisputes.map((seller) => (
                <div key={seller.name} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{seller.name}</span>
                  <span className="font-medium text-slate-900">{seller.count}</span>
                </div>
              ))}
            </div>
            <h3 className="mt-4 text-sm font-semibold text-slate-900">Disputes by Buyer</h3>
            <div className="mt-3 space-y-2">
              {buyerDisputes.map((buyer) => (
                <div key={buyer.name} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{buyer.name}</span>
                  <span className="font-medium text-slate-900">{buyer.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Refund Rate Trend</h3>
            <div className="mt-3 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={REFUND_TRENDS}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="refund" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/80">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white">
              <div>
                <h2 className="text-lg font-semibold">Dispute Review - {selectedDispute.id}</h2>
                <p className="text-xs text-slate-400">Order {selectedDispute.orderNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAssignOpen(true)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs"
                >
                  Assign to Me
                </button>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="w-full lg:w-1/3 bg-white p-6 overflow-y-auto border-r border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Dispute Information</h3>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p><strong>Dispute ID:</strong> {selectedDispute.id}</p>
                  <p><strong>Filed Date:</strong> {selectedDispute.filedDate}</p>
                  <p><strong>Order:</strong> {selectedDispute.orderNumber}</p>
                  <p><strong>Issue:</strong> {selectedDispute.issueType}</p>
                  <p><strong>Priority:</strong> {selectedDispute.priority}</p>
                  <p><strong>Status:</strong> {statusBadge(selectedDispute.status)}</p>
                </div>
                <div className="mt-6 space-y-4">
                  <div>
                    <h4 className="text-xs uppercase text-slate-400">Buyer</h4>
                    <div className="mt-2 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{selectedDispute.buyer.name}</p>
                      <p>{selectedDispute.buyer.email}</p>
                      <p>{selectedDispute.buyer.phone}</p>
                      <p>Orders: {selectedDispute.buyer.totalOrders}</p>
                      <p>Disputes: {selectedDispute.buyer.disputes}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase text-slate-400">Seller</h4>
                    <div className="mt-2 text-sm text-slate-600">
                      <p className="font-medium text-slate-900">{selectedDispute.seller.name}</p>
                      <p>{selectedDispute.seller.email}</p>
                      <p>{selectedDispute.seller.phone}</p>
                      <p>Orders: {selectedDispute.seller.totalOrders}</p>
                      <p>Disputes: {selectedDispute.seller.disputes}</p>
                      <p>Rating: {selectedDispute.seller.rating}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-2/5 bg-slate-50 p-6 overflow-y-auto border-r border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">Evidence & Timeline</h3>
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm text-slate-600">{selectedDispute.description}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedDispute.evidence.images.map((img) => (
                      <div key={img} className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <FileText size={20} />
                      </div>
                    ))}
                  </div>
                  {selectedDispute.evidence.documents.length > 0 && (
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {selectedDispute.evidence.documents.map((doc) => (
                        <p key={doc}>{doc}</p>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Order Details</h4>
                  <div className="mt-2 text-sm text-slate-600">
                    <p>Amount paid: ₹{selectedDispute.amountPaid.toLocaleString()}</p>
                    <p>Delivery: {selectedDispute.deliveryStatus}</p>
                    <p>Tracking: {selectedDispute.trackingInfo}</p>
                    <div className="mt-2">
                      {selectedDispute.products.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs text-slate-500">
                          <span>{item.name}</span>
                          <span>{item.qty} x ₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-slate-900">Timeline</h4>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    {selectedDispute.timeline.map((step) => (
                      <div key={step.id} className="flex items-center justify-between">
                        <span>{step.label}</span>
                        <span className="text-xs text-slate-400">{step.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Conversation Thread</h4>
                    <button className="text-xs text-orange-600">Add Comment</button>
                  </div>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    {selectedDispute.conversation.map((msg) => (
                      <div key={msg.id} className="rounded-lg border border-slate-200 px-3 py-2">
                        <p className="font-medium text-slate-900">{msg.author}</p>
                        <p>{msg.message}</p>
                        <p className="text-xs text-slate-400">{msg.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/3 bg-white p-6 overflow-y-auto">
                <h3 className="text-sm font-semibold text-slate-900">Resolution Actions</h3>
                <div className="mt-3 space-y-4">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-900">Full Refund</p>
                    <p className="text-xs text-slate-500">Refund amount: ₹{selectedDispute.amountPaid.toLocaleString()}</p>
                    <button
                      onClick={() => setFullRefundOpen(true)}
                      className="mt-2 w-full rounded-lg bg-green-600 px-3 py-2 text-sm text-white"
                    >
                      Process Full Refund
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <p className="text-sm font-medium text-slate-900">Partial Refund</p>
                    <input
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      placeholder="Refund amount"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      value={partialReason}
                      onChange={(e) => setPartialReason(e.target.value)}
                      placeholder="Reason/justification"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <button
                      onClick={() => setPartialRefundOpen(true)}
                      className="w-full rounded-lg bg-orange-600 px-3 py-2 text-sm text-white"
                    >
                      Process Partial Refund
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <p className="text-sm font-medium text-slate-900">Reject Dispute</p>
                    <button
                      onClick={() => setRejectOpen(true)}
                      className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                    >
                      Reject Dispute
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <p className="text-sm font-medium text-slate-900">Request More Info</p>
                    <button
                      onClick={() => setRequestInfoOpen(true)}
                      className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm text-white"
                    >
                      Send Request
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4 space-y-2">
                    <p className="text-sm font-medium text-slate-900">Escalate</p>
                    <button
                      onClick={() => setEscalateOpen(true)}
                      className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"
                    >
                      Escalate Dispute
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-900">Escrow</p>
                    <p className="text-xs text-slate-500">Escrow amount: ₹{selectedDispute.escrowAmount.toLocaleString()}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">Release to seller</button>
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">Release to buyer</button>
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">Split escrow</button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-900">Admin Notes</label>
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Internal notes"
                      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                    />
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h4 className="text-sm font-semibold text-slate-900">Audit Trail</h4>
                    <div className="mt-2 space-y-2 text-xs text-slate-500">
                      {selectedDispute.auditTrail.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-slate-200 px-3 py-2">
                          <p className="font-medium text-slate-900">{entry.action}</p>
                          <p>{entry.actor} • {entry.time}</p>
                          {entry.notes && <p>Notes: {entry.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {fullRefundOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <DollarSign className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Issue full refund of ₹{selectedDispute.amountPaid.toLocaleString()}?
                </h2>
              </div>
              <button onClick={() => setFullRefundOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600 space-y-2">
              <p>Reason: {selectedDispute.issueType}</p>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={fullRefundNotify}
                  onChange={(e) => setFullRefundNotify(e.target.checked)}
                />
                Notify buyer and seller
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setFullRefundOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setFullRefundOpen(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {partialRefundOpen && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Scale className="text-orange-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Confirm Partial Refund</h2>
              </div>
              <button onClick={() => setPartialRefundOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600 space-y-2">
              <p>₹{partialAmount || 0} refunded to buyer</p>
              <p>₹{Math.max(selectedDispute.amountPaid - Number(partialAmount || 0), 0)} released to seller</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setPartialRefundOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setPartialRefundOpen(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Confirm Partial Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Ban className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Reject Dispute</h2>
              </div>
              <button onClick={() => setRejectOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option>Insufficient evidence</option>
                <option>Buyer misuse</option>
                <option>Order as described</option>
                <option>Shipping issue (not seller fault)</option>
                <option>Other</option>
              </select>
              <textarea
                value={rejectDetails}
                onChange={(e) => setRejectDetails(e.target.value)}
                placeholder="Detailed explanation"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setRejectOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setRejectOpen(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Reject Dispute
              </button>
            </div>
          </div>
        </div>
      )}

      {requestInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Request More Info</h2>
              </div>
              <button onClick={() => setRequestInfoOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              <select
                value={requestRecipient}
                onChange={(e) => setRequestRecipient(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option>Buyer</option>
                <option>Seller</option>
                <option>Both</option>
              </select>
              <select
                value={requestDeadline}
                onChange={(e) => setRequestDeadline(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option>24 hours</option>
                <option>48 hours</option>
                <option>72 hours</option>
              </select>
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="What info is needed?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setRequestInfoOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setRequestInfoOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {escalateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-orange-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Escalate Dispute</h2>
              </div>
              <button onClick={() => setEscalateOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              <textarea
                value={escalateReason}
                onChange={(e) => setEscalateReason(e.target.value)}
                placeholder="Escalation reason"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setEscalateOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setEscalateOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}

      {assignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <User className="text-slate-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Assignment</h2>
              </div>
              <button onClick={() => setAssignOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              Assigning will prevent other admins from editing this dispute.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setAssignOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setAssignOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Assign to Me
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  )
}
