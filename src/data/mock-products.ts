import { faker } from '@faker-js/faker'

// Set a seed for consistent data generation during development
faker.seed(123)

// Types for mock data (mirrors schema types but without DB dependencies)
export interface MockCategory {
  id: number
  name: string
  slug: string
  icon: string
  parentId: number | null
}

export interface MockSupplier {
  id: number
  name: string
  slug: string
  logo: string
  verified: boolean
  location: string
  responseRate: number
  onTimeDelivery: number
  yearsInBusiness: number
  description: string
}

export interface MockProduct {
  id: number
  name: string
  slug: string
  description: string
  images: string[]
  price: number
  originalPrice: number | null
  moq: number
  stock: number
  unit: string
  categoryId: number
  supplierId: number
  featured: boolean
  isNew: boolean
  rating: number
  reviewCount: number
  soldCount: number
  tags: string[]
  tieredPricing: { minQty: number; maxQty: number | null; price: number }[]
  specifications: { key: string; value: string }[]
  hasSample: boolean
  samplePrice: number | null
}

// Category icons mapping (Lucide icon names) - exported for potential use
export const categoryIcons: Record<string, string> = {
  'Fashion & Apparel': 'Shirt',
  Electronics: 'Smartphone',
  'Home & Living': 'Home',
  'Beauty & Personal Care': 'Sparkles',
  'Sports & Outdoors': 'Dumbbell',
  'Food & Beverages': 'UtensilsCrossed',
  'Industrial Supplies': 'Factory',
  'Office & Stationery': 'Briefcase',
  Packaging: 'Package',
  'Raw Materials': 'Boxes',
}

// Wholesale product categories specific to Bangladesh B2B market
export const mockCategories: MockCategory[] = [
  {
    id: 1,
    name: 'Fashion & Apparel',
    slug: 'fashion-apparel',
    icon: 'Shirt',
    parentId: null,
  },
  {
    id: 2,
    name: 'Electronics',
    slug: 'electronics',
    icon: 'Smartphone',
    parentId: null,
  },
  {
    id: 3,
    name: 'Home & Living',
    slug: 'home-living',
    icon: 'Home',
    parentId: null,
  },
  {
    id: 4,
    name: 'Beauty & Personal Care',
    slug: 'beauty-personal-care',
    icon: 'Sparkles',
    parentId: null,
  },
  {
    id: 5,
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    icon: 'Dumbbell',
    parentId: null,
  },
  {
    id: 6,
    name: 'Food & Beverages',
    slug: 'food-beverages',
    icon: 'UtensilsCrossed',
    parentId: null,
  },
  {
    id: 7,
    name: 'Industrial Supplies',
    slug: 'industrial-supplies',
    icon: 'Factory',
    parentId: null,
  },
  {
    id: 8,
    name: 'Office & Stationery',
    slug: 'office-stationery',
    icon: 'Briefcase',
    parentId: null,
  },
  {
    id: 9,
    name: 'Packaging',
    slug: 'packaging',
    icon: 'Package',
    parentId: null,
  },
  {
    id: 10,
    name: 'Raw Materials',
    slug: 'raw-materials',
    icon: 'Boxes',
    parentId: null,
  },
  // Subcategories
  {
    id: 11,
    name: "Men's Clothing",
    slug: 'mens-clothing',
    icon: 'Shirt',
    parentId: 1,
  },
  {
    id: 12,
    name: "Women's Clothing",
    slug: 'womens-clothing',
    icon: 'Shirt',
    parentId: 1,
  },
  {
    id: 13,
    name: 'Mobile Accessories',
    slug: 'mobile-accessories',
    icon: 'Smartphone',
    parentId: 2,
  },
  {
    id: 14,
    name: 'Computer Parts',
    slug: 'computer-parts',
    icon: 'Monitor',
    parentId: 2,
  },
  {
    id: 15,
    name: 'Kitchen & Dining',
    slug: 'kitchen-dining',
    icon: 'UtensilsCrossed',
    parentId: 3,
  },
  {
    id: 16,
    name: 'Furniture',
    slug: 'furniture',
    icon: 'Sofa',
    parentId: 3,
  },
]

