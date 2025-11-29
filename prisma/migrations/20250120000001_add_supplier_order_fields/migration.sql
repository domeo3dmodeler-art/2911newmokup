-- Add number and total_amount fields to supplier_orders table
ALTER TABLE "supplier_orders" ADD COLUMN "number" TEXT;
ALTER TABLE "supplier_orders" ADD COLUMN "total_amount" REAL;

-- Add parent_document_id and cart_session_id fields for universal linking
ALTER TABLE "supplier_orders" ADD COLUMN "parent_document_id" TEXT;
ALTER TABLE "supplier_orders" ADD COLUMN "cart_session_id" TEXT;

-- Add cart_data field for storing cart information
ALTER TABLE "supplier_orders" ADD COLUMN "cart_data" TEXT;
