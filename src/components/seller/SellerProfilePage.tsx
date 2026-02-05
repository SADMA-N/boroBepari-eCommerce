import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  UploadCloud,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

type TabKey =
  | 'business'
  | 'bank'
  | 'kyc'
  | 'notifications'
  | 'security'
  | 'store'

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'business', label: 'Business Profile' },
  { key: 'bank', label: 'Bank Details' },
  { key: 'kyc', label: 'KYC Documents' },
  { key: 'notifications', label: 'Notification Settings' },
  { key: 'security', label: 'Security' },
  { key: 'store', label: 'Store Settings' },
]

export function SellerProfilePage() {
  const { pushToast } = useSellerToast()
  const { seller } = useSellerAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('business')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showMessage = (message: string) => {
    setSuccess(message)
    setError(null)
    pushToast(message, 'success')
    window.setTimeout(() => setSuccess(null), 2500)
  }

  if (!seller) return null

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your business profile, security, and store preferences.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  activeTab === tab.key ? 'bg-orange-50 text-orange-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {success && (
          <div className="rounded-xl border border-green-100 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {activeTab === 'business' && <BusinessTab seller={seller} onSuccess={showMessage} />}
        {activeTab === 'bank' && <BankTab seller={seller} onSuccess={showMessage} />}
        {activeTab === 'kyc' && <KycTab seller={seller} onSuccess={showMessage} />}
        {activeTab === 'notifications' && <NotificationsTab onSuccess={showMessage} />}
        {activeTab === 'security' && <SecurityTab onSuccess={showMessage} />}
        {activeTab === 'store' && <StoreTab onSuccess={showMessage} />}
      </div>
    </SellerProtectedRoute>
  )
}

