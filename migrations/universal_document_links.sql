-- Миграция для универсальных связей между документами
-- Удаляем старые поля и добавляем parent_document_id

-- Удаляем старые поля связей
ALTER TABLE orders DROP COLUMN IF EXISTS quote_id;
ALTER TABLE orders DROP COLUMN IF EXISTS invoice_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS quote_id;
ALTER TABLE invoices DROP COLUMN IF EXISTS order_id;
ALTER TABLE supplier_orders DROP COLUMN IF EXISTS order_id;
ALTER TABLE supplier_orders DROP COLUMN IF EXISTS invoice_id;

-- Добавляем универсальное поле parent_document_id
ALTER TABLE quotes ADD COLUMN parent_document_id TEXT;
ALTER TABLE invoices ADD COLUMN parent_document_id TEXT;
ALTER TABLE orders ADD COLUMN parent_document_id TEXT;
ALTER TABLE supplier_orders ADD COLUMN parent_document_id TEXT;

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_quotes_parent_document_id ON quotes(parent_document_id);
CREATE INDEX idx_invoices_parent_document_id ON invoices(parent_document_id);
CREATE INDEX idx_orders_parent_document_id ON orders(parent_document_id);
CREATE INDEX idx_supplier_orders_parent_document_id ON supplier_orders(parent_document_id);

-- Удаляем старые индексы
DROP INDEX IF EXISTS idx_orders_quote_id;
DROP INDEX IF EXISTS idx_orders_invoice_id;
DROP INDEX IF EXISTS idx_invoices_quote_id;
DROP INDEX IF EXISTS idx_supplier_orders_invoice_id;
