CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('pending', 'accepted', 'rejected', 'countered');--> statement-breakpoint
CREATE TYPE "public"."rfq_status" AS ENUM('pending', 'quoted', 'accepted', 'rejected', 'expired', 'converted');--> statement-breakpoint
CREATE TYPE "public"."verification_badge" AS ENUM('none', 'basic', 'verified', 'premium');--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"rfq_id" integer NOT NULL,
	"supplier_id" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"validity_period" timestamp NOT NULL,
	"terms" text,
	"status" "quote_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rfqs" (
	"id" serial PRIMARY KEY NOT NULL,
	"buyer_id" text NOT NULL,
	"supplier_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"target_price" numeric(12, 2),
	"delivery_location" text NOT NULL,
	"notes" text,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"status" "rfq_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"business_name" text NOT NULL,
	"phone" text,
	"kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"verification_badge" "verification_badge" DEFAULT 'none' NOT NULL,
	"supplier_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "stock_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"product_id" integer NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"source" text DEFAULT 'manual',
	"is_active" boolean DEFAULT true,
	"notified_at" timestamp,
	"acknowledged_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "addresses" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "supplier_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "transaction_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deposit_amount" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "balance_due" numeric(12, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "deposit_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "full_payment_paid_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "escrow_released_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "escrow_release_deadline" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "dispute_status" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "invoice_generated_at" timestamp;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "public"."rfqs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_buyer_id_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sellers" ADD CONSTRAINT "sellers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_alerts" ADD CONSTRAINT "stock_alerts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;