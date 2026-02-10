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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
            Platform Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 transition-colors">
            Configure platform-wide settings and integrations.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 transition-colors h-fit lg:sticky lg:top-24">
            <div className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const active = tab.id === activeTab
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all ${
                      active
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6 transition-colors">
            <div className="flex items-center gap-2">
              <ActiveIcon
                size={20}
                className="text-orange-600 dark:text-orange-500"
              />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white transition-colors">
                {TABS.find((t) => t.id === activeTab)?.label}
              </h2>
            </div>

            {activeTab === 'general' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Platform Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Platform Name
                      </label>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                        defaultValue="BoroBepari"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Default Language
                      </label>
                      <select className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none">
                        <option className="dark:bg-slate-900">English</option>
                        <option className="dark:bg-slate-900">বাংলা</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Default Currency
                      </label>
                      <select className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none">
                        <option className="dark:bg-slate-900">BDT</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Timezone
                      </label>
                      <select className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none">
                        <option className="dark:bg-slate-900">
                          Asia/Dhaka
                        </option>
                        <option className="dark:bg-slate-900">UTC</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Date/Time Format
                      </label>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                        defaultValue="DD MMM YYYY, hh:mm A"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <UploadCloud size={14} /> Upload Logo
                      </button>
                      <button className="mt-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <UploadCloud size={14} /> Upload Favicon
                      </button>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                    <Save size={14} /> Save Platform Info
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Business Information
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Company Legal Name"
                      defaultValue="BoroBepari Limited"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Business Address"
                      defaultValue="Gulshan, Dhaka"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Contact Email"
                      defaultValue="support@borobepari.com"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Contact Phone"
                      defaultValue="+880-1711-000000"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="GST/Tax Number"
                      defaultValue="TIN-0099281"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Terms & Conditions URL"
                      defaultValue="https://borobepari.com/terms"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Privacy Policy URL"
                      defaultValue="https://borobepari.com/privacy"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                    <Save size={14} /> Save Business Info
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    SEO Settings
                  </h3>
                  <div className="grid gap-4">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Meta Title"
                      defaultValue="BoroBepari - Wholesale Marketplace"
                    />
                    <textarea
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Meta Description"
                      rows={3}
                      defaultValue="Bangladesh's leading B2B marketplace."
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Meta Keywords"
                      defaultValue="wholesale, b2b, bangladesh"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                    <Save size={14} /> Save SEO Settings
                  </button>
                </section>
              </fieldset>
            )}

            {activeTab === 'commission' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Commission Structure
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                        Default Commission Rate (%)
                      </label>
                      <input
                        className="mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
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
                        <span className="flex-1 text-slate-600 dark:text-slate-400 transition-colors">
                          {category}
                        </span>
                        <input
                          className="w-24 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                          defaultValue="8"
                        />
                        <span className="text-slate-400 dark:text-slate-500">
                          %
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setCategories((prev) => [
                          ...prev,
                          `New Category ${prev.length + 1}`,
                        ])
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Plus size={14} /> Add Category
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Fee Settings
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Listing Fee (৳)"
                      defaultValue="0"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Featured Listing Fee (৳/month)"
                      defaultValue="1500"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Transaction Fee (৳ or %)"
                      defaultValue="1%"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Withdrawal Fee (৳ or %)"
                      defaultValue="20"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Minimum Withdrawal Amount (৳)"
                      defaultValue="500"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Promotional Pricing
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="First 3 months commission (%)"
                      defaultValue="5"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder=">100 orders/month (%)"
                      defaultValue="7"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder=">500 orders/month (%)"
                      defaultValue="6"
                    />
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                  <Save size={14} /> Save Commission & Fees
                </button>
              </fieldset>
            )}

            {activeTab === 'payment' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Payment Gateway Configuration
                  </h3>
                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">
                        bKash
                      </span>
                      <button
                        onClick={() => setBkashEnabled(!bkashEnabled)}
                        className="text-orange-600 dark:text-orange-500"
                      >
                        {bkashEnabled ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                        placeholder="Merchant Number"
                        defaultValue="017XXXXXXXX"
                      />
                      <input
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                        placeholder="API Credential (masked)"
                        defaultValue="••••••••"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      Test Mode
                    </label>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">
                        Credit/Debit Cards
                      </span>
                      <button
                        onClick={() => setCardsEnabled(!cardsEnabled)}
                        className="text-orange-600 dark:text-orange-500"
                      >
                        {cardsEnabled ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none">
                        <option className="dark:bg-slate-900">Stripe</option>
                        <option className="dark:bg-slate-900">
                          SSLCOMMERZ
                        </option>
                      </select>
                      <input
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                        placeholder="API Credential (masked)"
                        defaultValue="••••••••"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">
                        Cash on Delivery (COD)
                      </span>
                      <button
                        onClick={() => setCodEnabled(!codEnabled)}
                        className="text-orange-600 dark:text-orange-500"
                      >
                        {codEnabled ? <ToggleRight /> : <ToggleLeft />}
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                        />{' '}
                        Verified buyers only
                      </label>
                      <input
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="Order value < ৳X"
                        defaultValue="50000"
                      />
                      <input
                        className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                        placeholder="Specific cities only"
                        defaultValue="Dhaka, Chittagong"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Escrow Settings
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Hold period (days)"
                      defaultValue="3"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Auto-release after delivery + days"
                      defaultValue="2"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Dispute window (days)"
                      defaultValue="7"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Deposit Payment
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      Enable 30% deposit
                    </label>
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Deposit percentage"
                      defaultValue="30"
                    />
                    <select className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none">
                      <option className="dark:bg-slate-900">
                        Auto-charge balance
                      </option>
                      <option className="dark:bg-slate-900">
                        Manual invoice
                      </option>
                    </select>
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                  <Save size={14} /> Save Payment Settings
                </button>
              </fieldset>
            )}

            {activeTab === 'shipping' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Shipping Zones
                  </h3>
                  <div className="space-y-3">
                    {['Dhaka Metro', 'Chittagong', 'Sylhet'].map((zone) => (
                      <div
                        key={zone}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-2 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">
                            {zone}
                          </span>
                          <button className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                            Edit
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                          <span>
                            Cities:{' '}
                            {zone === 'Dhaka Metro' ? 'Dhaka, Gazipur' : zone}
                          </span>
                          <span>Base rate: ৳120</span>
                          <span>+৳20/kg</span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                          ETA: 2-4 days
                        </div>
                      </div>
                    ))}
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Plus size={14} /> Add New Zone
                    </button>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Shipping Partners
                  </h3>
                  <div className="space-y-3">
                    {['Pathao', 'Steadfast', 'Paperfly'].map((partner) => (
                      <div
                        key={partner}
                        className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">
                            {partner}
                          </span>
                          <label className="text-sm text-slate-600 dark:text-slate-400 transition-colors">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                            />{' '}
                            Enabled
                          </label>
                        </div>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <input
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            placeholder="API Credential (masked)"
                            defaultValue="••••••••"
                          />
                          <input
                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                            placeholder="Default rate"
                            defaultValue="120"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Free Shipping
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Free shipping threshold (৳)"
                      defaultValue="10000"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Free shipping categories"
                      defaultValue="Apparel, Electronics"
                    />
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                  <Save size={14} /> Save Shipping Settings
                </button>
              </fieldset>
            )}

            {activeTab === 'notifications' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Email Configuration
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="SMTP Host"
                      defaultValue="smtp.mailgun.org"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Port"
                      defaultValue="587"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Username"
                      defaultValue="postmaster@borobepari.com"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Password"
                      defaultValue="••••••••"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="From Address"
                      defaultValue="no-reply@borobepari.com"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="From Name"
                      defaultValue="BoroBepari"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <TestTube2 size={14} /> Test Email
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
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
                        className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm transition-colors"
                      >
                        <span className="dark:text-slate-300 transition-colors">
                          {tpl}
                        </span>
                        <div className="flex items-center gap-2">
                          <button className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            Edit Template
                          </button>
                          <button className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <Eye size={12} /> Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                    Variables: {'{{name}}'}, {'{{order_number}}'},{' '}
                    {'{{amount}}'}
                  </p>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    SMS Configuration
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Provider"
                      defaultValue="Mobireach"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="API Credential (masked)"
                      defaultValue="••••••••"
                    />
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <TestTube2 size={14} /> Test SMS
                  </button>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Push Notifications
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none"
                      placeholder="Firebase API Key (masked)"
                      defaultValue="••••••••"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={firebaseEnabled}
                        onChange={(e) => setFirebaseEnabled(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      Enable push notifications
                    </label>
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                  <Save size={14} /> Save Notifications
                </button>
              </fieldset>
            )}

            {activeTab === 'security' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Security Settings
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={twoFactorAdmin}
                        onChange={(e) => setTwoFactorAdmin(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      Require 2FA for admins
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={twoFactorSupplier}
                        onChange={(e) => setTwoFactorSupplier(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      Require 2FA for suppliers
                    </label>
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Session timeout (minutes)"
                      defaultValue="30"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Max login attempts"
                      defaultValue="5"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Lockout duration (minutes)"
                      defaultValue="15"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="IP whitelist (comma-separated)"
                      defaultValue="103.20.58.0/24"
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Data Privacy
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={gdprEnabled}
                        onChange={(e) => setGdprEnabled(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      GDPR Compliance
                    </label>
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Data retention (years)"
                      defaultValue="5"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={dataExportEnabled}
                        onChange={(e) => setDataExportEnabled(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      User data export enabled
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={dataDeletionEnabled}
                        onChange={(e) =>
                          setDataDeletionEnabled(e.target.checked)
                        }
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      User data deletion enabled
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Content Moderation
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <textarea
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      rows={3}
                      defaultValue="fake, prohibited, banned"
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Prohibited categories"
                      defaultValue="Weapons, Counterfeit"
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={autoModerationEnabled}
                        onChange={(e) =>
                          setAutoModerationEnabled(e.target.checked)
                        }
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      AI moderation toggle
                    </label>
                  </div>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
                  <Save size={14} /> Save Security Settings
                </button>
              </fieldset>
            )}

            {activeTab === 'maintenance' && (
              <fieldset disabled={!canEdit} className="space-y-6">
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Maintenance Controls
                  </h3>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-200 transition-colors">
                        Maintenance Mode
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                        Enable scheduled downtime message.
                      </p>
                    </div>
                    <button
                      onClick={() => setMaintenanceEnabled(!maintenanceEnabled)}
                      className="text-orange-600 dark:text-orange-500"
                    >
                      {maintenanceEnabled ? <ToggleRight /> : <ToggleLeft />}
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Scheduled maintenance message"
                      defaultValue="Scheduled maintenance in progress."
                    />
                    <input
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      placeholder="Estimated downtime"
                      defaultValue="2 hours"
                    />
                    <textarea
                      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm sm:col-span-2 text-slate-900 dark:text-slate-100 transition-colors focus:border-orange-500 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      rows={3}
                      placeholder="Maintenance page content"
                      defaultValue="We are currently improving our platform."
                    />
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-950 text-orange-600 focus:ring-orange-500 transition-colors"
                      />
                      Allow admin access
                    </label>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    Backup & Restore
                  </h3>
                  <div className="flex flex-wrap items-center gap-3">
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Database size={14} /> Create Backup
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <RefreshCw size={14} /> Restore from Backup
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <Download size={14} /> Download Backup
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-500 transition-colors">
                      Last backup: 2026-02-03 02:12
                    </span>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white transition-colors">
                    System Health
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm transition-colors">
                      <Database
                        size={16}
                        className="text-green-600 dark:text-green-500"
                      />
                      <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Database: Healthy
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm transition-colors">
                      <HardDrive
                        size={16}
                        className="text-orange-600 dark:text-orange-500"
                      />
                      <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Storage used: 72%
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-3 text-sm transition-colors">
                      <Activity
                        size={16}
                        className="text-green-600 dark:text-green-500"
                      />
                      <p className="mt-2 text-slate-600 dark:text-slate-400">
                        API uptime: 99.8%
                      </p>
                    </div>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <RefreshCw size={14} /> Run Diagnostics
                  </button>
                </section>
                <button className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20">
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
