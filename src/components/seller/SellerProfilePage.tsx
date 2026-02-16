import { useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, UploadCloud } from 'lucide-react'
import type { SellerUser } from '@/types/seller'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerAuth } from '@/contexts/SellerAuthContext'
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
  const { seller, updateProfile } = useSellerAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('business')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const showMessage = (message: string) => {
    setSuccess(message)
    setError(null)
    pushToast(message, 'success')
    window.setTimeout(() => setSuccess(null), 2500)
  }

  const handleUpdate = async (data: Partial<SellerUser>) => {
    setIsSaving(true)
    setError(null)
    try {
      await updateProfile(data)
      showMessage('Profile updated successfully')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
      pushToast(err.message || 'Update failed', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  if (!seller) return null

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 transition-colors">
              Profile & Settings
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 transition-colors">
              Manage your business profile, security, and store preferences.
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 transition-colors">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {isSaving && (
          <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 p-3 text-sm text-blue-700 dark:text-blue-400 flex items-center gap-2 transition-colors">
            <div className="w-4 h-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
            Saving changes...
          </div>
        )}

        {success && (
          <div className="rounded-xl border border-green-100 dark:border-green-900/30 bg-green-50 dark:bg-green-900/10 p-3 text-sm text-green-700 dark:text-green-400 transition-colors">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-700 dark:text-red-400 transition-colors">
            {error}
          </div>
        )}

        {activeTab === 'business' && (
          <BusinessTab seller={seller} onUpdate={handleUpdate} />
        )}
        {activeTab === 'bank' && (
          <BankTab seller={seller} onUpdate={handleUpdate} />
        )}
        {activeTab === 'kyc' && (
          <KycTab seller={seller} onSuccess={showMessage} />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab onSuccess={showMessage} />
        )}
        {activeTab === 'security' && <SecurityTab onSuccess={showMessage} />}
        {activeTab === 'store' && <StoreTab onSuccess={showMessage} />}
      </div>
    </SellerProtectedRoute>
  )
}

