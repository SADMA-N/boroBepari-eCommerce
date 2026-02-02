import React, { createContext, useContext, useEffect, useState } from 'react'
import { Cart, CartItem, CouponCode } from '@/types/cart'
import { calculateCartTotals } from '@/lib/cart-utils'
import { mockProducts, getSupplierById } from '@/data/mock-products'

interface CartContextType {
  cart: Cart
  cartItems: CartItem[] // Alias for cart.items
  addToCart: (productId: number, quantity: number, options?: { customPrice?: number, rfqId?: number, quoteId?: number }) => void
  removeFromCart: (productId: number, rfqId?: number) => void
  updateQuantity: (productId: number, quantity: number, rfqId?: number) => void
  clearCart: () => void
  applyCoupon: (code: string) => Promise<boolean> // Mock async
  cartCount: number
  getCartTotal: () => number // Legacy support
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const CART_STORAGE_KEY = 'borobepari_cart_v2'
const CART_EXPIRY_DAYS = 7

interface StoredCart {
  items: CartItem[]
  updatedAt: number
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0,
    supplierBreakdown: []
  })

  // Initialize from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CART_STORAGE_KEY)
        if (saved) {
          const parsed: StoredCart = JSON.parse(saved)
          const now = Date.now()
          const expiryMs = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000
          
          if (now - parsed.updatedAt < expiryMs) {
            // Recalculate totals on load to ensure consistency
            const totals = calculateCartTotals(parsed.items)
            setCart({ ...totals, items: parsed.items })
          } else {
            localStorage.removeItem(CART_STORAGE_KEY)
          }
        }
      } catch (e) {
        console.error("Failed to load cart", e)
      }
    }
  }, [])

  // Persist to LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const data: StoredCart = {
        items: cart.items,
        updatedAt: Date.now()
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data))
    }
  }, [cart.items])

  const addToCart = (productId: number, quantity: number, options?: { customPrice?: number, rfqId?: number, quoteId?: number }) => {
    const product = mockProducts.find(p => p.id === productId)
    if (!product) return

    setCart(prev => {
      const isSpecialOrder = !!options?.rfqId
      // Generate ID: for special orders, combine product+rfq. For standard, just product ID string.
      const itemId = isSpecialOrder ? `${productId}-rfq-${options?.rfqId}` : `${productId}-std`
      
      const existingItemIndex = prev.items.findIndex(item => item.id === itemId)
      let newItems = [...prev.items]

      if (existingItemIndex > -1) {
        // Update existing
        const item = newItems[existingItemIndex]
        const newQty = item.quantity + quantity
        // Ensure we don't exceed stock if it's not a special order (special orders usually negotiated separately, but strict stock check is good)
        // For simplicity, we just update.
        newItems[existingItemIndex] = {
          ...item,
          quantity: newQty,
          lineTotal: newQty * item.unitPrice
        }
      } else {
        // Add new
        const supplier = getSupplierById(product.supplierId)
        const unitPrice = options?.customPrice ?? product.price
        
        const newItem: CartItem = {
          id: itemId,
          productId,
          productName: product.name,
          image: product.images[0],
          supplierId: product.supplierId,
          quantity,
          unitPrice,
          moq: product.moq,
          stock: product.stock,
          lineTotal: quantity * unitPrice,
          rfqId: options?.rfqId,
          quoteId: options?.quoteId,
          isPriceLocked: isSpecialOrder
        }
        newItems.push(newItem)
      }

      const totals = calculateCartTotals(newItems, prev.appliedCoupon)
      return { ...prev, ...totals, items: newItems }
    })
  }

  const removeFromCart = (productId: number, rfqId?: number) => {
    setCart(prev => {
      const itemId = rfqId ? `${productId}-rfq-${rfqId}` : `${productId}-std`
      const newItems = prev.items.filter(item => item.id !== itemId)
      const totals = calculateCartTotals(newItems, prev.appliedCoupon)
      return { ...prev, ...totals, items: newItems }
    })
  }

  const updateQuantity = (productId: number, quantity: number, rfqId?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, rfqId)
      return
    }

    setCart(prev => {
      const itemId = rfqId ? `${productId}-rfq-${rfqId}` : `${productId}-std`
      const newItems = prev.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity,
            lineTotal: quantity * item.unitPrice
          }
        }
        return item
      })
      const totals = calculateCartTotals(newItems, prev.appliedCoupon)
      return { ...prev, ...totals, items: newItems }
    })
  }

  const clearCart = () => {
    setCart({
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      discount: 0,
      total: 0,
      supplierBreakdown: []
    })
  }

  const applyCoupon = async (code: string): Promise<boolean> => {
    // Mock API call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (code === 'WELCOME10') {
          const coupon: CouponCode = {
            code: 'WELCOME10',
            discountType: 'percentage',
            value: 10,
            minOrderValue: 1000,
            expiryDate: new Date(Date.now() + 86400000).toISOString()
          }
          setCart(prev => {
            const totals = calculateCartTotals(prev.items, coupon)
            return { ...prev, ...totals, appliedCoupon: coupon }
          })
          resolve(true)
        } else {
          resolve(false)
        }
      }, 500)
    })
  }

  const cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)
  const getCartTotal = () => cart.total

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        cartCount,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
