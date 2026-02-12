import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AddProductPage } from '@/components/seller/AddProductPage'
import { getSellerProductById } from '@/lib/seller-product-server'

export const Route = createFileRoute('/seller/products/$productId/edit')({
  component: EditProductRoute,
})

function EditProductRoute() {
  const { productId } = Route.useParams()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('seller_token')
    if (!token) {
        setError("Unauthorized: Please log in.")
        setLoading(false)
        return
    }

    getSellerProductById({
        data: { id: Number(productId) },
        headers: { Authorization: `Bearer ${token}` }
    })
    .then((data) => {
        setProduct(data)
        setLoading(false)
    })
    .catch((err) => {
        console.error(err)
        setError(err.message || "Failed to load product. It may not exist or you don't have permission.")
        setLoading(false)
    })
  }, [productId])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-500 font-medium">{error}</p>
        <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-muted hover:bg-muted rounded-lg text-foreground transition-colors"
        >
            Go Back
        </button>
      </div>
    )
  }

  return <AddProductPage initialData={product} />
}
