-- Миграция: Замена старых статусов на новые
-- IN_PRODUCTION → ORDERED
-- READY → RECEIVED_FROM_SUPPLIER

BEGIN;

-- Заменить IN_PRODUCTION на ORDERED в Invoice
UPDATE "Invoice" SET status = 'ORDERED' WHERE status = 'IN_PRODUCTION';

-- Заменить READY на RECEIVED_FROM_SUPPLIER в Invoice
UPDATE "Invoice" SET status = 'RECEIVED_FROM_SUPPLIER' WHERE status = 'READY';

-- Заменить IN_PRODUCTION на ORDERED в SupplierOrder
UPDATE "SupplierOrder" SET status = 'ORDERED' WHERE status = 'IN_PRODUCTION';

-- Заменить READY на RECEIVED_FROM_SUPPLIER в SupplierOrder
UPDATE "SupplierOrder" SET status = 'RECEIVED_FROM_SUPPLIER' WHERE status = 'READY';

-- Заменить IN_PRODUCTION на ORDERED в Quote
UPDATE "Quote" SET status = 'ORDERED' WHERE status = 'IN_PRODUCTION';

-- Заменить READY на COMPLETED в Quote (так как READY уже использовался как финальный статус)
UPDATE "Quote" SET status = 'COMPLETED' WHERE status = 'READY';

-- Заменить IN_PRODUCTION на RECEIVED_FROM_SUPPLIER в Order
UPDATE "Order" SET status = 'RECEIVED_FROM_SUPPLIER' WHERE status = 'IN_PRODUCTION';

-- Заменить READY на RECEIVED_FROM_SUPPLIER в Order
UPDATE "Order" SET status = 'RECEIVED_FROM_SUPPLIER' WHERE status = 'READY';

COMMIT;

-- Проверка результатов
SELECT 'Invoice' as table_name, status, COUNT(*) as count FROM "Invoice" GROUP BY status;
SELECT 'SupplierOrder' as table_name, status, COUNT(*) as count FROM "SupplierOrder" GROUP BY status;
SELECT 'Quote' as table_name, status, COUNT(*) as count FROM "Quote" GROUP BY status;
SELECT 'Order' as table_name, status, COUNT(*) as count FROM "Order" GROUP BY status;

