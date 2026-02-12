ALTER TABLE "orders"
ADD COLUMN "payment_channel" text,
ADD COLUMN "payment_provider" text,
ADD COLUMN "payment_reference" text,
ADD COLUMN "payment_sender_account" text,
ADD COLUMN "payment_declaration" boolean DEFAULT false;
