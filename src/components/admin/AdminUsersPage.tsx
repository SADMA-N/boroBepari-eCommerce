import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  Bell,
  CheckCircle,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Mail,
  MoreVertical,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

type UserStatus = 'active' | 'suspended' | 'deleted'
type OrderCountFilter = 'all' | '0' | '1-5' | '6-20' | '20+'
type SortKey = 'name' | 'date' | 'orders' | 'spent'
type DetailTab = 'profile' | 'orders' | 'activity'

type UserOrder = {
  id: string
  date: string
  total: number
  status: string
}

type UserActivity = {
  id: string
  type: string
  message: string
  time: string
}

type User = {
  id: string
  name: string
  email: string
  phone: string
  status: UserStatus
  verified: boolean
  orders: number
  totalSpent: number
  joinedAt: string
  lastLogin: string
  addresses: Array<string>
  businessInfo?: {
    company: string
    type: string
  }
  orderHistory: Array<UserOrder>
  activityLog: Array<UserActivity>
}

const USERS: Array<User> = [
  {
    id: 'BB-U-0001',
    name: 'Karim Hossain',
    email: 'karim@example.com',
    phone: '01712345678',
    status: 'active',
    verified: true,
    orders: 24,
    totalSpent: 125000,
    joinedAt: '2024-01-15',
    lastLogin: '2026-02-03 10:24',
    addresses: ['Banani, Dhaka', 'Gulshan-2, Dhaka'],
    businessInfo: { company: 'Karim Enterprises', type: 'Wholesale Buyer' },
    orderHistory: [
      {
        id: 'ORD-46012',
        date: '2026-02-01',
        total: 12500,
        status: 'Delivered',
      },
      {
        id: 'ORD-45876',
        date: '2026-01-21',
        total: 42000,
        status: 'Delivered',
      },
    ],
    activityLog: [
      {
        id: 'act-1',
        type: 'login',
        message: 'Logged in from Dhaka',
        time: '2 hours ago',
      },
      {
        id: 'act-2',
        type: 'order',
        message: 'Placed order ORD-46012',
        time: '3 days ago',
      },
      {
        id: 'act-3',
        type: 'rfq',
        message: 'Created RFQ for LED panels',
        time: '6 days ago',
      },
    ],
  },
  {
    id: 'BB-U-0002',
    name: 'Fatima Rahman',
    email: 'fatima@example.com',
    phone: '01812345678',
    status: 'active',
    verified: false,
    orders: 18,
    totalSpent: 89500,
    joinedAt: '2024-02-20',
    lastLogin: '2026-02-02 18:09',
    addresses: ['Dhanmondi, Dhaka'],
    orderHistory: [
      {
        id: 'ORD-46011',
        date: '2026-01-30',
        total: 23000,
        status: 'In Progress',
      },
    ],
    activityLog: [
      {
        id: 'act-4',
        type: 'login',
        message: 'Logged in from Dhaka',
        time: '1 day ago',
      },
      {
        id: 'act-5',
        type: 'review',
        message: 'Submitted a review',
        time: '4 days ago',
      },
    ],
  },
  {
    id: 'BB-U-0003',
    name: 'Abdul Malik',
    email: 'abdul@example.com',
    phone: '01912345678',
    status: 'suspended',
    verified: true,
    orders: 5,
    totalSpent: 12000,
    joinedAt: '2024-03-10',
    lastLogin: '2026-01-15 09:11',
    addresses: ['Agrabad, Chittagong'],
    businessInfo: { company: 'Malik Traders', type: 'Retailer' },
    orderHistory: [
      { id: 'ORD-45221', date: '2025-12-09', total: 6200, status: 'Delivered' },
    ],
    activityLog: [
      {
        id: 'act-6',
        type: 'support',
        message: 'Opened ticket #SUP-1022',
        time: '3 weeks ago',
      },
      {
        id: 'act-7',
        type: 'login',
        message: 'Failed login attempts',
        time: '3 weeks ago',
      },
    ],
  },
  {
    id: 'BB-U-0004',
    name: 'Nasreen Akhter',
    email: 'nasreen@example.com',
    phone: '01612345678',
    status: 'active',
    verified: true,
    orders: 42,
    totalSpent: 245000,
    joinedAt: '2023-11-05',
    lastLogin: '2026-02-03 21:40',
    addresses: ['Rajshahi, Bangladesh'],
    orderHistory: [
      {
        id: 'ORD-45998',
        date: '2026-01-29',
        total: 54000,
        status: 'Delivered',
      },
      {
        id: 'ORD-45976',
        date: '2026-01-20',
        total: 31000,
        status: 'Delivered',
      },
    ],
    activityLog: [
      {
        id: 'act-8',
        type: 'order',
        message: 'Placed order ORD-45998',
        time: '5 days ago',
      },
      {
        id: 'act-9',
        type: 'review',
        message: 'Submitted a review',
        time: '1 week ago',
      },
    ],
  },
  {
    id: 'BB-U-0005',
    name: 'Rafiq Islam',
    email: 'rafiq@example.com',
    phone: '01512345678',
    status: 'deleted',
    verified: false,
    orders: 2,
    totalSpent: 5500,
    joinedAt: '2024-04-01',
    lastLogin: '2025-12-18 15:10',
    addresses: ['Sylhet, Bangladesh'],
    orderHistory: [],
    activityLog: [
      {
        id: 'act-10',
        type: 'support',
        message: 'Requested account deletion',
        time: '2 months ago',
      },
    ],
  },
]

