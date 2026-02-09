import { pgTable, unique, text, boolean, timestamp, foreignKey, serial, integer, numeric, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const adminRole = pgEnum("admin_role", ['super_admin', 'admin', 'moderator'])
export const gender = pgEnum("gender", ['male', 'female'])
export const kycStatus = pgEnum("kyc_status", ['pending', 'submitted', 'approved', 'rejected'])
export const quoteStatus = pgEnum("quote_status", ['pending', 'accepted', 'rejected', 'countered'])
export const rfqStatus = pgEnum("rfq_status", ['pending', 'quoted', 'accepted', 'rejected', 'expired', 'converted'])
export const sellerDocumentStatus = pgEnum("seller_document_status", ['pending', 'approved', 'rejected'])
export const sellerDocumentType = pgEnum("seller_document_type", ['nid_front', 'nid_back', 'trade_license', 'selfie', 'bank_proof', 'other'])
export const sellerProductStatus = pgEnum("seller_product_status", ['draft', 'pending', 'accepted', 'declined'])
export const verificationBadge = pgEnum("verification_badge", ['none', 'basic', 'verified', 'premium'])


export const admins = pgTable("admins", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	name: text().notNull(),
	role: adminRole().default('admin').notNull(),
	avatar: text(),
	isActive: boolean("is_active").default(true).notNull(),
	lastLoginAt: timestamp("last_login_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("admins_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}),
]);

export const addresses = pgTable("addresses", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	name: text().notNull(),
	address: text().notNull(),
	postcode: text().notNull(),
	phone: text().notNull(),
	isDefault: boolean("is_default").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	city: text(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "addresses_user_id_user_id_fk"
		}),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	icon: text(),
	parentId: integer("parent_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("categories_slug_unique").on(table.slug),
]);

export const loginEvents = pgTable("login_events", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "login_events_user_id_user_id_fk"
		}),
]);

export const orderItems = pgTable("order_items", {
	id: serial().primaryKey().notNull(),
	orderId: integer("order_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().notNull(),
	price: numeric({ precision: 12, scale:  2 }).notNull(),
	supplierId: integer("supplier_id"),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "order_items_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.id],
			name: "order_items_order_id_orders_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "order_items_product_id_products_id_fk"
		}),
]);

export const orders = pgTable("orders", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	totalAmount: numeric("total_amount", { precision: 12, scale:  2 }).notNull(),
	status: text().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	paymentStatus: text("payment_status").default('pending').notNull(),
	transactionId: text("transaction_id"),
	paymentMethod: text("payment_method"),
	depositAmount: numeric("deposit_amount", { precision: 12, scale:  2 }).default('0'),
	balanceDue: numeric("balance_due", { precision: 12, scale:  2 }).default('0'),
	depositPaidAt: timestamp("deposit_paid_at", { mode: 'string' }),
	fullPaymentPaidAt: timestamp("full_payment_paid_at", { mode: 'string' }),
	escrowReleasedAt: timestamp("escrow_released_at", { mode: 'string' }),
	escrowReleaseDeadline: timestamp("escrow_release_deadline", { mode: 'string' }),
	disputeStatus: text("dispute_status"),
	notes: text(),
	invoiceUrl: text("invoice_url"),
	invoiceGeneratedAt: timestamp("invoice_generated_at", { mode: 'string' }),
	cancellationReason: text("cancellation_reason"),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "orders_user_id_user_id_fk"
		}),
]);

export const passwordResetOtps = pgTable("password_reset_otps", {
	id: serial().primaryKey().notNull(),
	email: text().notNull(),
	code: text().notNull(),
	token: text().notNull(),
	used: boolean().default(false).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const rfqs = pgTable("rfqs", {
	id: serial().primaryKey().notNull(),
	buyerId: text("buyer_id").notNull(),
	supplierId: integer("supplier_id").notNull(),
	productId: integer("product_id").notNull(),
	quantity: integer().notNull(),
	targetPrice: numeric("target_price", { precision: 12, scale:  2 }),
	deliveryLocation: text("delivery_location").notNull(),
	notes: text(),
	attachments: jsonb().default([]),
	status: rfqStatus().default('pending').notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.buyerId],
			foreignColumns: [user.id],
			name: "rfqs_buyer_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "rfqs_supplier_id_suppliers_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "rfqs_product_id_products_id_fk"
		}),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}),
	unique("session_token_unique").on(table.token),
]);

export const stockAlerts = pgTable("stock_alerts", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id"),
	productId: integer("product_id").notNull(),
	email: text().notNull(),
	phone: text(),
	source: text().default('manual'),
	isActive: boolean("is_active").default(true),
	notifiedAt: timestamp("notified_at", { mode: 'string' }),
	acknowledgedAt: timestamp("acknowledged_at", { mode: 'string' }),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "stock_alerts_user_id_user_id_fk"
		}),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "stock_alerts_product_id_products_id_fk"
		}),
]);

export const todos = pgTable("todos", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	dateOfBirth: timestamp("date_of_birth", { mode: 'string' }),
	gender: gender(),
	phoneNumber: text("phone_number"),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const sellers = pgTable("sellers", {
	id: text().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	businessName: text("business_name").notNull(),
	phone: text(),
	kycStatus: kycStatus("kyc_status").default('pending').notNull(),
	verificationBadge: verificationBadge("verification_badge").default('none').notNull(),
	supplierId: integer("supplier_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	businessType: text("business_type"),
	tradeLicenseNumber: text("trade_license_number"),
	businessCategory: text("business_category"),
	yearsInBusiness: integer("years_in_business"),
	fullName: text("full_name"),
	address: text(),
	city: text(),
	postalCode: text("postal_code"),
	bankName: text("bank_name"),
	accountHolderName: text("account_holder_name"),
	accountNumber: text("account_number"),
	branchName: text("branch_name"),
	routingNumber: text("routing_number"),
	emailVerified: boolean("email_verified").default(false).notNull(),
	kycSubmittedAt: timestamp("kyc_submitted_at", { mode: 'string' }),
	kycRejectionReason: text("kyc_rejection_reason"),
	kycDocuments: jsonb("kyc_documents").default({}),
	kycAdditionalInfo: jsonb("kyc_additional_info").default({"categories":[],"description":"","inventoryRange":""}),
}, (table) => [
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "sellers_supplier_id_suppliers_id_fk"
		}),
	unique("sellers_email_unique").on(table.email),
]);

