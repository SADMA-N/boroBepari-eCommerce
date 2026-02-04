import type {Order, OrderItem} from '@/db/schema';

export enum OrderStatus {
  PLACED = 'placed',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

// Extend Drizzle types with computed/joined fields if necessary
export type OrderDetail = Order & {
  items: Array<OrderItem & {
    productName: string
    image: string
    supplierName: string
  }>
  deliveryAddressStr: string
}

export interface OrderFilters {
  status?: OrderStatus
  startDate?: Date
  endDate?: Date
  search?: string
}
