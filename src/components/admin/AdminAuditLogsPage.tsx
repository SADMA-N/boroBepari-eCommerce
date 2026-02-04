import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Eye,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AdminProtectedRoute } from './AdminProtectedRoute'

type Severity = 'critical' | 'high' | 'medium' | 'low'
type Status = 'success' | 'failed'
type TargetType = 'user' | 'supplier' | 'product' | 'order' | 'dispute' | 'settings'

type AuditLog = {
  id: string
  timestamp: string
  adminId: string
  adminName: string
  adminRole: string
  actionType: string
  actionDescription: string
  targetType: TargetType
  targetId: string
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  reason: string
  ipAddress: string
  userAgent: string
  status: Status
  errorMessage?: string
  severity: Severity
}

const ADMINS = [
  { id: 'adm-1', name: 'Sumi Rahman', role: 'super_admin' },
  { id: 'adm-2', name: 'Rifat Ahmed', role: 'admin' },
  { id: 'adm-3', name: 'Mitu Das', role: 'moderator' },
]

const LOGS: Array<AuditLog> = [
  {
    id: 'log-1001',
    timestamp: '2026-02-04 14:20',
    adminId: 'adm-1',
    adminName: 'Sumi Rahman',
    adminRole: 'super_admin',
    actionType: 'User suspended',
    actionDescription: 'Suspended user for policy violation',
    targetType: 'user',
    targetId: 'BB-U-0003',
    beforeState: { status: 'active' },
    afterState: { status: 'suspended' },
    reason: 'Policy violation',
    ipAddress: '103.20.58.12',
    userAgent: 'Chrome 122 / macOS',
    status: 'success',
    severity: 'critical',
  },
  {
    id: 'log-1002',
    timestamp: '2026-02-04 13:55',
    adminId: 'adm-2',
    adminName: 'Rifat Ahmed',
    adminRole: 'admin',
    actionType: 'KYC approved',
    actionDescription: 'Approved KYC for supplier Rahim Textiles',
    targetType: 'supplier',
    targetId: 'BB-S-1021',
    beforeState: { kycStatus: 'pending' },
    afterState: { kycStatus: 'verified' },
    reason: 'All documents verified',
    ipAddress: '103.20.58.44',
    userAgent: 'Chrome 122 / Windows',
    status: 'success',
    severity: 'high',
  },
  {
    id: 'log-1003',
    timestamp: '2026-02-04 12:15',
    adminId: 'adm-3',
    adminName: 'Mitu Das',
    adminRole: 'moderator',
    actionType: 'Product suspended',
    actionDescription: 'Suspended product due to misleading listing',
    targetType: 'product',
    targetId: 'PRD-1003',
    beforeState: { status: 'published' },
    afterState: { status: 'suspended' },
    reason: 'Misleading listing',
    ipAddress: '103.20.58.99',
    userAgent: 'Firefox 124 / Linux',
    status: 'success',
    severity: 'critical',
  },
  {
    id: 'log-1004',
    timestamp: '2026-02-04 11:02',
    adminId: 'adm-1',
    adminName: 'Sumi Rahman',
    adminRole: 'super_admin',
    actionType: 'Settings changed',
    actionDescription: 'Updated commission rate from 10% to 9%',
    targetType: 'settings',
    targetId: 'commission_rate',
    beforeState: { defaultCommission: 10 },
    afterState: { defaultCommission: 9 },
    reason: 'Promo pricing for Q1',
    ipAddress: '103.20.58.12',
    userAgent: 'Chrome 122 / macOS',
    status: 'success',
    severity: 'medium',
  },
  {
    id: 'log-1005',
    timestamp: '2026-02-04 10:45',
    adminId: 'adm-2',
    adminName: 'Rifat Ahmed',
    adminRole: 'admin',
    actionType: 'Admin login',
    actionDescription: 'Successful login',
    targetType: 'settings',
    targetId: 'auth_login',
    beforeState: null,
    afterState: null,
    reason: '',
    ipAddress: '103.20.58.44',
    userAgent: 'Chrome 122 / Windows',
    status: 'success',
    severity: 'low',
  },
  {
    id: 'log-1006',
    timestamp: '2026-02-04 09:50',
    adminId: 'adm-3',
    adminName: 'Mitu Das',
    adminRole: 'moderator',
    actionType: 'Failed login attempt',
    actionDescription: 'Invalid password',
    targetType: 'settings',
    targetId: 'auth_login',
    beforeState: null,
    afterState: null,
    reason: '',
    ipAddress: '103.20.58.99',
    userAgent: 'Firefox 124 / Linux',
    status: 'failed',
    errorMessage: 'Invalid credentials',
    severity: 'low',
  },
]

