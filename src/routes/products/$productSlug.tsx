import { createFileRoute, notFound } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Heart,
  MessageSquareText,
  Minus,
  Plus,
  Share2,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react'
import {
  MockProduct,
  formatBDT,
  getSupplierById,
  mockProducts,
} from '../../data/mock-products'
import { useWishlist } from '../../contexts/WishlistContext'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import Toast from '../../components/Toast'
import RFQFormModal from '../../components/RFQFormModal'
import AuthModal from '../../components/AuthModal'
import { useNotifications } from '@/contexts/NotificationContext'

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
  const { addItem } = useCart()
  const { isAuthenticated, user } = useAuth()
  const { addNotification } = useNotifications()

  const [selectedImage, setSelectedImage] = useState(product.images[0])
  const [activeTab, setActiveTab] = useState('overview')
  const [quantity, setQuantity] = useState(product.moq)
  const [isSample, setIsSample] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  // Modal States
  const [isRfqOpen, setIsRfqOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isStockAlertOpen, setIsStockAlertOpen] = useState(false)
  const [alertEmail, setAlertEmail] = useState('')
  const [alertPhone, setAlertPhone] = useState('')
  const [isSubmittingAlert, setIsSubmittingAlert] = useState(false)

  useEffect(() => {
    if (user?.email) {
      setAlertEmail(user.email)
    }
  }, [user?.email])

  const isOutOfStock = product.stock === 0
  const maxQuantity = isSample ? 5 : product.stock
  const isWishlisted = isInWishlist(product.id)

  // Determine price based on quantity or sample
  const currentPrice = isSample
    ? product.samplePrice || product.price
    : (product.tieredPricing.find(
        (t) =>
          quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty),
      )?.price ?? product.price)

  const handleQuantityChange = (val: number) => {
    let newQty = val
    if (newQty < (isSample ? 1 : product.moq))
      newQty = isSample ? 1 : product.moq
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
    const result = addItem({ productId: product.id, quantity })
    if (result.success) {
      setToastMessage(
        `Added ${quantity} ${product.unit}(s) of "${product.name}" to cart`,
      )
    } else {
      setToastMessage(result.error || 'Failed to add to cart')
    }
    setShowToast(true)
  }

  const handleRequestQuote = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsRfqOpen(true)
  }

  const handleOpenStockAlert = () => {
    setIsStockAlertOpen(true)
  }

  const handleSubmitStockAlert = async () => {
    if (!alertEmail) {
      setToastMessage('Please provide an email for stock alerts.')
      setShowToast(true)
      return
    }
    setIsSubmittingAlert(true)
    try {
      const response = await fetch('/api/stock-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          email: alertEmail,
          phone: alertPhone,
          userId: user?.id ?? null,
          source: 'manual',
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setToastMessage(data?.error ?? 'Unable to subscribe for alerts.')
      } else if (data?.alreadySubscribed) {
        setToastMessage('You are already subscribed for this stock alert.')
      } else {
        setToastMessage(
          'We will notify you as soon as this product is back in stock.',
        )
        addNotification({
          id: `stock-alert-${product.id}-${Date.now()}`,
          title: `${product.name} stock alert`,
          message: 'You will be notified when this product is back in stock.',
          type: 'info',
          link: `/products/${product.slug}`,
          category: 'system',
        })
      }
      setShowToast(true)
      setIsStockAlertOpen(false)
      setAlertPhone('')
    } catch (error) {
      console.error('Failed to create stock alert:', error)
      setToastMessage('Failed to create stock alert. Please try again.')
      setShowToast(true)
    } finally {
      setIsSubmittingAlert(false)
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 transition-colors">
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />

      <RFQFormModal
        isOpen={isRfqOpen}
        onClose={() => setIsRfqOpen(false)}
        productId={product.id}
        productName={product.name}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Breadcrumb - Basic placeholder */}
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 transition-colors">
        Home / Products /{' '}
        <span className="text-gray-900 dark:text-gray-100 font-medium">
          {product.name}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column: Images */}
        <div className="lg:col-span-1">
          <div className="border dark:border-slate-800 rounded-lg overflow-hidden mb-4 bg-white dark:bg-slate-900 transition-colors">
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
                className={`border rounded-md overflow-hidden p-1 transition-all ${selectedImage === img ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-200 dark:border-slate-800 hover:border-gray-400 dark:hover:border-slate-600'}`}
              >
                <img
                  src={img}
                  alt={`View ${idx + 1}`}
                  className="w-full h-20 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Middle Column: Product Info & Pricing */}
        <div className="lg:col-span-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors">
            {product.name}
          </h1>

          <div className="flex items-center space-x-2 mb-4 transition-colors">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={
                    i < Math.floor(product.rating) ? 'currentColor' : 'none'
                  }
                  className={
                    i < Math.floor(product.rating)
                      ? ''
                      : 'text-gray-300 dark:text-gray-700'
                  }
                />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              ({product.reviewCount} Reviews)
            </span>
            <span className="text-sm text-gray-300 dark:text-gray-700">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {product.soldCount} Sold
            </span>
          </div>

          {/* Price Section */}
          <div className="mb-6 bg-gray-50 dark:bg-slate-900/50 border dark:border-slate-800 p-4 rounded-lg transition-colors">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                {formatBDT(currentPrice)}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                / {product.unit}
              </span>
            </div>
            {product.originalPrice && (
              <div className="text-sm text-gray-400 dark:text-gray-500 line-through mt-1">
                {formatBDT(product.originalPrice)}
              </div>
            )}

            {isOutOfStock ? (
              <div className="mt-2 inline-flex items-center px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded transition-colors">
                <AlertCircle size={16} className="mr-1" />
                Out of Stock
              </div>
            ) : (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400 font-medium transition-colors">
                In Stock ({product.stock} available)
              </div>
            )}
          </div>

          {/* Tiered Pricing Table */}
          {product.tieredPricing.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                Wholesale Pricing
              </h3>
              <div className="border dark:border-slate-800 rounded-md overflow-hidden text-sm transition-colors">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors">
                    <tr>
                      <th className="px-3 py-2 font-medium">Quantity</th>
                      <th className="px-3 py-2 font-medium">
                        Price / {product.unit}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800 transition-colors">
                    {product.tieredPricing.map((tier, idx) => (
                      <tr
                        key={idx}
                        className={
                          quantity >= tier.minQty &&
                          (tier.maxQty === null || quantity <= tier.maxQty) &&
                          !isSample
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : 'dark:bg-slate-900'
                        }
                      >
                        <td className="px-3 py-2 dark:text-gray-300">
                          {tier.minQty}
                          {tier.maxQty ? ` - ${tier.maxQty}` : '+'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-900 dark:text-white">
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
            <div
              className="mb-6 flex items-center justify-between border dark:border-slate-800 p-3 rounded-lg hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer dark:bg-slate-900"
              onClick={handleSampleToggle}
            >
              <div>
                <span className="block font-medium text-gray-900 dark:text-gray-100">
                  Order Sample
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Try before bulk order (Max 5 units)
                </span>
              </div>
              <div
                className={`w-10 h-6 flex items-center bg-gray-300 dark:bg-slate-700 rounded-full p-1 duration-300 ease-in-out ${isSample ? 'bg-blue-600 dark:bg-blue-500' : ''}`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isSample ? 'translate-x-4' : ''}`}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 dark:text-gray-300 font-medium transition-colors">
                Quantity:
              </span>
              <div className="flex items-center border dark:border-slate-800 rounded-md transition-colors">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={
                    isOutOfStock || quantity <= (isSample ? 1 : product.moq)
                  }
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    handleQuantityChange(parseInt(e.target.value) || 0)
                  }
                  className="w-16 text-center border-none focus:ring-0 p-0 bg-transparent dark:text-white"
                  min={isSample ? 1 : product.moq}
                  max={maxQuantity}
                  disabled={isOutOfStock}
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={isOutOfStock || quantity >= maxQuantity}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                MOQ: {isSample ? '1' : product.moq} {product.unit}s
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                disabled={isOutOfStock}
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-600/20"
              >
                <ShoppingCart className="mr-2" size={20} />
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>

              <button
                onClick={handleRequestQuote}
                className="flex-none px-4 py-3 border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center"
                title="Request a Quote"
              >
                <MessageSquareText size={20} className="mr-2" />
                Request Quote
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3 border dark:border-slate-800 rounded-lg transition-all ${
                  isWishlisted
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/40 text-red-500'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            {isOutOfStock && (
              <button
                onClick={handleOpenStockAlert}
                className="w-full border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
              >
                Notify Me When Available
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Supplier Info */}
        <div className="lg:col-span-1">
          {supplier && (
            <div className="border dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900 sticky top-4 transition-colors">
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={supplier.logo}
                  alt={supplier.name}
                  className="w-16 h-16 rounded-full border dark:border-slate-800"
                />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white transition-colors">
                    {supplier.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    <span className="mr-2">{supplier.location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 transition-colors">
                {supplier.verified && (
                  <div className="flex items-center text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded transition-colors">
                    <CheckCircle size={16} className="mr-2" />
                    Verified Supplier
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Response Rate
                  </span>
                  <span className="font-medium dark:text-gray-200">
                    {supplier.responseRate}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    On-time Delivery
                  </span>
                  <span className="font-medium dark:text-gray-200">
                    {supplier.onTimeDelivery}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Years in Business
                  </span>
                  <span className="font-medium dark:text-gray-200">
                    {supplier.yearsInBusiness} Years
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 py-2 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                  Contact Supplier
                </button>
                <button
                  onClick={handleRequestQuote}
                  className="w-full border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                >
                  Send Inquiry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Tabs */}
      <div className="border-t dark:border-slate-800 pt-8 transition-colors">
        <div className="flex border-b dark:border-slate-800 mb-6 transition-colors">
          {['overview', 'specifications', 'reviews', 'supplier'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm capitalize border-b-2 transition-all ${
                activeTab === tab
                  ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'supplier' ? 'Supplier Info' : tab}
            </button>
          ))}
        </div>

        <div className="min-h-[300px] transition-colors">
          {activeTab === 'overview' && (
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 transition-colors">
              <p className="mb-4">{product.description}</p>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
                enim ad minim veniam, quis nostrud exercitation ullamco laboris
                nisi ut aliquip ex ea commodo consequat.
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="bg-gray-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-6 max-w-2xl transition-colors">
              <h3 className="text-lg font-semibold mb-4 dark:text-white">
                Product Specifications
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                {product.specifications.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex border-b border-gray-200 dark:border-slate-800 pb-2 transition-colors"
                  >
                    <dt className="w-1/3 text-gray-500 dark:text-gray-400 text-sm font-medium">
                      {spec.key}
                    </dt>
                    <dd className="w-2/3 text-gray-900 dark:text-gray-200 text-sm">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 transition-colors">
              <Star className="mx-auto mb-2 text-yellow-400" size={32} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Reviews Coming Soon
              </h3>
              <p>This product hasn't received any detailed reviews yet.</p>
            </div>
          )}

          {activeTab === 'supplier' && supplier && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 transition-colors">
              <div>
                <h3 className="text-lg font-bold mb-2 dark:text-white">
                  {supplier.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {supplier.description}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
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
              <div className="bg-gray-50 dark:bg-slate-900 border dark:border-slate-800 p-6 rounded-lg transition-colors">
                <h4 className="font-semibold mb-3 dark:text-white">
                  Supplier Capabilities
                </h4>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-green-600 mr-2" />{' '}
                    Custom Packaging
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-green-600 mr-2" />{' '}
                    OEM/ODM Service
                  </li>
                  <li className="flex items-center">
                    <CheckCircle size={14} className="text-green-600 mr-2" />{' '}
                    Quality Control
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {isStockAlertOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="stock-alert-title"
        >
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200 transition-colors">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 transition-colors">
              <div>
                <h2
                  id="stock-alert-title"
                  className="text-lg font-bold text-gray-900 dark:text-white transition-colors"
                >
                  Notify Me When Available
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                  We will alert you when this product is back in stock.
                </p>
              </div>
              <button
                onClick={() => setIsStockAlertOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                  Email
                </label>
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:text-white transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={alertPhone}
                  onChange={(e) => setAlertPhone(e.target.value)}
                  className="mt-1 w-full border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-slate-800 dark:text-white transition-all"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsStockAlertOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitStockAlert}
                  disabled={isSubmittingAlert}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:opacity-60 transition-all shadow-md shadow-blue-600/20"
                >
                  {isSubmittingAlert ? 'Saving...' : 'Notify Me'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
