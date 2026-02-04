import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  ShieldCheck,
  ShieldX,
  Ban,
  Trash2,
  Download,
  UserPlus,
  Filter,
  ChevronDown,
  X,
  AlertTriangle,
  FileCheck,
  FileX2,
  Image,
  BarChart3,
  FileText,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { AdminProtectedRoute } from './AdminProtectedRoute'

type KycStatus = 'pending' | 'verified' | 'rejected'
type SupplierStatus = 'active' | 'suspended'
type PerformanceFilter = 'all' | 'top' | 'new' | 'low'
type SortKey = 'name' | 'gmv' | 'orders' | 'date'
type DetailTab = 'business' | 'kyc' | 'products' | 'orders' | 'analytics' | 'activity'

type Supplier = {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  kycStatus: KycStatus
  verificationBadge: 'none' | 'verified' | 'premium'
  totalProducts: number
  totalOrders: number
  gmv: number
  registrationDate: string
  status: SupplierStatus
  category: string
  businessType: string
  tradeLicense: string
  address: string
  bank: {
    name: string
    accountName: string
    accountNumberMasked: string
    branch: string
  }
  lastActive: string
  kycDocs: {
    tradeLicense: string
    nidFront: string
    nidBack: string
    bankProof: string
  }
  kycDecision?: {
    date: string
    reason?: string
  }
  analytics: {
    fulfillmentRate: number
    averageRating: number
    rfqResponseRate: number
    topProducts: Array<{ name: string; gmv: number }>
    gmvSeries: Array<{ date: string; gmv: number }>
  }
  activityLog: Array<{ id: string; message: string; time: string }>
}

const CATEGORIES = [
  'Apparel & Fashion',
  'Electronics',
  'Home & Kitchen',
  'Industrial Supplies',
  'Health & Beauty',
  'Grocery & FMCG',
  'Construction Materials',
]