const ACTION_TYPES = [
  'All',
  'User actions',
  'Supplier actions',
  'KYC actions',
  'Product actions',
  'Dispute actions',
  'Settings changes',
  'Login/Logout',
]

const ACTION_TYPE_MAP: Record<string, Array<string>> = {
  'User actions': ['User suspended', 'User unsuspended', 'User deleted', 'User details edited', 'Password reset'],
  'Supplier actions': ['Supplier verified', 'Supplier unverified', 'Supplier suspended', 'Supplier deleted'],
  'KYC actions': ['KYC approved', 'KYC rejected'],
  'Product actions': ['Product suspended', 'Product activated', 'Product deleted', 'Product edited', 'Flag dismissed'],
  'Dispute actions': ['Dispute resolved', 'Refund issued', 'Dispute rejected', 'Escrow released'],
  'Settings changes': ['Settings changed', 'Payment settings updated', 'Shipping settings updated', 'Email templates modified'],
  'Login/Logout': ['Admin login', 'Admin logout', 'Failed login attempt', '2FA enabled', '2FA disabled'],
}

function severityBadge(severity: Severity) {
  switch (severity) {
    case 'critical':
      return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Critical</span>
    case 'high':
      return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">High</span>
    case 'medium':
      return <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">Medium</span>
    case 'low':
      return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Low</span>
  }
}

function statusBadge(status: Status) {
  return status === 'success'
    ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Success</span>
    : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Failed</span>
}

