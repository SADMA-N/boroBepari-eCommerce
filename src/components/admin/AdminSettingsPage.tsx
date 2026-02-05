import { useMemo, useState } from 'react'
import {
  Activity,
  CreditCard,
  Database,
  Eye,
  HardDrive,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  TestTube2,
  ToggleLeft,
  ToggleRight,
  Truck,
  UploadCloud,
  Wrench,
} from 'lucide-react'
import { AdminProtectedRoute } from './AdminProtectedRoute'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

type SettingsTab =
  | 'general'
  | 'commission'
  | 'payment'
  | 'shipping'
  | 'notifications'
  | 'security'
  | 'maintenance'

const TABS: Array<{ id: SettingsTab; label: string; icon: React.ElementType }> =
  [
    { id: 'general', label: 'General Settings', icon: Settings },
    { id: 'commission', label: 'Commission & Fees', icon: CreditCard },
    { id: 'payment', label: 'Payment Settings', icon: CreditCard },
    { id: 'shipping', label: 'Shipping Settings', icon: Truck },
    { id: 'notifications', label: 'Email & Notifications', icon: Mail },
    { id: 'security', label: 'Security & Compliance', icon: Shield },
    { id: 'maintenance', label: 'Maintenance Mode', icon: Wrench },
  ]

const DEFAULT_CATEGORIES = [
  'Electronics',
  'Apparel',
  'Home & Kitchen',
  'Industrial',
  'Grocery',
]

