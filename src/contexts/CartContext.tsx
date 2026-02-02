import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockProducts } from '../data/mock-products'

interface CartItem {
  productId: number
  quantity: number
  customPrice?: number
  rfqId?: number
  quoteId?: number
}

interface CartContextType {
  cartItems: Array<CartItem>
  addToCart: (productId: number, quantity: number, options?: { customPrice?: number, rfqId?: number, quoteId?: number }) => void
  removeFromCart: (productId: number, rfqId?: number) => void
  updateQuantity: (productId: number, quantity: number, rfqId?: number) => void
  cartCount: number
  getCartTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<Array<CartItem>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (productId: number, quantity: number, options?: { customPrice?: number, rfqId?: number, quoteId?: number }) => {
    setCartItems((prev) => {
      // If it's a special RFQ item, we might want to treat it as a separate line item even if product ID matches?
      // For simplicity, if options.rfqId is present, we treat it as unique or update existing RFQ item.
      // Let's treat RFQ items as unique based on rfqId if present.
      
      const existingIndex = prev.findIndex((item) => 
        item.productId === productId && item.rfqId === options?.rfqId
      )

      if (existingIndex > -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + quantity } // Merge quantity
            : item,
        )
      }
      return [...prev, { productId, quantity, ...options }]
    })
  }

  const removeFromCart = (productId: number, rfqId?: number) => {
    setCartItems((prev) => prev.filter((item) => !(item.productId === productId && item.rfqId === rfqId)))
  }

  const updateQuantity = (productId: number, quantity: number, rfqId?: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, rfqId)
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        (item.productId === productId && item.rfqId === rfqId) ? { ...item, quantity } : item,
      ),
    )
  }

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = mockProducts.find((p) => p.id === item.productId)
      const price = item.customPrice ?? (product ? product.price : 0)
      return total + (price * item.quantity)
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
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
