ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "invoice_url" text;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "invoice_generated_at" timestamp;
