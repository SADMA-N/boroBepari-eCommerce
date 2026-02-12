ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS rfq_id integer;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS quote_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'order_items_rfq_id_rfqs_id_fk'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_rfq_id_rfqs_id_fk
      FOREIGN KEY (rfq_id) REFERENCES rfqs(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'order_items_quote_id_quotes_id_fk'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_quote_id_quotes_id_fk
      FOREIGN KEY (quote_id) REFERENCES quotes(id);
  END IF;
END $$;