const STATUS_OPTIONS: Array<{ label: string; value: UserStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Deleted', value: 'deleted' },
]

const VERIFICATION_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Verified', value: 'verified' },
  { label: 'Unverified', value: 'unverified' },
]

const ORDER_COUNT_OPTIONS: Array<{ label: string; value: OrderCountFilter }> = [
  { label: 'All', value: 'all' },
  { label: '0', value: '0' },
  { label: '1-5', value: '1-5' },
  { label: '6-20', value: '6-20' },
  { label: '20+', value: '20+' },
]

const SORT_OPTIONS: Array<{ label: string; value: SortKey }> = [
  { label: 'Name', value: 'name' },
  { label: 'Date', value: 'date' },
  { label: 'Orders', value: 'orders' },
  { label: 'Spent', value: 'spent' },
]

const PAGE_SIZE = 50

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString()}`
}

function matchesOrderCount(orders: number, filter: OrderCountFilter) {
  if (filter === 'all') return true
  if (filter === '0') return orders === 0
  if (filter === '1-5') return orders >= 1 && orders <= 5
  if (filter === '6-20') return orders >= 6 && orders <= 20
  return orders >= 21
}

function statusBadge(status: UserStatus) {
  if (status === 'active') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        Active
      </span>
    )
  }
  if (status === 'suspended') {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        Suspended
      </span>
    )
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-600">
      Deleted
    </span>
  )
}

export function AdminUsersPage() {
  const { can } = useAdminAuth()
  const canView = can('users.view')
  const canEdit = can('users.edit')
  const canDelete = can('users.delete')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [verificationFilter, setVerificationFilter] = useState<
    'all' | 'verified' | 'unverified'
  >('all')
  const [orderCountFilter, setOrderCountFilter] =
    useState<OrderCountFilter>('all')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('profile')
  const [suspendUser, setSuspendUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const [suspendReason, setSuspendReason] = useState('Fraudulent activity')
  const [suspendOtherReason, setSuspendOtherReason] = useState('')
  const [suspendDuration, setSuspendDuration] = useState('7 days')
  const [suspendNotify, setSuspendNotify] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [page, setPage] = useState(1)
  const [exportOpen, setExportOpen] = useState(false)
  const [bulkSuspendOpen, setBulkSuspendOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [bulkDeleteText, setBulkDeleteText] = useState('')

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return USERS.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.phone.toLowerCase().includes(query)
      const matchesStatus =
        statusFilter === 'all' || user.status === statusFilter
      const matchesVerification =
        verificationFilter === 'all' ||
        (verificationFilter === 'verified' && user.verified) ||
        (verificationFilter === 'unverified' && !user.verified)
      const matchesOrder = matchesOrderCount(user.orders, orderCountFilter)

      const joinedDate = new Date(user.joinedAt)
      const withinFrom = dateFrom ? joinedDate >= new Date(dateFrom) : true
      const withinTo = dateTo ? joinedDate <= new Date(dateTo) : true

      return (
        matchesSearch &&
        matchesStatus &&
        matchesVerification &&
        matchesOrder &&
        withinFrom &&
        withinTo
      )
    })
  }, [
    searchQuery,
    statusFilter,
    verificationFilter,
    orderCountFilter,
    dateFrom,
    dateTo,
  ])

  const sortedUsers = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'orders') return b.orders - a.orders
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    })
    return copy
  }, [filtered, sortBy])

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageUsers = sortedUsers.slice(pageStart, pageStart + PAGE_SIZE)

  const totalUsers = USERS.length
  const activeToday = 128
  const newThisMonth = 342
  const suspendedCount = USERS.filter((u) => u.status === 'suspended').length

  const toggleSelectAll = () => {
    if (pageUsers.length === 0) return
    const pageIds = pageUsers.map((u) => u.id)
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

  const exportUsers = (scope: 'all' | 'filtered', format: 'csv' | 'excel') => {
    const exportData = scope === 'all' ? USERS : sortedUsers
    const header = [
      'User ID',
      'Name',
      'Email',
      'Phone',
      'Registration Date',
      'Orders',
      'Spent',
      'Status',
    ]
    const rows = exportData.map((u) => [
      u.id,
      u.name,
      u.email,
      u.phone,
      u.joinedAt,
      String(u.orders),
      String(u.totalSpent),
      u.status,
    ])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const suffix = format === 'excel' ? 'xlsx' : 'csv'
    link.href = url
    link.download = `borobepari-users-${scope}.${suffix}`
    document.body.appendChild(link)
    link.click()
    if (link.isConnected) {
      link.remove()
    }
    URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  const selectedCount = selectedIds.length

  useEffect(() => {
    setPage(1)
  }, [
    searchQuery,
    statusFilter,
    verificationFilter,
    orderCountFilter,
    sortBy,
    dateFrom,
    dateTo,
  ])

  return (
    <AdminProtectedRoute requiredPermissions={['users.view']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
              User Management
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
              Total: {totalUsers} buyers
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={!canEdit}
              className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <UserPlus size={16} />+ Add User
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
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-20 overflow-hidden transition-colors">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase">
                      Export Scope
                    </div>
                    <button
                      onClick={() => exportUsers('all', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Export All (CSV)
                    </button>
                    <button
                      onClick={() => exportUsers('all', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Export All (Excel)
                    </button>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase border-t border-slate-100 dark:border-slate-800">
                      Filtered
                    </div>
                    <button
                      onClick={() => exportUsers('filtered', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Export Filtered (CSV)
                    </button>
                    <button
                      onClick={() => exportUsers('filtered', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Export Filtered (Excel)
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Users
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {totalUsers.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active Today
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {activeToday.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              New Users This Month
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {newThisMonth.toLocaleString()}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Suspended Accounts
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">
              {suspendedCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 transition-colors">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, phone"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                <Filter size={16} />
                Filters
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as UserStatus | 'all')
                }
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
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
                value={verificationFilter}
                onChange={(e) =>
                  setVerificationFilter(
                    e.target.value as 'all' | 'verified' | 'unverified',
                  )
                }
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
              >
                {VERIFICATION_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    Verification: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={orderCountFilter}
                onChange={(e) =>
                  setOrderCountFilter(e.target.value as OrderCountFilter)
                }
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
              >
                {ORDER_COUNT_OPTIONS.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className="dark:bg-slate-900"
                  >
                    Orders: {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              Registration Date
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors">
            <p className="text-sm text-orange-800 dark:text-orange-400">
              {selectedCount} user{selectedCount === 1 ? '' : 's'} selected
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setBulkSuspendOpen(true)}
                disabled={!canEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Ban size={14} />
                Bulk Suspend
              </button>
              <button
                disabled={!canEdit}
                className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                <CheckCircle size={14} />
                Bulk Unsuspend
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 px-3 py-2 text-sm border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Download size={14} />
                Bulk Export
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                disabled={!canDelete}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
              >
                <Trash2 size={14} />
                Bulk Delete
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 transition-colors">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        pageUsers.length > 0 &&
                        pageUsers.every((u) => selectedIds.includes(u.id))
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">User ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Email</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Registered Date</th>
                  <th className="px-4 py-3 text-right">Total Orders</th>
                  <th className="px-4 py-3 text-right">Total Spent (₹)</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                {pageUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={() => toggleSelectOne(user.id)}
                        className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 transition-colors">
                      {user.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 dark:text-slate-100 transition-colors">
                          {user.name}
                        </span>
                        {user.verified && (
                          <CheckCircle size={14} className="text-green-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                      {user.phone}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                      {user.joinedAt}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 transition-colors">
                      {user.orders}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400 transition-colors">
                      {formatCurrency(user.totalSpent)}
                    </td>
                    <td className="px-4 py-3">{statusBadge(user.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="relative inline-block text-left">
                        <button
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === user.id ? null : user.id,
                            )
                          }
                          className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                        >
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg transition-colors overflow-hidden">
                              <button
                                onClick={() => {
                                  setDetailUser(user)
                                  setDetailTab('profile')
                                  setOpenMenuId(null)
                                }}
                                disabled={!canView}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                              >
                                <Eye size={14} />
                                View Profile
                              </button>
                              <button
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                disabled={!canView}
                              >
                                <FileText size={14} />
                                View Orders
                              </button>
                              {user.status === 'suspended' ? (
                                <button
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                  disabled={!canEdit}
                                >
                                  <CheckCircle size={14} />
                                  Unsuspend Account
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSuspendUser(user)
                                    setOpenMenuId(null)
                                  }}
                                  disabled={!canEdit}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                                >
                                  <Ban size={14} />
                                  Suspend Account
                                </button>
                              )}
                              <button
                                disabled={!canEdit}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                              >
                                <Mail size={14} />
                                Reset Password
                              </button>
                              <button
                                disabled={!canEdit}
                                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                              >
                                <Bell size={14} />
                                Send Notification
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteUser(user)
                                  setOpenMenuId(null)
                                }}
                                disabled={!canDelete}
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
                ))}
                {pageUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-10 text-center text-slate-500 dark:text-slate-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between transition-colors">
            <p>
              Showing {pageUsers.length} of {sortedUsers.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Prev
              </button>
              <span className="text-slate-600 dark:text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Next
              </button>
              <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">
                50 per page
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {detailUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {detailUser.name}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {detailUser.email}
                </p>
              </div>
              <button
                onClick={() => setDetailUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-slate-200 dark:border-slate-800 px-6 transition-colors">
              <div className="flex gap-6 text-sm">
                {(['profile', 'orders', 'activity'] as Array<DetailTab>).map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab)}
                      className={`py-3 border-b-2 transition-colors ${
                        detailTab === tab
                          ? 'border-orange-600 text-orange-600'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      {tab === 'profile'
                        ? 'Profile Info'
                        : tab === 'orders'
                          ? 'Order History'
                          : 'Activity Log'}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {detailTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Full Name
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {detailUser.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Email
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {detailUser.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Phone
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {detailUser.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Registration Date
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {detailUser.joinedAt}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Last Login
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                        {detailUser.lastLogin}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Account Status
                      </p>
                      <div className="mt-1">
                        {statusBadge(detailUser.status)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                      Saved Addresses
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                      {detailUser.addresses.map((address) => (
                        <li
                          key={address}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 transition-colors"
                        >
                          {address}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {detailUser.businessInfo && (
                    <div>
                      <p className="text-xs uppercase text-slate-400 dark:text-slate-500">
                        Business Information
                      </p>
                      <div className="mt-2 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 transition-colors">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                          {detailUser.businessInfo.company}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {detailUser.businessInfo.type}
                        </p>
                      </div>
                    </div>
                  )}
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <Edit3 size={14} />
                    Edit User Info
                  </button>
                </div>
              )}

              {detailTab === 'orders' && (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Total Orders
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {detailUser.orders}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Total Spent
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(detailUser.totalSpent)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors">
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        Avg Order Value
                      </p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(
                          detailUser.orders
                            ? Math.round(
                                detailUser.totalSpent / detailUser.orders,
                              )
                            : 0,
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 transition-colors">
                        <tr>
                          <th className="px-4 py-2 text-left">Order ID</th>
                          <th className="px-4 py-2 text-left">Date</th>
                          <th className="px-4 py-2 text-left">Status</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                        {detailUser.orderHistory.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                              {order.id}
                            </td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                              {order.date}
                            </td>
                            <td className="px-4 py-2 text-slate-600 dark:text-slate-400">
                              {order.status}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-600 dark:text-slate-400">
                              {formatCurrency(order.total)}
                            </td>
                          </tr>
                        ))}
                        {detailUser.orderHistory.length === 0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                            >
                              No orders yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailTab === 'activity' && (
                <div className="space-y-3">
                  {detailUser.activityLog.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                          {activity.message}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          {activity.type}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {activity.time}
                      </span>
                    </div>
                  ))}
                  {detailUser.activityLog.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No activity logged.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Account Modal */}
      {suspendUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className="text-orange-600 dark:text-orange-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                  Suspend {suspendUser.name}?
                </h2>
              </div>
              <button
                onClick={() => setSuspendUser(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
                  Reason
                </label>
                <select
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 outline-none transition-colors"
                >
                  <option className="dark:bg-slate-900">
                    Fraudulent activity
                  </option>
                  <option className="dark:bg-slate-900">
                    Abusive behavior
                  </option>
                  <option className="dark:bg-slate-900">
                    Policy violation
                  </option>
                  <option className="dark:bg-slate-900">Other</option>
                </select>
                {suspendReason === 'Other' && (
                  <input
                    value={suspendOtherReason}
                    onChange={(e) => setSuspendOtherReason(e.target.value)}
                    placeholder="Provide details"
                    className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">
                  Suspension duration
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['7 days', '30 days', 'Permanent'].map((duration) => (
                    <button
                      key={duration}
                      onClick={() => setSuspendDuration(duration)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        suspendDuration === duration
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {duration}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                <input
                  type="checkbox"
                  checked={suspendNotify}
                  onChange={(e) => setSuspendNotify(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
                />
                Send email notification
              </label>
              <div className="rounded-lg border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-400 transition-colors">
                User will be logged out immediately and receive an email
                notification.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => setSuspendUser(null)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setSuspendUser(null)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className="text-red-600 dark:text-red-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                  Delete {deleteUser.name}?
                </h2>
              </div>
              <button
                onClick={() => {
                  setDeleteUser(null)
                  setDeleteConfirm(false)
                }}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium transition-colors">
                This action cannot be undone.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                <li>All user data will be deleted</li>
                <li>Order history will be anonymized</li>
                <li>Reviews will remain (anonymized)</li>
              </ul>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-red-600 focus:ring-red-500 dark:bg-slate-950 transition-colors"
                />
                I understand this action is permanent
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => {
                  setDeleteUser(null)
                  setDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!deleteConfirm || deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setDeleteUser(null)
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

      {/* Bulk Suspend Modal */}
      {bulkSuspendOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className="text-orange-600 dark:text-orange-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                  Suspend {selectedCount} selected user
                  {selectedCount === 1 ? '' : 's'}?
                </h2>
              </div>
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-400 transition-colors">
                Selected users will be logged out immediately and receive email
                notifications.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkSuspendOpen(false)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 p-4 backdrop-blur-sm transition-all">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-xl transition-colors overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <div className="flex items-center gap-2">
                <AlertTriangle
                  className="text-red-600 dark:text-red-500"
                  size={20}
                />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                  Delete {selectedCount} selected user
                  {selectedCount === 1 ? '' : 's'}?
                </h2>
              </div>
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium transition-colors">
                This action cannot be undone.
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                <li>All user data will be deleted</li>
                <li>Order history will be anonymized</li>
                <li>Reviews will remain (anonymized)</li>
              </ul>
              <input
                value={bulkDeleteText}
                onChange={(e) => setBulkDeleteText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 outline-none transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors">
              <button
                onClick={() => {
                  setBulkDeleteOpen(false)
                  setBulkDeleteText('')
                }}
                className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={bulkDeleteText !== 'DELETE'}
                onClick={() => {
                  setBulkDeleteOpen(false)
                  setBulkDeleteText('')
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors shadow-lg shadow-red-600/20"
              >
                Delete Accounts
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  )
}
