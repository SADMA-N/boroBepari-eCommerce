import { useEffect, useMemo, useState } from 'react'
import { Download, UploadCloud, X } from 'lucide-react'
import { useSellerToast } from '@/components/seller/SellerToastProvider'

type ImportRow = {
  rowNumber: number
  title: string
  category: string
  brand: string
  description: string
  price: string
  moq: string
  stock: string
  sku: string
  weight: string
  specs: string
  imageUrls: string
}

type ValidationError = {
  rowNumber: number
  title: string
  message: string
  suggestion: string
}

type ImportState = 'idle' | 'parsing' | 'ready' | 'importing' | 'complete'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_ROWS = 500
const REQUIRED_FIELDS = ['title', 'category', 'description', 'price', 'moq', 'stock']

const CATEGORIES = [
  'Electronics',
  'Apparel & Fashion',
  'Home & Kitchen',
  'Industrial Supplies',
]

const TEMPLATE_COLUMNS = [
  'Product Title*',
  'Category*',
  'Brand',
  'Description*',
  'Price*',
  'MOQ*',
  'Stock*',
  'SKU',
  'Weight (kg)',
  'Specifications (JSON format)',
  'Image URLs (comma-separated)',
]

const SAMPLE_ROW = [
  'Industrial Safety Gloves',
  'Industrial Supplies',
  'SafeGuard',
  'Nitrile coated safety gloves for heavy duty use.',
  '120',
  '50',
  '200',
  'GLV-204',
  '0.6',
  '{"Material":"Nitrile","Size":"L"}',
  'https://example.com/image1.jpg, https://example.com/image2.jpg',
]

