-- Миграция для добавления cart_session_id для группировки документов из корзины
-- Добавляем поле cart_session_id во все таблицы документов

-- Добавляем поле cart_session_id
ALTER TABLE quotes ADD COLUMN cart_session_id TEXT;
ALTER TABLE invoices ADD COLUMN cart_session_id TEXT;
ALTER TABLE orders ADD COLUMN cart_session_id TEXT;
ALTER TABLE supplier_orders ADD COLUMN cart_session_id TEXT;

-- Создаем индексы для быстрого поиска документов из одной корзины
CREATE INDEX idx_quotes_cart_session_id ON quotes(cart_session_id);
CREATE INDEX idx_invoices_cart_session_id ON invoices(cart_session_id);
CREATE INDEX idx_orders_cart_session_id ON orders(cart_session_id);
CREATE INDEX idx_supplier_orders_cart_session_id ON supplier_orders(cart_session_id);

-- Комментарии для понимания назначения полей
COMMENT ON COLUMN quotes.cart_session_id IS 'Сессия корзины для группировки документов, созданных из одной корзины';
COMMENT ON COLUMN invoices.cart_session_id IS 'Сессия корзины для группировки документов, созданных из одной корзины';
COMMENT ON COLUMN orders.cart_session_id IS 'Сессия корзины для группировки документов, созданных из одной корзины';
COMMENT ON COLUMN supplier_orders.cart_session_id IS 'Сессия корзины для группировки документов, созданных из одной корзины';
