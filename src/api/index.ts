import { Hono } from 'hono'
import { Scalar } from '@scalar/hono-api-reference'
import { openAPIRouteHandler } from 'hono-openapi'
import { auth } from '@/lib/auth'

// Auth routes
import authBuyerRoutes from './routes/auth/buyer'
import authSellerRoutes from './routes/auth/seller'
import authAdminRoutes from './routes/auth/admin'

// Product routes
import publicProductRoutes from './routes/products/public'
import sellerProductRoutes from './routes/products/seller'
import adminProductRoutes from './routes/products/admin'

// Order routes
import buyerOrderRoutes from './routes/orders/buyer'
import sellerOrderRoutes from './routes/orders/seller'
import adminOrderRoutes from './routes/orders/admin'

// RFQ routes
import buyerRfqRoutes from './routes/rfq/buyer'
import sellerRfqRoutes from './routes/rfq/seller'
import supplierRfqRoutes from './routes/rfq/supplier'
import legacyRfqRoutes from './routes/rfq/legacy'

// Analytics routes
import sellerAnalyticsRoutes from './routes/analytics/seller'
import adminAnalyticsRoutes from './routes/analytics/admin'

// KYC routes
import sellerKycRoutes from './routes/kyc/seller'
import adminKycRoutes from './routes/kyc/admin'

// Misc routes
import addressRoutes from './routes/addresses'
import cartRoutes from './routes/cart'
import stockAlertRoutes from './routes/stock-alerts'
import adminSupplierRoutes from './routes/admin-suppliers'
import publicSupplierRoutes from './routes/suppliers/public'

const app = new Hono().basePath('/api')

// Mount all route modules (each has its own basePath)
app.route('/', authBuyerRoutes)
app.route('/', authSellerRoutes)
app.route('/', authAdminRoutes)

app.route('/', publicProductRoutes)
app.route('/', sellerProductRoutes)
app.route('/', adminProductRoutes)

app.route('/', buyerOrderRoutes)
app.route('/', sellerOrderRoutes)
app.route('/', adminOrderRoutes)

app.route('/', buyerRfqRoutes)
app.route('/', sellerRfqRoutes)
app.route('/', supplierRfqRoutes)
app.route('/', legacyRfqRoutes)

app.route('/', sellerAnalyticsRoutes)
app.route('/', adminAnalyticsRoutes)

app.route('/', sellerKycRoutes)
app.route('/', adminKycRoutes)

app.route('/', addressRoutes)
app.route('/', cartRoutes)
app.route('/', stockAlertRoutes)
app.route('/', adminSupplierRoutes)
app.route('/', publicSupplierRoutes)

// Better Auth passthrough
app.on(['GET', 'POST'], '/auth/*', (c) => auth.handler(c.req.raw))

// OpenAPI spec endpoint - MUST be after all routes
app.get(
  '/openapi',
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: 'Borobepari E-commerce API',
        version: '1.0.0',
        description: 'API documentation for the Borobepari e-commerce platform',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Local Development' },
      ],
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Products', description: 'Product endpoints' },
        { name: 'Orders', description: 'Order management endpoints' },
        { name: 'RFQ', description: 'Request for quote endpoints' },
        { name: 'Analytics', description: 'Analytics endpoints' },
        { name: 'KYC', description: 'Know Your Customer endpoints' },
        { name: 'Addresses', description: 'Address management endpoints' },
        { name: 'Cart', description: 'Cart validation endpoints' },
        { name: 'Stock Alerts', description: 'Stock alert endpoints' },
        { name: 'Suppliers', description: 'Supplier management endpoints' },
      ],
    },
  }),
)

// Scalar documentation UI
app.get(
  '/docs',
  Scalar({
    url: '/api/openapi',
    theme: 'purple',
    pageTitle: 'Borobepari API Documentation',
  }),
)

export default app
