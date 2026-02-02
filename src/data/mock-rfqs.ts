import { addDays, subDays } from 'date-fns'
import { MockProduct, mockProducts } from './mock-products'
import { Rfq, Quote } from '@/db/schema'

// Extended types for UI with relations
export interface MockQuote extends Partial<Quote> {
  supplierName: string
  supplierLogo: string
  score: number // Simple score for sorting/highlighting
}

export interface MockRfq extends Partial<Rfq> {
  id: number
  rfqNumber: string
  product: MockProduct
  quotes: MockQuote[]
  quoteCount: number
}

const getProduct = (id: number) => mockProducts.find(p => p.id === id) || mockProducts[0]

export const mockRfqs: MockRfq[] = [
  {
    id: 1,
    rfqNumber: 'RFQ-1024',
    productId: 1,
    product: getProduct(1),
    quantity: 500,
    targetPrice: '450.00',
    status: 'quoted',
    createdAt: subDays(new Date(), 2),
    expiresAt: addDays(new Date(), 5),
    quoteCount: 3,
    deliveryLocation: 'Dhaka, Bangladesh',
    quotes: [
      {
        id: 101,
        supplierName: 'Dhaka Textiles Ltd',
        supplierLogo: 'https://via.placeholder.com/40',
        unitPrice: '460.00',
        totalPrice: '230000.00',
        validityPeriod: addDays(new Date(), 7),
        status: 'pending',
        createdAt: subDays(new Date(), 1),
      },
      {
        id: 102,
        supplierName: 'Fashion Export House',
        supplierLogo: 'https://via.placeholder.com/40',
        unitPrice: '445.00',
        totalPrice: '222500.00',
        validityPeriod: addDays(new Date(), 3),
        status: 'pending',
        createdAt: subDays(new Date(), 1),
      }
    ]
  },
  {
    id: 2,
    rfqNumber: 'RFQ-1025',
    productId: 3,
    product: getProduct(3),
    quantity: 100,
    targetPrice: '1200.00',
    status: 'pending',
    createdAt: subDays(new Date(), 1),
    expiresAt: addDays(new Date(), 6),
    quoteCount: 0,
    deliveryLocation: 'Chittagong Port',
    quotes: []
  },
  {
    id: 3,
    rfqNumber: 'RFQ-1020',
    productId: 5,
    product: getProduct(5),
    quantity: 2000,
    targetPrice: '85.00',
    status: 'accepted',
    createdAt: subDays(new Date(), 10),
    expiresAt: subDays(new Date(), 3),
    quoteCount: 5,
    deliveryLocation: 'Gazipur Industrial Area',
    quotes: [] // In real app, we'd load these
  },
  {
    id: 4,
    rfqNumber: 'RFQ-1021',
    productId: 2,
    product: getProduct(2),
    quantity: 50,
    targetPrice: '2500.00',
    status: 'expired',
    createdAt: subDays(new Date(), 15),
    expiresAt: subDays(new Date(), 1),
    quoteCount: 1,
    deliveryLocation: 'Sylhet',
    quotes: []
  }
]
