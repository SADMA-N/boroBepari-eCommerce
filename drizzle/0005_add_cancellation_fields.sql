ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancellation_reason" text;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;