function BusinessTab({ seller, onSuccess }: { seller: any; onSuccess: (msg: string) => void }) {
  const [businessName, setBusinessName] = useState(seller.businessName)
  const [businessType, setBusinessType] = useState(seller.businessType || '')
  const [categories, setCategories] = useState<Array<string>>(seller.businessCategory ? [seller.businessCategory] : [])
  const [tradeLicense, setTradeLicense] = useState(seller.tradeLicenseNumber || '')
  const [years, setYears] = useState(seller.yearsInBusiness?.toString() || '')
  const [description, setDescription] = useState('')
  const [logo, setLogo] = useState<File | null>(null)

  const [ownerName, setOwnerName] = useState(seller.fullName || '')
  const [email, setEmail] = useState(seller.email)
  const [phone, setPhone] = useState(seller.phone || '')
  const [landline, setLandline] = useState('')
  const [address, setAddress] = useState(seller.address || '')
  const [city, setCity] = useState(seller.city || '')
  const [postal, setPostal] = useState(seller.postalCode || '')

  const [storeName, setStoreName] = useState(seller.businessName)
  const [banner, setBanner] = useState<File | null>(null)
  const [storeDesc, setStoreDesc] = useState('')
  const [hours, setHours] = useState('Sat-Thu, 9AM-8PM')
  const [returnPolicy, setReturnPolicy] = useState('Returns accepted within 15 days.')
  const [shippingPolicy, setShippingPolicy] = useState('Ships within 48 hours.')

  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    )
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Business Information">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Business Name" value={businessName} onChange={setBusinessName} required />
          <SelectField label="Business Type" value={businessType} onChange={setBusinessType} options={['Manufacturer', 'Wholesaler', 'Distributor', 'Retailer']} />
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-slate-700 mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {['Industrial Supplies', 'Electronics', 'Apparel', 'Home & Kitchen'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleCategory(item)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    categories.includes(item) ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <Field label="Trade License Number" value={tradeLicense} onChange={setTradeLicense} disabled helper="Locked after verification" />
          <Field label="Years in Business" value={years} onChange={setYears} />
          <TextArea label="Business Description" value={description} onChange={setDescription} max={500} />
          <FileField label="Business Logo" onFile={setLogo} helper="PNG/JPEG recommended" />
        </div>
        <div className="mt-4 text-right">
          <button onClick={() => onSuccess('Business profile updated')} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Save Changes
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Contact Information">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Owner/Manager Name" value={ownerName} onChange={setOwnerName} required />
          <Field label="Email" value={email} onChange={setEmail} helper="Verified" />
          <Field label="Mobile Number" value={phone} onChange={setPhone} helper="Verified" />
          <Field label="Landline" value={landline} onChange={setLandline} />
          <TextArea label="Business Address" value={address} onChange={setAddress} />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="Postal Code" value={postal} onChange={setPostal} />
        </div>
        <div className="mt-4 text-right">
          <button onClick={() => onSuccess('Contact info updated')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">
            Update
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Store Profile (Public-facing)">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Store Name" value={storeName} onChange={setStoreName} />
          <FileField label="Store Banner (1920x400px)" onFile={setBanner} />
          <RichTextField label="Store Description" value={storeDesc} onChange={setStoreDesc} />
          <Field label="Operating Hours" value={hours} onChange={setHours} />
          <TextArea label="Return Policy" value={returnPolicy} onChange={setReturnPolicy} />
          <TextArea label="Shipping Policy" value={shippingPolicy} onChange={setShippingPolicy} />
        </div>
      </SectionCard>
    </div>
  )
}

function BankTab({ seller, onSuccess }: { seller: any; onSuccess: (msg: string) => void }) {
  const [accounts, setAccounts] = useState([
    {
      id: 'bank-1',
      bankName: seller.bankName || 'Not Linked',
      number: seller.accountNumber ? `XXXX${seller.accountNumber.slice(-4)}` : 'N/A',
      holder: seller.accountHolderName || seller.fullName || 'N/A',
      branch: seller.branchName || 'N/A',
      ifsc: seller.routingNumber || 'N/A',
      verified: true,
      primary: true,
    },
  ])
  const [newAccount, setNewAccount] = useState({
    bankName: '',
    holder: '',
    number: '',
    confirm: '',
    branch: '',
    ifsc: '',
    primary: false,
  })
  const [bankError, setBankError] = useState('')

  const addAccount = () => {
    setBankError('')
    if (!newAccount.bankName || !newAccount.number || newAccount.number !== newAccount.confirm) return
    if (!/^[0-9]{8,20}$/.test(newAccount.number)) {
      setBankError('Account number must be 8-20 digits.')
      return
    }
    if (newAccount.ifsc && !/^[A-Za-z0-9]{4,15}$/.test(newAccount.ifsc)) {
      setBankError('Invalid IFSC/Routing format.')
      return
    }
    setAccounts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        bankName: newAccount.bankName,
        number: `XXXX${newAccount.number.slice(-4)}`,
        holder: newAccount.holder,
        branch: newAccount.branch,
        ifsc: newAccount.ifsc,
        verified: false,
        primary: newAccount.primary,
      },
    ])
    onSuccess('Bank account added')
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Linked Bank Accounts">
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{account.bankName}</p>
                  <p className="text-xs text-slate-500">{account.number}</p>
                  <p className="text-xs text-slate-400">{account.holder}</p>
                </div>
                <span className={`text-xs font-semibold ${account.verified ? 'text-green-600' : 'text-orange-600'}`}>
                  {account.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {account.branch} · {account.ifsc}
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                {account.primary && <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-600">Primary</span>}
                <button>Edit</button>
                <button>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Add Bank Account">
        <div className="grid md:grid-cols-2 gap-4">
          <SelectField label="Bank Name" value={newAccount.bankName} onChange={(value) => setNewAccount((prev) => ({ ...prev, bankName: value }))} options={['BRAC Bank', 'DBBL', 'City Bank']} />
          <Field label="Account Holder Name" value={newAccount.holder} onChange={(value) => setNewAccount((prev) => ({ ...prev, holder: value }))} />
          <Field label="Account Number" value={newAccount.number} onChange={(value) => setNewAccount((prev) => ({ ...prev, number: value }))} />
          <Field label="Re-enter Account Number" value={newAccount.confirm} onChange={(value) => setNewAccount((prev) => ({ ...prev, confirm: value }))} />
          <Field label="Branch Name" value={newAccount.branch} onChange={(value) => setNewAccount((prev) => ({ ...prev, branch: value }))} />
          <Field label="IFSC/Routing Number" value={newAccount.ifsc} onChange={(value) => setNewAccount((prev) => ({ ...prev, ifsc: value }))} />
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={newAccount.primary}
              onChange={(event) => setNewAccount((prev) => ({ ...prev, primary: event.target.checked }))}
            />
            Set as Primary
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={addAccount} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Add Account
          </button>
          <p className="text-xs text-slate-500">Verify via ৳1 penny drop or upload cancelled cheque.</p>
        </div>
        {bankError && <p className="text-xs text-red-500 mt-2">{bankError}</p>}
      </SectionCard>
    </div>
  )
}

