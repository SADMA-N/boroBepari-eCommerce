import { relations } from "drizzle-orm/relations";
import { user, account, addresses, loginEvents, suppliers, orderItems, orders, products, rfqs, session, stockAlerts, sellers, notifications, sellerDocuments, categories, sellerProducts, quotes } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	addresses: many(addresses),
	loginEvents: many(loginEvents),
	orders: many(orders),
	rfqs: many(rfqs),
	sessions: many(session),
	stockAlerts: many(stockAlerts),
	suppliers: many(suppliers),
	notifications: many(notifications),
}));

export const addressesRelations = relations(addresses, ({one}) => ({
	user: one(user, {
		fields: [addresses.userId],
		references: [user.id]
	}),
}));

export const loginEventsRelations = relations(loginEvents, ({one}) => ({
	user: one(user, {
		fields: [loginEvents.userId],
		references: [user.id]
	}),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	supplier: one(suppliers, {
		fields: [orderItems.supplierId],
		references: [suppliers.id]
	}),
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	}),
}));

export const suppliersRelations = relations(suppliers, ({one, many}) => ({
	orderItems: many(orderItems),
	rfqs: many(rfqs),
	sellers: many(sellers),
	user: one(user, {
		fields: [suppliers.ownerId],
		references: [user.id]
	}),
	products: many(products),
	quotes: many(quotes),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	orderItems: many(orderItems),
	user: one(user, {
		fields: [orders.userId],
		references: [user.id]
	}),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	orderItems: many(orderItems),
	rfqs: many(rfqs),
	stockAlerts: many(stockAlerts),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	supplier: one(suppliers, {
		fields: [products.supplierId],
		references: [suppliers.id]
	}),
	sellerProducts: many(sellerProducts),
}));

export const rfqsRelations = relations(rfqs, ({one, many}) => ({
	user: one(user, {
		fields: [rfqs.buyerId],
		references: [user.id]
	}),
	supplier: one(suppliers, {
		fields: [rfqs.supplierId],
		references: [suppliers.id]
	}),
	product: one(products, {
		fields: [rfqs.productId],
		references: [products.id]
	}),
	quotes: many(quotes),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const stockAlertsRelations = relations(stockAlerts, ({one}) => ({
	user: one(user, {
		fields: [stockAlerts.userId],
		references: [user.id]
	}),
	product: one(products, {
		fields: [stockAlerts.productId],
		references: [products.id]
	}),
}));

export const sellersRelations = relations(sellers, ({one, many}) => ({
	supplier: one(suppliers, {
		fields: [sellers.supplierId],
		references: [suppliers.id]
	}),
	sellerDocuments: many(sellerDocuments),
	sellerProducts: many(sellerProducts),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(user, {
		fields: [notifications.userId],
		references: [user.id]
	}),
}));

export const sellerDocumentsRelations = relations(sellerDocuments, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerDocuments.sellerId],
		references: [sellers.id]
	}),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const sellerProductsRelations = relations(sellerProducts, ({one}) => ({
	seller: one(sellers, {
		fields: [sellerProducts.sellerId],
		references: [sellers.id]
	}),
	product: one(products, {
		fields: [sellerProducts.publishedProductId],
		references: [products.id]
	}),
}));

export const quotesRelations = relations(quotes, ({one}) => ({
	rfq: one(rfqs, {
		fields: [quotes.rfqId],
		references: [rfqs.id]
	}),
	supplier: one(suppliers, {
		fields: [quotes.supplierId],
		references: [suppliers.id]
	}),
}));