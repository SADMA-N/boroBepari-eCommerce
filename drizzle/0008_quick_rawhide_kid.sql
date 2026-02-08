CREATE TYPE "public"."seller_product_status" AS ENUM('draft', 'pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "seller_products" (
	"id" serial PRIMARY KEY NOT NULL,
	"seller_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"brand" text,
	"main_category" text,
	"sub_category" text,
	"description" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"price" numeric(12, 2) NOT NULL,
	"original_price" numeric(12, 2),
	"tiered_pricing" jsonb DEFAULT '[]'::jsonb,
	"moq" integer DEFAULT 1 NOT NULL,
	"stock" integer DEFAULT 0,
	"sku" text,
	"unit" text DEFAULT 'piece',
	"low_stock_threshold" integer DEFAULT 10,
	"specifications" jsonb DEFAULT '[]'::jsonb,
	"weight" text,
	"dimensions" jsonb,
	"ship_from" text,
	"delivery_time" text,
	"return_policy" text,
	"has_sample" boolean DEFAULT false,
	"sample_price" numeric(12, 2),
	"sample_max_qty" integer,
	"sample_delivery" text,
	"status" "seller_product_status" DEFAULT 'draft' NOT NULL,
	"admin_notes" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"published_product_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "tiered_pricing" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specifications" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_sample" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sample_price" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_products" ADD CONSTRAINT "seller_products_published_product_id_products_id_fk" FOREIGN KEY ("published_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;