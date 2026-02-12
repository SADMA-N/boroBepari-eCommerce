import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const genderEnum = pgEnum('gender', ['male', 'female'])
export const adminRoleEnum = pgEnum('admin_role', [
  'super_admin',
  'admin',
  'moderator',
])
export const kycStatusEnum = pgEnum('kyc_status', [
  'pending',
  'submitted',
  'approved',
  'rejected',
])
export const verificationBadgeEnum = pgEnum('verification_badge', [
  'none',
  'basic',
  'verified',
  'premium',
])
export const sellerProductStatusEnum = pgEnum('seller_product_status', [
  'draft',
  'pending',
  'accepted',
  'declined',
])

export const sellerDocumentTypeEnum = pgEnum('seller_document_type', [
  'nid_front',
  'nid_back',
  'trade_license',
  'selfie',
  'bank_proof',
  'other',
])
export const sellerDocumentStatusEnum = pgEnum('seller_document_status', [
  'pending',
  'approved',
  'rejected',
])

// Categories table
export const categories = pgTable('categories', {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  icon: text(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'categoryParent',
  }),
  children: many(categories, { relationName: 'categoryParent' }),
  products: many(products),
}))

// Suppliers table
export const suppliers = pgTable('suppliers', {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  ownerId: text('owner_id').references(() => user.id), // Link supplier to a user
  logo: text(),
  verified: boolean().default(false),
  location: text(),
  responseRate: decimal('response_rate', { precision: 5, scale: 2 }),
  onTimeDelivery: decimal('on_time_delivery', { precision: 5, scale: 2 }),
  yearsInBusiness: integer('years_in_business'),
  description: text(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  owner: one(user, {
    fields: [suppliers.ownerId],
    references: [user.id],
  }),
  products: many(products),
}))

// Sellers table (for seller portal authentication)
export const sellers = pgTable('sellers', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  businessName: text('business_name').notNull(),
  businessType: text('business_type'),
  tradeLicenseNumber: text('trade_license_number'),
  businessCategory: text('business_category'),
  yearsInBusiness: integer('years_in_business'),
  fullName: text('full_name'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  postalCode: text('postal_code'),
  bankName: text('bank_name'),
  accountHolderName: text('account_holder_name'),
  accountNumber: text('account_number'),
  branchName: text('branch_name'),
  routingNumber: text('routing_number'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  kycStatus: kycStatusEnum('kyc_status').default('pending').notNull(),
  kycSubmittedAt: timestamp('kyc_submitted_at'),
  kycRejectionReason: text('kyc_rejection_reason'),
  kycDocuments: jsonb('kyc_documents')
    .$type<Record<string, string | null>>()
    .default({}),
  kycAdditionalInfo: jsonb('kyc_additional_info')
    .$type<{
      description: string
      categories: Array<string>
      inventoryRange: string
    }>()
    .default({ description: '', categories: [], inventoryRange: '' }),
  verificationBadge: verificationBadgeEnum('verification_badge')
    .default('none')
    .notNull(),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const sellersRelations = relations(sellers, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [sellers.supplierId],
    references: [suppliers.id],
  }),
  documents: many(sellerDocuments),
  sellerProducts: many(sellerProducts),
}))

export const sellerDocuments = pgTable('seller_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  sellerId: text('seller_id')
    .notNull()
    .references(() => sellers.id),
  documentType: sellerDocumentTypeEnum('document_type').notNull(),
  s3Bucket: text('s3_bucket').notNull(),
  s3Key: text('s3_key').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').notNull(),
  status: sellerDocumentStatusEnum('status').default('pending').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
}).enableRLS()

export const sellerDocumentsRelations = relations(
  sellerDocuments,
  ({ one }) => ({
    seller: one(sellers, {
      fields: [sellerDocuments.sellerId],
      references: [sellers.id],
    }),
  }),
)

export type SellerDocument = typeof sellerDocuments.$inferSelect
export type NewSellerDocument = typeof sellerDocuments.$inferInsert

export type Seller = typeof sellers.$inferSelect
export type NewSeller = typeof sellers.$inferInsert

// Products table
export const products = pgTable('products', {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  images: jsonb().$type<Array<string>>().default([]),
  price: decimal({ precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 12, scale: 2 }),
  moq: integer().notNull().default(1),
  stock: integer().default(0),
  unit: text().default('piece'),
  categoryId: integer('category_id').references(() => categories.id),
  supplierId: integer('supplier_id').references(() => suppliers.id),
  featured: boolean().default(false),
  isNew: boolean('is_new').default(false),
  rating: decimal({ precision: 3, scale: 2 }),
  reviewCount: integer('review_count').default(0),
  soldCount: integer('sold_count').default(0),
  tags: jsonb().$type<Array<string>>().default([]),
  tieredPricing: jsonb('tiered_pricing')
    .$type<Array<{ minQty: number; maxQty: number | null; price: number }>>()
    .default([]),
  specifications: jsonb()
    .$type<Array<{ key: string; value: string }>>()
    .default([]),
  hasSample: boolean('has_sample').default(false),
  samplePrice: decimal('sample_price', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
}))

