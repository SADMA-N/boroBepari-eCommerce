CREATE TABLE IF NOT EXISTS "stock_alerts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "user"("id"),
  "product_id" integer NOT NULL REFERENCES "products"("id"),
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
