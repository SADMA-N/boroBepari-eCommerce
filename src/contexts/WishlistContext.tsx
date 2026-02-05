import React, { createContext, useContext, useEffect, useState } from 'react'
import { mockProducts } from '../data/mock-products'
import { useAuth } from './AuthContext'
import type { MockProduct } from '../data/mock-products'

interface WishlistContextType {
  wishlistIds: Array<number>
  addToWishlist: (productId: number) => void
  removeFromWishlist: (productId: number) => void
  toggleWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  wishlistItems: Array<MockProduct>
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [wishlistIds, setWishlistIds] = useState<Array<number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wishlist')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistIds))
  }, [wishlistIds])

  const addToWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      if (!prev.includes(productId)) {
        return [...prev, productId]
      }
      return prev
    })
    const product = mockProducts.find((p) => p.id === productId)
    if (product && product.stock === 0 && user?.email) {
      fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          email: user.email,
          userId: user.id,
          source: 'wishlist',
        }),
      }).catch((error) =>
        console.error('Failed to create wishlist stock alert', error),
      )
    }
  }

  const removeFromWishlist = (productId: number) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId))
  }

  const toggleWishlist = (productId: number) => {
    const wasInWishlist = wishlistIds.includes(productId)
    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
    if (!wasInWishlist) {
      const product = mockProducts.find((p) => p.id === productId)
      if (product && product.stock === 0 && user?.email) {
        fetch('/api/stock-alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            email: user.email,
            userId: user.id,
            source: 'wishlist',
          }),
        }).catch((error) =>
          console.error('Failed to create wishlist stock alert', error),
        )
      }
    }
  }

  const isInWishlist = (productId: number) => {
    return wishlistIds.includes(productId)
  }

  const wishlistItems = wishlistIds
    .map((id) => mockProducts.find((p) => p.id === id))
    .filter((p): p is MockProduct => p !== undefined)

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
