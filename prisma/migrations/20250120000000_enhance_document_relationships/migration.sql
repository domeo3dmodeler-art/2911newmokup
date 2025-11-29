-- Migration: Enhance document relationships and add history tracking
-- This migration adds missing foreign keys and new tables for document workflow

-- 1. Add foreign key constraints for existing relationships
ALTER TABLE "orders" ADD CONSTRAINT "orders_quote_id_fkey" 
  FOREIGN KEY ("quote_id") REFERENCES "quotes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" 
  FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_order_id_fkey" 
  FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Add quote_id to invoices table for direct Quote -> Invoice relationship
ALTER TABLE "invoices" ADD COLUMN "quote_id" TEXT;

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_quote_id_fkey" 
  FOREIGN KEY ("quote_id") REFERENCES "quotes" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 3. Create document history table
CREATE TABLE "document_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_type" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "user_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create document templates table
CREATE TABLE "document_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "template_data" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- 5. Add indexes for better performance
CREATE INDEX "idx_quotes_client_id" ON "quotes" ("client_id");
CREATE INDEX "idx_orders_client_id" ON "orders" ("client_id");
CREATE INDEX "idx_orders_quote_id" ON "orders" ("quote_id");
CREATE INDEX "idx_invoices_client_id" ON "invoices" ("client_id");
CREATE INDEX "idx_invoices_order_id" ON "invoices" ("order_id");
CREATE INDEX "idx_invoices_quote_id" ON "invoices" ("quote_id");
CREATE INDEX "idx_supplier_orders_order_id" ON "supplier_orders" ("order_id");
CREATE INDEX "idx_document_history_document" ON "document_history" ("document_type", "document_id");
CREATE INDEX "idx_document_templates_type" ON "document_templates" ("type");
