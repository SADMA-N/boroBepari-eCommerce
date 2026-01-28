import { createFileRoute, notFound } from '@tanstack/react-router'
import { useState } from 'react'
import { 
  mockProducts, 
  getSupplierById, 
  formatBDT, 
  MockProduct 
} from '../../data/mock-products'
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Minus, 
  Plus,
  AlertCircle
} from 'lucide-react'
import { useWishlist } from '../../contexts/WishlistContext'
import { useCart } from '../../contexts/CartContext'
import Toast from '../../components/Toast'

export const Route = createFileRoute('/products/$productSlug')({
  loader: ({ params }) => {
    const product = mockProducts.find((p) => p.slug === params.productSlug)
    if (!product) {
      throw notFound()
    }
    const supplier = getSupplierById(product.supplierId)
    return { product, supplier }
  },
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const { product, supplier } = Route.useLoaderData()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addToCart } = useCart()
  
  const [selectedImage, setSelectedImage] = useState(product.images[0])
  const [activeTab, setActiveTab] = useState('overview')
  const [quantity, setQuantity] = useState(product.moq)
  const [isSample, setIsSample] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const isOutOfStock = product.stock === 0
  const maxQuantity = isSample ? 5 : product.stock
  const isWishlisted = isInWishlist(product.id)
  
  // Determine price based on quantity or sample
  const currentPrice = isSample 
    ? (product.samplePrice || product.price) 
    : (product.tieredPricing?.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty))?.price || product.price)

  const handleQuantityChange = (val: number) => {
    let newQty = val
    if (newQty < (isSample ? 1 : product.moq)) newQty = isSample ? 1 : product.moq
    if (newQty > maxQuantity) newQty = maxQuantity
    setQuantity(newQty)
  }

  const handleSampleToggle = () => {
    const newIsSample = !isSample
    setIsSample(newIsSample)
    // Reset quantity when toggling
    setQuantity(newIsSample ? 1 : product.moq)
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
    setToastMessage(`Added ${quantity} ${product.unit}(s) of "${product.name}" to cart`)
    setShowToast(true)
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
       <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      {/* Breadcrumb - Basic placeholder */}
      <div className="text-sm text-gray-500 mb-6">
        Home / Products / <span className="text-gray-900">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column: Images */}
        <div className="lg:col-span-1">
          <div className="border rounded-lg overflow-hidden mb-4 bg-white">
            <img 
              src={selectedImage} 
              alt={product.name} 
              className="w-full h-96 object-contain cursor-zoom-in"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`border rounded-md overflow-hidden p-1 ${selectedImage === img ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 hover:border-gray-400'}`}
              >
                <img src={img} alt={`View ${idx + 1}`} className="w-full h-20 object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Middle Column: Product Info & Pricing */}
        <div className="lg:col-span-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} className={i < Math.floor(product.rating) ? "" : "text-gray-300"} />
              ))}
            </div>
            <span className="text-sm text-gray-500">({product.reviewCount} Reviews)</span>
            <span className="text-sm text-gray-300">|</span>
            <span className="text-sm text-gray-500">{product.soldCount} Sold</span>
          </div>

          {/* Price Section */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-blue-600">
                {formatBDT(currentPrice)}
              </span>
              <span className="text-gray-500">/ {product.unit}</span>
            </div>
            {product.originalPrice && (
              <div className="text-sm text-gray-400 line-through mt-1">
                {formatBDT(product.originalPrice)}
              </div>
            )}
            
            {isOutOfStock ? (
               <div className="mt-2 inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-sm font-medium rounded">
                 <AlertCircle size={16} className="mr-1" />
                 Out of Stock
               </div>
            ) : (
              <div className="mt-2 text-sm text-green-600 font-medium">
                In Stock ({product.stock} available)
              </div>
            )}
          </div>

          {/* Tiered Pricing Table */}
          {product.tieredPricing && product.tieredPricing.length > 0 && (
             <div className="mb-6">
               <h3 className="text-sm font-semibold text-gray-900 mb-2">Wholesale Pricing</h3>
               <div className="border rounded-md overflow-hidden text-sm">
                 <table className="w-full text-left">
                   <thead className="bg-gray-50 text-gray-500">
                     <tr>
                       <th className="px-3 py-2 font-medium">Quantity</th>
                       <th className="px-3 py-2 font-medium">Price / {product.unit}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {product.tieredPricing.map((tier, idx) => (
                       <tr key={idx} className={quantity >= tier.minQty && (tier.maxQty === null || quantity <= tier.maxQty) && !isSample ? "bg-blue-50" : ""}>
                         <td className="px-3 py-2">
                           {tier.minQty}{tier.maxQty ? ` - ${tier.maxQty}` : '+'}
                         </td>
                         <td className="px-3 py-2 font-semibold text-gray-900">
                           {formatBDT(tier.price)}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </div>
          )}

          {/* Sample Option */}
          {product.hasSample && !isOutOfStock && (
            <div className="mb-6 flex items-center justify-between border p-3 rounded-lg hover:border-blue-400 transition-colors cursor-pointer" onClick={handleSampleToggle}>
              <div>
                <span className="block font-medium text-gray-900">Order Sample</span>
                <span className="text-xs text-gray-500">Try before bulk order (Max 5 units)</span>
              </div>
              <div className={`w-10 h-6 flex items-center bg-gray-300 rounded-full p-1 duration-300 ease-in-out ${isSample ? 'bg-blue-600' : ''}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isSample ? 'translate-x-4' : ''}`}></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
               <span className="text-gray-700 font-medium">Quantity:</span>
               <div className="flex items-center border rounded-md">
                 <button 
                   onClick={() => handleQuantityChange(quantity - 1)}
                   disabled={isOutOfStock || quantity <= (isSample ? 1 : product.moq)}
                   className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                 >
                   <Minus size={16} />
                 </button>
                 <input 
                   type="number" 
                   value={quantity}
                   onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                   className="w-16 text-center border-none focus:ring-0 p-0"
                   min={isSample ? 1 : product.moq}
                   max={maxQuantity}
                   disabled={isOutOfStock}
                 />
                 <button 
                   onClick={() => handleQuantityChange(quantity + 1)}
                   disabled={isOutOfStock || quantity >= maxQuantity}
                   className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                 >
                   <Plus size={16} />
                 </button>
               </div>
               <span className="text-sm text-gray-500">
                 MOQ: {isSample ? '1' : product.moq} {product.unit}s
               </span>
            </div>

            <div className="flex space-x-3">
              <button 
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="mr-2" size={20} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              {isOutOfStock && (
                 <button className="flex-1 border border-blue-600 text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition">
                   Notify Me
                 </button>
              )}
              <button 
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 border rounded-lg transition-colors ${
                  isWishlisted 
                    ? 'bg-red-50 border-red-200 text-red-500' 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Heart size={20} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button className="p-3 border rounded-lg text-gray-500 hover:bg-gray-50">
                <Share2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Supplier Info */}
        <div className="lg:col-span-1">
          {supplier && (
            <div className="border rounded-lg p-6 bg-white sticky top-4">
              <div className="flex items-center space-x-4 mb-4">
                <img src={supplier.logo} alt={supplier.name} className="w-16 h-16 rounded-full border" />
                <div>
                  <h3 className="font-bold text-gray-900">{supplier.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">{supplier.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 mb-6">
                {supplier.verified && (
                  <div className="flex items-center text-sm text-green-700 bg-green-50 p-2 rounded">
                    <CheckCircle size={16} className="mr-2" />
                    Verified Supplier
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">{supplier.responseRate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">On-time Delivery</span>
                  <span className="font-medium">{supplier.onTimeDelivery}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Years in Business</span>
                  <span className="font-medium">{supplier.yearsInBusiness} Years</span>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full border border-blue-600 text-blue-600 py-2 rounded-lg font-medium hover:bg-blue-50 transition">
                  Contact Supplier
                </button>
                <button className="w-full text-gray-600 py-2 font-medium hover:underline text-sm">
                  Visit Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Tabs */}
      <div className="border-t pt-8">
        <div className="flex border-b mb-6">
          {['overview', 'specifications', 'reviews', 'supplier'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm capitalize border-b-2 transition-colors ${
                activeTab === tab 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'supplier' ? 'Supplier Info' : tab}
            </button>
          ))}
        </div>

        <div className="min-h-[300px]">
          {activeTab === 'overview' && (
            <div className="prose max-w-none text-gray-700">
              <p className="mb-4">{product.description}</p>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="bg-gray-50 rounded-lg p-6 max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {product.specifications?.map((spec, idx) => (
                  <div key={idx} className="flex border-b border-gray-200 pb-2">
                    <dt className="w-1/3 text-gray-500 text-sm font-medium">{spec.key}</dt>
                    <dd className="w-2/3 text-gray-900 text-sm">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {activeTab === 'reviews' && (
             <div className="text-center py-12 text-gray-500">
               <Star className="mx-auto mb-2 text-yellow-400" size={32} />
               <h3 className="text-lg font-medium text-gray-900">Reviews Coming Soon</h3>
               <p>This product hasn't received any detailed reviews yet.</p>
             </div>
          )}

          {activeTab === 'supplier' && supplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <h3 className="text-lg font-bold mb-2">{supplier.name}</h3>
                 <p className="text-gray-600 mb-4">{supplier.description}</p>
                 <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                   <div className="flex items-center">
                     <Clock size={16} className="mr-1" />
                     Member since 2020
                   </div>
                   <div className="flex items-center">
                     <Truck size={16} className="mr-1" />
                     Ships from {supplier.location}
                   </div>
                 </div>
               </div>
               <div className="bg-gray-50 p-6 rounded-lg">
                 <h4 className="font-semibold mb-3">Supplier Capabilities</h4>
                 <ul className="space-y-2 text-sm text-gray-700">
                   <li className="flex items-center"><CheckCircle size={14} className="text-green-600 mr-2" /> Custom Packaging</li>
                   <li className="flex items-center"><CheckCircle size={14} className="text-green-600 mr-2" /> OEM/ODM Service</li>
                   <li className="flex items-center"><CheckCircle size={14} className="text-green-600 mr-2" /> Quality Control</li>
                 </ul>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
