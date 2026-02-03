import { useMemo, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ChevronDown,
  Download,
  MoreVertical,
  PackagePlus,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'

type ProductStatus = 'Published' | 'Draft'
type StockStatus = 'In Stock' | 'Low Stock' | 'Out of Stock'

type Product = {
  id: string
  title: string
  sku: string
  price: number
  moq: number
  stock: number
  lowStockThreshold: number
  status: ProductStatus
  orders: number
  image: string
}

const PRODUCTS: Product[] = [
  {
    id: 'p1',
    title: 'Industrial Safety Gloves',
    sku: 'GLV-204',
    price: 120,
    moq: 50,
    stock: 145,
    lowStockThreshold: 20,
    status: 'Published',
    orders: 38,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=500&auto=format&fit=crop',
  },
  {
    id: 'p2',
    title: 'HDPE Packaging Bags',
    sku: 'PKG-810',
    price: 18,
    moq: 500,
    stock: 60,
    lowStockThreshold: 80,
    status: 'Published',
    orders: 22,
    image: 'https://images.unsplash.com/photo-1531498860502-7c67cf02f657?q=80&w=500&auto=format&fit=crop',
  },
  {
    id: 'p3',
    title: 'Cotton T-Shirts Bulk Pack',
    sku: 'TSH-532',
    price: 210,
    moq: 100,
    stock: 0,
    lowStockThreshold: 30,
    status: 'Draft',
    orders: 0,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=500&auto=format&fit=crop',
  },
  {
    id: 'p4',
    title: 'Stainless Steel Cookware Set',
    sku: 'CKW-119',
    price: 1250,
    moq: 10,
    stock: 22,
    lowStockThreshold: 15,
    status: 'Published',
    orders: 12,
    image: 'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?q=80&w=500&auto=format&fit=crop',
  },
]

type FilterTab = 'All' | 'Published' | 'Draft' | 'Out of Stock' | 'Low Stock'
type SortOption = 'Newest First' | 'Oldest First' | 'Price: Low to High' | 'Price: High to Low' | 'Most Orders'

export function SellerProductsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterTab>('All')
  const [sort, setSort] = useState<SortOption>('Newest First')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<{ id: string; field: 'price' | 'stock' } | null>(null)
  const [loadingEdit, setLoadingEdit] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [page, setPage] = useState(1)
  const perPage = 20

  const filtered = useMemo(() => {
    const matchesQuery = (product: Product) =>
      product.title.toLowerCase().includes(query.toLowerCase()) ||
      product.sku.toLowerCase().includes(query.toLowerCase())
    const filteredByTab = products.filter((product) => {
      if (filter === 'Published') return product.status === 'Published'
      if (filter === 'Draft') return product.status === 'Draft'
      if (filter === 'Out of Stock') return product.stock === 0
      if (filter === 'Low Stock') return product.stock > 0 && product.stock < product.lowStockThreshold
      return true
    })
    const result = filteredByTab.filter(matchesQuery)
    const sorted = [...result].sort((a, b) => {
      switch (sort) {
        case 'Oldest First':
          return a.id.localeCompare(b.id)
        case 'Price: Low to High':
          return a.price - b.price
        case 'Price: High to Low':
          return b.price - a.price
        case 'Most Orders':
          return b.orders - a.orders
        default:
          return b.id.localeCompare(a.id)
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

  const toggleSelection = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const toggleSelectAll = () => {
    if (selected.length === showing.length) {
      setSelected([])
    } else {
      setSelected(showing.map((product) => product.id))
    }
  }

  const updateInline = (id: string, field: 'price' | 'stock', value: string) => {
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
      setProducts((prev) => prev.filter((product) => !selected.includes(product.id)))
      setSelected([])
      return
    }
    setProducts((prev) =>
      prev.map((product) =>
        selected.includes(product.id)
          ? { ...product, status: action === 'publish' ? 'Published' : 'Draft' }
          : product,
      ),
    )
  }

  const handleAction = (id: string, action: string) => {
    if (action === 'delete') {
      if (!window.confirm('Delete this product?')) return
      setProducts((prev) => prev.filter((product) => product.id !== id))
      return
    }
    if (action === 'duplicate') {
      setProducts((prev) => [
        {
          ...prev.find((product) => product.id === id)!,
          id: `copy-${crypto.randomUUID()}`,
          title: `${prev.find((product) => product.id === id)!.title} (Copy)`,
        },
        ...prev,
      ])
      return
    }
    if (action === 'toggle') {
      setProducts((prev) =>
        prev.map((product) =>
          product.id === id
            ? { ...product, status: product.status === 'Published' ? 'Draft' : 'Published' }
            : product,
        ),
      )
    }
  }

  const handleExport = (type: 'csv' | 'excel') => {
    alert(`Exporting ${type.toUpperCase()} for ${filter === 'All' ? 'all products' : filter}.`)
  }

  return (
    <SellerProtectedRoute requireVerified>
      <div className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
            <p className="text-sm text-slate-500 mt-1">
              Showing {showing.length} of {total} products
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {selected.length > 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                {selected.length} selected
                <BulkActions onAction={handleBulkAction} />
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate({ to: '/seller/products/add' })}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
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
            className="w-full lg:max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              {(['All', 'Published', 'Draft', 'Out of Stock', 'Low Stock'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    filter === tab ? 'bg-orange-50 text-orange-700' : 'bg-white text-slate-500 border border-slate-200'
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
                className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700"
              >
                {([
                  'Newest First',
                  'Oldest First',
                  'Price: Low to High',
                  'Price: High to Low',
                  'Most Orders',
                ] as SortOption[]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <ExportMenu onExport={handleExport} />
          </div>
        </section>

        {filtered.length === 0 ? (
          <EmptyState
            query={query}
            onClear={() => {
              setQuery('')
              setFilter('All')
            }}
          />
        ) : (
          <>
            <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="text-left text-slate-400 bg-slate-50">
                  <tr>
                    <th className="p-4">
                      <input
                        type="checkbox"
                        checked={selected.length === showing.length && showing.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4">Product</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Price / MOQ</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {showing.map((product) => (
                    <tr key={product.id} className="text-slate-600">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelection(product.id)}
                        />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image} alt={product.title} className="h-12 w-12 rounded-lg object-cover" />
                          <div>
                            <p className="font-semibold text-slate-800">{product.title}</p>
                            <p className="text-xs text-slate-400">ID: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">
                      {editing?.id === product.id && editing.field === 'price' ? (
                        <input
                          autoFocus
                          defaultValue={product.price}
                          onBlur={(event) => updateInline(product.id, 'price', event.target.value)}
                          className="w-24 rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      ) : (
                        <button
                          onClick={() => setEditing({ id: product.id, field: 'price' })}
                          className="text-slate-700 hover:text-orange-600"
                        >
                          ₹{product.price} / Min: {product.moq}
                          {loadingEdit === product.id && (
                            <span className="ml-2 text-xs text-slate-400">Saving...</span>
                          )}
                        </button>
                      )}
                      </td>
                      <td className="p-4">
                      {editing?.id === product.id && editing.field === 'stock' ? (
                        <input
                          autoFocus
                          defaultValue={product.stock}
                          onBlur={(event) => updateInline(product.id, 'stock', event.target.value)}
                          className="w-20 rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                      ) : (
                        <button
                          onClick={() => setEditing({ id: product.id, field: 'stock' })}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${stockBadge(product)}`}
                          title={`${product.stock} units`}
                        >
                          {stockStatus(product)}
                        </button>
                      )}
                      </td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(product.status)}`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="p-4">{product.orders}</td>
                      <td className="p-4">
                        <RowActions
                          onAction={(action) => handleAction(product.id, action)}
                          isPublished={product.status === 'Published'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 lg:hidden">
              {showing.map((product) => (
                <div key={product.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex gap-4">
                    <img src={product.image} alt={product.title} className="h-20 w-20 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{product.title}</p>
                      <p className="text-xs text-slate-400">{product.sku}</p>
                      <p className="mt-2 text-sm text-slate-700">
                        ₹{product.price} · MOQ {product.moq}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${stockBadge(product)}`}>
                        {stockStatus(product)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <button className="rounded-lg border border-slate-200 py-2">Edit</button>
                    <button className="rounded-lg border border-orange-200 bg-orange-50 py-2 text-orange-600">View</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-slate-500">
            Page {page} of {Math.max(1, Math.ceil(filtered.length / perPage))}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((prev) => prev - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= Math.ceil(filtered.length / perPage)}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </footer>
      </div>
    </SellerProtectedRoute>
  )
}

function BulkActions({ onAction }: { onAction: (action: 'publish' | 'unpublish' | 'delete') => void }) {
  return (
    <div className="relative">
      <select
        className="appearance-none rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
        onChange={(event) => onAction(event.target.value as 'publish' | 'unpublish' | 'delete')}
      >
        <option value="">Bulk actions</option>
        <option value="publish">Publish selected</option>
        <option value="unpublish">Unpublish selected</option>
        <option value="delete">Delete selected</option>
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function ExportMenu({ onExport }: { onExport: (type: 'csv' | 'excel') => void }) {
  return (
    <div className="relative">
      <select
        className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700"
        onChange={(event) => onExport(event.target.value as 'csv' | 'excel')}
      >
        <option value="">Export</option>
        <option value="csv">CSV</option>
        <option value="excel">Excel</option>
      </select>
      <Download size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function RowActions({ onAction, isPublished }: { onAction: (action: string) => void; isPublished: boolean }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <button className="rounded-lg border border-slate-200 px-2 py-1">View</button>
      <div className="relative">
        <select
          className="appearance-none rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600"
          onChange={(event) => onAction(event.target.value)}
        >
          <option value="">More</option>
          <option value="view">View on marketplace</option>
          <option value="edit">Edit product</option>
          <option value="duplicate">Duplicate product</option>
          <option value="toggle">{isPublished ? 'Unpublish' : 'Publish'}</option>
          <option value="delete">Delete product</option>
        </select>
        <MoreVertical size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  )
}

function statusBadge(status: ProductStatus) {
  return status === 'Published'
    ? 'bg-green-50 text-green-700'
    : 'bg-slate-100 text-slate-600'
}

function stockBadge(product: Product) {
  if (product.stock === 0) return 'bg-red-50 text-red-600'
  if (product.stock < product.lowStockThreshold) return 'bg-orange-50 text-orange-600'
  return 'bg-green-50 text-green-600'
}

function EmptyState({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <PackagePlus size={28} />
      </div>
      {query ? (
        <>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            No products found for “{query}”
          </h2>
          <button
            type="button"
            onClick={onClear}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-lg font-semibold text-slate-800">
            Start selling by adding your first product
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Showcase your catalog to buyers across Bangladesh.
          </p>
          <Link
            to="/seller/products/add"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
          >
            <PackagePlus size={16} />
            Add Product
          </Link>
        </>
      )}
    </div>
  )
}
