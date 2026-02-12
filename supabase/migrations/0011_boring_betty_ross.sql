CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'admin', 'moderator');--> statement-breakpoint
CREATE TYPE "public"."seller_document_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."seller_document_type" AS ENUM('nid_front', 'nid_back', 'trade_license', 'selfie', 'bank_proof', 'other');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admins" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"link" text,
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seller_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" text NOT NULL,
	"document_type" "seller_document_type" NOT NULL,
	"s3_bucket" text NOT NULL,
	"s3_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"status" "seller_document_status" DEFAULT 'pending' NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "seller_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "login_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "password_reset_otps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "rfqs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sellers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "stock_alerts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "todos" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "business_type" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "trade_license_number" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "business_category" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "years_in_business" integer;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "full_name" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "account_holder_name" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "account_number" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "branch_name" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "routing_number" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "kyc_submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "kyc_rejection_reason" text;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "kyc_documents" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "sellers" ADD COLUMN "kyc_additional_info" jsonb DEFAULT '{"description":"","categories":[],"inventoryRange":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "suppliers" ADD COLUMN "owner_id" text;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seller_documents" ADD CONSTRAINT "seller_documents_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;