import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  CheckCircle,
  ChevronDown,
  Clock,
  Download,
  FileCheck,
  FileX2,
  Image,
  MessageSquare,
  RotateCw,
  Search,
  ShieldCheck,
  User,
  UserPlus,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'
import {
  getKycReviewQueue,
  getSellerKycDetails,
  reviewSellerKyc,
} from '@/lib/seller-kyc-server'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

type KycStatus = 'pending' | 'approved' | 'rejected' | 'resubmitted'
type Priority = 'normal' | 'urgent'
type ReviewStatus = 'unassigned' | 'assigned'

type KycSubmission = {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  businessType: string
  tradeLicenseNumber: string
  registrationDate: string
  submittedAt: string
  waitHours: number
  assignedTo?: string
  status: KycStatus
  priority: Priority
  documents: Array<{ id: string; label: string; src: string }>
  previousRejectionReason?: string
  auditTrail: Array<{
    id: string
    actor: string
    action: string
    time: string
    notes?: string
  }>
}

const MOCK_KYC: Array<KycSubmission> = [
  {
    id: 'KYC-1001',
    businessName: 'Chittagong Electronics',
    ownerName: 'Fahim Chowdhury',
    email: 'info@ctgelectronics.com',
    phone: '01822222222',
    businessType: 'Distributor',
    tradeLicenseNumber: 'TL-456123',
    registrationDate: '2026-01-12',
    submittedAt: '2026-02-02',
    waitHours: 18,
    status: 'pending',
    priority: 'normal',
    documents: [
      {
        id: 'doc-1',
        label: 'Trade License',
        src: '/img/kyc/trade-license.png',
      },
      { id: 'doc-2', label: 'NID Front', src: '/img/kyc/nid-front.png' },
      { id: 'doc-3', label: 'NID Back', src: '/img/kyc/nid-back.png' },
      { id: 'doc-4', label: 'Bank Proof', src: '/img/kyc/bank-proof.png' },
    ],
    auditTrail: [
      {
        id: 'aud-1',
        actor: 'System',
        action: 'Submitted',
        time: '2026-02-02 09:12',
      },
    ],
  },
  {
    id: 'KYC-1002',
    businessName: 'Sylhet Traders',
    ownerName: 'Arif Ahmed',
    email: 'sales@sylhettraders.com',
    phone: '01933333333',
    businessType: 'Wholesaler',
    tradeLicenseNumber: 'TL-220144',
    registrationDate: '2025-12-05',
    submittedAt: '2026-01-31',
    waitHours: 40,
    status: 'pending',
    priority: 'urgent',
    assignedTo: 'Admin Rifat',
    documents: [
      {
        id: 'doc-1',
        label: 'Trade License',
        src: '/img/kyc/trade-license.png',
      },
      { id: 'doc-2', label: 'NID Front', src: '/img/kyc/nid-front.png' },
      { id: 'doc-3', label: 'NID Back', src: '/img/kyc/nid-back.png' },
    ],
    auditTrail: [
      {
        id: 'aud-2',
        actor: 'System',
        action: 'Submitted',
        time: '2026-01-31 08:32',
      },
      {
        id: 'aud-3',
        actor: 'Admin Rifat',
        action: 'Assigned',
        time: '2026-02-01 10:05',
      },
    ],
  },
  {
    id: 'KYC-1003',
    businessName: 'Rahim Textiles Ltd.',
    ownerName: 'Rahim Uddin',
    email: 'contact@rahimtextiles.com',
    phone: '01711111111',
    businessType: 'Manufacturer',
    tradeLicenseNumber: 'TL-987654',
    registrationDate: '2023-06-15',
    submittedAt: '2026-01-28',
    waitHours: 62,
    status: 'resubmitted',
    priority: 'urgent',
    documents: [
      {
        id: 'doc-1',
        label: 'Trade License',
        src: '/img/kyc/trade-license.png',
      },
      { id: 'doc-2', label: 'NID Front', src: '/img/kyc/nid-front.png' },
      { id: 'doc-3', label: 'NID Back', src: '/img/kyc/nid-back.png' },
      { id: 'doc-4', label: 'Bank Proof', src: '/img/kyc/bank-proof.png' },
    ],
    previousRejectionReason: 'Document not clear/readable',
    auditTrail: [
      {
        id: 'aud-4',
        actor: 'Admin Sumi',
        action: 'Rejected',
        time: '2026-01-20 13:45',
      },
      {
        id: 'aud-5',
        actor: 'Supplier',
        action: 'Resubmitted documents',
        time: '2026-01-28 16:10',
      },
    ],
  },
  {
    id: 'KYC-1004',
    businessName: 'Rajshahi Exports',
    ownerName: 'Nabila Khan',
    email: 'export@rajshahiexports.com',
    phone: '01755555555',
    businessType: 'Exporter',
    tradeLicenseNumber: 'TL-332244',
    registrationDate: '2022-12-01',
    submittedAt: '2026-01-15',
    waitHours: 0,
    status: 'approved',
    priority: 'normal',
    documents: [
      {
        id: 'doc-1',
        label: 'Trade License',
        src: '/img/kyc/trade-license.png',
      },
      { id: 'doc-2', label: 'NID Front', src: '/img/kyc/nid-front.png' },
    ],
    auditTrail: [
      {
        id: 'aud-6',
        actor: 'Admin Nayeem',
        action: 'Approved',
        time: '2026-01-16 09:22',
      },
    ],
  },
  {
    id: 'KYC-1005',
    businessName: 'Khulna Garments',
    ownerName: 'Sabina Akter',
    email: 'info@khulnagarments.com',
    phone: '01644444444',
    businessType: 'Manufacturer',
    tradeLicenseNumber: 'TL-774455',
    registrationDate: '2024-03-05',
    submittedAt: '2026-01-10',
    waitHours: 0,
    status: 'rejected',
    priority: 'normal',
    documents: [
      {
        id: 'doc-1',
        label: 'Trade License',
        src: '/img/kyc/trade-license.png',
      },
      { id: 'doc-2', label: 'NID Front', src: '/img/kyc/nid-front.png' },
    ],
    auditTrail: [
      {
        id: 'aud-7',
        actor: 'Admin Mitu',
        action: 'Rejected',
        time: '2026-01-12 15:05',
        notes: 'Document expired',
      },
    ],
  },
]

