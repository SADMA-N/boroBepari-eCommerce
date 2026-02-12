import { getAdminSuppliers } from '@/lib/admin-supplier-server'
import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  BarChart3,
  Building2,
  CheckCircle,
  ChevronDown,
  Download,
  Eye,
  FileCheck,
  FileText,
  FileX2,
  Filter,
  Image,
  Loader2,
  MoreVertical,
  Search,
  ShieldCheck,
  ShieldX,
  Trash2,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminProtectedRoute } from './AdminProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

type KycStatus = 'pending' | 'verified' | 'rejected'
type SupplierStatus = 'active' | 'suspended'
type PerformanceFilter = 'all' | 'top' | 'new' | 'low'
type SortKey = 'name' | 'gmv' | 'orders' | 'date'
type DetailTab =
  | 'business'
  | 'kyc'
  | 'products'
  | 'orders'
  | 'analytics'
  | 'activity'

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



const KYC_OPTIONS: Array<{ label: string; value: KycStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Rejected', value: 'rejected' },
]

const STATUS_OPTIONS: Array<{ label: string; value: SupplierStatus | 'all' }> =
  [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Suspended', value: 'suspended' },
  ]

const PERFORMANCE_OPTIONS: Array<{ label: string; value: PerformanceFilter }> =
  [
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
  return `৳${amount.toLocaleString()}`
}

function kycBadge(status: KycStatus) {
  if (status === 'verified') {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        Verified
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
        Pending
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
      Rejected
    </span>
  )
}