// Bangladesh locations for suppliers
const bdLocations = [
  'Dhaka',
  'Chittagong',
  'Gazipur',
  'Narayanganj',
  'Comilla',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Rangpur',
  'Mymensingh',
]

// --- FACTORY FUNCTIONS ---

export const createMockSupplier = (id: number): MockSupplier => {
  return {
    id,
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    logo: `https://picsum.photos/seed/supplier${id}/200/200`,
    verified: faker.datatype.boolean({ probability: 0.7 }),
    location: faker.helpers.arrayElement(bdLocations),
    responseRate: faker.number.float({ min: 70, max: 100, fractionDigits: 1 }),
    onTimeDelivery: faker.number.float({ min: 80, max: 100, fractionDigits: 1 }),
    yearsInBusiness: faker.number.int({ min: 1, max: 20 }),
    description: faker.company.catchPhrase(),
  }
}

// Generate realistic wholesale prices in BDT
const generatePrice = (categoryId: number): number => {
  const priceRanges: Record<number, [number, number]> = {
    1: [150, 2500],
    2: [100, 5000],
    3: [200, 8000],
    4: [80, 1500],
    5: [150, 3000],
    6: [50, 2000],
    7: [100, 5000],
    8: [20, 500],
    9: [10, 200],
    10: [100, 3000],
  }
  const [min, max] = priceRanges[categoryId] || [100, 1000]
  return faker.number.int({ min, max })
}

const productNamesByCategory: Record<number, string[]> = {
  1: ['T-Shirt', 'Shirt', 'Polo', 'Jeans', 'Saree', 'Kurta', 'Jacket', 'Jersey'],
  2: ['Earbuds', 'Cable', 'Watch Band', 'Screen Protector', 'Power Bank', 'USB Hub', 'Stand', 'Mouse'],
  3: ['Cookware', 'Bed Sheet', 'Lamp', 'Container', 'Clock', 'Cushion', 'Towel', 'Chair'],
  4: ['Cream', 'Shampoo', 'Lotion', 'Perfume', 'Brush Set', 'Nail Polish', 'Sunscreen', 'Mask'],
  5: ['Yoga Mat', 'Dumbbells', 'Band', 'Bottle', 'Shoes', 'Football', 'Racket', 'Bag'],
  6: ['Tea', 'Noodles', 'Rice', 'Oil', 'Spice', 'Snacks', 'Drink', 'Coffee'],
  7: ['Helmet', 'Gloves', 'Fan', 'Cable Ties', 'Tape', 'Cleaning', 'Tools', 'First Aid'],
  8: ['Paper', 'Pen', 'Notebook', 'Stapler', 'Folder', 'Marker', 'Calculator', 'Organizer'],
  9: ['Boxes', 'Bubble Wrap', 'Tape', 'Bags', 'Shrink Wrap', 'Paper Bags', 'Container', 'Labels'],
  10: ['Fabric', 'Leather', 'Granules', 'Wire', 'Rubber', 'Foam', 'Beads', 'Chemical'],
}

const unitsByCategory: Record<number, string[]> = {
  1: ['piece', 'dozen', 'pack'],
  2: ['piece', 'pack', 'box'],
  3: ['piece', 'set', 'pack'],
  4: ['piece', 'bottle', 'pack'],
  5: ['piece', 'pair', 'set'],
  6: ['kg', 'pack', 'carton'],
  7: ['piece', 'box', 'set'],
  8: ['piece', 'pack', 'ream'],
  9: ['piece', 'roll', 'pack'],
  10: ['meter', 'kg', 'roll'],
}