const STATUS_TABS: Array<{ label: string; value: KycStatus; color: string }> = [
  { label: 'Pending Review', value: 'pending', color: 'text-red-600' },
  { label: 'Approved', value: 'approved', color: 'text-green-600' },
  { label: 'Rejected', value: 'rejected', color: 'text-red-600' },
  { label: 'Resubmitted', value: 'resubmitted', color: 'text-orange-600' },
]

const DOC_CHECKLIST = [
  'Trade License valid',
  'Trade License number matches',
  'NID clear and readable',
  'Name on NID matches owner name',
  'NID not expired',
  'Bank details provided',
]

const REJECTION_REASONS = [
  'Document not clear/readable',
  'Document expired',
  'Trade license invalid',
  'NID not matching',
  'Incomplete information',
  'Suspicious/fraudulent',
  'Other',
]

export function AdminKYCPage() {
  const { can, getToken } = useAdminAuth()
  const canReview = can('kyc.review')
  const canApprove = can('kyc.approve')
  const canReject = can('kyc.reject')
  const [activeTab, setActiveTab] = useState<KycStatus>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [queue, setQueue] = useState<Array<any>>([])
  const [isLoadingQueue, setIsLoadingQueue] = useState(true)
  const [reviewItem, setReviewItem] = useState<any | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [docIndex, setDocIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [checklist, setChecklist] = useState<Array<string>>([])
  const [internalNotes, setInternalNotes] = useState('')
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReasons, setRejectReasons] = useState<Array<string>>([])
  const [rejectOther, setRejectOther] = useState('')
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [requestInfoOpen, setRequestInfoOpen] = useState(false)
  const [requestMessage, setRequestMessage] = useState('')
  const [assignOpen, setAssignOpen] = useState(false)
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false)

  const fetchQueue = async () => {
    setIsLoadingQueue(true)
    try {
      const data = await getKycReviewQueue({
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      setQueue(data)
    } catch (error) {
      console.error('Failed to fetch KYC queue:', error)
    } finally {
      setIsLoadingQueue(false)
    }
  }

  useEffect(() => {
    fetchQueue()
  }, [])

  const handleReview = async (item: any) => {
    setIsLoadingDetails(true)
    try {
      const details = await getSellerKycDetails({
        data: { sellerId: item.id },
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      setReviewItem(details)
      setDocIndex(0)
      setZoom(1)
      setRotation(0)
    } catch (error) {
      console.error('Failed to fetch KYC details:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!reviewItem) return
    try {
      await reviewSellerKyc({
        data: {
          sellerId: reviewItem.seller.id,
          status,
          reason: status === 'rejected' ? rejectFeedback : undefined,
        },
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
      setReviewItem(null)
      setApproveOpen(false)
      setRejectOpen(false)
      fetchQueue()
    } catch (error) {
      console.error('Failed to review KYC:', error)
    }
  }

  useEffect(() => {
    if (!reviewItem) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        const docCount = reviewItem.documents?.length || 0
        setDocIndex((prev) => Math.min(prev + 1, docCount - 1))
      }
      if (event.key === 'ArrowLeft') {
        setDocIndex((prev) => Math.max(prev - 1, 0))
      }
      if (event.key.toLowerCase() === 'a') {
        setApproveOpen(true)
      }
      if (event.key.toLowerCase() === 'r') {
        setRejectOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [reviewItem])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return queue.filter((item) => {
      const matchesSearch =
        !query ||
        item.businessName.toLowerCase().includes(query) ||
        item.fullName.toLowerCase().includes(query)
      const submittedDate = item.submittedAt ? new Date(item.submittedAt) : null
      const withinFrom =
        dateFrom && submittedDate ? submittedDate >= new Date(dateFrom) : true
      const withinTo =
        dateTo && submittedDate ? submittedDate <= new Date(dateTo) : true
      return matchesSearch && withinFrom && withinTo
    })
  }, [queue, searchQuery, dateFrom, dateTo])

  const pendingQueue = filtered

  const filteredCount = [
    searchQuery,
    priorityFilter !== 'all',
    dateFrom,
    dateTo,
  ].filter(Boolean).length
  const pendingCount = queue.length
  const approvedCount = 0 // Mock for now
  const rejectedCount = 0 // Mock for now
  const resubmittedCount = 0 // Mock for now

  const todayReviewed = 18
  const averageReview = 18
  const approvalRate = 82
  const oldestPending = 62
  const myReviews = 7

  const toggleSelectAll = () => {
    const queueIds = pendingQueue.map((item) => item.id)
    const allSelected =
      queueIds.length > 0 && queueIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !queueIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...queueIds])))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const activeDocs = reviewItem?.documents || []
  const currentDoc =
    activeDocs.length > 0
      ? activeDocs[Math.min(docIndex, activeDocs.length - 1)]
      : null

  return (
    <AdminProtectedRoute requiredPermissions={['kyc.review']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
              KYC Review Queue
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-400 transition-colors">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  pendingCount > 0
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {pendingCount} pending reviews
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock size={14} />
                Avg review time: {averageReview} hours (target &lt;24h)
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {filteredCount} filters applied
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={!canReview}
              className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              <UserPlus size={16} />
              Assign to Me
            </button>
            <button
              onClick={() => setBulkApproveOpen(true)}
              disabled={!canApprove}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
            >
              <ShieldCheck size={16} />
              Bulk Approve
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
          <div className="flex flex-wrap gap-4">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business or submitter"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-900 dark:text-slate-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>
            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as Priority | 'all')
              }
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 focus:border-orange-500 outline-none transition-colors"
            >
              <option value="all" className="dark:bg-slate-900">
                Priority: All
              </option>
              <option value="normal" className="dark:bg-slate-900">
                Priority: Normal
              </option>
              <option value="urgent" className="dark:bg-slate-900">
                Priority: Urgent
              </option>
            </select>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
              Submission Date
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

        <div className="flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.value === 'pending'
                ? pendingCount
                : tab.value === 'approved'
                  ? approvedCount
                  : tab.value === 'rejected'
                    ? rejectedCount
                    : resubmittedCount
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                  activeTab === tab.value
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs transition-colors ${tab.color} ${activeTab === tab.value ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
              KYCs reviewed today
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white transition-colors">
              {todayReviewed}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
              Average review time
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white transition-colors">
              {averageReview}h
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
              Approval rate
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white transition-colors">
              {approvalRate}%
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
              Oldest pending
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white transition-colors">
              {oldestPending}h
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors">
            <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
              My reviews today
            </p>
            <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white transition-colors">
              {myReviews}
            </p>
          </div>
        </div>

        {activeTab === 'pending' && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 transition-colors">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          pendingQueue.length > 0 &&
                          pendingQueue.every((item) =>
                            selectedIds.includes(item.id),
                          )
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
                      />
                    </th>
                    <th className="px-4 py-3 text-left">Submission ID</th>
                    <th className="px-4 py-3 text-left">Business Name</th>
                    <th className="px-4 py-3 text-left">Submitted By</th>
                    <th className="px-4 py-3 text-left">Submission Date</th>
                    <th className="px-4 py-3 text-left">Wait Time</th>
                    <th className="px-4 py-3 text-left">Priority</th>
                    <th className="px-4 py-3 text-left">Review Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 transition-colors">
                  {pendingQueue.map((item) => {
                    const rowTone =
                      item.waitHours > 48
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : item.waitHours > 24
                          ? 'bg-orange-50 dark:bg-orange-900/10'
                          : ''
                    return (
                      <tr
                        key={item.id}
                        className={`${rowTone} hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelectOne(item.id)}
                            className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950 transition-colors"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 transition-colors">
                          {item.id}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300 transition-colors">
                          {item.businessName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                          {item.fullName}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                          {item.submittedAt
                            ? new Date(item.submittedAt).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                          -
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 transition-colors">
                            Normal
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 transition-colors">
                          Unassigned
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleReview(item)}
                            disabled={!canReview || isLoadingDetails}
                            className="rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50 transition-all shadow-lg shadow-orange-600/20"
                          >
                            {isLoadingDetails ? 'Loading...' : 'Review'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {pendingQueue.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-slate-500 dark:text-slate-400 transition-colors"
                      >
                        No pending KYC submissions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {reviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm transition-all">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 text-white transition-colors">
              <div>
                <h2 className="text-lg font-semibold transition-colors">
                  Review KYC - {reviewItem.seller.businessName}
                </h2>
                <p className="text-xs text-slate-400 transition-colors">
                  Submission {reviewItem.seller.id}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setReviewItem(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex flex-1 overflow-hidden transition-colors">
              <div className="w-full lg:w-3/5 bg-slate-950 text-white p-6 overflow-y-auto transition-colors">
                <div className="flex flex-wrap items-center gap-2">
                  {activeDocs.map((doc: any, index: number) => (
                    <button
                      key={doc.id}
                      onClick={() => setDocIndex(index)}
                      className={`rounded-lg border px-3 py-1 text-xs transition-all ${
                        docIndex === index
                          ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                          : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {doc.type.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium transition-colors">
                      {currentDoc
                        ? currentDoc.type.replace('_', ' ').toUpperCase()
                        : 'Document'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setZoom((prev) => Math.min(prev + 0.1, 2))
                        }
                        className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 transition-colors"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setZoom((prev) => Math.max(prev - 0.1, 0.5))
                        }
                        className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 transition-colors"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <button
                        onClick={() => setRotation((prev) => prev + 90)}
                        className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 transition-colors"
                      >
                        <RotateCw size={14} />
                      </button>
                      <a
                        href={currentDoc?.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg border border-slate-700 px-3 py-1 text-xs hover:bg-slate-800 transition-colors"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                  <div className="mt-4 flex h-[600px] items-center justify-center rounded-lg bg-slate-800 overflow-hidden transition-colors">
                    {currentDoc?.mimeType === 'application/pdf' ? (
                      <iframe
                        src={currentDoc.url}
                        className="w-full h-full"
                        title="PDF Document"
                      />
                    ) : (
                      <img
                        src={currentDoc?.url}
                        alt="KYC Document"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-slate-400 text-xs transition-colors">
                  <span>Keyboard: ← → to navigate</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setDocIndex((prev) => Math.max(prev - 1, 0))
                      }
                      className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 transition-colors"
                    >
                      <ArrowLeft size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setDocIndex((prev) =>
                          Math.min(prev + 1, activeDocs.length - 1),
                        )
                      }
                      className="rounded-lg border border-slate-700 p-2 hover:bg-slate-800 transition-colors"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                {reviewItem.status === 'resubmitted' && (
                  <div className="mt-4 rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-3 text-sm transition-colors">
                    Previous rejection reason:{' '}
                    {reviewItem.previousRejectionReason}
                  </div>
                )}
                {reviewItem.status === 'resubmitted' && (
                  <div className="mt-4 rounded-lg border border-slate-800 p-4 text-sm text-slate-300 transition-colors">
                    Side-by-side comparison available in next iteration.
                  </div>
                )}
              </div>
              <div className="w-full lg:w-2/5 bg-white dark:bg-slate-900 p-6 overflow-y-auto transition-colors">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                      Supplier Information
                    </h3>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <p>
                        <strong>Business:</strong>{' '}
                        {reviewItem.seller.businessName}
                      </p>
                      <p>
                        <strong>Owner:</strong> {reviewItem.seller.fullName}
                      </p>
                      <p>
                        <strong>Email:</strong> {reviewItem.seller.email}
                      </p>
                      <p>
                        <strong>Phone:</strong> {reviewItem.seller.phone}
                      </p>
                      <p>
                        <strong>Business Type:</strong>{' '}
                        {reviewItem.seller.businessType}
                      </p>
                      <p>
                        <strong>Category:</strong>{' '}
                        {reviewItem.seller.businessCategory}
                      </p>
                      <p>
                        <strong>Description:</strong>{' '}
                        {reviewItem.seller.additionalInfo?.description}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                      Checklist
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      {DOC_CHECKLIST.map((item) => (
                        <label key={item} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checklist.includes(item)}
                            onChange={(e) => {
                              setChecklist((prev) =>
                                e.target.checked
                                  ? [...prev, item]
                                  : prev.filter((entry) => entry !== item),
                              )
                            }}
                            className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setApproveOpen(true)}
                      disabled={!canApprove}
                      className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                    >
                      Approve KYC (A)
                    </button>
                    <button
                      onClick={() => setRejectOpen(true)}
                      disabled={!canReject}
                      className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                    >
                      Reject KYC (R)
                    </button>
                    <button
                      onClick={() => setRequestInfoOpen(true)}
                      disabled={!canReview}
                      className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                    >
                      Request More Info
                    </button>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                      Internal Notes
                    </label>
                    <textarea
                      value={internalNotes}
                      onChange={(e) => setInternalNotes(e.target.value)}
                      placeholder="Notes for audit trail"
                      className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      rows={4}
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                      Audit Trail
                    </h3>
                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      {reviewItem.auditTrail?.map((entry: any) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 transition-colors"
                        >
                          <p className="font-medium text-slate-900 dark:text-slate-200 transition-colors">
                            {entry.action}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                            {entry.actor} • {entry.time}
                          </p>
                          {entry.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                              Notes: {entry.notes}
                            </p>
                          )}
                        </div>
                      )) || (
                        <p className="text-xs text-slate-400 dark:text-slate-500 transition-colors">
                          No audit logs available.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {approveOpen && reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Approve KYC for {reviewItem.seller.businessName}?
                </h2>
              </div>
              <button
                onClick={() => setApproveOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              <p>Checklist summary:</p>
              <ul className="list-disc pl-5 space-y-1">
                {checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setApproveOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('approved')}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Ban className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Reject KYC for {reviewItem.seller.businessName}
                </h2>
              </div>
              <button
                onClick={() => setRejectOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              {REJECTION_REASONS.map((reason) => (
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
                  />
                  {reason}
                </label>
              ))}
              {rejectReasons.includes('Other') && (
                <input
                  value={rejectOther}
                  onChange={(e) => setRejectOther(e.target.value)}
                  placeholder="Other reason (required)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              )}
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="Detailed feedback (required)"
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
                onClick={() => handleAction('rejected')}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {requestInfoOpen && reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Request More Info
                </h2>
              </div>
              <button
                onClick={() => setRequestInfoOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              <textarea
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="What additional information is needed?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={4}
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

      {assignOpen && reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <User className="text-slate-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Assignment
                </h2>
              </div>
              <button
                onClick={() => setAssignOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              This action will assign the review to you and prevent others from
              editing.
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

      {bulkApproveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <FileCheck className="text-green-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Bulk Approve Selected KYCs?
                </h2>
              </div>
              <button
                onClick={() => setBulkApproveOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              Only use this for clear, straightforward cases.
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
                Confirm Bulk Approval
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  )
}