function statusBadge(status: SupplierStatus) {
  if (status === 'active') {
    return (
      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        Active
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
      Suspended
    </span>
  )
}

export function AdminSuppliersPage() {
  const { can } = useAdminAuth()
  const canView = can('suppliers.view')
  const canVerify = can('suppliers.verify')
  const canSuspend = can('suppliers.suspend')
  const canKycApprove = can('kyc.approve')
  const canKycReject = can('kyc.reject')
  
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await getAdminSuppliers()
        setSuppliers(data as Supplier[])
      } catch (err) {
        console.error('Failed to load suppliers:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSuppliers()
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [kycFilter, setKycFilter] = useState<KycStatus | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | 'all'>(
    'all',
  )
  const [performanceFilter, setPerformanceFilter] =
    useState<PerformanceFilter>('all')
  const [selectedCategories, setSelectedCategories] = useState<Array<string>>(
    [],
  )
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detailSupplier, setDetailSupplier] = useState<Supplier | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('business')
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReasons, setRejectReasons] = useState<Array<string>>([])
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
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    setPage(1)
  }, [
    searchQuery,
    kycFilter,
    statusFilter,
    performanceFilter,
    selectedCategories,
    sortBy,
  ])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return suppliers.filter((supplier) => {
      const matchesSearch =
        !query ||
        supplier.businessName.toLowerCase().includes(query) ||
        supplier.email.toLowerCase().includes(query) ||
        supplier.phone.toLowerCase().includes(query)
      const matchesKyc = kycFilter === 'all' || supplier.kycStatus === kycFilter
      const matchesStatus =
        statusFilter === 'all' || supplier.status === statusFilter
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(supplier.category)

      const matchesPerformance = (() => {
        if (performanceFilter === 'all') return true
        if (performanceFilter === 'top') return supplier.gmv >= 1000000
        if (performanceFilter === 'new')
          return supplier.registrationDate >= '2025-12-01'
        return supplier.totalOrders === 0
      })()

      return (
        matchesSearch &&
        matchesKyc &&
        matchesStatus &&
        matchesPerformance &&
        matchesCategory
      )
    })
  }, [
    suppliers,
    searchQuery,
    kycFilter,
    statusFilter,
    performanceFilter,
    selectedCategories,
  ])

  const sortedSuppliers = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortBy === 'name') return a.businessName.localeCompare(b.businessName)
      if (sortBy === 'gmv') return b.gmv - a.gmv
      if (sortBy === 'orders') return b.totalOrders - a.totalOrders
      return (
        new Date(b.registrationDate).getTime() -
        new Date(a.registrationDate).getTime()
      )
    })
    return copy
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedSuppliers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageSuppliers = sortedSuppliers.slice(pageStart, pageStart + PAGE_SIZE)

  const totalSuppliers = suppliers.length
  const activeSuppliers = suppliers.filter((s) => s.status === 'active').length
  const kycPending = suppliers.filter((s) => s.kycStatus === 'pending').length
  const suspendedSuppliers = suppliers.filter(
    (s) => s.status === 'suspended',
  ).length

  const topSuppliers = [...suppliers].sort((a, b) => b.gmv - a.gmv).slice(0, 10)
  const underperformers = suppliers.filter((s) => s.totalOrders === 0)
  const newSuppliers = suppliers.filter(
    (s) => s.registrationDate >= '2025-12-01',
  ).length

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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const exportSuppliers = (
    scope: 'all' | 'filtered',
    format: 'csv' | 'excel',
  ) => {
    const exportData = scope === 'all' ? suppliers : sortedSuppliers
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
    if (link.isConnected) {
      link.remove()
    }
    URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  const selectedCount = selectedIds.length

  if (loading) {
    return (
      <AdminProtectedRoute requiredPermissions={['suppliers.view']}>
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="animate-spin text-orange-600" size={32} />
        </div>
      </AdminProtectedRoute>
    )
  }

  return (
    <AdminProtectedRoute requiredPermissions={['suppliers.view']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-white transition-colors">
              Supplier Management
            </h1>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              Total: {totalSuppliers} sellers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={!canView}
              className="inline-flex items-center gap-2 rounded-lg bg-card dark:bg-slate-900 border border-border dark:border-slate-800 px-4 py-2 text-sm font-medium text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <UserPlus size={16} />+ Add Supplier
            </button>
            <div className="relative">
              <button
                onClick={() => setExportOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all"
              >
                <Download size={16} />
                Export
                <ChevronDown size={14} />
              </button>
              {exportOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setExportOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-lg z-20 overflow-hidden transition-colors">
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase">
                      Export Scope
                    </div>
                    <button
                      onClick={() => exportSuppliers('all', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                    >
                      Export All (CSV)
                    </button>
                    <button
                      onClick={() => exportSuppliers('all', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                    >
                      Export All (Excel)
                    </button>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground dark:text-muted-foreground uppercase border-t border-slate-100 dark:border-slate-800">
                      Filtered
                    </div>
                    <button
                      onClick={() => exportSuppliers('filtered', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
                    >
                      Export Filtered (CSV)
                    </button>
                    <button
                      onClick={() => exportSuppliers('filtered', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
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
          <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              Total Suppliers
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground dark:text-white transition-colors">
              {totalSuppliers}
            </p>
          </div>
          <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              Active Suppliers
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground dark:text-white transition-colors">
              {activeSuppliers}
            </p>
          </div>
          <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              KYC Pending
            </p>
            <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400 transition-colors">
              {kycPending}
            </p>
          </div>
          <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              Suspended
            </p>
            <p className="mt-2 text-2xl font-semibold text-foreground dark:text-white transition-colors">
              {suspendedSuppliers}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 space-y-4 transition-colors">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business name, email, phone"
                className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-foreground dark:text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                <Filter size={16} />
                Filters
              </div>
              <select
                value={kycFilter}
                onChange={(e) =>
                  setKycFilter(e.target.value as KycStatus | 'all')
                }
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
              >
                {KYC_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    KYC: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as SupplierStatus | 'all')
                }
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    Status: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={performanceFilter}
                onChange={(e) =>
                  setPerformanceFilter(e.target.value as PerformanceFilter)
                }
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
              >
                {PERFORMANCE_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    Performance: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-2 text-sm text-foreground dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
              >
                {SORT_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    Sort by: {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              Category
            </span>
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
                  className={`rounded-full px-3 py-1 text-xs border transition-colors ${
                    active
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'border-border dark:border-slate-800 text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-slate-800'
                  }`}
                >
                  {category}
                </button>
              )
            })}
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="rounded-full px-3 py-1 text-xs border border-border dark:border-slate-800 text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-slate-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {selectedCount > 0 && (
          <div className="rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors">
            <p className="text-sm text-orange-800 dark:text-orange-400">
              {selectedCount} supplier{selectedCount === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBulkApproveOpen(true)}
                disabled={!canKycApprove}
                className="inline-flex items-center gap-2 rounded-lg bg-card dark:bg-slate-900 px-3 py-2 text-sm border border-border dark:border-slate-800 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                <FileCheck size={14} />
                Bulk Approve KYC
              </button>
              <button
                onClick={() => setBulkVerifyOpen(true)}
                disabled={!canVerify}
                className="inline-flex items-center gap-2 rounded-lg bg-card dark:bg-slate-900 px-3 py-2 text-sm border border-border dark:border-slate-800 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                <ShieldCheck size={14} />
                Bulk Verify
              </button>
              <button
                onClick={() => setBulkSuspendOpen(true)}
                disabled={!canSuspend}
                className="inline-flex items-center gap-2 rounded-lg bg-card dark:bg-slate-900 px-3 py-2 text-sm border border-border dark:border-slate-800 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                <Ban size={14} />
                Bulk Suspend
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-card dark:bg-slate-900 px-3 py-2 text-sm border border-border dark:border-slate-800 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
                <Download size={14} />
                Bulk Export
              </button>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted dark:bg-slate-800/50 text-muted-foreground dark:text-muted-foreground transition-colors">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        pageSuppliers.length > 0 &&
                        pageSuppliers.every((s) => selectedIds.includes(s.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-border dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
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
                  <th className="px-4 py-3 text-right">GMV (৳)</th>
                  <th className="px-4 py-3 text-left">Registration Date</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-slate-800 transition-colors">
                {pageSuppliers.map((supplier) => {
                  const rowTone =
                    supplier.status === 'suspended'
                      ? 'bg-red-50 dark:bg-red-900/10'
                      : supplier.kycStatus === 'pending'
                        ? 'bg-yellow-50 dark:bg-yellow-900/10'
                        : supplier.kycStatus === 'verified'
                          ? 'bg-green-50 dark:bg-green-900/10'
                          : ''
                  return (
                    <tr
                      key={supplier.id}
                      className={`${rowTone} hover:bg-muted dark:hover:bg-slate-800/50 transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(supplier.id)}
                          onChange={() => toggleSelectOne(supplier.id)}
                          className="rounded border-border dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground dark:text-slate-100 transition-colors">
                        {supplier.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2
                            size={16}
                            className="text-muted-foreground dark:text-muted-foreground"
                          />
                          <span className="font-medium text-foreground dark:text-slate-100 transition-colors">
                            {supplier.businessName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground transition-colors">
                        {supplier.ownerName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground transition-colors">
                        {supplier.email}
                      </td>
                      <td className="px-4 py-3">
                        {kycBadge(supplier.kycStatus)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {supplier.verificationBadge !== 'none' ? (
                          <CheckCircle
                            size={16}
                            className="inline-block text-green-600"
                          />
                        ) : (
                          <XCircle
                            size={16}
                            className="inline-block text-muted-foreground dark:text-muted-foreground"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground dark:text-muted-foreground transition-colors">
                        {supplier.totalProducts}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground dark:text-muted-foreground transition-colors">
                        {supplier.totalOrders}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground dark:text-muted-foreground transition-colors">
                        {formatCurrency(supplier.gmv)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground dark:text-muted-foreground transition-colors">
                        {supplier.registrationDate}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(supplier.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === supplier.id ? null : supplier.id,
                              )
                            }
                            className="rounded-lg p-2 hover:bg-muted dark:hover:bg-slate-800 transition-colors text-muted-foreground dark:text-muted-foreground"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === supplier.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 shadow-lg transition-colors overflow-hidden">
                                <button
                                  onClick={() => {
                                    setDetailSupplier(supplier)
                                    setDetailTab('business')
                                    setOpenMenuId(null)
                                  }}
                                  disabled={!canView}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <Eye size={14} />
                                  View Profile
                                </button>
                                <button
                                  disabled={!canView}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <FileText size={14} />
                                  View Products
                                </button>
                                <button
                                  disabled={!canView}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
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
                                      disabled={!canKycApprove}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
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
                                      disabled={!canKycReject}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                    >
                                      <FileX2 size={14} />
                                      Reject KYC
                                    </button>
                                  </>
                                )}
                                {supplier.verificationBadge === 'none' ? (
                                  <button
                                    disabled={!canVerify}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                  >
                                    <ShieldCheck size={14} />
                                    Verify Supplier
                                  </button>
                                ) : (
                                  <button
                                    disabled={!canVerify}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                  >
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
                                  disabled={!canSuspend}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <Ban size={14} />
                                  Suspend Account
                                </button>
                                <button
                                  disabled={!canView}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <BarChart3 size={14} />
                                  View Analytics
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteOpen(true)
                                    setDetailSupplier(supplier)
                                    setOpenMenuId(null)
                                  }}
                                  disabled={!canSuspend}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50"
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
                    <td
                      colSpan={13}
                      className="px-4 py-10 text-center text-muted-foreground dark:text-muted-foreground"
                    >
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-border dark:border-slate-800 px-4 py-3 text-sm text-muted-foreground dark:text-muted-foreground sm:flex-row sm:items-center sm:justify-between transition-colors">
            <p>
              Showing {pageSuppliers.length} of {sortedSuppliers.length}{' '}
              suppliers
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-1.5 text-foreground dark:text-slate-300 disabled:opacity-50 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Prev
              </button>
              <span className="text-muted-foreground dark:text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-900 px-3 py-1.5 text-foreground dark:text-slate-300 disabled:opacity-50 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
              <span className="ml-2 text-xs text-muted-foreground dark:text-muted-foreground">
                50 per page
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 lg:col-span-2 transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground dark:text-white transition-colors">
                Top 10 Suppliers (GMV)
              </h3>
              <span className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                {newSuppliers} new this month
              </span>
            </div>
            <div className="mt-3 overflow-hidden rounded-lg border border-border dark:border-slate-800 transition-colors">
              <table className="min-w-full text-sm">
                <thead className="bg-muted dark:bg-slate-800/50 text-muted-foreground dark:text-muted-foreground transition-colors">
                  <tr>
                    <th className="px-4 py-2 text-left">Supplier</th>
                    <th className="px-4 py-2 text-right">GMV</th>
                    <th className="px-4 py-2 text-right">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-slate-800 transition-colors">
                  {topSuppliers.map((supplier) => (
                    <tr
                      key={supplier.id}
                      className="hover:bg-muted dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-2 text-foreground dark:text-slate-300 transition-colors">
                        {supplier.businessName}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground dark:text-muted-foreground transition-colors">
                        {formatCurrency(supplier.gmv)}
                      </td>
                      <td className="px-4 py-2 text-right text-muted-foreground dark:text-muted-foreground transition-colors">
                        {supplier.totalOrders}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-border dark:border-slate-800 bg-card dark:bg-slate-900 p-4 transition-colors">
            <h3 className="text-sm font-semibold text-foreground dark:text-white transition-colors">
              Underperformers (0 orders / 30d)
            </h3>
            <div className="mt-3 space-y-2">
              {underperformers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="rounded-lg border border-border dark:border-slate-800 px-3 py-2 transition-colors"
                >
                  <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                    {supplier.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                    {supplier.ownerName}
                  </p>
                </div>
              ))}
              {underperformers.length === 0 && (
                <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors text-center py-4">
                  No underperformers found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-4xl rounded-2xl bg-card dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <div>
                <h2 className="text-lg font-semibold text-foreground dark:text-white transition-colors">
                  {detailSupplier.businessName}
                </h2>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                  {detailSupplier.ownerName}
                </p>
              </div>
              <button
                onClick={() => setDetailSupplier(null)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground dark:text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-border dark:border-slate-800 px-6 transition-colors">
              <div className="flex flex-wrap gap-6 text-sm">
                {(
                  [
                    'business',
                    'kyc',
                    'products',
                    'orders',
                    'analytics',
                    'activity',
                  ] as Array<DetailTab>
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`py-3 border-b-2 transition-colors ${
                      detailTab === tab
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-muted-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-slate-200'
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
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Business Name
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.businessName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Business Type
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.businessType}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Category
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.category}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Trade License
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.tradeLicense}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Owner Name
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.ownerName}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Email
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Phone
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Business Address
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.address}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Bank Details
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.bank.name} •{' '}
                        {detailSupplier.bank.accountNumberMasked}
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground transition-colors">
                        {detailSupplier.bank.branch}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Registration Date
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.registrationDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground dark:text-muted-foreground">
                        Last Active
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                        {detailSupplier.lastActive}
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
                    Edit Business Info
                  </button>
                </div>
              )}

              {detailTab === 'kyc' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    {kycBadge(detailSupplier.kycStatus)}
                    {detailSupplier.kycDecision?.date && (
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Updated: {detailSupplier.kycDecision.date}
                      </span>
                    )}
                    {detailSupplier.kycDecision?.reason && (
                      <span className="text-xs text-red-600 dark:text-red-400">
                        Reason: {detailSupplier.kycDecision.reason}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      {
                        label: 'Trade License',
                        src: detailSupplier.kycDocs.tradeLicense,
                      },
                      {
                        label: 'NID Front',
                        src: detailSupplier.kycDocs.nidFront,
                      },
                      {
                        label: 'NID Back',
                        src: detailSupplier.kycDocs.nidBack,
                      },
                      {
                        label: 'Bank Proof',
                        src: detailSupplier.kycDocs.bankProof,
                      },
                    ].map((doc) => (
                      <div
                        key={doc.label}
                        className="rounded-lg border border-border dark:border-slate-800 p-3 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                            {doc.label}
                          </p>
                          <button className="text-xs text-orange-600 dark:text-orange-400">
                            Zoom
                          </button>
                        </div>
                        <div className="mt-2 flex h-32 items-center justify-center rounded-lg bg-muted dark:bg-slate-800 text-muted-foreground dark:text-muted-foreground transition-colors">
                          <Image size={24} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-lg border border-border dark:border-slate-800 p-4 transition-colors">
                    <p className="text-sm font-medium text-foreground dark:text-slate-200 transition-colors">
                      Document Checklist
                    </p>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-border dark:border-slate-700 dark:bg-slate-950 transition-colors"
                        />{' '}
                        Trade License
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-border dark:border-slate-700 dark:bg-slate-950 transition-colors"
                        />{' '}
                        NID Front
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-border dark:border-slate-700 dark:bg-slate-950 transition-colors"
                        />{' '}
                        NID Back
                      </label>
                    </div>
                  </div>
                  {detailSupplier.kycStatus === 'pending' && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setApproveOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                      >
                        <FileCheck size={14} />
                        Approve KYC
                      </button>
                      <button
                        onClick={() => setRejectOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
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
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Total Products
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        {detailSupplier.totalProducts}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Active
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        120
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Draft
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        24
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Out of Stock
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        12
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
                    View All Products
                  </button>
                </div>
              )}

              {detailTab === 'orders' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Total Orders
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        {detailSupplier.totalOrders}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Completed
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        1,120
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Cancelled
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        32
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        GMV
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        {formatCurrency(detailSupplier.gmv)}
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors">
                    View All Orders
                  </button>
                </div>
              )}

              {detailTab === 'analytics' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Fulfillment Rate
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        {detailSupplier.analytics.fulfillmentRate}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Average Rating
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        {detailSupplier.analytics.averageRating}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        RFQ Response
                      </p>
                      <p className="text-lg font-semibold text-foreground dark:text-slate-100">
                        {detailSupplier.analytics.rfqResponseRate}%
                      </p>
                    </div>
                    <div className="rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                        Top Product
                      </p>
                      <p className="text-sm font-semibold text-foreground dark:text-slate-100 transition-colors">
                        {detailSupplier.analytics.topProducts[0]?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-border dark:border-slate-800 p-4 transition-colors">
                    <p className="text-sm font-semibold text-foreground dark:text-white transition-colors">
                      GMV Over Time
                    </p>
                    <div className="mt-3 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={detailSupplier.analytics.gmvSeries}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDark ? '#334155' : '#e2e8f0'}
                          />
                          <XAxis
                            dataKey="date"
                            tick={{
                              fill: isDark ? '#94a3b8' : '#64748b',
                              fontSize: 12,
                            }}
                          />
                          <YAxis
                            tick={{
                              fill: isDark ? '#94a3b8' : '#64748b',
                              fontSize: 12,
                            }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isDark ? '#334155' : '#e2e8f0',
                              color: isDark ? '#f8fafc' : '#0f172a',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="gmv"
                            stroke="#f97316"
                            strokeWidth={2}
                          />
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
                      className="flex items-start justify-between rounded-lg border border-border dark:border-slate-800 px-4 py-3 transition-colors"
                    >
                      <p className="text-sm text-foreground dark:text-slate-300 transition-colors">
                        {activity.message}
                      </p>
                      <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                  {detailSupplier.activityLog.length === 0 && (
                    <p className="text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                      No activity logged.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {approveOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-card dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="text-green-600 dark:text-green-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-foreground dark:text-white transition-colors">
                  Approve KYC
                </h2>
              </div>
              <button
                onClick={() => setApproveOpen(false)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground dark:text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg border border-border dark:border-slate-800 p-4 text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                Review document checklist and add notes before approval.
              </div>
              <textarea
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 text-sm text-foreground dark:text-slate-100 focus:border-orange-500 outline-none transition-colors"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => setApproveOpen(false)}
                className="rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setApproveOpen(false)}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
              >
                Approve KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-card dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className="text-red-600 dark:text-red-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-foreground dark:text-white transition-colors">
                  Reject KYC
                </h2>
              </div>
              <button
                onClick={() => setRejectOpen(false)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground dark:text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2 text-sm text-foreground dark:text-slate-300 transition-colors">
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
                          e.target.checked
                            ? [...prev, reason]
                            : prev.filter((item) => item !== reason),
                        )
                      }}
                      className="rounded border-border dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500"
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
                  className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 text-sm text-foreground dark:text-slate-100 focus:border-orange-500 outline-none transition-colors"
                />
              )}
              <textarea
                value={rejectCorrections}
                onChange={(e) => setRejectCorrections(e.target.value)}
                placeholder="Required corrections"
                className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 text-sm text-foreground dark:text-slate-100 focus:border-orange-500 outline-none transition-colors"
                rows={3}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => setRejectOpen(false)}
                className="rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setRejectOpen(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                Reject KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {suspendOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-card dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <Ban
                  className="text-orange-600 dark:text-orange-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-foreground dark:text-white transition-colors">
                  Suspend {detailSupplier.businessName}?
                </h2>
              </div>
              <button
                onClick={() => setSuspendOpen(false)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground dark:text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
              <div className="rounded-lg border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 px-4 py-3 transition-colors">
                <p>All products hidden from marketplace</p>
                <p>Cannot respond to RFQs</p>
                <p>Pending orders unaffected</p>
                <p>Payouts held (if applicable)</p>
              </div>
              <input
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="Suspension reason"
                className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 text-sm text-foreground dark:text-slate-100 focus:border-orange-500 outline-none transition-colors"
              />
              <div className="flex flex-wrap gap-2">
                {['7 days', '30 days', 'Permanent'].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setSuspendDuration(duration)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                      suspendDuration === duration
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                        : 'border-border dark:border-slate-800 text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => setSuspendOpen(false)}
                className="rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setSuspendOpen(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && detailSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-card dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className="text-red-600 dark:text-red-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-foreground dark:text-white transition-colors">
                  Delete {detailSupplier.businessName}?
                </h2>
              </div>
              <button
                onClick={() => setDeleteOpen(false)}
                className="p-2 hover:bg-muted dark:hover:bg-slate-800 rounded-lg transition-colors text-muted-foreground dark:text-muted-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium transition-colors">
                This action cannot be undone.
              </p>
              <label className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground transition-colors">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="rounded border-border dark:border-slate-700 dark:bg-slate-950 text-red-600 focus:ring-red-500"
                />
                I understand this action is permanent
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-border dark:border-slate-800 bg-card dark:bg-slate-950 px-3 py-2 text-sm text-foreground dark:text-slate-100 focus:border-orange-500 outline-none transition-colors placeholder:text-muted-foreground dark:placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => {
                  setDeleteOpen(false)
                  setDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg border border-border dark:border-slate-800 px-4 py-2 text-sm text-foreground dark:text-slate-300 hover:bg-muted dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!deleteConfirm || deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setDeleteOpen(false)
                  setDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <FileCheck className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-foreground">
                  Approve KYC for {selectedCount} suppliers?
                </h2>
              </div>
              <button
                onClick={() => setBulkApproveOpen(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-muted-foreground">
              Selected suppliers will receive notification and verification
              badge.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setBulkApproveOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
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
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-foreground">
                  Verify {selectedCount} suppliers?
                </h2>
              </div>
              <button
                onClick={() => setBulkVerifyOpen(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-muted-foreground">
              Verified suppliers receive a badge and higher trust ranking.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setBulkVerifyOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
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
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <Ban className="text-orange-600" size={20} />
                <h2 className="text-lg font-semibold text-foreground">
                  Suspend {selectedCount} suppliers?
                </h2>
              </div>
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="p-2 hover:bg-muted rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-muted-foreground">
              All selected suppliers will be suspended and products hidden from
              marketplace.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
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
