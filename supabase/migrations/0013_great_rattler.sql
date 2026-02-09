ALTER TABLE "quotes" ADD COLUMN "agreed_quantity" integer;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "deposit_percentage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "delivery_time" text;