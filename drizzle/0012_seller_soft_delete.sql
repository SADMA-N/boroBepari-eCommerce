ALTER TABLE "products"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;

ALTER TABLE "seller_products"
  ADD COLUMN IF NOT EXISTS "deleted_at" timestamp,
  ADD COLUMN IF NOT EXISTS "deleted_by" text;

CREATE INDEX IF NOT EXISTS "idx_products_deleted_at"
  ON "products" ("deleted_at");

CREATE INDEX IF NOT EXISTS "idx_seller_products_seller_id_deleted_at"
  ON "seller_products" ("seller_id", "deleted_at");
