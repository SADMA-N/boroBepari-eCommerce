import { createServerFn } from '@tanstack/react-start'
import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { products } from '@/db/schema'

export const validateCartServer = createServerFn({ method: 'POST' })
  .inputValidator(
    (
      items: Array<{
        productId: number
        quantity: number
        unitPrice: number
        id: string
      }>,
    ) => items,
  )
  .handler(async ({ data: items }) => {
    if (items.length === 0) return { valid: true, changes: [], errors: [] }

    const productIds = items.map((i) => i.productId)
    const dbProducts = await db
      .select()
      .from(products)
      .where(inArray(products.id, productIds))

    const changes: Array<{
      itemId: string
      type: 'price' | 'stock' | 'removed'
      message: string
      newPrice?: number
      newStock?: number
    }> = []
    const errors: Array<string> = []

    items.forEach((item) => {
      const product = dbProducts.find((p) => p.id === item.productId)

      if (!product) {
        changes.push({
          itemId: item.id,
          type: 'removed',
          message: 'Product no longer available',
        })
        return
      }

      // Check Stock
      if (product.stock < item.quantity) {
        changes.push({
          itemId: item.id,
          type: 'stock',
          message: `Stock reduced. Only ${product.stock} available.`,
          newStock: product.stock,
        })
      }

      // Check Price (Note: RFQ custom prices might be handled differently, this checks standard catalog price)
      // Assuming non-RFQ items check against catalog price.
      // If item is from RFQ/Quote, we might skip this or check quote validity.
      // For now, we'll assume strict price check for simplicity unless it's flagged as locked.
      const currentPrice = Number(product.price)
      if (Math.abs(currentPrice - item.unitPrice) > 0.01) {
        // Logic: If price increased, warn. If decreased, auto-update?
        // For now, warn on mismatch.
        changes.push({
          itemId: item.id,
          type: 'price',
          message: `Price changed from ${item.unitPrice} to ${currentPrice}`,
          newPrice: currentPrice,
        })
      }
    })

    return {
      valid: changes.length === 0,
      changes,
      errors,
    }
  })
