/**
 * Cart Context for BoroBepari B2B Marketplace
 *
 * Provides global cart state management with:
 * - Add, remove, update quantity actions
 * - Coupon code application
 * - localStorage persistence with 7-day expiry
 * - Guest cart merge with user cart on login
 * - Automatic cart total calculations
 * - Multi-supplier cart support
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getProductById } from '../data/mock-products'
import type {
  Cart,
  CartItem,
  CouponCode,
  AddToCartRequest,
  CartValidation,
} from '@/types/cart'
import {
  calculateCartTotals,
  validateCart,
  validateMoq,
  validateStock,
  saveCartToStorage,
  loadCartFromStorage,
  clearCartFromStorage,
  generateCartItemId,
  validateCoupon,
} from '@/lib/cart-utils'

// ============================================================================
// Types
// ============================================================================

interface CartContextType {
  /** Current cart state */
  cart: Cart
  /** Add an item to the cart */
  addItem: (request: AddToCartRequest) => { success: boolean; error?: string }
  /** Remove an item from the cart by its ID */
  removeItem: (itemId: string) => void
  /** Update the quantity of a cart item */
  updateQuantity: (itemId: string, quantity: number) => { success: boolean; error?: string }
  /** Clear all items from the cart */
  clearCart: () => void
  /** Apply a coupon code to the cart */
  applyCoupon: (coupon: CouponCode) => { success: boolean; error?: string }
  /** Remove the applied coupon */
  removeCoupon: () => void
  /** Validate the entire cart */
  validateCartItems: () => CartValidation
  /** Total number of items in cart */
  cartCount: number
  /** Whether cart is loading from storage */
  isLoading: boolean
}

// ============================================================================
// Context
// ============================================================================

const CartContext = createContext<CartContextType | undefined>(undefined)

// ============================================================================
// Initial State
// ============================================================================

const initialCart: Cart = {
  items: [],
  subtotal: 0,
  deliveryFee: 0,
  discount: 0,
  total: 0,
  supplierBreakdown: [],
  appliedCoupon: undefined,
}