export function BulkImportModal({
  onClose,
  onViewProducts,
}: {
  onClose: () => void
  onViewProducts: () => void
}) {
  const { pushToast } = useSellerToast()
  const [fileError, setFileError] = useState('')
  const [rows, setRows] = useState<Array<ImportRow>>([])
  const [errors, setErrors] = useState<Array<ValidationError>>([])
  const [state, setState] = useState<ImportState>('idle')
  const [showAllValid, setShowAllValid] = useState(false)
  const [uploadImagesSeparately, setUploadImagesSeparately] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 })

  const validRows = useMemo(() => {
    const errorRowSet = new Set(errors.map((err) => err.rowNumber))
    return rows.filter((row) => !errorRowSet.has(row.rowNumber))
  }, [rows, errors])

  const visibleValidRows = showAllValid ? validRows : validRows.slice(0, 10)

  useEffect(() => {
    if (state !== 'importing') return
    setImportProgress(0)
    setTimeRemaining(validRows.length * 0.3)
    const interval = window.setInterval(() => {
      setImportProgress((prev) => {
        const next = Math.min(prev + 8, 100)
        return next
      })
      setTimeRemaining((prev) => Math.max(prev - 1, 0))
    }, 400)
    const done = window.setTimeout(() => {
      window.clearInterval(interval)
      setState('complete')
      setImportStats({ success: validRows.length, failed: errors.length })
      pushToast('Bulk import complete', 'success')
    }, 5200)
    return () => {
      window.clearInterval(interval)
      window.clearTimeout(done)
    }
  }, [state, validRows.length, errors.length])

  const downloadCsvTemplate = () => {
    const csv = [TEMPLATE_COLUMNS.join(','), SAMPLE_ROW.join(',')].join('\n')
    downloadFile(csv, 'bulk-product-template.csv', 'text/csv')
  }

  const downloadExcelTemplate = async () => {
    try {
      const { utils, writeFile } = await import('xlsx')
      const worksheet = utils.aoa_to_sheet([TEMPLATE_COLUMNS, SAMPLE_ROW])
      const workbook = utils.book_new()
      utils.book_append_sheet(workbook, worksheet, 'Products')
      writeFile(workbook, 'bulk-product-template.xlsx')
    } catch (error) {
      setFileError('Unable to generate Excel template. Please use CSV instead.')
    }
  }

  const handleFile = async (file: File | null) => {
    if (!file) return
    setFileError('')
    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds 10MB limit.')
      return
    }
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['csv', 'xlsx', 'xls'].includes(ext)) {
      setFileError('Invalid file format. Upload CSV or Excel.')
      return
    }
    setState('parsing')
    try {
      const parsedRows = ext === 'csv' ? await parseCsv(file) : await parseExcel(file)
      if (parsedRows.length > MAX_ROWS) {
        setFileError('Maximum 500 products per upload.')
        setState('idle')
        return
      }
      const { formattedRows, rowErrors } = validateRows(parsedRows, uploadImagesSeparately)
      setRows(formattedRows)
      setErrors(rowErrors)
      setState('ready')
      pushToast('File parsed successfully', 'success')
    } catch (error) {
      setFileError('Parsing failed. Please check your file format.')
      pushToast('Parsing failed. Please retry.', 'error')
      setState('idle')
    }
  }

  const handleImport = () => {
    if (!validRows.length) return
    setState('importing')
  }

  const downloadErrorReport = () => {
    const csv = [
      'Row,Title,Error,Fix Suggestion',
      ...errors.map(
        (err) => `${err.rowNumber},"${err.title}","${err.message}","${err.suggestion}"`,
      ),
    ].join('\n')
    downloadFile(csv, 'import-errors.csv', 'text/csv')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Import Products in Bulk</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close modal" autoFocus>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Step 1: Download Template</h3>
            <ul className="mt-2 text-sm text-slate-500 list-disc pl-5">
              <li>Download our template</li>
              <li>Fill in product details</li>
              <li>Upload the completed file</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={downloadCsvTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <Download size={16} />
                Download CSV Template
              </button>
              <button
                type="button"
                onClick={downloadExcelTemplate}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <Download size={16} />
                Download Excel Template
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Step 2: Upload File</h3>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="checkbox"
                  checked={uploadImagesSeparately}
                  onChange={(event) => setUploadImagesSeparately(event.target.checked)}
                />
                Upload images separately
              </label>
            </div>
            <div
              className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                void handleFile(event.dataTransfer.files.item(0) || null)
              }}
            >
              <UploadCloud className="mx-auto text-slate-400" size={28} />
              <p className="mt-2 text-sm text-slate-500">
                Drag & drop your CSV/Excel file, or{' '}
                <label className="text-orange-600 font-semibold cursor-pointer">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={(event) => void handleFile(event.target.files?.item(0) || null)}
                  />
                </label>
              </p>
              <p className="text-xs text-slate-400 mt-1">Max 10MB · Up to 500 products</p>
              {fileError && <p className="mt-2 text-xs text-red-500">{fileError}</p>}
            </div>
          </section>

          {state === 'ready' && (
            <section className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <SummaryCard label="Total rows" value={rows.length} />
                <SummaryCard label="Valid rows" value={validRows.length} tone="success" />
                <SummaryCard label="Rows with errors" value={errors.length} tone="danger" />
              </div>

              {errors.length > 0 && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-red-700">Validation Errors</h4>
                    <button
                      type="button"
                      onClick={downloadErrorReport}
                      className="text-xs font-semibold text-red-600 underline"
                    >
                      Download error report
                    </button>
                  </div>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs text-red-700">
                      <thead>
                        <tr className="text-left">
                          <th className="pb-2">Row</th>
                          <th>Product title</th>
                          <th>Error</th>
                          <th>Fix suggestion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {errors.map((error) => (
                          <tr key={`${error.rowNumber}-${error.title}`}>
                            <td className="py-1">{error.rowNumber}</td>
                            <td>{error.title}</td>
                            <td>{error.message}</td>
                            <td>{error.suggestion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-700">Preview Valid Products</h4>
                  {validRows.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setShowAllValid((prev) => !prev)}
                      className="text-xs font-semibold text-orange-600"
                    >
                      {showAllValid ? 'Show Less' : 'Show All'}
                    </button>
                  )}
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-xs text-slate-600">
                    <thead>
                      <tr className="text-left">
                        <th className="pb-2">Title</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>MOQ</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleValidRows.map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="py-1 text-slate-800">{row.title}</td>
                          <td>{row.category}</td>
                          <td>৳{row.price}</td>
                          <td>{row.moq}</td>
                          <td>{row.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <button
                  type="button"
                  onClick={handleImport}
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Import Valid Products
                </button>
                <span className="text-xs text-slate-400">
                  Invalid rows will be skipped.
                </span>
              </div>
            </section>
          )}

          {state === 'importing' && (
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="text-sm font-semibold text-slate-700">Importing products...</h4>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-orange-500" style={{ width: `${importProgress}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>{importProgress}% completed</span>
                <span>Estimated time remaining: {Math.ceil(timeRemaining)}s</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setState('ready')
                  setImportProgress(0)
                }}
                className="mt-4 text-xs font-semibold text-red-500 underline"
              >
                Cancel Import
              </button>
            </section>
          )}

          {state === 'complete' && (
            <section className="rounded-xl border border-green-100 bg-green-50 p-5 space-y-3">
              <h4 className="text-sm font-semibold text-green-700">Import Complete!</h4>
              <p className="text-xs text-green-700">
                {importStats.success} products imported successfully · {importStats.failed} failed
              </p>
              <button
                type="button"
                onClick={downloadErrorReport}
                className="text-xs font-semibold text-green-700 underline"
              >
                Download error report (CSV)
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onViewProducts}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  View Imported Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setState('idle')
                    setRows([])
                    setErrors([])
                  }}
                  className="rounded-lg border border-green-200 px-4 py-2 text-sm font-semibold text-green-700"
                >
                  Import More
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone?: 'success' | 'danger' }) {
  const toneClass =
    tone === 'success'
      ? 'bg-green-50 text-green-700'
      : tone === 'danger'
        ? 'bg-red-50 text-red-600'
        : 'bg-slate-50 text-slate-600'
  return (
    <div className={`rounded-xl border border-slate-200 p-4 ${toneClass}`}>
      <p className="text-xs uppercase">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  if (link.isConnected) {
    link.remove()
  }
  URL.revokeObjectURL(url)
}

async function parseCsv(file: File) {
  const text = await file.text()
  const lines = text.split(/\r?\n/).filter(Boolean)
  const headers = parseCsvLine(lines[0] || '')
  const dataLines = lines.slice(1)
  return dataLines.map((line, index) => {
    const values = parseCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[normalizeHeader(header)] = values[idx] || ''
    })
    return toImportRow(row, index + 2)
  })
}