export const createMockProduct = (id: number, supplierCount: number): MockProduct => {
  const categoryId = faker.number.int({ min: 1, max: 10 })
  const baseNames = productNamesByCategory[categoryId] || productNamesByCategory[1]
  const baseName = faker.helpers.arrayElement(baseNames)
  const adjective = faker.commerce.productAdjective()
  const name = `${adjective} ${baseName}`
  
  const price = generatePrice(categoryId)
  const hasDiscount = faker.datatype.boolean({ probability: 0.4 })
  const originalPrice = hasDiscount
    ? Math.round(price * faker.number.float({ min: 1.1, max: 1.5 }))
    : null
  
  const units = unitsByCategory[categoryId] || ['piece']
  const moq = faker.helpers.arrayElement([1, 5, 10, 20, 50, 100])
  
  // Tiered pricing
  const tieredPricing = [
    { minQty: moq, maxQty: moq * 2, price: price },
    { minQty: moq * 2 + 1, maxQty: moq * 5, price: Math.round(price * 0.95) },
    { minQty: moq * 5 + 1, maxQty: null, price: Math.round(price * 0.9) },
  ]
  
  const hasSample = faker.datatype.boolean({ probability: 0.8 })

  return {
    id,
    name,
    slug: faker.helpers.slugify(name).toLowerCase() + `-${id}`,
    description: faker.commerce.productDescription(),
    images: Array.from(
      { length: faker.number.int({ min: 1, max: 4 }) },
      (_, j) => `https://picsum.photos/seed/product${id}-${j}/800/800`
    ),
    price,
    originalPrice,
    moq,
    stock: faker.number.int({ min: 0, max: 10000 }),
    unit: faker.helpers.arrayElement(units),
    categoryId,
    supplierId: faker.number.int({ min: 1, max: supplierCount }),
    featured: faker.datatype.boolean({ probability: 0.2 }),
    isNew: faker.datatype.boolean({ probability: 0.3 }),
    rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    reviewCount: faker.number.int({ min: 0, max: 500 }),
    soldCount: faker.number.int({ min: 0, max: 10000 }),
    tags: faker.helpers.arrayElements(
      ['bestseller', 'trending', 'limited', 'bulk-deal', 'new-arrival', 'top-rated'],
      faker.number.int({ min: 0, max: 4 })
    ),
    tieredPricing,
    specifications: [
      { key: 'Material', value: faker.commerce.productMaterial() },
      { key: 'Color', value: faker.color.human() },
      { key: 'Origin', value: 'Bangladesh' },
      { key: 'Weight', value: `${faker.number.int({ min: 100, max: 1000 })}g` },
      { key: 'Brand', value: faker.company.name() },
    ],
    hasSample,
    samplePrice: hasSample ? Math.round(price * 1.5) : null,
  }
}

// --- DATA GENERATION ---

export const mockSuppliers: MockSupplier[] = Array.from(
  { length: 20 },
  (_, i) => createMockSupplier(i + 1)
)

export const mockProducts: MockProduct[] = Array.from(
  { length: 120 },
  (_, i) => createMockProduct(i + 1, mockSuppliers.length)
)


// Helper functions
export const formatBDT = (price: number): string => {
  return `৳${price.toLocaleString('en-BD')}`
}

export const getProductsByCategory = (categoryId: number): MockProduct[] => {
  return mockProducts.filter((p) => p.categoryId === categoryId)
}

export const getFeaturedProducts = (): MockProduct[] => {
  return mockProducts.filter((p) => p.featured)
}

export const getNewArrivals = (): MockProduct[] => {
  return mockProducts.filter((p) => p.isNew).slice(0, 12)
}

export const getTopRanking = (): MockProduct[] => {
  return [...mockProducts].sort((a, b) => b.soldCount - a.soldCount).slice(0, 12)
}

export const getSupplierById = (id: number): MockSupplier | undefined => {
  return mockSuppliers.find((s) => s.id === id)
}

export const getCategoryById = (id: number): MockCategory | undefined => {
  return mockCategories.find((c) => c.id === id)
}

export const getCategoryBySlug = (slug: string): MockCategory | undefined => {
  return mockCategories.find((c) => c.slug === slug)
}

export const getVerifiedSuppliers = (): MockSupplier[] => {
  return mockSuppliers.filter((s) => s.verified)
}

// Search and filter functions
export interface ProductFilters {
  search?: string
  categoryId?: number
  minPrice?: number
  maxPrice?: number
  minMoq?: number
  maxMoq?: number
  locations?: string[]
  verifiedOnly?: boolean
  sortBy?: 'price-asc' | 'price-desc' | 'newest' | 'popularity'
}

