
-- Скрипт оптимизации базы данных
-- Создан: 2025-10-22T19:20:17.119Z

-- 1. Создание индексов для часто используемых полей
CREATE INDEX IF NOT EXISTS idx_user_email ON user (email);
CREATE INDEX IF NOT EXISTS idx_user_created_at ON user (created_at);
CREATE INDEX IF NOT EXISTS idx_user_updated_at ON user (updated_at);
CREATE INDEX IF NOT EXISTS idx_client_phone ON client (phone);
CREATE INDEX IF NOT EXISTS idx_catalogcategory_created_at ON catalogcategory (created_at);
CREATE INDEX IF NOT EXISTS idx_catalogcategory_updated_at ON catalogcategory (updated_at);
CREATE INDEX IF NOT EXISTS idx_productproperty_created_at ON productproperty (created_at);
CREATE INDEX IF NOT EXISTS idx_productproperty_updated_at ON productproperty (updated_at);
CREATE INDEX IF NOT EXISTS idx_categorypropertyassignment_created_at ON categorypropertyassignment (created_at);
CREATE INDEX IF NOT EXISTS idx_categorypropertyassignment_updated_at ON categorypropertyassignment (updated_at);
CREATE INDEX IF NOT EXISTS idx_importtemplate_created_at ON importtemplate (created_at);
CREATE INDEX IF NOT EXISTS idx_importtemplate_updated_at ON importtemplate (updated_at);
CREATE INDEX IF NOT EXISTS idx_document_status ON document (status);
CREATE INDEX IF NOT EXISTS idx_exportsetting_created_at ON exportsetting (created_at);
CREATE INDEX IF NOT EXISTS idx_exportsetting_updated_at ON exportsetting (updated_at);
CREATE INDEX IF NOT EXISTS idx_frontendcategory_created_at ON frontendcategory (created_at);
CREATE INDEX IF NOT EXISTS idx_frontendcategory_updated_at ON frontendcategory (updated_at);
CREATE INDEX IF NOT EXISTS idx_constructorconfig_created_at ON constructorconfig (created_at);
CREATE INDEX IF NOT EXISTS idx_constructorconfig_updated_at ON constructorconfig (updated_at);
CREATE INDEX IF NOT EXISTS idx_product_created_at ON product (created_at);
CREATE INDEX IF NOT EXISTS idx_product_updated_at ON product (updated_at);
CREATE INDEX IF NOT EXISTS idx_productimage_created_at ON productimage (created_at);
CREATE INDEX IF NOT EXISTS idx_productimage_product_id ON productimage (product_id);
CREATE INDEX IF NOT EXISTS idx_quote_status ON quote (status);
CREATE INDEX IF NOT EXISTS idx_quote_created_at ON quote (created_at);
CREATE INDEX IF NOT EXISTS idx_quote_updated_at ON quote (updated_at);
CREATE INDEX IF NOT EXISTS idx_quote_client_id ON quote (client_id);
CREATE INDEX IF NOT EXISTS idx_quoteitem_product_id ON quoteitem (product_id);
CREATE INDEX IF NOT EXISTS idx_order_status ON order (status);
CREATE INDEX IF NOT EXISTS idx_order_created_at ON order (created_at);
CREATE INDEX IF NOT EXISTS idx_order_updated_at ON order (updated_at);
CREATE INDEX IF NOT EXISTS idx_order_client_id ON order (client_id);
CREATE INDEX IF NOT EXISTS idx_orderitem_product_id ON orderitem (product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice (status);
CREATE INDEX IF NOT EXISTS idx_invoice_created_at ON invoice (created_at);
CREATE INDEX IF NOT EXISTS idx_invoice_updated_at ON invoice (updated_at);
CREATE INDEX IF NOT EXISTS idx_invoice_client_id ON invoice (client_id);
CREATE INDEX IF NOT EXISTS idx_invoiceitem_product_id ON invoiceitem (product_id);
CREATE INDEX IF NOT EXISTS idx_supplierorder_status ON supplierorder (status);
CREATE INDEX IF NOT EXISTS idx_supplierorder_created_at ON supplierorder (created_at);
CREATE INDEX IF NOT EXISTS idx_supplierorder_updated_at ON supplierorder (updated_at);
CREATE INDEX IF NOT EXISTS idx_importhistory_status ON importhistory (status);
CREATE INDEX IF NOT EXISTS idx_importhistory_created_at ON importhistory (created_at);
CREATE INDEX IF NOT EXISTS idx_systemsetting_created_at ON systemsetting (created_at);
CREATE INDEX IF NOT EXISTS idx_systemsetting_updated_at ON systemsetting (updated_at);
CREATE INDEX IF NOT EXISTS idx_documentcomment_created_at ON documentcomment (created_at);
CREATE INDEX IF NOT EXISTS idx_documentcomment_updated_at ON documentcomment (updated_at);
CREATE INDEX IF NOT EXISTS idx_documentcomment_user_id ON documentcomment (user_id);
CREATE INDEX IF NOT EXISTS idx_documenthistory_created_at ON documenthistory (created_at);
CREATE INDEX IF NOT EXISTS idx_documenthistory_user_id ON documenthistory (user_id);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON notification (created_at);
CREATE INDEX IF NOT EXISTS idx_notification_client_id ON notification (client_id);
CREATE INDEX IF NOT EXISTS idx_notification_user_id ON notification (user_id);

-- 2. Анализ статистики таблиц
ANALYZE user;
ANALYZE client;
ANALYZE catalogcategory;
ANALYZE productproperty;
ANALYZE categorypropertyassignment;
ANALYZE importtemplate;
ANALYZE constructorconfiguration;
ANALYZE document;
ANALYZE exportsetting;
ANALYZE frontendcategory;
ANALYZE constructorconfig;
ANALYZE product;
ANALYZE productimage;
ANALYZE quote;
ANALYZE quoteitem;
ANALYZE order;
ANALYZE orderitem;
ANALYZE invoice;
ANALYZE invoiceitem;
ANALYZE supplierorder;
ANALYZE importhistory;
ANALYZE systemsetting;
ANALYZE page;
ANALYZE pageelement;
ANALYZE propertyphoto;
ANALYZE documentcomment;
ANALYZE documenthistory;
ANALYZE notification;

-- 3. Очистка неиспользуемых данных (если нужно)
-- DELETE FROM notifications WHERE created_at < datetime('now', '-30 days');
-- DELETE FROM document_history WHERE created_at < datetime('now', '-90 days');

-- 4. Оптимизация базы данных
VACUUM;