const SUPPLIERS: Supplier[] = [
  {
    id: 'BB-S-1021',
    businessName: 'Rahim Textiles Ltd.',
    ownerName: 'Rahim Uddin',
    email: 'contact@rahimtextiles.com',
    phone: '01711111111',
    kycStatus: 'verified',
    verificationBadge: 'premium',
    totalProducts: 156,
    totalOrders: 1240,
    gmv: 2450000,
    registrationDate: '2023-06-15',
    status: 'active',
    category: 'Apparel & Fashion',
    businessType: 'Manufacturer',
    tradeLicense: 'TL-987654',
    address: 'Tejgaon, Dhaka',
    bank: {
      name: 'BRAC Bank',
      accountName: 'Rahim Textiles Ltd.',
      accountNumberMasked: '**** 2456',
      branch: 'Gulshan',
    },
    lastActive: '2026-02-03 10:45',
    kycDocs: {
      tradeLicense: '/img/kyc/trade-license.png',
      nidFront: '/img/kyc/nid-front.png',
      nidBack: '/img/kyc/nid-back.png',
      bankProof: '/img/kyc/bank-proof.png',
    },
    kycDecision: { date: '2023-06-18' },
    analytics: {
      fulfillmentRate: 96,
      averageRating: 4.8,
      rfqResponseRate: 92,
      topProducts: [
        { name: 'Cotton Bedsheets', gmv: 450000 },
        { name: 'Denim Fabric', gmv: 390000 },
      ],
      gmvSeries: [
        { date: 'Jan', gmv: 180000 },
        { date: 'Feb', gmv: 210000 },
        { date: 'Mar', gmv: 190000 },
        { date: 'Apr', gmv: 230000 },
        { date: 'May', gmv: 250000 },
        { date: 'Jun', gmv: 240000 },
      ],
    },
    activityLog: [
      { id: 'act-1', message: 'Added 3 new products', time: '2 hours ago' },
      { id: 'act-2', message: 'Fulfilled order ORD-45998', time: '1 day ago' },
      { id: 'act-3', message: 'Responded to RFQ #RFQ-120', time: '3 days ago' },
    ],
  },
  {
    id: 'BB-S-1103',
    businessName: 'Chittagong Electronics',
    ownerName: 'Fahim Chowdhury',
    email: 'info@ctgelectronics.com',
    phone: '01822222222',
    kycStatus: 'pending',
    verificationBadge: 'none',
    totalProducts: 12,
    totalOrders: 24,
    gmv: 180000,
    registrationDate: '2026-01-12',
    status: 'active',
    category: 'Electronics',
    businessType: 'Distributor',
    tradeLicense: 'TL-456123',
    address: 'Agrabad, Chittagong',
    bank: {
      name: 'Dutch-Bangla Bank',
      accountName: 'Chittagong Electronics',
      accountNumberMasked: '**** 7832',
      branch: 'Agrabad',
    },
    lastActive: '2026-02-02 15:30',
    kycDocs: {
      tradeLicense: '/img/kyc/trade-license.png',
      nidFront: '/img/kyc/nid-front.png',
      nidBack: '/img/kyc/nid-back.png',
      bankProof: '/img/kyc/bank-proof.png',
    },
    analytics: {
      fulfillmentRate: 82,
      averageRating: 4.2,
      rfqResponseRate: 75,
      topProducts: [
        { name: 'LED Panels', gmv: 55000 },
        { name: 'Power Supplies', gmv: 32000 },
      ],
      gmvSeries: [
        { date: 'Jan', gmv: 20000 },
        { date: 'Feb', gmv: 30000 },
        { date: 'Mar', gmv: 25000 },
        { date: 'Apr', gmv: 35000 },
        { date: 'May', gmv: 40000 },
        { date: 'Jun', gmv: 30000 },
      ],
    },
    activityLog: [
      { id: 'act-4', message: 'Uploaded KYC documents', time: '2 days ago' },
      { id: 'act-5', message: 'Added product SKU-982', time: '4 days ago' },
    ],
  },
  {
    id: 'BB-S-1180',
    businessName: 'Sylhet Traders',
    ownerName: 'Arif Ahmed',
    email: 'sales@sylhettraders.com',
    phone: '01933333333',
    kycStatus: 'rejected',
    verificationBadge: 'none',
    totalProducts: 8,
    totalOrders: 0,
    gmv: 0,
    registrationDate: '2025-12-05',
    status: 'suspended',
    category: 'Grocery & FMCG',
    businessType: 'Wholesaler',
    tradeLicense: 'TL-220144',
    address: 'Sylhet, Bangladesh',
    bank: {
      name: 'Sonali Bank',
      accountName: 'Sylhet Traders',
      accountNumberMasked: '**** 3322',
      branch: 'Sylhet',
    },
    lastActive: '2025-12-21 11:15',
    kycDocs: {
      tradeLicense: '/img/kyc/trade-license.png',
      nidFront: '/img/kyc/nid-front.png',
      nidBack: '/img/kyc/nid-back.png',
      bankProof: '/img/kyc/bank-proof.png',
    },
    kycDecision: { date: '2025-12-18', reason: 'Document not clear/readable' },
    analytics: {
      fulfillmentRate: 0,
      averageRating: 0,
      rfqResponseRate: 0,
      topProducts: [],
      gmvSeries: [
        { date: 'Jan', gmv: 0 },
        { date: 'Feb', gmv: 0 },
        { date: 'Mar', gmv: 0 },
        { date: 'Apr', gmv: 0 },
        { date: 'May', gmv: 0 },
        { date: 'Jun', gmv: 0 },
      ],
    },
    activityLog: [
      { id: 'act-6', message: 'KYC rejected', time: '6 weeks ago' },
      { id: 'act-7', message: 'Account suspended', time: '1 month ago' },
    ],
  },
]

const KYC_OPTIONS: Array<{ label: string; value: KycStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
]

const STATUS_OPTIONS: Array<{ label: string; value: SupplierStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
]

const PERFORMANCE_OPTIONS: Array<{ label: string; value: PerformanceFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Top Sellers', value: 'top' },
  { label: 'New Sellers', value: 'new' },
  { label: 'Low Performers', value: 'low' },
]

const SORT_OPTIONS: Array<{ label: string; value: SortKey }> = [
  { label: 'Name', value: 'name' },
  { label: 'GMV', value: 'gmv' },
  { label: 'Orders', value: 'orders' },
  { label: 'Registration Date', value: 'date' },
]