// Seller Products table (seller submission workflow)
export const sellerProducts = pgTable('seller_products', {
  id: serial().primaryKey(),
  sellerId: text('seller_id')
    .notNull()
    .references(() => sellers.id),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  brand: text('brand'),
  mainCategory: text('main_category'),
  subCategory: text('sub_category'),
  description: text('description'),
  tags: jsonb('tags').$type<Array<string>>().default([]),
  images: jsonb('images').$type<Array<string>>().default([]),
  price: decimal('price', { precision: 12, scale: 2 }).notNull(),
  originalPrice: decimal('original_price', { precision: 12, scale: 2 }),
  tieredPricing: jsonb('tiered_pricing')
    .$type<Array<{ minQty: number; maxQty: number | null; price: number }>>()
    .default([]),
  moq: integer('moq').notNull().default(1),
  stock: integer('stock').default(0),
  sku: text('sku'),
  unit: text('unit').default('piece'),
  lowStockThreshold: integer('low_stock_threshold').default(10),
  specifications: jsonb('specifications')
    .$type<Array<{ key: string; value: string }>>()
    .default([]),
  weight: text('weight'),
  dimensions: jsonb('dimensions')
    .$type<{ length: string; width: string; height: string }>(),
  shipFrom: text('ship_from'),
  deliveryTime: text('delivery_time'),
  returnPolicy: text('return_policy'),
  hasSample: boolean('has_sample').default(false),
  samplePrice: decimal('sample_price', { precision: 12, scale: 2 }),
  sampleMaxQty: integer('sample_max_qty'),
  sampleDelivery: text('sample_delivery'),
  status: sellerProductStatusEnum('status').default('draft').notNull(),
  adminNotes: text('admin_notes'),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  publishedProductId: integer('published_product_id').references(() => products.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const sellerProductsRelations = relations(sellerProducts, ({ one }) => ({
  seller: one(sellers, {
    fields: [sellerProducts.sellerId],
    references: [sellers.id],
  }),
  publishedProduct: one(products, {
    fields: [sellerProducts.publishedProductId],
    references: [products.id],
  }),
}))

export type SellerProduct = typeof sellerProducts.$inferSelect
export type NewSellerProduct = typeof sellerProducts.$inferInsert

// Todos table (existing)
export const todos = pgTable('todos', {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}).enableRLS()

// Type exports
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  dateOfBirth: timestamp('date_of_birth'),
  gender: genderEnum('gender'),
  phoneNumber: text('phone_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const userRelations = relations(user, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  rfqs: many(rfqs),
}))

export const addresses = pgTable('addresses', {
  id: serial().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city'),
  postcode: text('postcode').notNull(),
  phone: text('phone').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, {
    fields: [addresses.userId],
    references: [user.id],
  }),
}))

export const orders = pgTable('orders', {
  id: serial().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').notNull().default('pending'),
  paymentStatus: text('payment_status').default('pending').notNull(),
  transactionId: text('transaction_id'),
  paymentMethod: text('payment_method'),
  paymentChannel: text('payment_channel'),
  paymentProvider: text('payment_provider'),
  paymentReference: text('payment_reference'),
  paymentSenderAccount: text('payment_sender_account'),
  paymentDeclaration: boolean('payment_declaration').default(false),

  // Escrow & Deposit Fields
  depositAmount: decimal('deposit_amount', { precision: 12, scale: 2 }).default(
    '0',
  ),
  balanceDue: decimal('balance_due', { precision: 12, scale: 2 }).default('0'),
  depositPaidAt: timestamp('deposit_paid_at'),
  fullPaymentPaidAt: timestamp('full_payment_paid_at'),
  escrowReleasedAt: timestamp('escrow_released_at'),
  escrowReleaseDeadline: timestamp('escrow_release_deadline'),
  disputeStatus: text('dispute_status'), // 'open', 'resolved', 'closed'

  notes: text('notes'),
  invoiceUrl: text('invoice_url'),
  invoiceGeneratedAt: timestamp('invoice_generated_at'),
  cancellationReason: text('cancellation_reason'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const orderItems = pgTable('order_items', {
  id: serial().primaryKey(),

  productId: integer('product_id')
    .notNull()

    .references(() => products.id),

  supplierId: integer('supplier_id').references(() => suppliers.id),

  rfqId: integer('rfq_id').references(() => rfqs.id),
  quoteId: integer('quote_id').references(() => quotes.id),

  quantity: integer('quantity').notNull(),

  price: decimal('price', { precision: 12, scale: 2 }).notNull(),

  orderId: integer('order_id')
    .notNull()

    .references(() => orders.id),
}).enableRLS()

export const stockAlerts = pgTable('stock_alerts', {
  id: serial().primaryKey(),
  userId: text('user_id').references(() => user.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  email: text('email').notNull(),
  phone: text('phone'),
  source: text('source').default('manual'),
  isActive: boolean('is_active').default(true),
  notifiedAt: timestamp('notified_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const stockAlertsRelations = relations(stockAlerts, ({ one }) => ({
  user: one(user, {
    fields: [stockAlerts.userId],
    references: [user.id],
  }),
  product: one(products, {
    fields: [stockAlerts.productId],
    references: [products.id],
  }),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(user, {
    fields: [orders.userId],

    references: [user.id],
  }),

  items: many(orderItems),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],

    references: [orders.id],
  }),

  product: one(products, {
    fields: [orderItems.productId],

    references: [products.id],
  }),
}))

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
}).enableRLS()

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}).enableRLS()

