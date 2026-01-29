import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Categories table
export const categories = pgTable('categories', {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  icon: text(),
  parentId: integer('parent_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

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
  logo: text(),
  verified: boolean().default(false),
  location: text(),
  responseRate: decimal('response_rate', { precision: 5, scale: 2 }),
  onTimeDelivery: decimal('on_time_delivery', { precision: 5, scale: 2 }),
  yearsInBusiness: integer('years_in_business'),
  description: text(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}))

// Products table
export const products = pgTable('products', {
  id: serial().primaryKey(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  description: text(),
  images: jsonb().$type<string[]>().default([]),
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
  tags: jsonb().$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

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

// Todos table (existing)
export const todos = pgTable('todos', {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// Type exports
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(()=> user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(()=> user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow(),
	updatedAt: timestamp("updated_at").defaultNow()
});

export const loginEvents = pgTable("login_events", {
  id: serial().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loginEventsRelations = relations(loginEvents, ({ one }) => ({
  user: one(user, {
    fields: [loginEvents.userId],
    references: [user.id],
  }),
}));

// Type exports
export type Category = typeof categories.$inferSelect
export type NewCategory = typeof categories.$inferInsert
export type Supplier = typeof suppliers.$inferSelect
export type NewSupplier = typeof suppliers.$inferInsert
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type LoginEvent = typeof loginEvents.$inferSelect
export type NewLoginEvent = typeof loginEvents.$inferInsert
