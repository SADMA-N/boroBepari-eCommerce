import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  CheckCircle2,
  ChevronDown,
  ImagePlus,
  Info,
  PackagePlus,
  Plus,
  Save,
  Sparkles,
  X,
} from 'lucide-react'
import { SellerProtectedRoute } from '@/components/seller'
import { useSellerToast } from '@/components/seller/SellerToastProvider'
import {
  uploadSellerProductImage,
  submitSellerProduct,
  updateSellerProduct,
} from '@/lib/seller-product-server'

type PricingTier = { id: string; minQty: string; maxQty: string; price: string }
type SpecRow = { id: string; key: string; value: string }
type UploadImage = {
  id: string
  file?: File
  previewUrl: string
  thumbUrl: string
  progress: number
  isPrimary: boolean
}

type SubmitMode = 'draft' | 'publish'

const MAX_IMAGES = 8
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png']

const MAIN_CATEGORIES = [
  {
    name: 'Electronics',
    sub: ['Mobile Accessories', 'Audio Devices', 'Electrical Components'],
    specs: ['Warranty', 'Voltage', 'Material'],
  },
  {
    name: 'Apparel & Fashion',
    sub: ['T-Shirts', 'Footwear', 'Accessories'],
    specs: ['Fabric', 'Color', 'Size'],
  },
  {
    name: 'Home & Kitchen',
    sub: ['Cookware', 'Home Decor', 'Storage'],
    specs: ['Material', 'Dimensions', 'Weight'],
  },
  {
    name: 'Industrial Supplies',
    sub: ['Safety Gear', 'Tools', 'Packaging'],
    specs: ['Weight', 'Grade', 'Usage'],
  },
]

const EXISTING_SKUS = ['GLV-204', 'PKG-810', 'TSH-532', 'CKW-119']

const DELIVERY_OPTIONS = ['2-3 days', '3-5 days', '5-7 days']
const RETURN_POLICIES = ['7 days', '15 days', '30 days', 'No returns']
const SHIP_FROM = [
  'Dhaka Warehouse',
  'Chittagong Warehouse',
  'Khulna Warehouse',
]
const SECTION_IDS = [
  { id: 'basic', label: 'Basic Information' },
  { id: 'images', label: 'Images' },
  { id: 'pricing', label: 'Pricing & Inventory' },
  { id: 'specs', label: 'Specifications' },
  { id: 'shipping', label: 'Shipping & Delivery' },
  { id: 'samples', label: 'Sample Orders' },
]

