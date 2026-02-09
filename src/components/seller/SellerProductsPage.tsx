import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  Download,
  MoreVertical,
  PackagePlus,
  UploadCloud,
} from 'lucide-react'
import { BulkImportModal } from './BulkImportModal'
import { SellerProtectedRoute } from '@/components/seller'
import { getSellerProducts } from '@/lib/seller-product-server'

type ProductStatus = 'draft' | 'pending' | 'accepted' | 'declined'
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

type Product = {
  id: number
  name: string
  sku: string
  price: number
  moq: number
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  images: string[]
  adminNotes: string | null
  createdAt: string
}

type FilterTab = 'All' | 'Pending' | 'Accepted' | 'Draft' | 'Declined' | 'Out of Stock' | 'Low Stock'
type SortOption =
  | 'Newest First'
  | 'Oldest First'
  | 'Price: Low to High'
  | 'Price: High to Low'
  | 'Most Orders'

export function SellerProductsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterTab>('All')
  const [sort, setSort] = useState<SortOption>('Newest First')
  const [selected, setSelected] = useState<Array<number>>([])
  const [editing, setEditing] = useState<{
    id: number
    field: 'price' | 'stock'
  } | null>(null)
  const [loadingEdit, setLoadingEdit] = useState<number | null>(null)
  const [products, setProducts] = useState<Array<Product>>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)
  const perPage = 20

  useEffect(() => {
    const token = localStorage.getItem('seller_token') || ''
    getSellerProducts({
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((data) => {
        setProducts(data as Array<Product>)
      })
      .catch((err) => {
        console.error('Failed to load seller products:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const matchesQuery = (product: Product) =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase())
    const filteredByTab = products.filter((product) => {
      if (filter === 'Pending') return product.status === 'pending'
      if (filter === 'Accepted') return product.status === 'accepted'
      if (filter === 'Draft') return product.status === 'draft'
      if (filter === 'Declined') return product.status === 'declined'
      if (filter === 'Out of Stock') return product.stock === 0
      if (filter === 'Low Stock')
        return product.stock > 0 && product.stock < product.lowStockThreshold
      return true
    })
    const result = filteredByTab.filter(matchesQuery)
    const sorted = [...result].sort((a, b) => {
      switch (sort) {
        case 'Oldest First':
          return a.id - b.id
        case 'Price: Low to High':
          return a.price - b.price
        case 'Price: High to Low':
          return b.price - a.price
        case 'Most Orders':
          return 0
        default:
          return b.id - a.id
      }
    })
    return sorted
  }, [products, query, filter, sort])

  const total = products.length
  const showing = filtered.slice((page - 1) * perPage, page * perPage)

  const stockStatus = (product: Product): StockStatus => {
    if (product.stock === 0) return 'Out of Stock'
    if (product.stock < product.lowStockThreshold) return 'Low Stock'
    return 'In Stock'
  }

  const toggleSelection = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = () => {
    if (selected.length === showing.length) {
      setSelected([])
    } else {
      setSelected(showing.map((product) => product.id))
    }
  }

  const updateInline = (
    id: number,
    field: 'price' | 'stock',
    value: string,
  ) => {
    setLoadingEdit(id)
    window.setTimeout(() => {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id ? { ...product, [field]: Number(value) } : product,
        ),
      )
      setLoadingEdit(null)
      setEditing(null)
    }, 600)
  }

  const handleBulkAction = (action: 'publish' | 'unpublish' | 'delete') => {
    if (action === 'delete') {
      if (!window.confirm('Delete selected products?')) return
      setProducts((prev) =>
        prev.filter((product) => !selected.includes(product.id)),
      )
      setSelected([])
      return
    }
  }

  const handleAction = (id: number, action: string) => {
    if (action === 'delete') {
      if (!window.confirm('Delete this product?')) return
      setProducts((prev) => prev.filter((product) => product.id !== id))
      return
    }
  }

  const handleExport = (type: 'csv' | 'excel') => {
    alert(
      `Exporting ${type.toUpperCase()} for ${filter === 'All' ? 'all products' : filter}.`,
    )
  }

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 transition-colors">
              My Products
            </h1>
            <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 transition-colors">
              Showing {showing.length} of {total} products
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-600 dark:text-gray-300 transition-colors">
                {selected.length} selected
                <BulkActions onAction={handleBulkAction} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <UploadCloud size={16} />
              Bulk Import
            </button>
            <button
              type="button"
              onClick={() => navigate({ to: '/seller/products/add' })}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors"
            >
              <PackagePlus size={16} />
              Add Product
            </button>
          </div>
        </header>

        <section className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title or SKU"
            className="w-full lg:max-w-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 transition-all"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {(
                [
                  'All',
                  'Pending',
                  'Accepted',
                  'Draft',
                  'Declined',
                  'Out of Stock',
                  'Low Stock',
                ] as Array<FilterTab>
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                    filter === tab
                      ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
                      : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="relative">
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortOption)}
                className="appearance-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-700 dark:text-gray-200 focus:border-orange-500 transition-colors"
              >
                {(
                  [
                    'Newest First',
                    'Oldest First',
                    'Price: Low to High',
                    'Price: High to Low',
                    'Most Orders',
                  ] as Array<SortOption>
                ).map((option) => (
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
            <ExportMenu onExport={handleExport} />
          </div>
        </section>

        {loading ? (
          <ProductSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            query={query}
            onClear={() => {
              setQuery('')
              setFilter('All')
            }}
          />
        ) : (
          <>
            <div className="hidden lg:block rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400 dark:text-gray-500 bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={
                          selected.length === showing.length &&
                          showing.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
                      />
                    </th>
                    <th className="p-4">Product</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Price / MOQ</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {showing.map((product) => (
                    <tr
                      key={product.id}
                      className="text-slate-600 dark:text-gray-300 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-orange-600 focus:ring-orange-500 dark:bg-slate-950"
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="h-12 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                              <PackagePlus size={16} />
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-gray-100">
                              {product.name}
                            </p>
                            <p className="text-xs text-slate-400 dark:text-gray-500">
                              ID: {product.id}
                            </p>
                            {product.status === 'declined' && product.adminNotes && (
                              <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
                                Reason: {product.adminNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">
                        {editing?.id === product.id &&
                        editing.field === 'price' ? (
                          <input
                            autoFocus
                            defaultValue={product.price}
                            onBlur={(event) =>
                              updateInline(
                                product.id,
                                'price',
                                event.target.value,
                              )
                            }
                            className="w-24 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-sm dark:text-gray-100"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setEditing({ id: product.id, field: 'price' })
                            }
                            className="text-slate-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-500 transition-colors text-left"
                          >
                            ৳{product.price} / Min: {product.moq}
                            {loadingEdit === product.id && (
                              <span className="ml-2 text-xs text-slate-400">
                                Saving...
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        {editing?.id === product.id &&
                        editing.field === 'stock' ? (
                          <input
                            autoFocus
                            defaultValue={product.stock}
                            onBlur={(event) =>
                              updateInline(
                                product.id,
                                'stock',
                                event.target.value,
                              )
                            }
                            className="w-20 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-sm dark:text-gray-100"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setEditing({ id: product.id, field: 'stock' })
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${stockBadge(product)}`}
                            title={`${product.stock} units`}
                          >
                            {stockStatus(product)}
                          </button>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${statusBadge(product.status)}`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <RowActions
                          onAction={(action) =>
                            handleAction(product.id, action)
                          }
                          status={product.status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {showing.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-colors"
                >
                  <div className="flex gap-4">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-20 w-20 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <PackagePlus size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800 dark:text-gray-100">
                        {product.name}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-gray-500">
                        {product.sku}
                      </p>
                      <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                        ৳{product.price} · MOQ {product.moq}
                      </p>
                      <span
                        className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${statusBadge(product.status)}`}
                      >
                        {product.status}
                      </span>
                      {product.status === 'declined' && product.adminNotes && (
                        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                          Reason: {product.adminNotes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <button className="rounded-lg border border-slate-200 dark:border-slate-800 py-2 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      Edit
                    </button>
                    <button className="rounded-lg border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 py-2 text-orange-600 dark:text-orange-400 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-500 dark:text-gray-400">
            Page {page} of {Math.max(1, Math.ceil(filtered.length / perPage))}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-slate-700 dark:text-gray-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= Math.ceil(filtered.length / perPage)}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-slate-700 dark:text-gray-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      {showImport && (
        <BulkImportModal
          onClose={() => setShowImport(false)}
          onViewProducts={() => {
            setShowImport(false)
            setQuery('')
            setFilter('All')
          }}
        />
      )}
    </SellerProtectedRoute>
  )
}

function BulkActions({
  onAction,
}: {
  onAction: (action: 'publish' | 'unpublish' | 'delete') => void
}) {
  return (
    <div className="relative">
      <select
        className="appearance-none rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-600 dark:text-gray-300 transition-colors"
        onChange={(event) =>
          onAction(event.target.value as 'publish' | 'unpublish' | 'delete')
        }
      >
        <option value="" className="dark:bg-slate-900">
          Bulk actions
        </option>
        <option value="publish" className="dark:bg-slate-900">
          Publish selected
        </option>
        <option value="unpublish" className="dark:bg-slate-900">
          Unpublish selected
        </option>
        <option value="delete" className="dark:bg-slate-900">
          Delete selected
        </option>
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none"
      />
    </div>
  )
}

function ExportMenu({
  onExport,
}: {
  onExport: (type: 'csv' | 'excel') => void
}) {
  return (
    <div className="relative">
      <select
        className="appearance-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-700 dark:text-gray-200 transition-colors focus:border-orange-500"
        onChange={(event) => onExport(event.target.value as 'csv' | 'excel')}
      >
        <option value="" className="dark:bg-slate-900">
          Export
        </option>
        <option value="csv" className="dark:bg-slate-900">
          CSV
        </option>
        <option value="excel" className="dark:bg-slate-900">
          Excel
        </option>
      </select>
      <Download
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none"
      />
    </div>
  )
}

function RowActions({
  onAction,
  status,
}: {
  onAction: (action: string) => void
  status: ProductStatus
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
      <div className="relative">
        <select
          className="appearance-none rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-1 text-xs text-slate-600 dark:text-gray-300 transition-colors"
          onChange={(event) => onAction(event.target.value)}
        >
          <option value="" className="dark:bg-slate-900">
            More
          </option>
          {status === 'accepted' && (
            <option value="view" className="dark:bg-slate-900">
              View on marketplace
            </option>
          )}
          <option value="delete" className="dark:bg-slate-900">
            Delete product
          </option>
        </select>
        <MoreVertical
          size={12}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 pointer-events-none"
        />
      </div>
    </div>
  )
}

function statusBadge(status: ProductStatus) {
  switch (status) {
    case 'accepted':
      return 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
    case 'pending':
      return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
    case 'declined':
      return 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400'
  }
}

function stockBadge(product: Product) {
  if (product.stock === 0)
    return 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  if (product.stock < product.lowStockThreshold)
    return 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
  return 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
}

function EmptyState({
  query,
  onClear,
}: {
  query: string
  onClear: () => void
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center transition-colors">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-gray-500">
        <PackagePlus size={28} />
      </div>
      {query ? (
        <>
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-gray-100">
            No products found for “{query}”
          </h2>
          <button
            type="button"
            onClick={onClear}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-lg font-semibold text-slate-800 dark:text-gray-100">
            Start selling by adding your first product
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-gray-400">
            Showcase your catalog to buyers across Bangladesh.
          </p>
          <Link
            to="/seller/products/add"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 transition-colors shadow-lg shadow-orange-600/20"
          >
            <PackagePlus size={16} />
            Add Product
          </Link>
        </>
      )}
    </div>
  )
}

function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div
          key={row}
          className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
        />
      ))}
    </div>
  )
}