function BusinessTab({
  seller,
  onUpdate,
}: {
  seller: SellerUser
  onUpdate: (data: Partial<SellerUser>) => Promise<void>
}) {
  const [businessName, setBusinessName] = useState(seller.businessName)
  const [businessType, setBusinessType] = useState(seller.businessType || '')
  const [categories, setCategories] = useState<Array<string>>(
    seller.businessCategory ? [seller.businessCategory] : [],
  )
  const [tradeLicense, setTradeLicense] = useState(
    seller.tradeLicenseNumber || '',
  )
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

  const toggleCategory = (value: string) => {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    )
  }

  const handleSaveBusiness = () => {
    onUpdate({
      businessName,
      businessType,
      businessCategory: categories.join(', '),
      yearsInBusiness: years ? parseInt(years) : null,
    })
  }

  const handleSaveContact = () => {
    onUpdate({
      fullName: ownerName,
      phone,
      address,
      city,
      postalCode: postal,
    })
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Business Information">
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Business Name"
            value={businessName}
            onChange={setBusinessName}
            required
          />
          <SelectField
            label="Business Type"
            value={businessType}
            onChange={setBusinessType}
            options={['Manufacturer', 'Wholesaler', 'Distributor', 'Retailer']}
          />
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Industrial Supplies',
                'Electronics',
                'Apparel',
                'Home & Kitchen',
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleCategory(item)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    categories.includes(item)
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <Field
            label="Trade License Number"
            value={tradeLicense}
            onChange={setTradeLicense}
            disabled
            helper="Locked after verification"
          />
          <Field
            label="Years in Business"
            value={years}
            onChange={setYears}
            type="number"
          />
          <TextArea
            label="Business Description"
            value={description}
            onChange={setDescription}
            max={500}
          />
          <FileField
            label="Business Logo"
            onFile={setLogo}
            helper="PNG/JPEG recommended"
          />
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleSaveBusiness}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/10"
          >
            Save Changes
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Contact Information">
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Owner/Manager Name"
            value={ownerName}
            onChange={setOwnerName}
            required
          />
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            helper="Verified"
            disabled
          />
          <Field
            label="Mobile Number"
            value={phone}
            onChange={setPhone}
            helper="Verified"
          />
          <Field label="Landline" value={landline} onChange={setLandline} />
          <TextArea
            label="Business Address"
            value={address}
            onChange={setAddress}
          />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="Postal Code" value={postal} onChange={setPostal} />
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleSaveContact}
            className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Update
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function BankTab({
  seller,
  onUpdate,
}: {
  seller: SellerUser
  onUpdate: (data: Partial<SellerUser>) => Promise<void>
}) {
  const [bankName, setBankName] = useState(seller.bankName || '')
  const [accountHolderName, setAccountHolderName] = useState(
    seller.accountHolderName || '',
  )
  const [accountNumber, setAccountNumber] = useState(seller.accountNumber || '')
  const [branchName, setBranchName] = useState(seller.branchName || '')
  const [routingNumber, setRoutingNumber] = useState(seller.routingNumber || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveBank = async () => {
    setIsSaving(true)
    try {
      await onUpdate({
        bankName,
        accountHolderName,
        accountNumber,
        branchName,
        routingNumber,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Bank Account Details">
        <div className="grid md:grid-cols-2 gap-4">
          <SelectField
            label="Bank Name"
            value={bankName}
            onChange={setBankName}
            options={[
              'BRAC Bank',
              'Dutch-Bangla Bank',
              'Eastern Bank',
              'Islami Bank',
              'Prime Bank',
              'Sonali Bank',
              'Standard Chartered',
            ]}
          />
          <Field
            label="Account Holder Name"
            value={accountHolderName}
            onChange={setAccountHolderName}
          />
          <Field
            label="Account Number"
            value={accountNumber}
            onChange={setAccountNumber}
          />
          <Field
            label="Branch Name"
            value={branchName}
            onChange={setBranchName}
          />
          <Field
            label="Routing Number"
            value={routingNumber}
            onChange={setRoutingNumber}
          />
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={handleSaveBank}
            disabled={isSaving}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors disabled:opacity-60 shadow-md shadow-orange-600/10"
          >
            {isSaving ? 'Saving...' : 'Update Bank Details'}
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function KycTab({
  seller,
  onSuccess,
}: {
  seller: SellerUser
  onSuccess: (msg: string) => void
}) {
  return (
    <div className="space-y-6">
      <SectionCard title="Document Status">
        <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-400 transition-colors">
          <CheckCircle2
            size={18}
            className={
              seller.kycStatus === 'approved'
                ? 'text-green-600'
                : 'text-orange-600'
            }
          />
          Overall KYC Status:{' '}
          {seller.kycStatus.charAt(0).toUpperCase() + seller.kycStatus.slice(1)}
          {seller.kycStatus === 'approved' && (
            <span className="rounded-full bg-green-50 dark:bg-green-900/20 px-2 py-0.5 text-xs text-green-600 dark:text-green-400 transition-colors">
              Verified
            </span>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Uploaded Documents">
        <DocumentRow
          label="Trade License"
          status={
            seller.kycStatus === 'approved' ? 'Approved' : 'Pending Review'
          }
        />
        <DocumentRow
          label="NID (Front)"
          status={
            seller.kycStatus === 'approved' ? 'Approved' : 'Pending Review'
          }
        />
        <DocumentRow
          label="NID (Back)"
          status={
            seller.kycStatus === 'approved' ? 'Approved' : 'Pending Review'
          }
        />
      </SectionCard>

      <SectionCard title="Add Supplementary Documents">
        <FileField
          label="Upload document"
          onFile={() => onSuccess('Document uploaded')}
        />
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
        <SelectField
          label="Frequency"
          value={frequency}
          onChange={setFrequency}
          options={['Instant', 'Daily Digest (9 AM)', 'Weekly Summary']}
        />
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Do Not Disturb From"
            value={dnd.from}
            onChange={(value) => setDnd((prev) => ({ ...prev, from: value }))}
          />
          <Field
            label="Do Not Disturb To"
            value={dnd.to}
            onChange={(value) => setDnd((prev) => ({ ...prev, to: value }))}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={weekend}
            onChange={(event) => setWeekend(event.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
          />
          Weekend notifications
        </label>
        <div className="mt-4 text-right">
          <button
            onClick={() => onSuccess('Notification preferences saved')}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/10"
          >
            Save Preferences
          </button>
        </div>
      </SectionCard>
    </div>
  )
}

function SecurityTab({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const { logout } = useSellerAuth()
  const [password, setPassword] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [twoFA, setTwoFA] = useState(false)
  return (
    <div className="space-y-6">
      <SectionCard title="Change Password">
        <div className="grid md:grid-cols-2 gap-4">
          <Field
            label="Current Password"
            value={password.current}
            onChange={(value) =>
              setPassword((prev) => ({ ...prev, current: value }))
            }
            type="password"
          />
          <Field
            label="New Password"
            value={password.next}
            onChange={(value) =>
              setPassword((prev) => ({ ...prev, next: value }))
            }
            type="password"
          />
          <Field
            label="Confirm New Password"
            value={password.confirm}
            onChange={(value) =>
              setPassword((prev) => ({ ...prev, confirm: value }))
            }
            type="password"
          />
          <div className="text-xs text-slate-500 dark:text-gray-500 transition-colors">
            Password strength: Strong
          </div>
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={() => onSuccess('Password updated')}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/10"
          >
            Update Password
          </button>
        </div>
      </SectionCard>
      <SectionCard title="Two-Factor Authentication">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors">
            Enable 2FA for extra security
          </p>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={twoFA}
              onChange={(event) => setTwoFA(event.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-6 w-11 rounded-full transition-colors ${twoFA ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-700'} relative`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white dark:bg-slate-100 absolute top-0.5 transition ${twoFA ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </div>
          </label>
        </div>
        <div className="mt-3 text-xs text-slate-500 dark:text-gray-500 transition-colors">
          Scan QR code in your authenticator app. Backup codes available.
        </div>
      </SectionCard>
      <SectionCard title="Account Session">
        <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 transition-colors">
          <div>
            <p className="text-sm font-bold text-red-800 dark:text-red-400">
              Danger Zone
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">
              Terminate your current session
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors shadow-sm"
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
          <p className="text-sm text-slate-600 dark:text-gray-400 transition-colors">
            Store Status
          </p>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!vacation}
              onChange={(event) => setVacation(!event.target.checked)}
              className="sr-only"
            />
            <div
              className={`h-6 w-11 rounded-full transition-colors ${!vacation ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-700'} relative`}
            >
              <div
                className={`h-5 w-5 rounded-full bg-white dark:bg-slate-100 absolute top-0.5 transition ${!vacation ? 'translate-x-5' : 'translate-x-1'}`}
              />
            </div>
          </label>
        </div>
        {vacation && (
          <div className="grid md:grid-cols-2 gap-3 mt-4">
            <Field
              label="Vacation From"
              value={vacationDates.from}
              onChange={(value) =>
                setVacationDates((prev) => ({ ...prev, from: value }))
              }
              type="date"
            />
            <Field
              label="Vacation To"
              value={vacationDates.to}
              onChange={(value) =>
                setVacationDates((prev) => ({ ...prev, to: value }))
              }
              type="date"
            />
            <TextArea
              label="Auto-response Message"
              value="We are on vacation, expect a delay."
              onChange={() => {}}
            />
          </div>
        )}
      </SectionCard>
      <SectionCard title="Catalog Settings">
        <div className="space-y-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-gray-400 cursor-pointer transition-colors">
            <input
              type="checkbox"
              checked={autoAccept}
              onChange={(event) => setAutoAccept(event.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
            />
            Auto-accept orders
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Auto-decline RFQs below MOQ"
              value="50"
              onChange={() => {}}
            />
            <Field
              label="Minimum target price threshold"
              value="৳100"
              onChange={() => {}}
            />
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Integration Settings">
        <div className="space-y-4">
          <Field
            label="API Key"
            value="sk_live_********"
            onChange={() => {}}
            disabled
          />
          <Field
            label="Webhook URL"
            value="https://example.com/webhook"
            onChange={() => {}}
          />
          <div className="text-right">
            <button
              onClick={() => onSuccess('Settings saved')}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-md shadow-orange-600/10"
            >
              Save Settings
            </button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}

function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 transition-colors">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-gray-100 transition-colors">
        {title}
      </h2>
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
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  helper?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 disabled:bg-slate-50 dark:disabled:bg-slate-900/50 transition-all placeholder:text-slate-400"
      />
      {helper && (
        <p className="mt-1 text-xs text-slate-400 dark:text-gray-500 transition-colors">
          {helper}
        </p>
      )}
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
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={max}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all placeholder:text-slate-400"
        rows={3}
      />
      {max && (
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 transition-colors">
          {value.length}/{max}
        </p>
      )}
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
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all"
        >
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none"
        />
      </div>
    </div>
  )
}

function FileField({
  label,
  onFile,
  helper,
}: {
  label: string
  onFile: (file: File | null) => void
  helper?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2 transition-colors">
        {label}
      </label>
      <label className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-3 py-3 text-sm text-slate-500 dark:text-gray-400 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <UploadCloud size={16} />
        Upload file
        <input
          type="file"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0] || null)}
        />
      </label>
      {helper && (
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1 transition-colors">
          {helper}
        </p>
      )}
    </div>
  )
}

function DocumentRow({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-gray-400 transition-colors bg-gray-50 dark:bg-slate-950/30">
      <span>{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 dark:text-gray-500">
          {status}
        </span>
        <button className="text-xs text-orange-600 dark:text-orange-500 hover:underline">
          View
        </button>
        <button className="text-xs text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300">
          Download
        </button>
        <button className="text-xs text-red-500 dark:text-red-400 hover:underline">
          Re-upload
        </button>
      </div>
    </div>
  )
}

function NotificationRow({ label }: { label: string }) {
  return (
    <div className="grid md:grid-cols-[1fr_repeat(3,auto)] items-center gap-3 text-sm text-slate-600 dark:text-gray-400 transition-colors p-2 border-b dark:border-slate-800 last:border-0">
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
    <label className="inline-flex items-center gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={enabled}
        onChange={(event) => setEnabled(event.target.checked)}
        className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
      />
      <span className="text-xs group-hover:text-gray-900 dark:group-hover:text-gray-200 transition-colors">
        {label}
      </span>
    </label>
  )
}