function KycTab({ seller, onSuccess }: { seller: any; onSuccess: (msg: string) => void }) {
  return (
    <div className="space-y-6">
      <SectionCard title="Document Status">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <CheckCircle2 size={18} className={seller.kycStatus === 'approved' ? "text-green-600" : "text-orange-600"} />
          Overall KYC Status: {seller.kycStatus.charAt(0).toUpperCase() + seller.kycStatus.slice(1)}
          {seller.kycStatus === 'approved' && (
            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600">Verified</span>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Uploaded Documents">
        <DocumentRow label="Trade License" status={seller.kycStatus === 'approved' ? "Approved" : "Pending Review"} />
        <DocumentRow label="NID (Front)" status={seller.kycStatus === 'approved' ? "Approved" : "Pending Review"} />
        <DocumentRow label="NID (Back)" status={seller.kycStatus === 'approved' ? "Approved" : "Pending Review"} />
      </SectionCard>

      <SectionCard title="Add Supplementary Documents">
        <FileField label="Upload document" onFile={() => onSuccess('Document uploaded')} />
      </SectionCard>
    </div>
  )
}

function NotificationsTab({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [frequency, setFrequency] = useState('Instant')
  const [dnd, setDnd] = useState({ from: '22:00', to: '07:00' })
  const [weekend, setWeekend] = useState(true)
  return (
    <div className="space-y-6">
      <SectionCard title="Notification Preferences">
        <NotificationRow label="New Order" />
        <NotificationRow label="New RFQ" />
        <NotificationRow label="Low Stock Alert" />
        <NotificationRow label="Payment Received" />
        <NotificationRow label="Payout Completed" />
        <NotificationRow label="Buyer Message" />
        <NotificationRow label="System Updates" />
      </SectionCard>
      <SectionCard title="Frequency Settings">
        <SelectField label="Frequency" value={frequency} onChange={setFrequency} options={['Instant', 'Daily Digest (9 AM)', 'Weekly Summary']} />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Do Not Disturb From" value={dnd.from} onChange={(value) => setDnd((prev) => ({ ...prev, from: value }))} />
          <Field label="Do Not Disturb To" value={dnd.to} onChange={(value) => setDnd((prev) => ({ ...prev, to: value }))} />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={weekend} onChange={(event) => setWeekend(event.target.checked)} />
          Weekend notifications
        </label>
        <div className="mt-4 text-right">
          <button onClick={() => onSuccess('Notification preferences saved')} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Save Preferences
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function SecurityTab({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const { logout } = useSellerAuth()
  const [password, setPassword] = useState({ current: '', next: '', confirm: '' })
  const [twoFA, setTwoFA] = useState(false)
  return (
    <div className="space-y-6">
      <SectionCard title="Change Password">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Current Password" value={password.current} onChange={(value) => setPassword((prev) => ({ ...prev, current: value }))} />
          <Field label="New Password" value={password.next} onChange={(value) => setPassword((prev) => ({ ...prev, next: value }))} />
          <Field label="Confirm New Password" value={password.confirm} onChange={(value) => setPassword((prev) => ({ ...prev, confirm: value }))} />
          <div className="text-xs text-slate-500">Password strength: Strong</div>
        </div>
        <div className="mt-4 text-right">
          <button onClick={() => onSuccess('Password updated')} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
            Update Password
          </button>
        </div>
      </SectionCard>
      <SectionCard title="Two-Factor Authentication">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Enable 2FA for extra security</p>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={twoFA} onChange={(event) => setTwoFA(event.target.checked)} className="sr-only" />
            <div className={`h-6 w-11 rounded-full ${twoFA ? 'bg-orange-600' : 'bg-slate-200'} relative`}>
              <div className={`h-5 w-5 rounded-full bg-white absolute top-0.5 transition ${twoFA ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          Scan QR code in your authenticator app. Backup codes available.
        </div>
      </SectionCard>
      <SectionCard title="Account Session">
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
          <div>
            <p className="text-sm font-bold text-red-800">Danger Zone</p>
            <p className="text-xs text-red-600">Terminate your current session</p>
          </div>
          <button 
            onClick={() => logout()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function StoreTab({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [vacation, setVacation] = useState(false)
  const [vacationDates, setVacationDates] = useState({ from: '', to: '' })
  const [autoAccept, setAutoAccept] = useState(true)
  return (
    <div className="space-y-6">
      <SectionCard title="Operating Settings">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">Store Status</p>
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={!vacation} onChange={(event) => setVacation(!event.target.checked)} className="sr-only" />
            <div className={`h-6 w-11 rounded-full ${!vacation ? 'bg-orange-600' : 'bg-slate-200'} relative`}>
              <div className={`h-5 w-5 rounded-full bg-white absolute top-0.5 transition ${!vacation ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
          </label>
        </div>
        {vacation && (
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Vacation From" value={vacationDates.from} onChange={(value) => setVacationDates((prev) => ({ ...prev, from: value }))} />
            <Field label="Vacation To" value={vacationDates.to} onChange={(value) => setVacationDates((prev) => ({ ...prev, to: value }))} />
            <TextArea label="Auto-response Message" value="We are on vacation, expect a delay." onChange={() => {}} />
          </div>
        )}
      </SectionCard>
      <SectionCard title="Catalog Settings">
        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={autoAccept} onChange={(event) => setAutoAccept(event.target.checked)} />
          Auto-accept orders
        </label>
        <Field label="Auto-decline RFQs below MOQ" value="50" onChange={() => {}} />
        <Field label="Minimum target price threshold" value="৳100" onChange={() => {}} />
      </SectionCard>
      <SectionCard title="Integration Settings">
        <Field label="API Key" value="sk_live_********" onChange={() => {}} />
        <Field label="Webhook URL" value="https://example.com/webhook" onChange={() => {}} />
        <button onClick={() => onSuccess('Settings saved')} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white">
          Save Settings
        </button>
      </SectionCard>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  disabled,
  helper,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  helper?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
      />
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
    </div>
  )
}

function TextArea({
  label,
  value,
  onChange,
  max,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  max?: number
}) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={max}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        rows={3}
      />
      {max && <p className="text-xs text-slate-400 mt-1">{value.length}/{max}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<string>
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

function FileField({ label, onFile, helper }: { label: string; onFile: (file: File | null) => void; helper?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500 cursor-pointer">
        <UploadCloud size={16} />
        Upload file
        <input type="file" className="hidden" onChange={(event) => onFile(event.target.files?.[0] || null)} />
      </label>
      {helper && <p className="text-xs text-slate-400 mt-1">{helper}</p>}
    </div>
  )
}

function RichTextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="md:col-span-2">
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <div
        contentEditable
        className="min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
        onInput={(event) => onChange(sanitizeHtml((event.target as HTMLDivElement).innerText))}
        suppressContentEditableWarning
      >
        {value}
      </div>
    </div>
  )
}

function sanitizeHtml(input: string) {
  return input.replace(/[<>]/g, '')
}

function DocumentRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm text-slate-600">
      <span>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500">{status}</span>
        <button className="text-xs text-orange-600">View</button>
        <button className="text-xs text-slate-500">Download</button>
        <button className="text-xs text-red-500">Re-upload</button>
      </div>
    </div>
  )
}

function NotificationRow({ label }: { label: string }) {
  return (
    <div className="grid md:grid-cols-[1fr_repeat(3,auto)] items-center gap-3 text-sm text-slate-600">
      <span>{label}</span>
      <Toggle label="Email" />
      <Toggle label="SMS" />
      <Toggle label="Push" />
    </div>
  )
}

function Toggle({ label }: { label: string }) {
  const [enabled, setEnabled] = useState(true)
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
      {label}
    </label>
  )
}

function SessionRow({ device, location, time }: { device: string; location: string; time: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
      <div>
        <p className="text-sm text-slate-700">{device}</p>
        <p className="text-xs text-slate-400">{location}</p>
      </div>
      <div className="text-xs text-slate-500">{time}</div>
      <button className="text-xs text-red-500">Logout</button>
    </div>
  )
}

function HistoryRow({ date, ip, device, failed }: { date: string; ip: string; device: string; failed?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${failed ? 'border-red-100 bg-red-50' : 'border-slate-200'}`}>
      <div>
        <p className="text-sm text-slate-700">{date}</p>
        <p className="text-xs text-slate-400">{ip}</p>
      </div>
      <span className="text-xs text-slate-500">{device}</span>
      {failed && <span className="text-xs text-red-500">Failed</span>}
    </div>
  )
}
