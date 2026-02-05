import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Ban,
  CheckCircle,
  ChevronDown,
  Download,
  Edit3,
  Eye,
  FileText,
  Filter,
  Flag,
  Image,
  Layers,
  MoreVertical,
  Search,
  Tag,
  Trash2,
  X,
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

type ProductStatus =
  | 'published'
  | 'draft'
  | 'flagged'
  | 'out_of_stock'
  | 'suspended'
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
type SortKey = 'name' | 'price' | 'date' | 'orders' | 'flags'
type DetailTab = 'info' | 'pricing' | 'reports' | 'analytics'

type ProductReport = {
  id: string
  reporter: string
  reason: string
  details: string
  date: string
  action?: string
}

type Product = {
  id: string
  name: string
  sku: string
  supplier: string
  category: string
  price: number
  moq: number
  stock: number
  status: ProductStatus
  orders: number
  flags: number
  addedAt: string
  images: Array<string>
  description: string
  specs: Array<string>
  tieredPricing: Array<{ min: number; price: number }>
  stockHistory: Array<{ date: string; stock: number }>
  priceHistory: Array<{ date: string; price: number }>
  reports: Array<ProductReport>
  analytics: {
    views: number
    wishlists: number
    carts: number
    orders: number
    conversionRate: number
    revenue: number
  }
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

const PRODUCTS: Array<Product> = [
  {
    id: 'PRD-1001',
    name: 'Cotton Bedsheets (Set of 6)',
    sku: 'CTN-BED-06',
    supplier: 'Rahim Textiles Ltd.',
    category: 'Apparel & Fashion',
    price: 420,
    moq: 12,
    stock: 340,
    status: 'published',
    orders: 320,
    flags: 0,
    addedAt: '2025-11-05',
    images: ['/img/products/bed-1.png', '/img/products/bed-2.png'],
    description: 'Premium cotton bedsheets for wholesale buyers.',
    specs: ['100% Cotton', 'Thread Count 180', 'Assorted colors'],
    tieredPricing: [
      { min: 12, price: 420 },
      { min: 50, price: 399 },
      { min: 200, price: 380 },
    ],
    stockHistory: [
      { date: 'Jan', stock: 500 },
      { date: 'Feb', stock: 420 },
      { date: 'Mar', stock: 340 },
      { date: 'Apr', stock: 360 },
    ],
    priceHistory: [
      { date: 'Jan', price: 440 },
      { date: 'Feb', price: 430 },
      { date: 'Mar', price: 420 },
      { date: 'Apr', price: 420 },
    ],
    reports: [],
    analytics: {
      views: 5200,
      wishlists: 680,
      carts: 340,
      orders: 320,
      conversionRate: 6.2,
      revenue: 134400,
    },
  },
  {
    id: 'PRD-1002',
    name: 'LED Panel 24W',
    sku: 'LED-24W-PL',
    supplier: 'Chittagong Electronics',
    category: 'Electronics',
    price: 650,
    moq: 20,
    stock: 0,
    status: 'out_of_stock',
    orders: 112,
    flags: 1,
    addedAt: '2025-12-12',
    images: ['/img/products/led-1.png'],
    description: 'High-efficiency LED panels for commercial lighting.',
    specs: ['24W', 'Cool White', '2-year warranty'],
    tieredPricing: [
      { min: 20, price: 650 },
      { min: 100, price: 610 },
    ],
    stockHistory: [
      { date: 'Jan', stock: 200 },
      { date: 'Feb', stock: 80 },
      { date: 'Mar', stock: 0 },
    ],
    priceHistory: [
      { date: 'Jan', price: 670 },
      { date: 'Feb', price: 650 },
      { date: 'Mar', price: 650 },
    ],
    reports: [
      {
        id: 'REP-1',
        reporter: 'Anonymous',
        reason: 'Misleading description',
        details: 'Power rating appears inaccurate.',
        date: '2026-01-28',
      },
    ],
    analytics: {
      views: 2200,
      wishlists: 210,
      carts: 90,
      orders: 112,
      conversionRate: 5.1,
      revenue: 72800,
    },
  },
  {
    id: 'PRD-1003',
    name: 'Stainless Steel Cookware Set',
    sku: 'SS-SET-10',
    supplier: 'Nasreen Wholesale',
    category: 'Home & Kitchen',
    price: 1200,
    moq: 5,
    stock: 12,
    status: 'flagged',
    orders: 60,
    flags: 3,
    addedAt: '2026-01-20',
    images: ['/img/products/cookware-1.png'],
    description: '10-piece cookware set with stainless steel finish.',
    specs: ['10 pcs', 'Stainless steel', 'Dishwasher safe'],
    tieredPricing: [
      { min: 5, price: 1200 },
      { min: 20, price: 1100 },
    ],
    stockHistory: [
      { date: 'Jan', stock: 40 },
      { date: 'Feb', stock: 12 },
    ],
    priceHistory: [
      { date: 'Jan', price: 1250 },
      { date: 'Feb', price: 1200 },
    ],
    reports: [
      {
        id: 'REP-2',
        reporter: 'Karim Enterprises',
        reason: 'Wrong category',
        details: 'Listed as kitchen but should be industrial.',
        date: '2026-02-01',
      },
      {
        id: 'REP-3',
        reporter: 'Anonymous',
        reason: 'Price too high/low',
        details: 'Comparable items cheaper.',
        date: '2026-02-02',
      },
    ],
    analytics: {
      views: 1400,
      wishlists: 120,
      carts: 40,
      orders: 60,
      conversionRate: 4.3,
      revenue: 72000,
    },
  },
  {
    id: 'PRD-1004',
    name: 'Industrial Safety Gloves',
    sku: 'IND-GLV-01',
    supplier: 'Dhaka Industrial Supply',
    category: 'Industrial Supplies',
    price: 95,
    moq: 100,
    stock: 480,
    status: 'suspended',
    orders: 12,
    flags: 2,
    addedAt: '2025-10-10',
    images: ['/img/products/gloves-1.png'],
    description: 'Durable gloves for industrial use.',
    specs: ['Latex coated', 'Size L', 'Pack of 12'],
    tieredPricing: [
      { min: 100, price: 95 },
      { min: 500, price: 88 },
    ],
    stockHistory: [
      { date: 'Jan', stock: 600 },
      { date: 'Feb', stock: 480 },
    ],
    priceHistory: [
      { date: 'Jan', price: 100 },
      { date: 'Feb', price: 95 },
    ],
    reports: [
      {
        id: 'REP-4',
        reporter: 'Anonymous',
        reason: 'Inappropriate content',
        details: 'Images include branding that is not allowed.',
        date: '2026-01-10',
        action: 'Suspended',
      },
    ],
    analytics: {
      views: 900,
      wishlists: 40,
      carts: 20,
      orders: 12,
      conversionRate: 1.3,
      revenue: 1140,
    },
  },
]

const STATUS_TABS: Array<{ label: string; value: ProductStatus | 'all' }> = [
  { label: 'All Products', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Flagged', value: 'flagged' },
  { label: 'Out of Stock', value: 'out_of_stock' },
  { label: 'Suspended', value: 'suspended' },
]

const STOCK_OPTIONS: Array<{ label: string; value: StockFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
]

const SORT_OPTIONS: Array<{ label: string; value: SortKey }> = [
  { label: 'Name', value: 'name' },
  { label: 'Price', value: 'price' },
  { label: 'Date', value: 'date' },
  { label: 'Orders', value: 'orders' },
  { label: 'Flags', value: 'flags' },
]

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString()}`
}

function statusBadge(status: ProductStatus) {
  switch (status) {
    case 'published':
      return (
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs text-green-700">
          Published
        </span>
      )
    case 'draft':
      return (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
          Draft
        </span>
      )
    case 'flagged':
      return (
        <span className="rounded-full bg-yellow-100 px-2.5 py-1 text-xs text-yellow-700">
          Flagged
        </span>
      )
    case 'out_of_stock':
      return (
        <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs text-orange-700">
          Out of Stock
        </span>
      )
    case 'suspended':
      return (
        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs text-red-700">
          Suspended
        </span>
      )
  }
}

export function AdminProductsPage() {
  const { can } = useAdminAuth()
  const canView = can('products.view')
  const canModerate = can('products.moderate')
  const canDelete = can('products.delete')
  const [activeTab, setActiveTab] = useState<ProductStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [supplierFilter, setSupplierFilter] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('date')
  const [selectedIds, setSelectedIds] = useState<Array<string>>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [detailProduct, setDetailProduct] = useState<Product | null>(null)
  const [detailTab, setDetailTab] = useState<DetailTab>('info')
  const [editMode, setEditMode] = useState(false)
  const [suspendProduct, setSuspendProduct] = useState<Product | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [suspendReason, setSuspendReason] = useState('Policy violation')
  const [suspendOtherReason, setSuspendOtherReason] = useState('')
  const [flagReviewProduct, setFlagReviewProduct] = useState<Product | null>(
    null,
  )
  const [flagReviewNotes, setFlagReviewNotes] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    setSelectedIds([])
  }, [activeTab])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return PRODUCTS.filter((product) => {
      const matchesTab = activeTab === 'all' || product.status === activeTab
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.supplier.toLowerCase().includes(query)
      const matchesCategory =
        categoryFilter === 'all' || product.category === categoryFilter
      const matchesSupplier =
        !supplierFilter.trim() ||
        product.supplier.toLowerCase().includes(supplierFilter.toLowerCase())
      const matchesStock = (() => {
        if (stockFilter === 'all') return true
        if (stockFilter === 'out_of_stock') return product.stock === 0
        if (stockFilter === 'low_stock')
          return product.stock > 0 && product.stock <= 20
        return product.stock > 20
      })()
      const minOk = priceMin ? product.price >= Number(priceMin) : true
      const maxOk = priceMax ? product.price <= Number(priceMax) : true
      const addedDate = new Date(product.addedAt)
      const withinFrom = dateFrom ? addedDate >= new Date(dateFrom) : true
      const withinTo = dateTo ? addedDate <= new Date(dateTo) : true
      return (
        matchesTab &&
        matchesSearch &&
        matchesCategory &&
        matchesSupplier &&
        matchesStock &&
        minOk &&
        maxOk &&
        withinFrom &&
        withinTo
      )
    })
  }, [
    activeTab,
    searchQuery,
    categoryFilter,
    supplierFilter,
    stockFilter,
    priceMin,
    priceMax,
    dateFrom,
    dateTo,
  ])

  const sortedProducts = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price') return b.price - a.price
      if (sortBy === 'orders') return b.orders - a.orders
      if (sortBy === 'flags') return b.flags - a.flags
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    })
    return copy
  }, [filtered, sortBy])

  const totalProducts = PRODUCTS.length
  const publishedCount = PRODUCTS.filter((p) => p.status === 'published').length
  const flaggedCount = PRODUCTS.filter((p) => p.flags > 0).length
  const suspendedCount = PRODUCTS.filter((p) => p.status === 'suspended').length
  const outOfStockCount = PRODUCTS.filter((p) => p.stock === 0).length

  const categoryBreakdown = CATEGORIES.map((category) => ({
    category,
    count: PRODUCTS.filter((p) => p.category === category).length,
  }))

  const popularCategories = [...categoryBreakdown]
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
  const underrepresentedCategories = [...categoryBreakdown]
    .sort((a, b) => a.count - b.count)
    .slice(0, 3)

  const toggleSelectAll = () => {
    const ids = sortedProducts.map((p) => p.id)
    const allSelected =
      ids.length > 0 && ids.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(ids)
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const exportProducts = (
    scope: 'all' | 'filtered',
    format: 'csv' | 'excel',
  ) => {
    const exportData = scope === 'all' ? PRODUCTS : sortedProducts
    const header = [
      'Product ID',
      'Name',
      'SKU',
      'Supplier',
      'Category',
      'Price',
      'Stock',
      'Status',
    ]
    const rows = exportData.map((p) => [
      p.id,
      p.name,
      p.sku,
      p.supplier,
      p.category,
      String(p.price),
      String(p.stock),
      p.status,
    ])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const suffix = format === 'excel' ? 'xlsx' : 'csv'
    link.href = url
    link.download = `borobepari-products-${scope}.${suffix}`
    document.body.appendChild(link)
    link.click()
    if (link.isConnected) {
      link.remove()
    }
    URL.revokeObjectURL(url)
    setExportOpen(false)
  }

  return (
    <AdminProtectedRoute requiredPermissions={['products.view']}>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Product Moderation
            </h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-slate-600">
              <span>Total: {totalProducts} products</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs text-red-700">
                <Flag size={12} />
                {flaggedCount} flagged
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setExportOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-20 overflow-hidden">
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Export Scope
                    </div>
                    <button
                      onClick={() => exportProducts('all', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export All (CSV)
                    </button>
                    <button
                      onClick={() => exportProducts('all', 'excel')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export All (Excel)
                    </button>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase">
                      Filtered
                    </div>
                    <button
                      onClick={() => exportProducts('filtered', 'csv')}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      Export Filtered (CSV)
                    </button>
                    <button
                      onClick={() => exportProducts('filtered', 'excel')}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Total Products</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {totalProducts}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {publishedCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Flagged</p>
            <p className="mt-2 text-2xl font-semibold text-red-600">
              {flaggedCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Suspended</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {suspendedCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">Out of Stock</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {outOfStockCount}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full border px-4 py-2 text-sm ${
                activeTab === tab.value
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-slate-200 text-slate-600'
              }`}
            >
              {tab.label}
              {tab.value === 'flagged' && (
                <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                  {flaggedCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, SKU, supplier"
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                <Filter size={16} />
                Filters
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                <option value="all">Category: All</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <input
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                placeholder="Supplier search"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              <div className="flex items-center gap-2 text-sm text-slate-600">
                Price
              </div>
              <input
                type="number"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                placeholder="Min"
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              <input
                type="number"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                placeholder="Max"
                className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              />
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as StockFilter)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
              >
                {STOCK_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    Stock: {option.label}
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
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-slate-600">Date added</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
            <span className="text-sm text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-orange-800">
              {selectedIds.length} selected
            </span>
            <button
              disabled={!canModerate}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Bulk Publish
            </button>
            <button
              disabled={!canModerate}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Bulk Suspend
            </button>
            <button
              onClick={() => setBulkDeleteOpen(true)}
              disabled={!canDelete}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
            >
              Bulk Delete
            </button>
            <button
              onClick={() => setBulkCategoryOpen(true)}
              disabled={!canModerate}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"
            >
              Bulk Category
            </button>
            <button className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              Bulk Export
            </button>
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
                      checked={
                        sortedProducts.length > 0 &&
                        sortedProducts.every((p) => selectedIds.includes(p.id))
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left">SKU</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price/MOQ</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Flags</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedProducts.map((product) => {
                  const rowTone =
                    product.status === 'suspended'
                      ? 'bg-red-50'
                      : product.flags > 0
                        ? 'bg-yellow-50'
                        : ''
                  return (
                    <tr
                      key={product.id}
                      className={`${rowTone} hover:bg-slate-50`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelectOne(product.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setDetailProduct(product)
                            setDetailTab('info')
                          }}
                          disabled={!canView}
                          className="flex items-center gap-3 text-left"
                        >
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Image size={16} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {product.id}
                            </p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.supplier}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatCurrency(product.price)} / MOQ {product.moq}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {product.stock}
                      </td>
                      <td className="px-4 py-3">
                        {statusBadge(product.status)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {product.orders}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {product.flags > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                            <Flag size={12} />
                            {product.flags}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative inline-block text-left">
                          <button
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === product.id ? null : product.id,
                              )
                            }
                            className="rounded-lg p-2 hover:bg-slate-100"
                          >
                            <MoreVertical size={16} />
                          </button>
                          {openMenuId === product.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                                <a
                                  href={`/products/${product.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                                >
                                  <Eye size={14} />
                                  View on Marketplace
                                </a>
                                <button
                                  onClick={() => setOpenMenuId(null)}
                                  disabled={!canModerate}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <Edit3 size={14} />
                                  Edit Product
                                </button>
                                {product.status !== 'published' && (
                                  <button
                                    onClick={() => setOpenMenuId(null)}
                                    disabled={!canModerate}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    <CheckCircle size={14} />
                                    Activate Product
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSuspendProduct(product)
                                    setOpenMenuId(null)
                                  }}
                                  disabled={!canModerate}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <Ban size={14} />
                                  Suspend Product
                                </button>
                                <button
                                  onClick={() => {
                                    setFlagReviewProduct(product)
                                    setFlagReviewNotes('')
                                    setOpenMenuId(null)
                                  }}
                                  disabled={!canModerate}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50 disabled:opacity-50"
                                >
                                  <Flag size={14} />
                                  View Reports/Flags
                                </button>
                                <button
                                  onClick={() => setOpenMenuId(null)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-slate-50"
                                >
                                  <FileText size={14} />
                                  View Orders for Product
                                </button>
                                <button
                                  onClick={() => {
                                    setDeleteProduct(product)
                                    setOpenMenuId(null)
                                  }}
                                  disabled={!canDelete}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                  Delete Product
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sortedProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Category Breakdown
            </h3>
            <div className="mt-3 space-y-2">
              {categoryBreakdown.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600">{item.category}</span>
                  <span className="text-slate-900 font-medium">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Most Popular Categories
            </h3>
            <div className="mt-3 space-y-2">
              {popularCategories.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <Tag size={14} />
                  {item.category} ({item.count})
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">
              Underrepresented
            </h3>
            <div className="mt-3 space-y-2">
              {underrepresentedCategories.map((item) => (
                <div
                  key={item.category}
                  className="flex items-center gap-2 text-sm text-slate-600"
                >
                  <Layers size={14} />
                  {item.category} ({item.count})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {detailProduct.name}
                </h2>
                <p className="text-sm text-slate-500">{detailProduct.sku}</p>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="border-b border-slate-200 px-6">
              <div className="flex flex-wrap gap-6 text-sm">
                {(
                  [
                    'info',
                    'pricing',
                    'reports',
                    'analytics',
                  ] as Array<DetailTab>
                ).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailTab(tab)}
                    className={`py-3 border-b-2 ${
                      detailTab === tab
                        ? 'border-orange-600 text-orange-600'
                        : 'border-transparent text-slate-500'
                    }`}
                  >
                    {tab === 'info'
                      ? 'Product Info'
                      : tab === 'pricing'
                        ? 'Pricing & Inventory'
                        : tab === 'reports'
                          ? 'Reports/Flags'
                          : 'Analytics'}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-5 space-y-5">
              {detailTab === 'info' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={editMode}
                        onChange={(e) => setEditMode(e.target.checked)}
                      />
                      Admin edit mode
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase text-slate-400">
                        Supplier
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {detailProduct.supplier}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs uppercase text-slate-400">
                        Category
                      </p>
                      <p className="text-sm font-medium text-slate-900">
                        {detailProduct.category}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">
                      Description
                    </p>
                    <p className="mt-2 text-sm text-slate-700">
                      {detailProduct.description}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">
                      Specifications
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-slate-700">
                      {detailProduct.specs.map((spec) => (
                        <li key={spec}>• {spec}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-400">Images</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-3">
                      {detailProduct.images.map((image) => (
                        <div
                          key={image}
                          className="flex h-24 items-center justify-center rounded-lg bg-slate-100 text-slate-400"
                        >
                          <Image size={20} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 overflow-hidden">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-4 py-2 text-left">Min Qty</th>
                          <th className="px-4 py-2 text-right">Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {detailProduct.tieredPricing.map((tier) => (
                          <tr key={tier.min}>
                            <td className="px-4 py-2 text-slate-700">
                              {tier.min}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-700">
                              {formatCurrency(tier.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">Current Stock</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {detailProduct.stock}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">MOQ</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {detailProduct.moq}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Stock History
                      </p>
                      <div className="mt-2 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={detailProduct.stockHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="stock"
                              stroke="#10b981"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Price History
                      </p>
                      <div className="mt-2 h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={detailProduct.priceHistory}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="price"
                              stroke="#f97316"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'reports' && (
                <div className="space-y-4">
                  {detailProduct.reports.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No reports for this product.
                    </p>
                  )}
                  {detailProduct.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900">
                          {report.reason}
                        </p>
                        <span className="text-xs text-slate-400">
                          {report.date}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {report.details}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Reporter: {report.reporter}
                      </p>
                      {report.action && (
                        <p className="mt-1 text-xs text-slate-500">
                          Action: {report.action}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                          Dismiss
                        </button>
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs">
                          Warn Supplier
                        </button>
                        <button className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs text-orange-700">
                          Suspend Product
                        </button>
                        <button className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                          Delete Product
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'analytics' && (
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: 'Views', value: detailProduct.analytics.views },
                    {
                      label: 'Wishlist',
                      value: detailProduct.analytics.wishlists,
                    },
                    {
                      label: 'Cart Adds',
                      value: detailProduct.analytics.carts,
                    },
                    { label: 'Orders', value: detailProduct.analytics.orders },
                    {
                      label: 'Conversion',
                      value: `${detailProduct.analytics.conversionRate}%`,
                    },
                    {
                      label: 'Revenue',
                      value: formatCurrency(detailProduct.analytics.revenue),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <p className="text-xs text-slate-400">{item.label}</p>
                      <p className="text-lg font-semibold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {flagReviewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Flag Review
                </h2>
                <p className="text-sm text-slate-500">
                  {flagReviewProduct.name}
                </p>
              </div>
              <button
                onClick={() => setFlagReviewProduct(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">
                  {flagReviewProduct.name}
                </p>
                <p>Supplier: {flagReviewProduct.supplier}</p>
                <p>Category: {flagReviewProduct.category}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">Reports</p>
                <div className="mt-2 space-y-2 text-sm text-slate-600">
                  {flagReviewProduct.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <p className="font-medium">{report.reason}</p>
                      <p>{report.details}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900">
                  Admin Notes
                </label>
                <textarea
                  value={flagReviewNotes}
                  onChange={(e) => setFlagReviewNotes(e.target.value)}
                  placeholder="Notes or request edits from supplier"
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  rows={3}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white">
                  Approve
                </button>
                <button className="rounded-lg bg-orange-600 px-4 py-2 text-sm text-white">
                  Suspend
                </button>
                <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
                  Request Edit
                </button>
                <button className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {suspendProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Ban className="text-orange-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Suspend {suspendProduct.name}?
                </h2>
              </div>
              <button
                onClick={() => setSuspendProduct(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 text-sm text-slate-600">
              <select
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option>Policy violation</option>
                <option>Incorrect information</option>
                <option>Misleading listing</option>
                <option>Intellectual property issue</option>
                <option>Other</option>
              </select>
              {suspendReason === 'Other' && (
                <input
                  value={suspendOtherReason}
                  onChange={(e) => setSuspendOtherReason(e.target.value)}
                  placeholder="Other reason"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              )}
              <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                Suspension details will be sent to the supplier. Supplier can
                appeal or edit.
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setSuspendProduct(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setSuspendProduct(null)}
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Delete {deleteProduct.name}?
                </h2>
              </div>
              <button
                onClick={() => setDeleteProduct(null)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-red-600 font-medium">
                This action cannot be undone.
              </p>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                I understand this action is permanent
              </label>
              <input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => {
                  setDeleteProduct(null)
                  setDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={!deleteConfirm || deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  setDeleteProduct(null)
                  setDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Tag className="text-slate-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Bulk Category Change
                </h2>
              </div>
              <button
                onClick={() => setBulkCategoryOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3 text-sm text-slate-600">
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                {CATEGORIES.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setBulkCategoryOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkCategoryOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-2">
                <Trash2 className="text-red-600" size={20} />
                <h2 className="text-lg font-semibold text-slate-900">
                  Bulk Delete Products
                </h2>
              </div>
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 text-sm text-slate-600">
              This action cannot be undone.
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkDeleteOpen(false)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Delete Products
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminProtectedRoute>
  )
}
