import { useMemo, useState } from 'react'
import {
  Banknote,
  Download,
  Plus,
  X,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

type PayoutStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed'

type BankAccount = {
  id: string
  bankName: string
  accountNumber: string
  isPrimary: boolean
  status: 'Verified' | 'Pending'
}

type Payout = {
  id: string
  requestedAt: string
  amount: number
  status: PayoutStatus
  bank: string
  completedAt?: string
  transactionId?: string
}

type Transaction = {
  date: string
  description: string
  reference: string
  type: 'credit' | 'debit'
  amount: number
  balanceAfter: number
}

const bankAccounts: Array<BankAccount> = [
  {
    id: 'bank-1',
    bankName: 'BRAC Bank',
    accountNumber: '**** 1023',
    isPrimary: true,
    status: 'Verified',
  },
  {
    id: 'bank-2',
    bankName: 'DBBL',
    accountNumber: '**** 8876',
    isPrimary: false,
    status: 'Pending',
  },
]

const payouts: Array<Payout> = [
  {
    id: 'PO-2041',
    requestedAt: 'Feb 1, 2026',
    amount: 42000,
    status: 'Processing',
    bank: 'BRAC Bank',
  },
  {
    id: 'PO-2038',
    requestedAt: 'Jan 25, 2026',
    amount: 65000,
    status: 'Completed',
    bank: 'BRAC Bank',
    completedAt: 'Jan 28, 2026',
    transactionId: 'TXN-554311',
  },
  {
    id: 'PO-2034',
    requestedAt: 'Jan 12, 2026',
    amount: 18000,
    status: 'Failed',
    bank: 'DBBL',
    transactionId: 'TXN-553200',
  },
]

const transactions: Array<Transaction> = [
  {
    date: 'Feb 3, 2026',
    description: 'Order Payment Received',
    reference: 'BB-1048',
    type: 'credit',
    amount: 125000,
    balanceAfter: 196000,
  },
  {
    date: 'Feb 2, 2026',
    description: 'Commission Deducted',
    reference: 'BB-1043',
    type: 'debit',
    amount: 4200,
    balanceAfter: 71000,
  },
  {
    date: 'Feb 1, 2026',
    description: 'Withdrawal',
    reference: 'PO-2041',
    type: 'debit',
    amount: 42000,
    balanceAfter: 75200,
  },
]

const escrowOrders = [
  {
    id: 'BB-1050',
    amount: 54000,
    releaseDate: 'Feb 9, 2026',
    daysRemaining: 6,
  },
  {
    id: 'BB-1044',
    amount: 32000,
    releaseDate: 'Feb 6, 2026',
    daysRemaining: 3,
  },
]

export function SellerPayoutsPage() {
  const { pushToast } = useSellerToast()
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]?.id ?? '')
  const [autoWithdraw, setAutoWithdraw] = useState(false)
  const [minAutoBalance, setMinAutoBalance] = useState('2000')
  const [schedule, setSchedule] = useState('Weekly')
  const [notifyEmail, setNotifyEmail] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchTxn, setSearchTxn] = useState('')

  const availableBalance = 75200
  const pendingBalance = 86000
  const totalEarnings = 1250000

  const feeRate = 0.01
  const fee = withdrawAmount ? Math.max(10, Number(withdrawAmount) * feeRate) : 0
  const netAmount = withdrawAmount ? Number(withdrawAmount) - fee : 0

  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      if (statusFilter && payout.status !== statusFilter) return false
      if (searchTxn && !payout.transactionId?.includes(searchTxn)) return false
      return true
    })
  }, [statusFilter, searchTxn])

  const minimumError =
    withdrawAmount && Number(withdrawAmount) < 500
      ? 'Minimum withdrawal amount is ৳500.'
      : ''

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-8">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payouts & Finance</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your earnings, withdrawals, and financial settings.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
            onClick={() => setShowWithdraw(true)}
          >
            <Banknote size={16} />
            Withdraw
          </button>
        </header>

        <section className="grid lg:grid-cols-3 gap-4">
          <BalanceCard
            title="Available Balance"
            amount={availableBalance}
            actionLabel="Withdraw"
            onAction={() => setShowWithdraw(true)}
            updated="Updated 5 mins ago"
          />
          <BalanceCard
            title="Pending Balance (Escrow)"
            amount={pendingBalance}
            subtext="Will be available on 09/02/2026"
            expandable
            details={escrowOrders}
          />
          <BalanceCard
            title="Total Earnings (All-time)"
            amount={totalEarnings}
            subtext="↑ 12% vs last period"
          />
        </section>

        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Payout History</h2>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                >
                  <option value="">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Failed">Failed</option>
                </select>
                <input
                  value={searchTxn}
                  onChange={(event) => setSearchTxn(event.target.value)}
                  placeholder="Search transaction ID"
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400">
                  <tr>
                    <th className="pb-2">Payout ID</th>
                    <th>Date Requested</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Bank</th>
                    <th>Date Completed</th>
                    <th>Transaction ID</th>
                    <th />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {filteredPayouts.map((payout) => (
                    <tr key={payout.id}>
                      <td className="py-2 font-semibold text-slate-800">{payout.id}</td>
                      <td>{payout.requestedAt}</td>
                      <td>৳{payout.amount.toLocaleString()}</td>
                      <td>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadge(payout.status)}`}>
                          {payout.status}
                        </span>
                      </td>
                      <td>{payout.bank}</td>
                      <td>{payout.completedAt ?? '-'}</td>
                      <td>{payout.transactionId ?? '-'}</td>
                      <td>
                        {payout.status === 'Failed' ? (
                          <button className="text-xs text-red-500">Retry</button>
                        ) : (
                          <button className="text-xs text-slate-500">Download</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Bank Accounts</h2>
            <div className="space-y-3">
              {bankAccounts.map((account) => (
                <div key={account.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{account.bankName}</p>
                      <p className="text-xs text-slate-500">{account.accountNumber}</p>
                    </div>
                    <span className={`text-xs font-semibold ${account.status === 'Verified' ? 'text-green-600' : 'text-orange-600'}`}>
                      {account.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                    {account.isPrimary && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-600">Primary</span>}
                    <button>Edit</button>
                    <button>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <Plus size={16} />
              Add New Account
            </button>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Transaction History</h2>
              <button className="text-sm text-slate-500">Export CSV/PDF</button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-slate-400">
                <tr>
                  <th className="pb-2">Date</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Credit/Debit</th>
                  <th>Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {transactions.map((tx) => (
                  <tr key={`${tx.date}-${tx.reference}`}>
                    <td className="py-2">{tx.date}</td>
                    <td>{tx.description}</td>
                    <td>{tx.reference}</td>
                    <td className={tx.type === 'credit' ? 'text-green-600' : 'text-red-500'}>
                      {tx.type === 'credit' ? '+' : '-'}৳{tx.amount.toLocaleString()}
                    </td>
                    <td>৳{tx.balanceAfter.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Commission Breakdown</h2>
              <p className="text-sm text-slate-500">Commission rate: 3% per order</p>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                Monthly commission: ৳12,800
              </div>
              <button className="text-sm text-orange-600">View commission policy</button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">Escrow Details</h2>
              {escrowOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between text-sm text-slate-600">
                  <span>{order.id}</span>
                  <span>৳{order.amount.toLocaleString()}</span>
                  <span>{order.daysRemaining} days</span>
                </div>
              ))}
              <p className="text-xs text-slate-400">Total escrow: ৳{pendingBalance.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Payment Settings</h2>
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Auto-withdrawal</p>
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWithdraw}
                  onChange={(event) => setAutoWithdraw(event.target.checked)}
                  className="sr-only"
                />
                <div className={`h-6 w-11 rounded-full ${autoWithdraw ? 'bg-orange-600' : 'bg-slate-200'} relative`}>
                  <div className={`h-5 w-5 rounded-full bg-white absolute top-0.5 transition ${autoWithdraw ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </label>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                value={minAutoBalance}
                onChange={(event) => setMinAutoBalance(event.target.value)}
                placeholder="Minimum balance"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <select
                value={schedule}
                onChange={(event) => setSchedule(event.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option>Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(event) => setNotifyEmail(event.target.checked)}
              />
              Email notifications for payouts
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
            <h2 className="text-lg font-semibold text-slate-900">Tax Information</h2>
            <p className="text-sm text-slate-500">TDS and GST summaries</p>
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Download TDS Certificate</button>
            <button className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Tax Reports</button>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Help & Support</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm text-slate-600">
            <div className="rounded-lg border border-slate-200 p-3">Withdrawal not received</div>
            <div className="rounded-lg border border-slate-200 p-3">Incorrect amount</div>
            <div className="rounded-lg border border-slate-200 p-3">Update bank details</div>
          </div>
          <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">Contact Support</button>
        </section>

        {showWithdraw && (
          <WithdrawModal
            available={availableBalance}
            amount={withdrawAmount}
            onAmountChange={setWithdrawAmount}
            fee={fee}
            netAmount={netAmount}
            selectedBank={selectedBank}
            onBankChange={setSelectedBank}
            bankAccounts={bankAccounts}
            minimumError={minimumError}
            onClose={() => setShowWithdraw(false)}
            onConfirm={() => {
              setShowWithdraw(false)
              pushToast('Withdrawal request submitted', 'success')
            }}
          />
        )}
      </div>
    </SellerProtectedRoute>
  )
}

function BalanceCard({
  title,
  amount,
  actionLabel,
  onAction,
  updated,
  subtext,
  expandable,
  details,
}: {
  title: string
  amount: number
  actionLabel?: string
  onAction?: () => void
  updated?: string
  subtext?: string
  expandable?: boolean
  details?: Array<{ id: string; amount: number; releaseDate: string; daysRemaining: number }>
}) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-3">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-900">৳{amount.toLocaleString()}</p>
      {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
      {updated && <p className="text-xs text-slate-400">{updated}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="rounded-lg bg-orange-600 px-4 py-2 text-xs font-semibold text-white"
        >
          {actionLabel}
        </button>
      )}
      {expandable && details && (
        <div>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="text-xs text-orange-600"
          >
            {expanded ? 'Hide breakdown' : 'View breakdown'}
          </button>
          {expanded && (
            <div className="mt-2 space-y-2 text-xs text-slate-600">
              {details.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <span>{item.id}</span>
                  <span>৳{item.amount.toLocaleString()}</span>
                  <span>{item.daysRemaining} days</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WithdrawModal({
  available,
  amount,
  onAmountChange,
  fee,
  netAmount,
  selectedBank,
  onBankChange,
  bankAccounts: bankAccountList,
  minimumError,
  onClose,
  onConfirm,
}: {
  available: number
  amount: string
  onAmountChange: (value: string) => void
  fee: number
  netAmount: number
  selectedBank: string
  onBankChange: (value: string) => void
  bankAccounts: Array<BankAccount>
  minimumError: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Request Withdrawal</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" autoFocus>
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            Available balance: ৳{available.toLocaleString()}
          </div>
          <input
            value={amount}
            onChange={(event) => onAmountChange(event.target.value)}
            placeholder="Enter withdrawal amount"
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          />
          {minimumError && <p className="text-xs text-red-500">{minimumError}</p>}
          <select
            value={selectedBank}
            onChange={(event) => onBankChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2"
          >
            {bankAccountList.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} · {account.accountNumber}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400">Expected transfer date: 3-5 business days</p>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            Withdrawal fee: ৳{fee.toFixed(2)} · Net amount: ৳{netAmount.toFixed(2)}
          </div>
          <button
            className="w-full rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white"
            disabled={!amount || Number(amount) > available || Boolean(minimumError)}
            onClick={onConfirm}
          >
            Confirm Withdrawal
          </button>
        </div>
      </div>
    </div>
  )
}

function statusBadge(status: PayoutStatus) {
  if (status === 'Pending') return 'bg-yellow-50 text-yellow-700'
  if (status === 'Processing') return 'bg-blue-50 text-blue-700'
  if (status === 'Completed') return 'bg-green-50 text-green-700'
  return 'bg-red-50 text-red-600'
}