export function AdminSettingsPage() {
  const { can } = useAdminAuth()
  const canEdit = can('settings.edit')
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false)
  const [twoFactorAdmin, setTwoFactorAdmin] = useState(true)
  const [twoFactorSupplier, setTwoFactorSupplier] = useState(false)
  const [gdprEnabled, setGdprEnabled] = useState(true)
  const [dataExportEnabled, setDataExportEnabled] = useState(true)
  const [dataDeletionEnabled, setDataDeletionEnabled] = useState(true)
  const [bkashEnabled, setBkashEnabled] = useState(true)
  const [cardsEnabled, setCardsEnabled] = useState(true)
  const [codEnabled, setCodEnabled] = useState(false)
  const [firebaseEnabled, setFirebaseEnabled] = useState(true)
  const [autoModerationEnabled, setAutoModerationEnabled] = useState(true)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)

  const activeIcon = useMemo(() => {
    const tab = TABS.find((t) => t.id === activeTab)
    return tab ? tab.icon : Settings
  }, [activeTab])

  const ActiveIcon = activeIcon

  return (
    <AdminProtectedRoute requiredPermissions={['settings.view']}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500">
            Configure platform-wide settings and integrations.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                      active
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6">
            <div className="flex items-center gap-2">
              <ActiveIcon size={20} className="text-orange-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>

            {activeTab === 'general' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Platform Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-600">
                        Platform Name
                      </label>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        defaultValue="BoroBepari"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">
                        Default Language
                      </label>
                      <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option>English</option>
                        <option>বাংলা</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">
                        Default Currency
                      </label>
                      <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option>BDT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">Timezone</label>
                      <select className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option>Asia/Dhaka</option>
                        <option>UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600">
                        Date/Time Format
                      </label>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        defaultValue="DD MMM YYYY, hh:mm A"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <UploadCloud size={14} /> Upload Logo
                      </button>
                      <button className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <UploadCloud size={14} /> Upload Favicon
                      </button>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                    <Save size={14} /> Save Platform Info
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Business Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Company Legal Name"
                      defaultValue="BoroBepari Limited"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Business Address"
                      defaultValue="Gulshan, Dhaka"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Contact Email"
                      defaultValue="support@borobepari.com"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Contact Phone"
                      defaultValue="+880-1711-000000"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="GST/Tax Number"
                      defaultValue="TIN-0099281"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Terms & Conditions URL"
                      defaultValue="https://borobepari.com/terms"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Privacy Policy URL"
                      defaultValue="https://borobepari.com/privacy"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                    <Save size={14} /> Save Business Info
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    SEO Settings
                  </h3>
                  <div className="grid gap-4">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Meta Title"
                      defaultValue="BoroBepari - Wholesale Marketplace"
                    />
                    <textarea
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Meta Description"
                      rows={3}
                      defaultValue="Bangladesh's leading B2B marketplace."
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Meta Keywords"
                      defaultValue="wholesale, b2b, bangladesh"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                    <Save size={14} /> Save SEO Settings
                  </button>
                </section>
              </fieldset>
            )}

            {activeTab === 'commission' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Commission Structure
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-600">
                        Default Commission Rate (%)
                      </label>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        defaultValue="10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span className="flex-1 text-slate-600">
                          {category}
                        </span>
                        <input
                          className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          defaultValue="8"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setCategories((prev) => [
                          ...prev,
                          `New Category ${prev.length + 1}`,
                        ])
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <Plus size={14} /> Add Category
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Fee Settings
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Listing Fee (₹)"
                      defaultValue="0"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Featured Listing Fee (₹/month)"
                      defaultValue="1500"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Transaction Fee (₹ or %)"
                      defaultValue="1%"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Withdrawal Fee (₹ or %)"
                      defaultValue="20"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Minimum Withdrawal Amount (₹)"
                      defaultValue="500"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Promotional Pricing
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="First 3 months commission (%)"
                      defaultValue="5"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder=">100 orders/month (%)"
                      defaultValue="7"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder=">500 orders/month (%)"
                      defaultValue="6"
                    />
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  <Save size={14} /> Save Commission & Fees
                </button>
              </fieldset>
            )}

            {activeTab === 'payment' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Payment Gateway Configuration
                  </h3>
                  <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        bKash
                      </span>
                      <button
                        onClick={() => setBkashEnabled(!bkashEnabled)}
                        className="text-orange-600"
                      >
                        {bkashEnabled ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Merchant Number"
                        defaultValue="017XXXXXXXX"
                      />
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="API Credential (masked)"
                        defaultValue="••••••••"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" defaultChecked />
                      Test Mode
                    </label>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        Credit/Debit Cards
                      </span>
                      <button
                        onClick={() => setCardsEnabled(!cardsEnabled)}
                        className="text-orange-600"
                      >
                        {cardsEnabled ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                        <option>Stripe</option>
                        <option>SSLCOMMERZ</option>
                      </select>
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="API Credential (masked)"
                        defaultValue="••••••••"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">
                        Cash on Delivery (COD)
                      </span>
                      <button
                        onClick={() => setCodEnabled(!codEnabled)}
                        className="text-orange-600"
                      >
                        {codEnabled ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" /> Verified buyers only
                      </label>
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Order value < ₹X"
                        defaultValue="50000"
                      />
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Specific cities only"
                        defaultValue="Dhaka, Chittagong"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Escrow Settings
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Hold period (days)"
                      defaultValue="3"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Auto-release after delivery + days"
                      defaultValue="2"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Dispute window (days)"
                      defaultValue="7"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Deposit Payment
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" defaultChecked />
                      Enable 30% deposit
                    </label>
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Deposit percentage"
                      defaultValue="30"
                    />
                    <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <option>Auto-charge balance</option>
                      <option>Manual invoice</option>
                    </select>
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  <Save size={14} /> Save Payment Settings
                </button>
              </fieldset>
            )}

            {activeTab === 'shipping' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Shipping Zones
                  </h3>
                  <div className="space-y-3">
                    {['Dhaka Metro', 'Chittagong', 'Sylhet'].map((zone) => (
                      <div
                        key={zone}
                        className="rounded-lg border border-slate-200 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">
                            {zone}
                          </span>
                          <button className="text-xs text-slate-500">
                            Edit
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                          <span>
                            Cities:{' '}
                            {zone === 'Dhaka Metro' ? 'Dhaka, Gazipur' : zone}
                          </span>
                          <span>Base rate: ₹120</span>
                          <span>+₹20/kg</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          ETA: 2-4 days
                        </div>
                      </div>
                    ))}
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <Plus size={14} /> Add New Zone
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Shipping Partners
                  </h3>
                  <div className="space-y-3">
                    {['Pathao', 'Steadfast', 'Paperfly'].map((partner) => (
                      <div
                        key={partner}
                        className="rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900">
                            {partner}
                          </span>
                          <label className="text-sm text-slate-600">
                            <input type="checkbox" defaultChecked /> Enabled
                          </label>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="API Credential (masked)"
                            defaultValue="••••••••"
                          />
                          <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="Default rate"
                            defaultValue="120"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Free Shipping
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Free shipping threshold (₹)"
                      defaultValue="10000"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Free shipping categories"
                      defaultValue="Apparel, Electronics"
                    />
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  <Save size={14} /> Save Shipping Settings
                </button>
              </fieldset>
            )}

            {activeTab === 'notifications' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Email Configuration
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="SMTP Host"
                      defaultValue="smtp.mailgun.org"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Port"
                      defaultValue="587"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Username"
                      defaultValue="postmaster@borobepari.com"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Password"
                      defaultValue="••••••••"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="From Address"
                      defaultValue="no-reply@borobepari.com"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="From Name"
                      defaultValue="BoroBepari"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <TestTube2 size={14} /> Test Email
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Email Templates
                  </h3>
                  <div className="space-y-2">
                    {[
                      'User Registration',
                      'Order Confirmation',
                      'Order Shipped',
                      'KYC Approved',
                      'Dispute Resolved',
                    ].map((tpl) => (
                      <div
                        key={tpl}
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm"
                      >
                        <span>{tpl}</span>
                        <div className="flex items-center gap-2">
                          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                            Edit Template
                          </button>
                          <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                            <Eye size={12} /> Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">
                    Variables: {'{{name}}'}, {'{{order_number}}'},{' '}
                    {'{{amount}}'}
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    SMS Configuration
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Provider"
                      defaultValue="Mobireach"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="API Credential (masked)"
                      defaultValue="••••••••"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <TestTube2 size={14} /> Test SMS
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Push Notifications
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Firebase API Key (masked)"
                      defaultValue="••••••••"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={firebaseEnabled}
                        onChange={(e) => setFirebaseEnabled(e.target.checked)}
                      />
                      Enable push notifications
                    </label>
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  <Save size={14} /> Save Notifications
                </button>
              </fieldset>
            )}

            {activeTab === 'security' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Security Settings
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={twoFactorAdmin}
                        onChange={(e) => setTwoFactorAdmin(e.target.checked)}
                      />
                      Require 2FA for admins
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={twoFactorSupplier}
                        onChange={(e) => setTwoFactorSupplier(e.target.checked)}
                      />
                      Require 2FA for suppliers
                    </label>
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Session timeout (minutes)"
                      defaultValue="30"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Max login attempts"
                      defaultValue="5"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Lockout duration (minutes)"
                      defaultValue="15"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="IP whitelist (comma-separated)"
                      defaultValue="103.20.58.0/24"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Data Privacy
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={gdprEnabled}
                        onChange={(e) => setGdprEnabled(e.target.checked)}
                      />
                      GDPR Compliance
                    </label>
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Data retention (years)"
                      defaultValue="5"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={dataExportEnabled}
                        onChange={(e) => setDataExportEnabled(e.target.checked)}
                      />
                      User data export enabled
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={dataDeletionEnabled}
                        onChange={(e) =>
                          setDataDeletionEnabled(e.target.checked)
                        }
                      />
                      User data deletion enabled
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Content Moderation
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <textarea
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      rows={3}
                      defaultValue="fake, prohibited, banned"
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Prohibited categories"
                      defaultValue="Weapons, Counterfeit"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={autoModerationEnabled}
                        onChange={(e) =>
                          setAutoModerationEnabled(e.target.checked)
                        }
                      />
                      AI moderation toggle
                    </label>
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  <Save size={14} /> Save Security Settings
                </button>
              </fieldset>
            )}

            {activeTab === 'maintenance' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Maintenance Controls
                  </h3>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        Maintenance Mode
                      </p>
                      <p className="text-xs text-slate-500">
                        Enable scheduled downtime message.
                      </p>
                    </div>
                    <button
                      onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
                      className="text-orange-600"
                    >
                      {maintenanceEnabled ? <ToggleRight /> : <ToggleLeft />}
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Scheduled maintenance message"
                      defaultValue="Scheduled maintenance in progress."
                    />
                    <input
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="Estimated downtime"
                      defaultValue="2 hours"
                    />
                    <textarea
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
                      rows={3}
                      placeholder="Maintenance page content"
                      defaultValue="We are currently improving our platform."
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" defaultChecked />
                      Allow admin access
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Backup & Restore
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <Database size={14} /> Create Backup
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <RefreshCw size={14} /> Restore from Backup
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <Download size={14} /> Download Backup
                    </button>
                    <span className="text-xs text-slate-500">
                      Last backup: 2026-02-03 02:12
                    </span>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    System Health
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
                      <Database size={16} className="text-green-600" />
                      <p className="mt-2 text-slate-600">Database: Healthy</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
                      <HardDrive size={16} className="text-orange-600" />
                      <p className="mt-2 text-slate-600">Storage used: 72%</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 px-4 py-3 text-sm">
                      <Activity size={16} className="text-green-600" />
                      <p className="mt-2 text-slate-600">API uptime: 99.8%</p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <RefreshCw size={14} /> Run Diagnostics
                  </button>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  <Save size={14} /> Save Maintenance Settings
                </button>
              </fieldset>
            )}
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  )
}