export const loginEvents = pgTable('login_events', {
  id: serial().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export const loginEventsRelations = relations(loginEvents, ({ one }) => ({
  user: one(user, {
    fields: [loginEvents.userId],
    references: [user.id],
  }),
}))

export const passwordResetOtps = pgTable('password_reset_otps', {
  id: serial().primaryKey(),
  email: text('email').notNull(),
  code: text('code').notNull(),
  token: text('token').notNull(),
  used: boolean('used').default(false).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}).enableRLS()

export type LoginEvent = typeof loginEvents.$inferSelect
export type NewLoginEvent = typeof loginEvents.$inferInsert
export type Address = typeof addresses.$inferSelect
export type NewAddress = typeof addresses.$inferInsert
export type Order = typeof orders.$inferSelect
export type NewOrder = typeof orders.$inferInsert
export type OrderItem = typeof orderItems.$inferSelect
export type NewOrderItem = typeof orderItems.$inferInsert

// Enums for RFQ and Quote
export const rfqStatusEnum = pgEnum('rfq_status', [
  'pending',
  'quoted',
  'accepted',
  'rejected',
  'expired',
  'converted',
])

export const quoteStatusEnum = pgEnum('quote_status', [
  'pending',
  'accepted',
  'rejected',
  'countered',
])

// RFQ Table
export const rfqs = pgTable('rfqs', {
  id: serial('id').primaryKey(),
  buyerId: text('buyer_id')
    .notNull()
    .references(() => user.id),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id),
  quantity: integer('quantity').notNull(),
  targetPrice: decimal('target_price', { precision: 12, scale: 2 }),
  deliveryLocation: text('delivery_location').notNull(),
  notes: text('notes'),
  attachments: jsonb('attachments').$type<Array<string>>().default([]),
  status: rfqStatusEnum('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const rfqsRelations = relations(rfqs, ({ one, many }) => ({
  buyer: one(user, {
    fields: [rfqs.buyerId],
    references: [user.id],
  }),
  supplier: one(suppliers, {
    fields: [rfqs.supplierId],
    references: [suppliers.id],
  }),
  product: one(products, {
    fields: [rfqs.productId],
    references: [products.id],
  }),
  quotes: many(quotes),
}))

// Quotes Table
export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  rfqId: integer('rfq_id')
    .notNull()
    .references(() => rfqs.id),
  supplierId: integer('supplier_id')
    .notNull()
    .references(() => suppliers.id),
  unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 12, scale: 2 }).notNull(),
  validityPeriod: timestamp('validity_period').notNull(),
  terms: text('terms'),
  status: quoteStatusEnum('status').default('pending').notNull(),
  agreedQuantity: integer('agreed_quantity'),
  depositPercentage: integer('deposit_percentage').default(0),
  deliveryTime: text('delivery_time'),
  counterPrice: decimal('counter_price', { precision: 12, scale: 2 }),
  counterNote: text('counter_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export const quotesRelations = relations(quotes, ({ one }) => ({
  rfq: one(rfqs, {
    fields: [quotes.rfqId],
    references: [rfqs.id],
  }),
  supplier: one(suppliers, {
    fields: [quotes.supplierId],
    references: [suppliers.id],
  }),
}))

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(), // rfq_received, quote_received, etc.
  link: text('link'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
}).enableRLS()

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}))

export type Rfq = typeof rfqs.$inferSelect
export type NewRfq = typeof rfqs.$inferInsert
export type Quote = typeof quotes.$inferSelect
export type NewQuote = typeof quotes.$inferInsert
export type Notification = typeof notifications.$inferSelect
export type NewNotification = typeof notifications.$inferInsert

// Admin table for admin portal
export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: adminRoleEnum('role').default('admin').notNull(),
  avatar: text('avatar'),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}).enableRLS()

export type Admin = typeof admins.$inferSelect
export type NewAdmin = typeof admins.$inferInsert