// ============================================================================
// Provider
// ============================================================================

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(initialCart)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()

  // --------------------------------------------------------------------------
  // Load cart from localStorage on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    const stored = loadCartFromStorage()
    if (stored && stored.items.length > 0) {
      // Recalculate totals from stored items
      const totals = calculateCartTotals(stored.items)
      setCart({
        ...totals,
        items: stored.items,
        appliedCoupon: undefined, // TODO: Reload coupon if stored
      })
    }
    setIsLoading(false)
  }, [])

  // --------------------------------------------------------------------------
  // Merge guest cart with user cart on login
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (user && !isLoading) {
      const stored = loadCartFromStorage()
      // If stored cart was for a guest (no userId) and user just logged in
      if (stored && !stored.userId) {
        // TODO: Fetch user's server-side cart and merge
        // For now, we just associate the guest cart with the user
        saveCartToStorage(cart, user.id)
      }
    }
  }, [user, isLoading, cart])

  // --------------------------------------------------------------------------
  // Persist cart to localStorage whenever it changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(cart, user?.id)
    }
  }, [cart, user?.id, isLoading])

  // --------------------------------------------------------------------------
  // Add item to cart
  // --------------------------------------------------------------------------
  const addItem = useCallback(
    (request: AddToCartRequest): { success: boolean; error?: string } => {
      const product = getProductById(request.productId)
      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      const itemId = generateCartItemId(request.productId, request.rfqId)
      const unitPrice = request.customPrice ?? product.price
      const supplierId = product.supplierId

      // Create the new cart item
      const newItem: CartItem = {
        id: itemId,
        productId: request.productId,
        productName: product.name,
        image: product.images[0] || '',
        supplierId,
        quantity: request.quantity,
        unitPrice,
        moq: product.moq,
        stock: product.stock,
        lineTotal: request.quantity * unitPrice,
        rfqId: request.rfqId,
        quoteId: request.quoteId,
        isPriceLocked: !!request.rfqId,
      }

      // Validate stock
      const stockResult = validateStock(newItem)
      if (!stockResult.valid) {
        return { success: false, error: stockResult.message }
      }

      setCart((prev) => {
        // Check if item already exists
        const existingIndex = prev.items.findIndex((item) => item.id === itemId)

        let updatedItems: CartItem[]
        if (existingIndex > -1) {
          // Update existing item quantity
          updatedItems = prev.items.map((item, index) => {
            if (index === existingIndex) {
              const newQuantity = item.quantity + request.quantity
              // Check stock for combined quantity
              if (newQuantity > item.stock) {
                return item // Don't update if exceeds stock
              }
              return {
                ...item,
                quantity: newQuantity,
                lineTotal: newQuantity * item.unitPrice,
              }
            }
            return item
          })
        } else {
          // Add new item
          updatedItems = [...prev.items, newItem]
        }

        // Recalculate totals
        const totals = calculateCartTotals(updatedItems, prev.appliedCoupon)
        return {
          ...prev,
          ...totals,
          items: updatedItems,
        }
      })

      return { success: true }
    },
    []
  )

  // --------------------------------------------------------------------------
  // Remove item from cart
  // --------------------------------------------------------------------------
  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const updatedItems = prev.items.filter((item) => item.id !== itemId)
      const totals = calculateCartTotals(updatedItems, prev.appliedCoupon)
      return {
        ...prev,
        ...totals,
        items: updatedItems,
      }
    })
  }, [])

  // --------------------------------------------------------------------------
  // Update item quantity
  // --------------------------------------------------------------------------
  const updateQuantity = useCallback(
    (itemId: string, quantity: number): { success: boolean; error?: string } => {
      if (quantity <= 0) {
        removeItem(itemId)
        return { success: true }
      }

      const item = cart.items.find((i) => i.id === itemId)
      if (!item) {
        return { success: false, error: 'Item not found in cart' }
      }

      // Validate stock
      if (quantity > item.stock) {
        return {
          success: false,
          error: `Only ${item.stock} units available in stock`,
        }
      }

      setCart((prev) => {
        const updatedItems = prev.items.map((i) => {
          if (i.id === itemId) {
            return {
              ...i,
              quantity,
              lineTotal: quantity * i.unitPrice,
            }
          }
          return i
        })

        const totals = calculateCartTotals(updatedItems, prev.appliedCoupon)
        return {
          ...prev,
          ...totals,
          items: updatedItems,
        }
      })

      return { success: true }
    },
    [cart.items, removeItem]
  )

  // --------------------------------------------------------------------------
  // Clear cart
  // --------------------------------------------------------------------------
  const clearCart = useCallback(() => {
    setCart(initialCart)
    clearCartFromStorage()
  }, [])

  // --------------------------------------------------------------------------
  // Apply coupon
  // --------------------------------------------------------------------------
  const applyCoupon = useCallback(
    (coupon: CouponCode): { success: boolean; error?: string } => {
      // Validate the coupon
      const validation = validateCoupon(coupon, cart.subtotal, cart.items)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      setCart((prev) => {
        const totals = calculateCartTotals(prev.items, coupon)
        return {
          ...prev,
          ...totals,
          appliedCoupon: coupon,
        }
      })

      return { success: true }
    },
    [cart.subtotal, cart.items]
  )

  // --------------------------------------------------------------------------
  // Remove coupon
  // --------------------------------------------------------------------------
  const removeCoupon = useCallback(() => {
    setCart((prev) => {
      const totals = calculateCartTotals(prev.items, undefined)
      return {
        ...prev,
        ...totals,
        appliedCoupon: undefined,
      }
    })
  }, [])

  // --------------------------------------------------------------------------
  // Validate cart
  // --------------------------------------------------------------------------
  const validateCartItems = useCallback((): CartValidation => {
    return validateCart(cart)
  }, [cart])

  // --------------------------------------------------------------------------
  // Cart count
  // --------------------------------------------------------------------------
  const cartCount = cart.items.reduce((acc, item) => acc + item.quantity, 0)

  // --------------------------------------------------------------------------
  // Provider value
  // --------------------------------------------------------------------------
  const value: CartContextType = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    validateCartItems,
    cartCount,
    isLoading,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access cart context.
 * Must be used within a CartProvider.
 *
 * @example
 * const { cart, addItem, removeItem } = useCart();
 *
 * // Add item to cart
 * const result = addItem({ productId: 1, quantity: 10 });
 * if (!result.success) {
 *   showError(result.error);
 * }
 *
 * // Remove item
 * removeItem('1-std');
 *
 * // Apply coupon
 * const couponResult = applyCoupon(myCoupon);
 */
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