export const filterProducts = (filters: ProductFilters): MockProduct[] => {
  let filtered = [...mockProducts]

  if (filters.search) {
    const searchLower = filters.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags.some((t) => t.toLowerCase().includes(searchLower))
    )
  }

  if (filters.categoryId) {
    filtered = filtered.filter((p) => p.categoryId === filters.categoryId)
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!)
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!)
  }

  if (filters.minMoq !== undefined) {
    filtered = filtered.filter((p) => p.moq >= filters.minMoq!)
  }

  if (filters.maxMoq !== undefined) {
    filtered = filtered.filter((p) => p.moq <= filters.maxMoq!)
  }

  if (filters.locations && filters.locations.length > 0) {
    const supplierIds = mockSuppliers
      .filter((s) => filters.locations!.includes(s.location))
      .map((s) => s.id)
    filtered = filtered.filter((p) => supplierIds.includes(p.supplierId))
  }

  if (filters.verifiedOnly) {
    const verifiedSupplierIds = mockSuppliers
      .filter((s) => s.verified)
      .map((s) => s.id)
    filtered = filtered.filter((p) =>
      verifiedSupplierIds.includes(p.supplierId)
    )
  }

  // Sorting
  switch (filters.sortBy) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price)
      break
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price)
      break
    case 'newest':
      filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0))
      break
    case 'popularity':
      filtered.sort((a, b) => b.soldCount - a.soldCount)
      break
  }

  return filtered
}

// Hero banner slides
export interface HeroBannerSlide {
  id: number
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  bgImage: string
  bgColor: string
}

export const heroBannerSlides: HeroBannerSlide[] = [
  {
    id: 1,
    title: 'Wholesale Fashion Week',
    subtitle: 'Up to 50% off on bulk orders of apparel',
    ctaText: 'Shop Now',
    ctaLink: '/categories/fashion-apparel',
    bgImage: 'https://picsum.photos/seed/banner1/1920/600',
    bgColor: 'from-orange-500 to-red-600',
  },
  {
    id: 2,
    title: 'Electronics Mega Sale',
    subtitle: 'Best prices on mobile accessories and gadgets',
    ctaText: 'Explore Deals',
    ctaLink: '/categories/electronics',
    bgImage: 'https://picsum.photos/seed/banner2/1920/600',
    bgColor: 'from-blue-500 to-purple-600',
  },
  {
    id: 3,
    title: 'New Supplier? Get 10% Off',
    subtitle: 'First order discount for verified businesses',
    ctaText: 'Register Now',
    ctaLink: '/register',
    bgImage: 'https://picsum.photos/seed/banner3/1920/600',
    bgColor: 'from-green-500 to-teal-600',
  },
  {
    id: 4,
    title: 'Bulk Order Benefits',
    subtitle: 'Volume discounts on orders above ৳50,000',
    ctaText: 'Learn More',
    ctaLink: '/bulk-orders',
    bgImage: 'https://picsum.photos/seed/banner4/1920/600',
    bgColor: 'from-amber-500 to-orange-600',
  },
]

// Promo banners for homepage sections
export interface PromoBanner {
  id: number
  title: string
  image: string
  link: string
}

export const promoBanners: PromoBanner[] = [
  {
    id: 1,
    title: 'Flash Deals',
    image: 'https://picsum.photos/seed/promo1/400/200',
    link: '/flash-deals',
  },
  {
    id: 2,
    title: 'New Arrivals',
    image: 'https://picsum.photos/seed/promo2/400/200',
    link: '/new-arrivals',
  },
  {
    id: 3,
    title: 'Top Brands',
    image: 'https://picsum.photos/seed/promo3/400/200',
    link: '/top-brands',
  },
]

// Frequently searched terms
export const frequentlySearched: string[] = [
  'cotton t-shirt',
  'mobile charger',
  'kitchen utensils',
  'office supplies',
  'packaging materials',
  'safety equipment',
  'fabric wholesale',
  'electronics bulk',
]

// Bangladesh locations for filters
export const bdLocationsList: string[] = bdLocations