const PAGE_SIZE = 50

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString()}`
}

function kycBadge(status: KycStatus) {
  if (status === 'verified') {
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Verified</span>
  }
  if (status === 'pending') {
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>
  }
  return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Rejected</span>
}

function statusBadge(status: SupplierStatus) {
  if (status === 'active') {
    return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Active</span>
  }
  return <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Suspended</span>
}

export function AdminSuppliersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState<KycStatus | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>('all')
  const [performanceFilter, setPerformanceFilter] = useState<PerformanceFilter>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('business')
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReasons, setRejectReasons] = useState<string[]>([])
  const [rejectOther, setRejectOther] = useState('')
  const [rejectCorrections, setRejectCorrections] = useState('')
  const [approveNotes, setApproveNotes] = useState('')
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [suspendDuration, setSuspendDuration] = useState('7 days')
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)
  const [bulkVerifyOpen, setBulkVerifyOpen] = useState(false)
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [searchQuery, kycFilter, statusFilter, performanceFilter, selectedCategories, sortBy])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return SUPPLIERS.filter((supplier) => {
      const matchesSearch =
        !query ||
        supplier.businessName.toLowerCase().includes(query) ||
        supplier.email.toLowerCase().includes(query) ||
        supplier.phone.toLowerCase().includes(query)
      const matchesKyc = kycFilter === 'all' || supplier.kycStatus === kycFilter
      const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(supplier.category)

      const matchesPerformance = (() => {
        if (performanceFilter === 'all') return true
        if (performanceFilter === 'top') return supplier.gmv >= 1000000
        if (performanceFilter === 'new') return supplier.registrationDate >= '2025-12-01'
        return supplier.totalOrders === 0
      })()

      return matchesSearch && matchesKyc && matchesStatus && matchesPerformance && matchesCategory
    })
  }, [searchQuery, kycFilter, statusFilter, performanceFilter, selectedCategories])

  const sortedSuppliers = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortBy === 'name') return a.businessName.localeCompare(b.businessName)
      if (sortBy === 'gmv') return b.gmv - a.gmv
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders
      return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
    })
    return copy
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedSuppliers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageSuppliers = sortedSuppliers.slice(pageStart, pageStart + PAGE_SIZE)

  const totalSuppliers = SUPPLIERS.length
  const activeSuppliers = SUPPLIERS.filter((s) => s.status === 'active').length
  const kycPending = SUPPLIERS.filter((s) => s.kycStatus === 'pending').length
  const suspendedSuppliers = SUPPLIERS.filter((s) => s.status === 'suspended').length

  const topSuppliers = [...SUPPLIERS].sort((a, b) => b.gmv - a.gmv).slice(0, 10)
  const underperformers = SUPPLIERS.filter((s) => s.totalOrders === 0)
  const newSuppliers = SUPPLIERS.filter((s) => s.registrationDate >= '2025-12-01').length

  const toggleSelectAll = () => {
    if (pageSuppliers.length === 0) return
    const pageIds = pageSuppliers.map((s) => s.id)
    const allSelected = pageIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const exportSuppliers = (scope: 'all' | 'filtered', format: 'csv' | 'excel') => {
    const exportData = scope === 'all' ? SUPPLIERS : sortedSuppliers
    const header = [
      'Supplier ID',
      'Business Name',
      'Owner Name',
      'Email',
      'KYC Status',
      'Products',
      'Orders',
      'GMV',
      'Registration Date',
      'Status',
    ]
    const rows = exportData.map((s) => [
      s.id,
      s.businessName,
      s.ownerName,
      s.email,
      s.kycStatus,
      String(s.totalProducts),
      String(s.totalOrders),
      String(s.gmv),
      s.registrationDate,
      s.status,
    ])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const suffix = format === 'excel' ? 'xlsx' : 'csv'
    link.href = url
    link.download = `borobepari-suppliers-${scope}.${suffix}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  const selectedCount = selectedIds.length

  return (
    <AdminProtectedRoute requiredPermission="canManageSuppliers">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Supplier Management</h1>
            <p className="text-sm text-slate-500">Total: {totalSuppliers} sellers</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <UserPlus size={16} />
              + Add Supplier
            </button>
            <div className="relative">
              <button
                onClick={() => setExportOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </button>
              {exportOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Export Scope</div>
                    <button
                      onClick={() => exportSuppliers('all', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export All (CSV)
                    </button>
                    <button
                      onClick={() => exportSuppliers('all', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export All (Excel)
                    </button>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">Filtered</div>
                    <button
                      onClick={() => exportSuppliers('filtered', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export Filtered (CSV)
                    </button>
                    <button
                      onClick={() => exportSuppliers('filtered', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export Filtered (Excel)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Total Suppliers</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{totalSuppliers}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Active Suppliers</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{activeSuppliers}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">KYC Pending</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">{kycPending}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Suspended</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{suspendedSuppliers}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business name, email, phone"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <Filter size={16} />
                Filters
              </div>
              <select
                value={kycFilter}
                onChange={(e) => setKycFilter(e.target.value as KycStatus | 'all')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {KYC_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    KYC: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SupplierStatus | 'all')}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Status: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={performanceFilter}
                onChange={(e) => setPerformanceFilter(e.target.value as PerformanceFilter)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {PERFORMANCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Performance: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by: {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-600">Category</span>
            {CATEGORIES.map((category) => {
              const active = selectedCategories.includes(category)
              return (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategories((prev) =>
                      prev.includes(category)
                        ? prev.filter((item) => item !== category)
                        : [...prev, category],
                    )
                  }}
                  className={`rounded-full px-3 py-1 text-xs border ${
                    active ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {category}
                </button>
              )
            })}
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="rounded-full px-3 py-1 text-xs border border-slate-200 text-slate-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-orange-800">
              {selectedCount} supplier{selectedCount === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBulkApproveOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm border border-slate-200"
              >
                <FileCheck size={14} />
                Bulk Approve KYC
              </button>
              <button
                onClick={() => setBulkVerifyOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm border border-slate-200"
              >
                <ShieldCheck size={14} />
                Bulk Verify
              </button>
              <button
                onClick={() => setBulkSuspendOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm border border-slate-200"
              >
                <Ban size={14} />
                Bulk Suspend
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm border border-slate-200">
                <Download size={14} />
                Bulk Export
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={pageSuppliers.length > 0 && pageSuppliers.every((s) => selectedIds.includes(s.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Supplier ID</th>
                  <th className="px-4 py-3 text-left">Business Name</th>
                  <th className="px-4 py-3 text-left">Owner Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">KYC Status</th>
                  <th className="px-4 py-3 text-center">Verified</th>
                  <th className="px-4 py-3 text-right">Products</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">GMV (₹)</th>
                  <th className="px-4 py-3 text-left">Registration Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageSuppliers.map((supplier) => {
                  const rowTone =
                    supplier.status === 'suspended'
                      ? 'bg-red-50'
                      : supplier.kycStatus === 'pending'
                        ? 'bg-yellow-50'
                        : supplier.kycStatus === 'verified' && supplier.status === 'active'
                          ? 'bg-green-50'
                          : ''
                  return (
                    <tr key={supplier.id} className={`${rowTone} hover:bg-slate-50`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(supplier.id)}
                          onChange={() => toggleSelectOne(supplier.id)}
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">{supplier.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-slate-400" />
                          <span className="font-medium text-slate-900">{supplier.businessName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{supplier.ownerName}</td>
                      <td className="px-4 py-3 text-slate-600">{supplier.email}</td>
                      <td className="px-4 py-3">{kycBadge(supplier.kycStatus)}</td>
                      <td className="px-4 py-3 text-center">
                        {supplier.verificationBadge !== 'none' ? (
                          <CheckCircle size={16} className="inline-block text-green-600" />
                        ) : (
                          <XCircle size={16} className="inline-block text-slate-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{supplier.totalProducts}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{supplier.totalOrders}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(supplier.gmv)}</td>
                      <td className="px-4 py-3 text-slate-600">{supplier.registrationDate}</td>
                      <td className="px-4 py-3">{statusBadge(supplier.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === supplier.id ? null : supplier.id)}
                            className="rounded-lg p-2 hover:bg-slate-100"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === supplier.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                                <button
                                  onClick={() => {
                                    setDetailSupplier(supplier)
                                    setDetailTab('business')
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                                >
                                  <Eye size={14} />
                                  View Profile
                                </button>
                                <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
                                  <FileText size={14} />
                                  View Products
                                </button>
                                <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
                                  <FileText size={14} />
                                  View Orders
                                </button>
                                {supplier.kycStatus === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setApproveOpen(true)
                                        setDetailSupplier(supplier)
                                        setOpenMenuId(null)
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                                    >
                                      <FileCheck size={14} />
                                      Approve KYC
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRejectOpen(true)
                                        setDetailSupplier(supplier)
                                        setOpenMenuId(null)
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                                    >
                                      <FileX2 size={14} />
                                      Reject KYC
                                    </button>
                                  </>
                                )}
                                {supplier.verificationBadge === 'none' ? (
                                  <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
                                    <ShieldCheck size={14} />
                                    Verify Supplier
                                  </button>
                                ) : (
                                  <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
                                    <ShieldX size={14} />
                                    Revoke Verification
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSuspendOpen(true)
                                    setDetailSupplier(supplier)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                                >
                                  <Ban size={14} />
                                  Suspend Account
                                </button>
                                <button className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50">
                                  <BarChart3 size={14} />
                                  View Analytics
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteOpen(true)
                                    setDetailSupplier(supplier)
                                    setOpenMenuId(null)
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 size={14} />
                                  Delete Account
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {pageSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={13} className="px-4 py-10 text-center text-slate-500">
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing {pageSuppliers.length} of {sortedSuppliers.length} suppliers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Prev
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Next
              </button>
              <span className="ml-2 text-xs text-slate-400">50 per page</span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Top 10 Suppliers (GMV)</h3>
              <span className="text-xs text-slate-500">{newSuppliers} new this month</span>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2 text-right">GMV</th>
                    <th className="px-4 py-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {topSuppliers.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-4 py-2 text-slate-700">{supplier.businessName}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{formatCurrency(supplier.gmv)}</td>
                      <td className="px-4 py-2 text-right text-slate-600">{supplier.totalOrders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Underperformers (0 orders / 30d)</h3>
            <div className="mt-3 space-y-2">
              {underperformers.map((supplier) => (
                <div key={supplier.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{supplier.businessName}</p>
                  <p className="text-xs text-slate-500">{supplier.ownerName}</p>
                </div>
              ))}
              {underperformers.length === 0 && (
                <p className="text-sm text-slate-500">No underperformers found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{detailSupplier.businessName}</h2>
                <p className="text-sm text-slate-500">{detailSupplier.ownerName}</p>
              </div>
              <button onClick={() => setDetailSupplier(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-slate-200 px-6">
              <div className="flex flex-wrap gap-6 text-sm">
                {(['business', 'kyc', 'products', 'orders', 'analytics', 'activity'] as DetailTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`py-3 border-b-2 ${
                      detailTab === tab ? 'border-orange-600 text-orange-600' : 'border-transparent text-slate-500'
                    }`}
                  >
                    {tab === 'business'
                      ? 'Business Info'
                      : tab === 'kyc'
                        ? 'KYC Documents'
                        : tab === 'products'
                          ? 'Products'
                          : tab === 'orders'
                            ? 'Orders'
                            : tab === 'analytics'
                              ? 'Analytics'
                              : 'Activity Log'}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {detailTab === 'business' && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-slate-400">Business Name</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.businessName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Business Type</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.businessType}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Category</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.category}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Trade License</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.tradeLicense}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Owner Name</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Email</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.email}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Phone</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Business Address</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.address}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Bank Details</p>
                      <p className="text-sm font-medium text-slate-900">
                        {detailSupplier.bank.name} • {detailSupplier.bank.accountNumberMasked}
                      </p>
                      <p className="text-xs text-slate-500">{detailSupplier.bank.branch}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Registration Date</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.registrationDate}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400">Last Active</p>
                      <p className="text-sm font-medium text-slate-900">{detailSupplier.lastActive}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm">
                    Edit Business Info
                  </button>
                </div>
              )}

              {detailTab === 'kyc' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {kycBadge(detailSupplier.kycStatus)}
                    {detailSupplier.kycDecision?.date && (
                      <span className="text-xs text-slate-500">Updated: {detailSupplier.kycDecision.date}</span>
                    )}
                    {detailSupplier.kycDecision?.reason && (
                      <span className="text-xs text-red-600">Reason: {detailSupplier.kycDecision.reason}</span>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: 'Trade License', src: detailSupplier.kycDocs.tradeLicense },
                      { label: 'NID Front', src: detailSupplier.kycDocs.nidFront },
                      { label: 'NID Back', src: detailSupplier.kycDocs.nidBack },
                      { label: 'Bank Proof', src: detailSupplier.kycDocs.bankProof },
                    ].map((doc) => (
                      <div key={doc.label} className="rounded-lg border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{doc.label}</p>
                          <button className="text-xs text-orange-600">Zoom</button>
                        </div>
                        <div className="mt-2 flex h-32 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <Image size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-900">Document Checklist</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-slate-300" /> Trade License
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-slate-300" /> NID Front
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded border-slate-300" /> NID Back
                      </label>
                    </div>
                  </div>
                  {detailSupplier.kycStatus === 'pending' && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setApproveOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white"
                      >
                        <FileCheck size={14} />
                        Approve KYC
                      </button>
                      <button
                        onClick={() => setRejectOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
                      >
                        <FileX2 size={14} />
                        Reject KYC
                      </button>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'products' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Total Products</p>
                      <p className="text-lg font-semibold text-slate-900">{detailSupplier.totalProducts}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Active</p>
                      <p className="text-lg font-semibold text-slate-900">120</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Draft</p>
                      <p className="text-lg font-semibold text-slate-900">24</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Out of Stock</p>
                      <p className="text-lg font-semibold text-slate-900">12</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm">
                    View All Products
                  </button>
                </div>
              )}

              {detailTab === 'orders' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Total Orders</p>
                      <p className="text-lg font-semibold text-slate-900">{detailSupplier.totalOrders}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Completed</p>
                      <p className="text-lg font-semibold text-slate-900">1,120</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Cancelled</p>
                      <p className="text-lg font-semibold text-slate-900">32</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">GMV</p>
                      <p className="text-lg font-semibold text-slate-900">{formatCurrency(detailSupplier.gmv)}</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm">
                    View All Orders
                  </button>
                </div>
              )}

              {detailTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Fulfillment Rate</p>
                      <p className="text-lg font-semibold text-slate-900">{detailSupplier.analytics.fulfillmentRate}%</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Average Rating</p>
                      <p className="text-lg font-semibold text-slate-900">{detailSupplier.analytics.averageRating}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">RFQ Response</p>
                      <p className="text-lg font-semibold text-slate-900">{detailSupplier.analytics.rfqResponseRate}%</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3">
                      <p className="text-xs text-slate-400">Top Product</p>
                      <p className="text-sm font-semibold text-slate-900">
                        {detailSupplier.analytics.topProducts[0]?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <p className="text-sm font-semibold text-slate-900">GMV Over Time</p>
                    <div className="mt-3 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detailSupplier.analytics.gmvSeries}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="gmv" stroke="#f97316" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-3">
                  {detailSupplier.activityLog.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between rounded-lg border border-slate-200 px-4 py-3"
                    >
                      <p className="text-sm text-slate-700">{activity.message}</p>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                  ))}
                  {detailSupplier.activityLog.length === 0 && (
                    <p className="text-sm text-slate-500">No activity logged.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {approveOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Approve KYC</h2>
              </div>
              <button onClick={() => setApproveOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                Review document checklist and add notes before approval.
              </div>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setApproveOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setApproveOpen(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Reject KYC</h2>
              </div>
              <button onClick={() => setRejectOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2 text-sm text-slate-700">
                {[
                  'Document not clear/readable',
                  'Document expired',
                  'Name mismatch',
                  'Invalid trade license',
                  'Other',
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rejectReasons.includes(reason)}
                      onChange={(e) => {
                        setRejectReasons((prev) =>
                          e.target.checked ? [...prev, reason] : prev.filter((item) => item !== reason),
                        )
                      }}
                    />
                    {reason}
                  </label>
                ))}
              </div>
              {rejectReasons.includes('Other') && (
                <input
                  value={rejectOther}
                  onChange={(e) => setRejectOther(e.target.value)}
                  placeholder="Other reason"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              )}
              <textarea
                value={rejectCorrections}
                onChange={(e) => setRejectCorrections(e.target.value)}
                placeholder="Required corrections"
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
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Ban className="text-orange-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Suspend {detailSupplier.businessName}?</h2>
              </div>
              <button onClick={() => setSuspendOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-slate-600">
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
                <p>All products hidden from marketplace</p>
                <p>Cannot respond to RFQs</p>
                <p>Pending orders unaffected</p>
                <p>Payouts held (if applicable)</p>
              </div>
              <input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Suspension reason"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                {['7 days', '30 days', 'Permanent'].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSuspendDuration(duration)}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      suspendDuration === duration
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSuspendOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setSuspendOpen(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">Delete {detailSupplier.businessName}?</h2>
              </div>
              <button onClick={() => setDeleteOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                I understand this action is permanent
              </label>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!deleteConfirm}
                onClick={() => setDeleteOpen(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileCheck className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Approve KYC for {selectedCount} suppliers?
                </h2>
              </div>
              <button onClick={() => setBulkApproveOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              Selected suppliers will receive notification and verification badge.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setBulkApproveOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkApproveOpen(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkVerifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Verify {selectedCount} suppliers?
                </h2>
              </div>
              <button onClick={() => setBulkVerifyOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              Verified suppliers receive a badge and higher trust ranking.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setBulkVerifyOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkVerifyOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Verify Suppliers
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkSuspendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Ban className="text-orange-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Suspend {selectedCount} suppliers?
                </h2>
              </div>
              <button onClick={() => setBulkSuspendOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              All selected suppliers will be suspended and products hidden from marketplace.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  )
}