async function parseExcel(file: File) {
  const { read, utils } = await import('xlsx')
  const data = await file.arrayBuffer()
  const workbook = read(data)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = utils.sheet_to_json<Array<string>>(sheet, { header: 1 })
  const [headerRow, ...dataRows] = rows
  return dataRows.map((row, index) => {
    const record: Record<string, string> = {}
    headerRow.forEach((header: string, idx: number) => {
      record[normalizeHeader(header)] = String(row[idx] ?? '')
    })
    return toImportRow(record, index + 2)
  })
}

function parseCsvLine(line: string) {
  const result: Array<string> = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"' && line[i + 1] === '"') {
      current += '"'
      i += 1
      continue
    }
    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }
    current += char
  }
  result.push(current.trim())
  return result
}

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function toImportRow(record: Record<string, string>, rowNumber: number): ImportRow {
  return {
    rowNumber,
    title: record.producttitle || record.title || '',
    category: record.category || '',
    brand: record.brand || '',
    description: record.description || '',
    price: record.price || '',
    moq: record.moq || '',
    stock: record.stock || '',
    sku: record.sku || '',
    weight: record.weightkg || record.weight || '',
    specs: record.specificationsjsonformat || record.specifications || '',
    imageUrls: record.imageurlscommaseparated || record.imageurls || '',
  }
}

function validateRows(rows: Array<ImportRow>, uploadImagesSeparately: boolean) {
  const errors: Array<ValidationError> = []
  const skuSet = new Set<string>()
  const formattedRows = rows.map((row) => {
    const rowErrors: Array<ValidationError> = []
    REQUIRED_FIELDS.forEach((field) => {
      if (!row[field as keyof ImportRow]) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          title: row.title || 'Untitled',
          message: `Missing required field: ${field}`,
          suggestion: 'Add the missing value in template.',
        })
      }
    })
    if (row.category && !CATEGORIES.includes(row.category)) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        title: row.title || 'Untitled',
        message: 'Invalid category',
        suggestion: 'Use a category from the template list.',
      })
    }
    if (row.price && Number.isNaN(Number(row.price))) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        title: row.title || 'Untitled',
        message: 'Price must be a number',
        suggestion: 'Enter numeric price value.',
      })
    }
    if (row.sku) {
      if (skuSet.has(row.sku)) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          title: row.title || 'Untitled',
          message: 'Duplicate SKU',
          suggestion: 'Ensure SKU is unique.',
        })
      }
      skuSet.add(row.sku)
    }
    if (!uploadImagesSeparately && !row.imageUrls) {
      rowErrors.push({
        rowNumber: row.rowNumber,
        title: row.title || 'Untitled',
        message: 'Missing image URLs',
        suggestion: 'Add at least one image URL or enable separate upload.',
      })
    }
    errors.push(...rowErrors)
    return row
  })
  return { formattedRows, rowErrors: errors }
}
