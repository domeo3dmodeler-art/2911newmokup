-- Миграция для добавления связей между документами
-- Добавляем поля для связей между Quote, Invoice, Order, SupplierOrder

-- Добавляем invoice_id в Order
ALTER TABLE orders ADD COLUMN invoice_id TEXT;

-- Добавляем quote_id в Invoice  
ALTER TABLE invoices ADD COLUMN quote_id TEXT;

-- Добавляем invoice_id в SupplierOrder
ALTER TABLE supplier_orders ADD COLUMN invoice_id TEXT;

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_orders_quote_id ON orders(quote_id);
CREATE INDEX idx_orders_invoice_id ON orders(invoice_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_supplier_orders_invoice_id ON supplier_orders(invoice_id);

-- Обновляем существующие записи (если нужно)
-- Это пример - нужно адаптировать под реальные данные
-- UPDATE orders SET invoice_id = (SELECT id FROM invoices WHERE order_id = orders.id LIMIT 1) WHERE invoice_id IS NULL;
-- UPDATE invoices SET quote_id = (SELECT id FROM quotes WHERE client_id = invoices.client_id ORDER BY created_at DESC LIMIT 1) WHERE quote_id IS NULL;