export function AddProductPage({ initialData }: { initialData?: any }) {
  const { pushToast } = useSellerToast()
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('basic')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [errorSummary, setErrorSummary] = useState<Array<string>>([])
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitMode, setSubmitMode] = useState<SubmitMode>('draft')
  const [submitError, setSubmitError] = useState('')

  const [title, setTitle] = useState('')
  const [mainCategory, setMainCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [descriptionHtml, setDescriptionHtml] = useState('')
  const [descriptionText, setDescriptionText] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<Array<string>>([])

  const [images, setImages] = useState<Array<UploadImage>>([])
  const imagesRef = useRef<Array<UploadImage>>([])

  const [tieredPricing, setTieredPricing] = useState(false)
  const [pricingTiers, setPricingTiers] = useState<Array<PricingTier>>([
    { id: crypto.randomUUID(), minQty: '', maxQty: '', price: '' },
    { id: crypto.randomUUID(), minQty: '', maxQty: '', price: '' },
  ])
  const [price, setPrice] = useState('')
  const [discount, setDiscount] = useState('')
  const [moq, setMoq] = useState('')
  const [stock, setStock] = useState('')
  const [sku, setSku] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState('10')

  const [specs, setSpecs] = useState<Array<SpecRow>>([
    { id: crypto.randomUUID(), key: '', value: '' },
  ])

  const [weight, setWeight] = useState('')
  const [dimensions, setDimensions] = useState({
    length: '',
    width: '',
    height: '',
  })
  const [shipFrom, setShipFrom] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  const [returnPolicy, setReturnPolicy] = useState('')

  const [sampleEnabled, setSampleEnabled] = useState(false)
  const [samplePrice, setSamplePrice] = useState('')
  const [sampleMaxQty, setSampleMaxQty] = useState('5')
  const [sampleDelivery, setSampleDelivery] = useState('')

  const contentRef = useRef<HTMLDivElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.name)
      setMainCategory(initialData.mainCategory || '')
      setSubCategory(initialData.subCategory || '')
      setBrand(initialData.brand || '')
      setDescriptionHtml(initialData.description || '')
      // Simple text extraction for validation (not perfect but sufficient for required check)
      const parser = new DOMParser()
      const doc = parser.parseFromString(initialData.description || '', 'text/html')
      setDescriptionText(doc.body.textContent || '')
      
      setTags(initialData.tags || [])
      setPrice(String(initialData.price))
      // Assuming originalPrice logic is handled via discount field in UI if needed, 
      // but for now we just load price.
      
      setMoq(String(initialData.moq))
      setStock(String(initialData.stock))
      setSku(initialData.sku || '')
      setLowStockThreshold(String(initialData.lowStockThreshold || 10))
      
      const initImages = (initialData.images || []).map((url: string, idx: number) => ({
        id: crypto.randomUUID(),
        previewUrl: url,
        thumbUrl: url,
        progress: 100,
        isPrimary: idx === 0,
      }))
      setImages(initImages)

      if (initialData.tieredPricing && initialData.tieredPricing.length > 0) {
        setTieredPricing(true)
        setPricingTiers(initialData.tieredPricing.map((t: any) => ({
            id: crypto.randomUUID(),
            minQty: String(t.minQty),
            maxQty: t.maxQty ? String(t.maxQty) : '',
            price: String(t.price)
        })))
      } else {
        setTieredPricing(false)
      }

      if (initialData.specifications && initialData.specifications.length > 0) {
        setSpecs(initialData.specifications.map((s: any) => ({
            id: crypto.randomUUID(),
            key: s.key,
            value: s.value
        })))
      } else {
        setSpecs([{ id: crypto.randomUUID(), key: '', value: '' }])
      }

      setWeight(initialData.weight || '')
      setDimensions(initialData.dimensions || { length: '', width: '', height: '' })
      setShipFrom(initialData.shipFrom || '')
      setDeliveryTime(initialData.deliveryTime || '')
      setReturnPolicy(initialData.returnPolicy || '')
      
      setSampleEnabled(initialData.hasSample || false)
      setSamplePrice(initialData.samplePrice ? String(initialData.samplePrice) : '')
      setSampleMaxQty(initialData.sampleMaxQty ? String(initialData.sampleMaxQty) : '5')
      setSampleDelivery(initialData.sampleDelivery || '')
    }
  }, [initialData])

  useEffect(() => {
    if (initialData) return // Don't load draft if editing existing product
    const saved = localStorage.getItem('seller_product_draft')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setTitle(parsed.title ?? '')
        setMainCategory(parsed.mainCategory ?? '')
        setSubCategory(parsed.subCategory ?? '')
        setBrand(parsed.brand ?? '')
        setDescriptionHtml(parsed.descriptionHtml ?? '')
        setDescriptionText(parsed.descriptionText ?? '')
        setTags(parsed.tags ?? [])
        setTieredPricing(parsed.tieredPricing ?? false)
        setPricingTiers(parsed.pricingTiers ?? pricingTiers)
        setPrice(parsed.price ?? '')
        setDiscount(parsed.discount ?? '')
        setMoq(parsed.moq ?? '')
        setStock(parsed.stock ?? '')
        setSku(parsed.sku ?? '')
        setLowStockThreshold(parsed.lowStockThreshold ?? '10')
        setSpecs(parsed.specs ?? specs)
        setWeight(parsed.weight ?? '')
        setDimensions(
          parsed.dimensions ?? { length: '', width: '', height: '' },
        )
        setShipFrom(parsed.shipFrom ?? '')
        setDeliveryTime(parsed.deliveryTime ?? '')
        setReturnPolicy(parsed.returnPolicy ?? '')
        setSampleEnabled(parsed.sampleEnabled ?? false)
        setSamplePrice(parsed.samplePrice ?? '')
        setSampleMaxQty(parsed.sampleMaxQty ?? '5')
        setSampleDelivery(parsed.sampleDelivery ?? '')
        if (parsed.lastSavedAt) setLastSavedAt(new Date(parsed.lastSavedAt))
      } catch {
        // ignore invalid draft
      }
    }
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSavingStatus('saving')
      const payload = {
        title,
        mainCategory,
        subCategory,
        brand,
        descriptionHtml,
        descriptionText,
        tags,
        tieredPricing,
        pricingTiers,
        price,
        discount,
        moq,
        stock,
        sku,
        lowStockThreshold,
        specs,
        weight,
        dimensions,
        shipFrom,
        deliveryTime,
        returnPolicy,
        sampleEnabled,
        samplePrice,
        sampleMaxQty,
        sampleDelivery,
        lastSavedAt: new Date().toISOString(),
      }
      localStorage.setItem('seller_product_draft', JSON.stringify(payload))
      window.setTimeout(() => {
        setSavingStatus('idle')
        setLastSavedAt(new Date())
      }, 400)
    }, 30000)
    return () => window.clearInterval(interval)
  }, [
    title,
    mainCategory,
    subCategory,
    brand,
    descriptionHtml,
    descriptionText,
    tags,
    tieredPricing,
    pricingTiers,
    price,
    discount,
    moq,
    stock,
    sku,
    lowStockThreshold,
    specs,
    weight,
    dimensions,
    shipFrom,
    deliveryTime,
    returnPolicy,
    sampleEnabled,
    samplePrice,
    sampleMaxQty,
    sampleDelivery,
  ])

  useEffect(() => {
    const computeActive = () => {
      // If scrolled to the bottom, activate the last section
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 40
      if (atBottom) return SECTION_IDS[SECTION_IDS.length - 1].id

      const threshold = window.innerHeight * 0.35
      let current = 'basic'
      for (const s of SECTION_IDS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= threshold) {
          current = s.id
        }
      }
      return current
    }

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(() => {
          setActiveSection(computeActive())
          ticking = false
        })
      }
    }

    // Run once immediately
    setActiveSection(computeActive())

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    })
    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, { capture: true })
    }
  }, [])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      title: title.trim()
        ? title.length > 200
          ? 'Max 200 characters allowed.'
          : ''
        : 'Product title is required.',
    }))
  }, [title])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      mainCategory: mainCategory ? '' : 'Select a main category.',
      subCategory: subCategory ? '' : 'Select a subcategory.',
    }))
  }, [mainCategory, subCategory])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      description: descriptionText.trim()
        ? descriptionText.length > 2000
          ? 'Max 2000 characters allowed.'
          : ''
        : 'Product description is required.',
    }))
  }, [descriptionText])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      images: images.length > 0 ? '' : 'Primary image is required.',
    }))
  }, [images])

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.previewUrl)
        URL.revokeObjectURL(img.thumbUrl)
      })
    }
  }, [])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => {
    if (!tieredPricing) return
    const ranges = pricingTiers.map((tier) => ({
      min: Number(tier.minQty),
      max: Number(tier.maxQty),
    }))
    const invalidRange = ranges.some(
      (range) => !range.min || !range.max || range.min > range.max,
    )
    const overlaps = ranges.some((range, idx) =>
      ranges.some(
        (other, j) =>
          j !== idx && range.min <= other.max && other.min <= range.max,
      ),
    )
    setErrors((prev) => ({
      ...prev,
      pricingTiers: invalidRange
        ? 'Tier ranges must be valid.'
        : overlaps
          ? 'Tier ranges should not overlap.'
          : '',
    }))
  }, [tieredPricing, pricingTiers])

  useEffect(() => {
    if (!tieredPricing) {
      setErrors((prev) => ({
        ...prev,
        price: price ? '' : 'Price per unit is required.',
      }))
    }
  }, [tieredPricing, price])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      moq: moq ? '' : 'MOQ is required.',
      stock: stock ? '' : 'Stock is required.',
    }))
  }, [moq, stock])

  useEffect(() => {
    setErrors((prev) => ({
      ...prev,
      weight: weight ? '' : 'Product weight is required.',
      shipFrom: shipFrom ? '' : 'Select ship-from location.',
      deliveryTime: deliveryTime ? '' : 'Select delivery time.',
      returnPolicy: returnPolicy ? '' : 'Select return policy.',
    }))
  }, [weight, shipFrom, deliveryTime, returnPolicy])

  useEffect(() => {
    if (!sampleEnabled) {
      setErrors((prev) => ({
        ...prev,
        samplePrice: '',
        sampleDelivery: '',
      }))
      return
    }
    setErrors((prev) => ({
      ...prev,
      samplePrice: samplePrice ? '' : 'Sample price is required.',
      sampleDelivery: sampleDelivery ? '' : 'Sample delivery time is required.',
    }))
  }, [sampleEnabled, samplePrice, sampleDelivery])

  const subCategories = useMemo(() => {
    const match = MAIN_CATEGORIES.find((item) => item.name === mainCategory)
    return match?.sub ?? []
  }, [mainCategory])

  const specSuggestions = useMemo(() => {
    const match = MAIN_CATEGORIES.find((item) => item.name === mainCategory)
    return match?.specs ?? []
  }, [mainCategory])

  const handleTagInput = (value: string) => {
    if (value.includes(',')) {
      const parts = value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      setTags((prev) => Array.from(new Set([...prev, ...parts])))
      setTagInput('')
      return
    }
    setTagInput(value)
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag))
  }

  const addTier = () => {
    setPricingTiers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), minQty: '', maxQty: '', price: '' },
    ])
  }

  const updateTier = (id: string, field: keyof PricingTier, value: string) => {
    setPricingTiers((prev) =>
      prev.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)),
    )
  }

  const removeTier = (id: string) => {
    if (pricingTiers.length <= 2) return
    setPricingTiers((prev) => prev.filter((tier) => tier.id !== id))
  }

  const addSpecRow = () => {
    setSpecs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: '', value: '' },
    ])
  }

  const updateSpec = (id: string, field: keyof SpecRow, value: string) => {
    setSpecs((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    )
  }

  const removeSpec = (id: string) => {
    setSpecs((prev) => prev.filter((row) => row.id !== id))
  }

  const handleImageFiles = async (files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)
    for (const file of fileArray) {
      if (images.length >= MAX_IMAGES) break
      const error = validateImage(file)
      if (error) {
        setErrors((prev) => ({ ...prev, images: error }))
        continue
      }
      const compressed = await compressImage(file)
      const previewUrl = URL.createObjectURL(compressed)
      const thumbUrl = await generateThumbnail(compressed)
      const imageItem: UploadImage = {
        id: crypto.randomUUID(),
        file: compressed,
        previewUrl,
        thumbUrl,
        progress: 0,
        isPrimary: images.length === 0,
      }
      setImages((prev) => [...prev, imageItem])
      simulateUploadProgress(imageItem.id)
    }
  }

  const validateImage = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type))
      return 'Only JPEG or PNG images are allowed.'
    if (file.size > MAX_IMAGE_SIZE) return 'Image must be under 5MB.'
    return ''
  }

  const simulateUploadProgress = (id: string) => {
    let progress = 0
    const interval = window.setInterval(() => {
      progress += 15
      setImages((prev) =>
        prev.map((img) =>
          img.id === id ? { ...img, progress: Math.min(progress, 100) } : img,
        ),
      )
      if (progress >= 100) window.clearInterval(interval)
    }, 120)
  }

  const removeImage = (id: string) => {
    setImages((prev) => {
      const next = prev.filter((img) => img.id !== id)
      if (next.length && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true
      }
      return [...next]
    })
  }

  const setPrimaryImage = (id: string) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, isPrimary: img.id === id })),
    )
  }

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, id: string) => {
    event.dataTransfer.setData('text/plain', id)
  }

  const onDropImage = (
    event: React.DragEvent<HTMLDivElement>,
    targetId: string,
  ) => {
    event.preventDefault()
    const sourceId = event.dataTransfer.getData('text/plain')
    if (!sourceId || sourceId === targetId) return
    setImages((prev) => {
      const sourceIndex = prev.findIndex((img) => img.id === sourceId)
      const targetIndex = prev.findIndex((img) => img.id === targetId)
      if (sourceIndex === -1 || targetIndex === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(sourceIndex, 1)
      next.splice(targetIndex, 0, moved)
      return next
    })
  }

  const validateAll = () => {
    const nextErrors: Record<string, string> = {}
    if (!title.trim()) nextErrors.title = 'Product title is required.'
    if (title.length > 200) nextErrors.title = 'Max 200 characters allowed.'
    if (
      !mainCategory ||
      !MAIN_CATEGORIES.some((cat) => cat.name === mainCategory)
    ) {
      nextErrors.mainCategory = 'Select a valid main category.'
    }
    if (!subCategory || !subCategories.includes(subCategory)) {
      nextErrors.subCategory = 'Select a valid subcategory.'
    }
    if (!descriptionText.trim())
      nextErrors.description = 'Product description is required.'
    if (descriptionText.length > 2000)
      nextErrors.description = 'Max 2000 characters allowed.'
    if (images.length === 0) nextErrors.images = 'Primary image is required.'
    if (tieredPricing) {
      if (pricingTiers.length < 2)
        nextErrors.pricingTiers = 'Minimum 2 tiers required.'
      const ranges = pricingTiers.map((tier) => ({
        min: Number(tier.minQty),
        max: Number(tier.maxQty),
      }))
      const invalidRange = ranges.some(
        (range) => !range.min || !range.max || range.min > range.max,
      )
      if (invalidRange) nextErrors.pricingTiers = 'Tier ranges must be valid.'
      const overlaps = ranges.some((range, idx) =>
        ranges.some(
          (other, j) =>
            j !== idx && range.min <= other.max && other.min <= range.max,
        ),
      )
      if (overlaps) nextErrors.pricingTiers = 'Tier ranges should not overlap.'
    } else {
      if (!price) nextErrors.price = 'Price per unit is required.'
    }
    if (!moq) nextErrors.moq = 'MOQ is required.'
    if (!stock) nextErrors.stock = 'Stock is required.'
    if (sku && EXISTING_SKUS.includes(sku))
      nextErrors.sku = 'SKU already exists.'
    if (!weight) nextErrors.weight = 'Product weight is required.'
    if (!shipFrom) nextErrors.shipFrom = 'Select ship-from location.'
    if (!deliveryTime) nextErrors.deliveryTime = 'Select delivery time.'
    if (!returnPolicy) nextErrors.returnPolicy = 'Select return policy.'
    if (sampleEnabled) {
      if (!samplePrice) nextErrors.samplePrice = 'Sample price is required.'
      if (!sampleDelivery)
        nextErrors.sampleDelivery = 'Sample delivery time is required.'
    }
    setErrors(nextErrors)
    setErrorSummary(Object.values(nextErrors).filter(Boolean))
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (mode: SubmitMode) => {
    setSubmitMode(mode)
    setSubmitError('')
    if (!validateAll()) return

    const token = localStorage.getItem('seller_token') || ''

    const doSubmit = async () => {
      // Upload images first
      const imageUrls: string[] = []
      for (const img of images) {
        if (img.file) {
          const arrayBuf = await img.file.arrayBuffer()
          const base64 = btoa(
            new Uint8Array(arrayBuf).reduce(
              (data, byte) => data + String.fromCharCode(byte),
              '',
            ),
          )
          const result = await uploadSellerProductImage({
            data: {
              fileBase64: base64,
              mimeType: img.file.type || 'image/jpeg',
              fileName: img.file.name,
            },
            headers: { Authorization: `Bearer ${token}` },
          })
          imageUrls.push(result.url)
        } else {
          // Existing image
          imageUrls.push(img.previewUrl)
        }
      }

      // Calculate original price from discount percentage
      let computedOriginalPrice: string | undefined
      if (discount && price) {
        const discountNum = parseFloat(discount.replace('%', ''))
        const priceNum = parseFloat(price)
        if (!isNaN(discountNum) && discountNum > 0 && discountNum < 100) {
          computedOriginalPrice = (priceNum / (1 - discountNum / 100)).toFixed(2)
        }
      }

      // Build the payload
      const payload = {
        name: title,
        brand,
        mainCategory,
        subCategory,
        description: descriptionHtml,
        tags,
        images: imageUrls,
        price,
        originalPrice: computedOriginalPrice,
        tieredPricingEnabled: tieredPricing,
        tieredPricing: pricingTiers.map((t) => ({
          minQty: t.minQty,
          maxQty: t.maxQty,
          price: t.price,
        })),
        moq,
        stock,
        sku: sku || undefined,
        unit: 'piece',
        lowStockThreshold,
        specifications: specs
          .filter((s) => s.key && s.value)
          .map((s) => ({ key: s.key, value: s.value })),
        weight,
        dimensions,
        shipFrom,
        deliveryTime,
        returnPolicy,
        hasSample: sampleEnabled,
        samplePrice: samplePrice || undefined,
        sampleMaxQty: sampleMaxQty || undefined,
        sampleDelivery: sampleDelivery || undefined,
        mode,
      }

      if (initialData?.id) {
        await updateSellerProduct({
          data: { ...payload, id: initialData.id },
          headers: { Authorization: `Bearer ${token}` },
        })
      } else {
        await submitSellerProduct({
          data: payload,
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    }

    void doSubmit()
      .then(() => {
        localStorage.removeItem('seller_product_draft')
        setShowSuccess(true)
        pushToast(
          initialData
            ? 'Product updated successfully'
            : mode === 'publish'
              ? 'Product submitted for review'
              : 'Draft saved',
          'success',
        )
      })
      .catch((err) => {
        const msg =
          err instanceof Error ? err.message : 'Failed to save product.'
        setSubmitError(msg)
        pushToast(msg, 'error')
      })
  }

  const handlePreview = () => {
    if (!validateAll()) return
    setShowPreview(true)
  }

  const descriptionRemaining = 2000 - descriptionText.length

  return (
    <SellerProtectedRoute requireVerified>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-xl p-4 border border-transparent dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-400">
                  Form Sections
                </p>
                <nav className="mt-3 space-y-1">
                  {SECTION_IDS.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveSection(section.id)
                        document.getElementById(section.id)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        })
                      }}
                      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? 'bg-orange-50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                      }`}
                    >
                      {section.label}
                    </a>
                  ))}
                </nav>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                  Auto-save
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">
                  {savingStatus === 'saving'
                    ? 'Saving...'
                    : 'All changes saved'}
                </p>
                {lastSavedAt && (
                  <p className="mt-1 text-xs text-slate-400 dark:text-gray-500">
                    Last saved at {lastSavedAt.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </aside>

          <main className="flex-1 space-y-8">
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {initialData ? 'Edit Product' : 'Add New Product'}
                </h1>
                <p className="text-slate-500 dark:text-gray-400 mt-1">
                  Provide complete details to increase buyer confidence.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Save size={16} />
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                >
                  <Sparkles size={16} />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('publish')}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  <PackagePlus size={16} />
                  Publish Product
                </button>
              </div>
            </header>

            {submitError && (
              <div className="rounded-xl border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                {submitError}{' '}
                <button
                  type="button"
                  onClick={() => handleSubmit(submitMode)}
                  className="underline"
                >
                  Retry
                </button>
              </div>
            )}

            {errorSummary.length > 0 && (
              <div className="rounded-xl border border-red-100 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-600 dark:text-red-400">
                <p className="font-semibold">
                  Please fix the following errors:
                </p>
                <ul className="mt-2 list-disc pl-5">
                  {errorSummary.map((item, idx) => (
                    <li key={`${item}-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <section
              id="basic"
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Basic Information
                </h2>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  Section 1
                </span>
              </div>
              <Field
                label="Product Title"
                required
                value={title}
                onChange={(value) => setTitle(value)}
                error={errors.title}
                helper="Max 200 characters"
              />
              <div className="grid md:grid-cols-2 gap-4">
                <SelectField
                  label="Main Category"
                  required
                  value={mainCategory}
                  onChange={(value) => {
                    setMainCategory(value)
                    setSubCategory('')
                  }}
                  options={MAIN_CATEGORIES.map((item) => item.name)}
                  error={errors.mainCategory}
                />
                <SelectField
                  label="Subcategory"
                  required
                  value={subCategory}
                  onChange={(value) => setSubCategory(value)}
                  options={subCategories}
                  disabled={!mainCategory}
                  error={errors.subCategory}
                />
              </div>
              <Field
                label="Brand"
                value={brand}
                onChange={(value) => setBrand(value)}
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Product Description <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-t-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                  <ToolbarButton
                    label="B"
                    onClick={() => document.execCommand('bold')}
                  />
                  <ToolbarButton
                    label="I"
                    onClick={() => document.execCommand('italic')}
                  />
                  <ToolbarButton
                    label="•"
                    onClick={() => document.execCommand('insertUnorderedList')}
                  />
                </div>
                <div
                  ref={contentRef}
                  contentEditable
                  className="min-h-[140px] rounded-b-lg border border-t-0 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-gray-200 focus:outline-none"
                  onInput={(event) => {
                    const html = sanitizeHtml(
                      (event.target as HTMLDivElement).innerHTML,
                    )
                    const text = (event.target as HTMLDivElement).innerText
                    if (text.length <= 2000) {
                      setDescriptionHtml(html)
                      setDescriptionText(text)
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-gray-500 mt-1">
                  <span>{errors.description}</span>
                  <span>{descriptionRemaining} characters left</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                  Product Tags
                </label>
                <input
                  value={tagInput}
                  onChange={(event) => handleTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleTagInput(`${tagInput},`)
                    }
                  }}
                  placeholder="Type and press comma"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-gray-300"
                    >
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section
              id="images"
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Images
                </h2>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  Section 2
                </span>
              </div>
              <div
                className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 p-4"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault()
                  void handleImageFiles(event.dataTransfer.files)
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-gray-500">
                    <ImagePlus size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                      Drag & drop or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                      >
                        browse
                      </button>{' '}
                      to upload
                    </p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">
                      JPEG/PNG, max 5MB each · Minimum 800x800px recommended ·
                      White background preferred
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  className="hidden"
                  onChange={(event) => handleImageFiles(event.target.files)}
                />
                {errors.images && (
                  <p className="mt-2 text-xs text-red-500">{errors.images}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2"
                    draggable
                    onDragStart={(event) => onDragStart(event, image.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDropImage(event, image.id)}
                  >
                    <img
                      src={image.thumbUrl}
                      alt="preview"
                      className="h-28 w-full rounded-lg object-cover"
                    />
                    <div className="mt-2 h-1 rounded-full bg-slate-100 dark:bg-slate-700">
                      <div
                        className="h-1 rounded-full bg-orange-500"
                        style={{ width: `${image.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(image.id)}
                        className={`text-xs font-semibold ${
                          image.isPrimary
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'
                        }`}
                      >
                        {image.isPrimary ? 'Primary' : 'Set as primary'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="text-xs text-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              id="pricing"
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Pricing & Inventory
                </h2>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  Section 3
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                    Enable Tiered Pricing
                  </p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    Offer volume discounts with pricing tiers
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={tieredPricing}
                    onChange={(event) => setTieredPricing(event.target.checked)}
                  />
                  <div
                    className={`h-6 w-11 rounded-full ${tieredPricing ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-700'} relative`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white absolute top-0.5 transition ${tieredPricing ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </div>
                </label>
              </div>

              {tieredPricing ? (
                <div className="space-y-3">
                  {pricingTiers.map((tier, index) => (
                    <div
                      key={tier.id}
                      className="grid md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-center"
                    >
                      <Field
                        label={index === 0 ? 'Min Quantity' : undefined}
                        required
                        value={tier.minQty}
                        onChange={(value) =>
                          updateTier(tier.id, 'minQty', value)
                        }
                      />
                      <Field
                        label={index === 0 ? 'Max Quantity' : undefined}
                        required
                        value={tier.maxQty}
                        onChange={(value) =>
                          updateTier(tier.id, 'maxQty', value)
                        }
                      />
                      <Field
                        label={index === 0 ? 'Price per Unit' : undefined}
                        required
                        value={tier.price}
                        onChange={(value) =>
                          updateTier(tier.id, 'price', value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeTier(tier.id)}
                        disabled={pricingTiers.length <= 2}
                        className="text-xs text-slate-400 dark:text-gray-500 hover:text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {errors.pricingTiers && (
                    <p className="text-xs text-red-500">
                      {errors.pricingTiers}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={addTier}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                  >
                    <Plus size={16} />
                    Add Tier
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="Price per Unit"
                    required
                    value={price}
                    onChange={(value) => setPrice(value)}
                    error={errors.price}
                  />
                  <Field
                    label="Discount (%)"
                    value={discount}
                    onChange={(value) => setDiscount(value)}
                  />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Minimum Order Quantity (MOQ)"
                  required
                  value={moq}
                  onChange={setMoq}
                  error={errors.moq}
                />
                <Field
                  label="Available Stock"
                  required
                  value={stock}
                  onChange={setStock}
                  error={errors.stock}
                />
                <Field
                  label="SKU"
                  value={sku}
                  onChange={setSku}
                  error={errors.sku}
                />
                <Field
                  label="Low Stock Threshold"
                  value={lowStockThreshold}
                  onChange={setLowStockThreshold}
                />
              </div>
            </section>

            <section
              id="specs"
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Specifications
                </h2>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  Section 4
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {specSuggestions.map((spec) => (
                  <button
                    key={spec}
                    type="button"
                    onClick={() =>
                      setSpecs((prev) => [
                        ...prev,
                        { id: crypto.randomUUID(), key: spec, value: '' },
                      ])
                    }
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                  >
                    + {spec}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                {specs.map((row) => (
                  <div
                    key={row.id}
                    className="grid md:grid-cols-[1fr_1fr_auto] gap-3 items-center"
                  >
                    <Field
                      label="Specification"
                      value={row.key}
                      onChange={(value) => updateSpec(row.id, 'key', value)}
                    />
                    <Field
                      label="Value"
                      value={row.value}
                      onChange={(value) => updateSpec(row.id, 'value', value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(row.id)}
                      className="text-xs text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
                >
                  <Plus size={16} />
                  Add Specification
                </button>
              </div>
            </section>

            <section
              id="shipping"
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Shipping & Delivery
                </h2>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  Section 5
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field
                  label="Product Weight (kg)"
                  required
                  value={weight}
                  onChange={setWeight}
                  error={errors.weight}
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Package Dimensions (cm)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={dimensions.length}
                      onChange={(event) =>
                        setDimensions((prev) => ({
                          ...prev,
                          length: event.target.value,
                        }))
                      }
                      placeholder="L"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-gray-100"
                    />
                    <input
                      value={dimensions.width}
                      onChange={(event) =>
                        setDimensions((prev) => ({
                          ...prev,
                          width: event.target.value,
                        }))
                      }
                      placeholder="W"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-gray-100"
                    />
                    <input
                      value={dimensions.height}
                      onChange={(event) =>
                        setDimensions((prev) => ({
                          ...prev,
                          height: event.target.value,
                        }))
                      }
                      placeholder="H"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <SelectField
                  label="Ships From"
                  required
                  value={shipFrom}
                  onChange={setShipFrom}
                  options={SHIP_FROM}
                  error={errors.shipFrom}
                />
                <SelectField
                  label="Estimated Delivery Time"
                  required
                  value={deliveryTime}
                  onChange={setDeliveryTime}
                  options={DELIVERY_OPTIONS}
                  error={errors.deliveryTime}
                />
                <SelectField
                  label="Return Policy"
                  required
                  value={returnPolicy}
                  onChange={setReturnPolicy}
                  options={RETURN_POLICIES}
                  error={errors.returnPolicy}
                />
              </div>
            </section>

            <section
              id="samples"
              className="scroll-mt-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Sample Orders
                </h2>
                <span className="text-xs text-slate-400 dark:text-gray-500">
                  Section 6
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                    Enable Sample Orders
                  </p>
                  <p className="text-xs text-slate-400 dark:text-gray-500">
                    Offer samples to build buyer trust
                  </p>
                </div>
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={sampleEnabled}
                    onChange={(event) => setSampleEnabled(event.target.checked)}
                  />
                  <div
                    className={`h-6 w-11 rounded-full ${sampleEnabled ? 'bg-orange-600' : 'bg-slate-200 dark:bg-slate-700'} relative`}
                  >
                    <div
                      className={`h-5 w-5 rounded-full bg-white absolute top-0.5 transition ${sampleEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                    />
                  </div>
                </label>
              </div>
              {sampleEnabled && (
                <div className="grid md:grid-cols-3 gap-4">
                  <Field
                    label="Sample Price per Unit"
                    required
                    value={samplePrice}
                    onChange={setSamplePrice}
                    error={errors.samplePrice}
                  />
                  <Field
                    label="Max Sample Quantity"
                    value={sampleMaxQty}
                    onChange={setSampleMaxQty}
                  />
                  <SelectField
                    label="Sample Delivery Time"
                    required
                    value={sampleDelivery}
                    onChange={setSampleDelivery}
                    options={DELIVERY_OPTIONS}
                    error={errors.sampleDelivery}
                  />
                </div>
              )}
            </section>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-gray-400">
                <Info size={16} />
                All fields marked with * are required.
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('publish')}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
                >
                  Publish Product
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {showPreview && (
        <Modal onClose={() => setShowPreview(false)} title="Product Preview">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {title || 'Untitled Product'}
            </h3>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              {mainCategory} · {subCategory}
            </p>
            {images[0] && (
              <img
                src={images[0].previewUrl}
                alt="preview"
                className="w-full max-h-64 object-cover rounded-lg"
              />
            )}
            <div
              className="prose prose-sm max-w-none text-slate-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: descriptionHtml || '<p>No description yet.</p>',
              }}
            />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-600 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showSuccess && (
        <Modal
          onClose={() => setShowSuccess(false)}
          title="Product Added Successfully!"
        >
          <div className="space-y-4 text-center">
            <div className="mx-auto h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-slate-600 dark:text-gray-300">
              Your product has been{' '}
              {submitMode === 'publish' ? 'published' : 'saved as draft'}.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => navigate({ to: '/' })}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                View Product
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccess(false)
                  navigate({ to: '/seller/products/add' })
                }}
                className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/30 px-4 py-2 text-sm font-semibold text-orange-700 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50"
              >
                Add Another Product
              </button>
              <Link
                to="/seller/products"
                className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Go to Products List
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </SellerProtectedRoute>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  error,
  helper,
}: {
  label?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  error?: string
  helper?: string
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20"
      />
      {helper && (
        <p className="mt-1 text-xs text-slate-400 dark:text-gray-500">
          {helper}
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<string>
  required?: boolean
  error?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-gray-100 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-900/20 disabled:bg-slate-50 dark:disabled:bg-slate-800"
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
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-700"
    >
      {label}
    </button>
  )
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label="Close modal"
            autoFocus
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function sanitizeHtml(input: string) {
  if (typeof window === 'undefined') return input
  const allowed = new Set(['B', 'I', 'UL', 'LI', 'P', 'BR'])
  const doc = new DOMParser().parseFromString(input, 'text/html')
  const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT)
  const nodes: Array<Element> = []
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Element)
  }
  nodes.forEach((node) => {
    if (!allowed.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes))
    }
  })
  return doc.body.innerHTML
}

async function compressImage(file: File) {
  if (file.size <= 1.5 * 1024 * 1024) return file
  const bitmap = await createImageBitmap(file)
  const maxSize = 1600
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.82),
  )
  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
    type: 'image/jpeg',
  })
}

async function generateThumbnail(file: File) {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const size = 240
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return URL.createObjectURL(file)
  const scale = Math.max(size / bitmap.width, size / bitmap.height)
  const width = bitmap.width * scale
  const height = bitmap.height * scale
  const dx = (size - width) / 2
  const dy = (size - height) / 2
  ctx.drawImage(bitmap, dx, dy, width, height)
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.8),
  )
  if (!blob) return URL.createObjectURL(file)
  return URL.createObjectURL(blob)
}
