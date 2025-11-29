-- Схема базы данных для универсальной системы товаров
-- Подходит для Yandex Cloud PostgreSQL

-- Таблица категорий товаров
CREATE TABLE categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(10),
    properties JSONB NOT NULL DEFAULT '[]',
    import_mapping JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Универсальная таблица товаров
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id),
    supplier_sku VARCHAR(100) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, supplier_sku)
);

-- Таблица истории импортов
CREATE TABLE import_history (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id),
    filename VARCHAR(255) NOT NULL,
    file_size INTEGER,
    imported_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    errors JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier_sku ON products(supplier_sku);
CREATE INDEX idx_products_data ON products USING GIN(data);
CREATE INDEX idx_import_history_category ON import_history(category_id);
CREATE INDEX idx_import_history_created_at ON import_history(created_at);

-- Вставка базовых категорий
INSERT INTO categories (id, name, description, icon, properties, import_mapping) VALUES
('doors', 'Двери', 'Межкомнатные и входные двери', '🚪', 
 '[{"key":"model","name":"Модель","type":"text","required":true},{"key":"style","name":"Стиль","type":"select","options":["Современная","Классика","Неоклассика","Скрытая"]},{"key":"finish","name":"Покрытие","type":"select","options":["Нанотекс","Эмаль","Шпон"]},{"key":"color","name":"Цвет","type":"text","required":true},{"key":"width","name":"Ширина","type":"number","unit":"мм","required":true},{"key":"height","name":"Высота","type":"number","unit":"мм","required":true},{"key":"price_rrc","name":"РРЦ","type":"number","unit":"₽","required":true},{"key":"supplier_sku","name":"Артикул поставщика","type":"text","required":true},{"key":"photo_url","name":"Фото","type":"url"}]',
 '{"supplier_sku":"supplier_sku","model":"model","style":"style","finish":"finish","color":"color","width":"width","height":"height","price_rrc":"price_rrc","photo_url":"photo_url"}'),

('windows', 'Окна', 'Пластиковые и деревянные окна', '🪟',
 '[{"key":"model","name":"Модель","type":"text","required":true},{"key":"material","name":"Материал","type":"select","options":["ПВХ","Дерево","Алюминий"]},{"key":"color","name":"Цвет","type":"text","required":true},{"key":"width","name":"Ширина","type":"number","unit":"мм","required":true},{"key":"height","name":"Высота","type":"number","unit":"мм","required":true},{"key":"glazing","name":"Стеклопакет","type":"select","options":["Однокамерный","Двухкамерный","Трехкамерный"]},{"key":"price_rrc","name":"РРЦ","type":"number","unit":"₽","required":true},{"key":"supplier_sku","name":"Артикул поставщика","type":"text","required":true},{"key":"photo_url","name":"Фото","type":"url"}]',
 '{"supplier_sku":"supplier_sku","model":"model","material":"material","color":"color","width":"width","height":"height","glazing":"glazing","price_rrc":"price_rrc","photo_url":"photo_url"}'),

('furniture', 'Мебель', 'Корпусная и мягкая мебель', '🪑',
 '[{"key":"name","name":"Название","type":"text","required":true},{"key":"category","name":"Категория","type":"select","options":["Кухня","Спальня","Гостиная","Офис"]},{"key":"material","name":"Материал","type":"text","required":true},{"key":"color","name":"Цвет","type":"text","required":true},{"key":"width","name":"Ширина","type":"number","unit":"см"},{"key":"height","name":"Высота","type":"number","unit":"см"},{"key":"depth","name":"Глубина","type":"number","unit":"см"},{"key":"price_rrc","name":"РРЦ","type":"number","unit":"₽","required":true},{"key":"supplier_sku","name":"Артикул поставщика","type":"text","required":true},{"key":"photo_url","name":"Фото","type":"url"}]',
 '{"supplier_sku":"supplier_sku","name":"name","category":"category","material":"material","color":"color","width":"width","height":"height","depth":"depth","price_rrc":"price_rrc","photo_url":"photo_url"}');