export const suppliers = pgTable("suppliers", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	logo: text(),
	verified: boolean().default(false),
	location: text(),
	responseRate: numeric("response_rate", { precision: 5, scale:  2 }),
	onTimeDelivery: numeric("on_time_delivery", { precision: 5, scale:  2 }),
	yearsInBusiness: integer("years_in_business"),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	ownerId: text("owner_id"),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [user.id],
			name: "suppliers_owner_id_user_id_fk"
		}),
	unique("suppliers_slug_unique").on(table.slug),
]);

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	title: text().notNull(),
	message: text().notNull(),
	type: text().notNull(),
	link: text(),
	read: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "notifications_user_id_user_id_fk"
		}),
]);

export const sellerDocuments = pgTable("seller_documents", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sellerId: text("seller_id").notNull(),
	documentType: sellerDocumentType("document_type").notNull(),
	s3Bucket: text("s3_bucket").notNull(),
	s3Key: text("s3_key").notNull(),
	mimeType: text("mime_type").notNull(),
	fileSize: integer("file_size").notNull(),
	status: sellerDocumentStatus().default('pending').notNull(),
	uploadedAt: timestamp("uploaded_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_documents_seller_id_sellers_id_fk"
		}),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	images: jsonb().default([]),
	price: numeric({ precision: 12, scale:  2 }).notNull(),
	originalPrice: numeric("original_price", { precision: 12, scale:  2 }),
	moq: integer().default(1).notNull(),
	stock: integer().default(0),
	unit: text().default('piece'),
	categoryId: integer("category_id"),
	supplierId: integer("supplier_id"),
	featured: boolean().default(false),
	isNew: boolean("is_new").default(false),
	rating: numeric({ precision: 3, scale:  2 }),
	reviewCount: integer("review_count").default(0),
	soldCount: integer("sold_count").default(0),
	tags: jsonb().default([]),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	tieredPricing: jsonb("tiered_pricing").default([]),
	specifications: jsonb().default([]),
	hasSample: boolean("has_sample").default(false),
	samplePrice: numeric("sample_price", { precision: 12, scale:  2 }),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_categories_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "products_supplier_id_suppliers_id_fk"
		}),
	unique("products_slug_unique").on(table.slug),
]);

export const sellerProducts = pgTable("seller_products", {
	id: serial().primaryKey().notNull(),
	sellerId: text("seller_id").notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	brand: text(),
	mainCategory: text("main_category"),
	subCategory: text("sub_category"),
	description: text(),
	tags: jsonb().default([]),
	images: jsonb().default([]),
	price: numeric({ precision: 12, scale:  2 }).notNull(),
	originalPrice: numeric("original_price", { precision: 12, scale:  2 }),
	tieredPricing: jsonb("tiered_pricing").default([]),
	moq: integer().default(1).notNull(),
	stock: integer().default(0),
	sku: text(),
	unit: text().default('piece'),
	lowStockThreshold: integer("low_stock_threshold").default(10),
	specifications: jsonb().default([]),
	weight: text(),
	dimensions: jsonb(),
	shipFrom: text("ship_from"),
	deliveryTime: text("delivery_time"),
	returnPolicy: text("return_policy"),
	hasSample: boolean("has_sample").default(false),
	samplePrice: numeric("sample_price", { precision: 12, scale:  2 }),
	sampleMaxQty: integer("sample_max_qty"),
	sampleDelivery: text("sample_delivery"),
	status: sellerProductStatus().default('draft').notNull(),
	adminNotes: text("admin_notes"),
	reviewedBy: text("reviewed_by"),
	reviewedAt: timestamp("reviewed_at", { mode: 'string' }),
	publishedProductId: integer("published_product_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [sellers.id],
			name: "seller_products_seller_id_sellers_id_fk"
		}),
	foreignKey({
			columns: [table.publishedProductId],
			foreignColumns: [products.id],
			name: "seller_products_published_product_id_products_id_fk"
		}),
]);

export const quotes = pgTable("quotes", {
	id: serial().primaryKey().notNull(),
	rfqId: integer("rfq_id").notNull(),
	supplierId: integer("supplier_id").notNull(),
	unitPrice: numeric("unit_price", { precision: 12, scale:  2 }).notNull(),
	totalPrice: numeric("total_price", { precision: 12, scale:  2 }).notNull(),
	validityPeriod: timestamp("validity_period", { mode: 'string' }).notNull(),
	terms: text(),
	status: quoteStatus().default('pending').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	counterPrice: numeric("counter_price", { precision: 12, scale:  2 }),
	counterNote: text("counter_note"),
	agreedQuantity: integer("agreed_quantity"),
	depositPercentage: integer("deposit_percentage").default(0),
	deliveryTime: text("delivery_time"),
}, (table) => [
	foreignKey({
			columns: [table.rfqId],
			foreignColumns: [rfqs.id],
			name: "quotes_rfq_id_rfqs_id_fk"
		}),
	foreignKey({
			columns: [table.supplierId],
			foreignColumns: [suppliers.id],
			name: "quotes_supplier_id_suppliers_id_fk"
		}),
]);