export function AdminAuditLogsPage() {
  const [adminFilter, setAdminFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('All')
  const [severityFilter, setSeverityFilter] = useState<'all' | Severity>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [detailsLog, setDetailsLog] = useState<AuditLog | null>(null)
  const [newActivity, setNewActivity] = useState(false)
  const lastTimestampRef = useRef(LOGS[0]?.timestamp || '')

  useEffect(() => {
    const timer = window.setInterval(() => {
      const latest = LOGS[0]?.timestamp || ''
      if (latest !== lastTimestampRef.current) {
        setNewActivity(true)
        lastTimestampRef.current = latest
      }
    }, 30000)
    return () => window.clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const allowedActions =
      actionFilter === 'All' ? null : ACTION_TYPE_MAP[actionFilter]
    return LOGS.filter((log) => {
      const matchesAdmin = adminFilter === 'all' || log.adminId === adminFilter
      const matchesAction = !allowedActions || allowedActions.includes(log.actionType)
      const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
      const matchesSearch =
        !query ||
        log.adminName.toLowerCase().includes(query) ||
        log.actionType.toLowerCase().includes(query) ||
        log.targetId.toLowerCase().includes(query) ||
        log.actionDescription.toLowerCase().includes(query)
      const timestampDate = new Date(log.timestamp)
      const withinFrom = dateFrom ? timestampDate >= new Date(dateFrom) : true
      const withinTo = dateTo ? timestampDate <= new Date(dateTo) : true
      return matchesAdmin && matchesAction && matchesSeverity && matchesSearch && withinFrom && withinTo
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [adminFilter, actionFilter, severityFilter, dateFrom, dateTo, searchQuery])

  const exportCsv = () => {
    const header = [
      'id',
      'timestamp',
      'adminId',
      'adminName',
      'adminRole',
      'actionType',
      'actionDescription',
      'targetType',
      'targetId',
      'beforeState',
      'afterState',
      'reason',
      'ipAddress',
      'userAgent',
      'status',
      'errorMessage',
      'severity',
    ]
    const rows = filtered.map((log) => [
      log.id,
      log.timestamp,
      log.adminId,
      log.adminName,
      log.adminRole,
      log.actionType,
      log.actionDescription,
      log.targetType,
      log.targetId,
      JSON.stringify(log.beforeState ?? {}),
      JSON.stringify(log.afterState ?? {}),
      log.reason,
      log.ipAddress,
      log.userAgent,
      log.status,
      log.errorMessage ?? '',
      log.severity,
    ])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const from = dateFrom || 'all'
    const to = dateTo || 'all'
    link.href = url
    link.download = `audit-logs-${from}-${to}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const totalToday = 18
  const criticalCount = LOGS.filter((log) => log.severity === 'critical').length
  const actionCounts = ADMINS.map((admin) => ({
    admin: admin.name.split(' ')[0],
    count: LOGS.filter((log) => log.adminId === admin.id).length,
  }))
  const commonActions = [
    { label: 'Suspensions', value: 6 },
    { label: 'KYC', value: 5 },
    { label: 'Settings', value: 3 },
    { label: 'Logins', value: 4 },
  ]

  return (
    <AdminProtectedRoute requiredPermissions={['logs.view']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-sm text-slate-500">Complete record of all admin actions</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span>Date range</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {newActivity && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} />
              New activity detected. Refresh to update.
            </div>
            <button
              onClick={() => setNewActivity(false)}
              className="text-xs text-blue-700 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search admin, action, target ID"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">Admin: All</option>
                {ADMINS.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.name} ({admin.role})
                  </option>
                ))}
              </select>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {ACTION_TYPES.map((action) => (
                  <option key={action}>{action}</option>
                ))}
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as 'all' | Severity)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">Severity: All</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total actions today</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{totalToday}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Critical actions</p>
            <p className="mt-2 text-xl font-semibold text-red-600">{criticalCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
            <p className="text-xs text-slate-500">Actions per admin</p>
            <div className="mt-2 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={actionCounts}>
                  <XAxis dataKey="admin" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Most common actions</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            {commonActions.map((item) => (
              <div key={item.label} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <span className="font-medium text-slate-900">{item.value}</span> {item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Timestamp</th>
                  <th className="px-4 py-3 text-left">Admin User</th>
                  <th className="px-4 py-3 text-left">Action Type</th>
                  <th className="px-4 py-3 text-left">Action Description</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">IP Address</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Severity</th>
                  <th className="px-4 py-3 text-right">View Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{log.timestamp}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.adminName}
                      <span className="ml-2 text-xs text-slate-400">{log.adminRole}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.actionType}</td>
                    <td className="px-4 py-3 text-slate-600">{log.actionDescription}</td>
                    <td className="px-4 py-3 text-slate-600">{log.targetId}</td>
                    <td className="px-4 py-3 text-slate-600">{log.ipAddress}</td>
                    <td className="px-4 py-3">{statusBadge(log.status)}</td>
                    <td className="px-4 py-3">{severityBadge(log.severity)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setDetailsLog(log)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                      >
                        <Eye size={12} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <ShieldAlert size={16} className="text-orange-600" />
            Logs are immutable and retained per compliance policy. Critical actions trigger super admin alerts.
          </div>
        </div>
      </div>

      {detailsLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Audit Log Details</h2>
                <p className="text-sm text-slate-500">{detailsLog.id}</p>
              </div>
              <button onClick={() => setDetailsLog(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-slate-600">
              <p><strong>Admin:</strong> {detailsLog.adminName} ({detailsLog.adminRole})</p>
              <p><strong>Timestamp:</strong> {detailsLog.timestamp}</p>
              <p><strong>Action:</strong> {detailsLog.actionType}</p>
              <p><strong>Target:</strong> {detailsLog.targetType} {detailsLog.targetId}</p>
              <p><strong>Reason:</strong> {detailsLog.reason || 'N/A'}</p>
              <p><strong>IP Address:</strong> {detailsLog.ipAddress}</p>
              <p><strong>User Agent:</strong> {detailsLog.userAgent}</p>
              {detailsLog.errorMessage && (
                <p className="text-red-600"><strong>Error:</strong> {detailsLog.errorMessage}</p>
              )}
              <div>
                <p className="font-medium text-slate-900">Before State</p>
                <pre className="mt-2 rounded-lg bg-slate-900 p-3 text-xs text-slate-100 overflow-auto">
{JSON.stringify(detailsLog.beforeState, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-medium text-slate-900">After State</p>
                <pre className="mt-2 rounded-lg bg-slate-900 p-3 text-xs text-slate-100 overflow-auto">
{JSON.stringify(detailsLog.afterState, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex items-center justify-end border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setDetailsLog(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  )
}
