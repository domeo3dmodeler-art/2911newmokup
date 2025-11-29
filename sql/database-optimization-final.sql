-- Скрипт оптимизации базы данных
-- Создан: 2025-10-22T19:20:17.119Z
-- Исправлен: 2025-10-22T19:30:00.000Z

-- 1. Создание индексов для часто используемых полей
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users (updated_at);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_createdAt ON clients (createdAt);
CREATE INDEX IF NOT EXISTS idx_clients_updatedAt ON clients (updatedAt);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_created_at ON catalog_categories (created_at);
CREATE INDEX IF NOT EXISTS idx_catalog_categories_updated_at ON catalog_categories (updated_at);
CREATE INDEX IF NOT EXISTS idx_product_properties_created_at ON product_properties (created_at);
CREATE INDEX IF NOT EXISTS idx_product_properties_updated_at ON product_properties (updated_at);
CREATE INDEX IF NOT EXISTS idx_category_property_assignments_created_at ON category_property_assignments (created_at);
CREATE INDEX IF NOT EXISTS idx_category_property_assignments_updated_at ON category_property_assignments (updated_at);
CREATE INDEX IF NOT EXISTS idx_import_templates_created_at ON import_templates (created_at);
CREATE INDEX IF NOT EXISTS idx_import_templates_updated_at ON import_templates (updated_at);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);
CREATE INDEX IF NOT EXISTS idx_documents_createdAt ON documents (createdAt);
CREATE INDEX IF NOT EXISTS idx_documents_updatedAt ON documents (updatedAt);
CREATE INDEX IF NOT EXISTS idx_export_settings_created_at ON export_settings (created_at);
CREATE INDEX IF NOT EXISTS idx_export_settings_updated_at ON export_settings (updated_at);
CREATE INDEX IF NOT EXISTS idx_frontend_categories_created_at ON frontend_categories (created_at);
CREATE INDEX IF NOT EXISTS idx_frontend_categories_updated_at ON frontend_categories (updated_at);
CREATE INDEX IF NOT EXISTS idx_constructor_configs_created_at ON constructor_configs (created_at);
CREATE INDEX IF NOT EXISTS idx_constructor_configs_updated_at ON constructor_configs (updated_at);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products (updated_at);
CREATE INDEX IF NOT EXISTS idx_products_catalog_category_id ON products (catalog_category_id);
CREATE INDEX IF NOT EXISTS idx_product_images_created_at ON product_images (created_at);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_updated_at ON quotes (updated_at);
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes (client_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_product_id ON quote_items (product_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders (updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_updated_at ON invoices (updated_at);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items (product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status ON supplier_orders (status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_created_at ON supplier_orders (created_at);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_updated_at ON supplier_orders (updated_at);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history (status);
CREATE INDEX IF NOT EXISTS idx_import_history_created_at ON import_history (created_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_created_at ON system_settings (created_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_updated_at ON system_settings (updated_at);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_at ON document_comments (created_at);
CREATE INDEX IF NOT EXISTS idx_document_comments_updated_at ON document_comments (updated_at);
CREATE INDEX IF NOT EXISTS idx_document_comments_user_id ON document_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_document_history_created_at ON document_history (created_at);
CREATE INDEX IF NOT EXISTS idx_document_history_user_id ON document_history (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_client_id ON notifications (client_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);

-- 2. Создание составных индексов для часто используемых запросов
CREATE INDEX IF NOT EXISTS idx_quotes_client_status ON quotes (client_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_client_status ON orders (client_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_status ON invoices (client_id, status);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_status_created ON supplier_orders (status, created_at);
CREATE INDEX IF NOT EXISTS idx_documents_status_created ON documents (status, createdAt);
CREATE INDEX IF NOT EXISTS idx_products_category_created ON products (catalog_category_id, created_at);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_product ON quote_items (quote_id, product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items (order_id, product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_product ON invoice_items (invoice_id, product_id);

-- 3. Создание индексов для связей между документами
CREATE INDEX IF NOT EXISTS idx_quotes_parent_document_id ON quotes (parent_document_id);
CREATE INDEX IF NOT EXISTS idx_quotes_cart_session_id ON quotes (cart_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_parent_document_id ON orders (parent_document_id);
CREATE INDEX IF NOT EXISTS idx_orders_cart_session_id ON orders (cart_session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_parent_document_id ON invoices (parent_document_id);
CREATE INDEX IF NOT EXISTS idx_invoices_cart_session_id ON invoices (cart_session_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_parent_document_id ON supplier_orders (parent_document_id);

-- 4. Анализ статистики таблиц
ANALYZE users;
ANALYZE clients;
ANALYZE catalog_categories;
ANALYZE product_properties;
ANALYZE category_property_assignments;
ANALYZE import_templates;
ANALYZE constructor_configurations;
ANALYZE documents;
ANALYZE export_settings;
ANALYZE frontend_categories;
ANALYZE constructor_configs;
ANALYZE products;
ANALYZE product_images;
ANALYZE quotes;
ANALYZE quote_items;
ANALYZE orders;
ANALYZE order_items;
ANALYZE invoices;
ANALYZE invoice_items;
ANALYZE supplier_orders;
ANALYZE import_history;
ANALYZE system_settings;
ANALYZE pages;
ANALYZE page_elements;
ANALYZE property_photos;
ANALYZE document_comments;
ANALYZE document_history;
ANALYZE notifications;

-- 5. Оптимизация базы данных
VACUUM;
