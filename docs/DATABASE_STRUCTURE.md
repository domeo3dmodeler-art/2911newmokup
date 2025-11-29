# 📊 СТРУКТУРА БАЗЫ ДАННЫХ ПРОЕКТА DOMEO

**БД:** PostgreSQL  
**ORM:** Prisma  
**Схема:** `prisma/schema.prisma`

---

## 🗂️ ОСНОВНЫЕ ГРУППЫ МОДЕЛЕЙ

### 1. 👥 Пользователи и клиенты
### 2. 📦 Каталог товаров
### 3. 📄 Документооборот
### 4. 🔔 Уведомления и история
### 5. ⚙️ Системные настройки

---

## 1. 👥 ПОЛЬЗОВАТЕЛИ И КЛИЕНТЫ

### User (Пользователи системы)
```prisma
users:
  - id: String (cuid) - уникальный ID
  - email: String (unique) - email пользователя
  - password_hash: String - хеш пароля
  - first_name, last_name, middle_name: String - ФИО
  - role: String (default: "admin") - роль (admin, complectator, executor)
  - is_active: Boolean (default: true) - активен ли пользователь
  - last_login: DateTime? - последний вход
  - created_at, updated_at: DateTime - даты создания/обновления

Связи:
  - document_comments[] - комментарии к документам
  - document_history[] - история изменений документов
  - notifications[] - уведомления пользователя
```

### Client (Клиенты)
```prisma
clients:
  - id: String (cuid) - уникальный ID
  - firstName, lastName, middleName: String - ФИО клиента
  - phone: String - телефон (индексирован)
  - address: String - адрес
  - objectId: String - ID объекта
  - compilationLeadNumber: String? - номер лида комплектации
  - customFields: String (JSON, default: "{}") - произвольные поля
  - isActive: Boolean (default: true) - активен ли клиент
  - createdAt, updatedAt: DateTime - даты создания/обновления

Связи:
  - quotes[] - коммерческие предложения
  - invoices[] - счета
  - orders[] - заказы
  - documents[] - документы
  - notifications[] - уведомления

Индексы:
  - phone, firstName+lastName
```

---

## 2. 📦 КАТАЛОГ ТОВАРОВ

### CatalogCategory (Категории каталога)
```prisma
catalog_categories:
  - id: String (cuid) - уникальный ID
  - name: String - название категории
  - parent_id: String? - ID родительской категории (для иерархии)
  - level: Int (default: 0) - уровень в иерархии
  - path: String - путь в иерархии (индексирован)
  - sort_order: Int (default: 0) - порядок сортировки
  - is_active: Boolean (default: true) - активна ли категория
  - products_count: Int (default: 0) - количество товаров
  - created_at, updated_at: DateTime

Связи:
  - parent (self-reference) - родительская категория
  - subcategories[] - дочерние категории
  - products[] - товары в категории
  - property_assignments[] - назначения свойств
  - export_settings[] - настройки экспорта
  - import_templates[] - шаблоны импорта

Индексы:
  - parent_id, path
```

### Product (Товары)
```prisma
products:
  - id: String (cuid) - уникальный ID
  - catalog_category_id: String - ID категории
  - sku: String (unique) - артикул товара
  - name: String - название
  - description: String? - описание
  - brand, model, series: String? - бренд, модель, серия
  - base_price: Float - базовая цена
  - currency: String (default: "RUB") - валюта
  - stock_quantity: Int (default: 0) - количество на складе
  - min_order_qty: Int (default: 1) - минимальный заказ
  - weight: Float? - вес
  - dimensions: String (JSON, default: "{}") - размеры
  - specifications: String (JSON, default: "{}") - характеристики
  - properties_data: String (JSON, default: "{}") - данные свойств
  - tags: String (JSON, default: "[]") - теги
  - is_active: Boolean (default: true) - активен ли товар
  - is_featured: Boolean (default: false) - рекомендованный товар
  - created_at, updated_at: DateTime

Связи:
  - catalog_category - категория товара
  - images[] - изображения товара

Индексы:
  - catalog_category_id, is_active, created_at, properties_data
```

### ProductImage (Изображения товаров)
```prisma
product_images:
  - id: String (cuid) - уникальный ID
  - product_id: String - ID товара
  - filename: String - имя файла
  - original_name: String - оригинальное имя
  - url: String - URL изображения
  - alt_text: String? - альтернативный текст
  - width, height: Int? - размеры
  - file_size: Int? - размер файла
  - mime_type: String - MIME тип
  - is_primary: Boolean (default: false) - главное изображение
  - sort_order: Int (default: 0) - порядок сортировки
  - created_at: DateTime

Связи:
  - product - товар

Индексы:
  - product_id, is_primary
```

### ProductProperty (Свойства товаров)
```prisma
product_properties:
  - id: String (cuid) - уникальный ID
  - name: String (unique) - название свойства
  - type: String - тип свойства
  - description: String? - описание
  - options: String? - варианты значений (JSON)
  - is_required: Boolean (default: false) - обязательное ли
  - is_active: Boolean (default: true) - активно ли
  - created_at, updated_at: DateTime

Связи:
  - category_assignments[] - назначения по категориям
```

### CategoryPropertyAssignment (Назначения свойств категориям)
```prisma
category_property_assignments:
  - id: String (cuid) - уникальный ID
  - catalog_category_id: String - ID категории
  - product_property_id: String - ID свойства
  - is_required: Boolean (default: false) - обязательное ли для категории
  - is_for_calculator: Boolean (default: false) - используется в калькуляторе
  - is_for_export: Boolean (default: false) - используется при экспорте
  - sort_order: Int (default: 0) - порядок сортировки
  - created_at, updated_at: DateTime

Связи:
  - catalog_category - категория
  - product_property - свойство

Уникальный индекс:
  - catalog_category_id + product_property_id
```

### PropertyPhoto (Фото свойств)
```prisma
property_photos:
  - id: String (cuid) - уникальный ID
  - categoryId: String - ID категории
  - propertyName: String - название свойства
  - propertyValue: String - значение свойства
  - photoPath: String - путь к фото
  - photoType: String (default: "cover") - тип фото (cover, gallery_1, etc.)
  - originalFilename: String? - оригинальное имя файла
  - fileSize: Int? - размер файла
  - mimeType: String? - MIME тип
  - created_at, updated_at: DateTime

Уникальный индекс:
  - categoryId + propertyName + propertyValue + photoType

Индексы:
  - categoryId, propertyName, propertyValue, photoType
```

---

## 3. 📄 ДОКУМЕНТООБОРОТ

**Важно:** Order является основным документом, все остальные создаются на его основе.

### Order (Заказ) - ОСНОВНОЙ ДОКУМЕНТ ⭐
```prisma
orders:
  - id: String (cuid) - уникальный ID
  - number: String (unique) - номер заказа (например, "Заказ-123")
  - client_id: String - ID клиента
  - invoice_id: String? - ID счета (one-to-one связь)
  - lead_number: String? - номер лида
  - complectator_id: String? - ID комплектатора
  - executor_id: String? - ID исполнителя
  - status: String (default: "NEW_PLANNED") - статус заказа
  
  // Данные проекта
  - project_file_url: String? - URL файла проекта/планировки
  - door_dimensions: String? (JSON) - размеры дверей
  - measurement_done: Boolean (default: false) - был ли проведен замер
  - project_complexity: String? - "SIMPLE" | "COMPLEX" | null
  
  // Файлы
  - wholesale_invoices: String? (JSON) - массив URL оптовых счетов
  - technical_specs: String? (JSON) - массив URL техзаданий
  
  // Проверка
  - verification_status: String? - "PENDING" | "VERIFIED" | "FAILED"
  - verification_notes: String? - примечания проверки
  
  // Дедубликация
  - parent_document_id: String? (null для Order) - родительский документ
  - cart_session_id: String? - сессия корзины
  - cart_data: String? (JSON) - данные корзины
  - total_amount: Float? - общая сумма
  
  - notes: String? - примечания
  - created_at, updated_at: DateTime

Связи:
  - client - клиент
  - invoice - счет (one-to-one через invoice_id)

Индексы:
  - client_id, status, invoice_id, executor_id, created_at, parent_document_id, cart_session_id

Статусы:
  NEW_PLANNED → UNDER_REVIEW → AWAITING_MEASUREMENT → AWAITING_INVOICE → COMPLETED
  CANCELLED (из любого статуса)
```

### Invoice (Счет)
```prisma
invoices:
  - id: String (cuid) - уникальный ID
  - number: String (unique) - номер счета (например, "Счет-1701234567890")
  - parent_document_id: String? - ID родительского документа (Order)
  - cart_session_id: String? - сессия корзины
  - order_id: String? (unique) - ID заказа (one-to-one связь)
  - client_id: String - ID клиента
  - created_by: String - ID создателя
  - status: String (default: "DRAFT") - статус счета
  - invoice_date: DateTime (default: now()) - дата счета
  - due_date: DateTime? - срок оплаты
  - subtotal: Float (default: 0) - подытог
  - tax_amount: Float (default: 0) - налог
  - total_amount: Float (default: 0) - итоговая сумма
  - currency: String (default: "RUB") - валюта
  - notes: String? - примечания
  - cart_data: String? (JSON) - данные корзины
  - created_at, updated_at: DateTime

Связи:
  - client - клиент
  - invoice_items[] - позиции счета
  - order - заказ (one-to-one через order_id)

Индексы:
  - client_id, status, created_at, created_by, parent_document_id, order_id

Статусы:
  DRAFT → SENT → PAID → ORDERED → RECEIVED_FROM_SUPPLIER → COMPLETED
  CANCELLED (из любого статуса)
```

### InvoiceItem (Позиции счета)
```prisma
invoice_items:
  - id: String (cuid) - уникальный ID
  - invoice_id: String - ID счета
  - product_id: String - ID товара
  - quantity: Int - количество
  - unit_price: Float - цена за единицу
  - total_price: Float - итоговая цена
  - notes: String? - примечания

Связи:
  - invoice - счет

Индексы:
  - invoice_id, product_id
```

### Quote (Коммерческое предложение)
```prisma
quotes:
  - id: String (cuid) - уникальный ID
  - number: String (unique) - номер КП (например, "КП-1701234567890")
  - parent_document_id: String? - ID родительского документа (Order)
  - cart_session_id: String? - сессия корзины
  - client_id: String - ID клиента
  - created_by: String - ID создателя
  - status: String (default: "DRAFT") - статус КП
  - valid_until: DateTime? - срок действия
  - subtotal: Float (default: 0) - подытог
  - tax_amount: Float (default: 0) - налог
  - total_amount: Float (default: 0) - итоговая сумма
  - currency: String (default: "RUB") - валюта
  - notes: String? - примечания
  - terms: String? - условия
  - cart_data: String? (JSON) - данные корзины
  - created_at, updated_at: DateTime

Связи:
  - client - клиент
  - quote_items[] - позиции КП

Индексы:
  - client_id, status, created_at, created_by

Статусы:
  DRAFT → SENT → ACCEPTED или REJECTED
  CANCELLED (из любого статуса)
```

### QuoteItem (Позиции КП)
```prisma
quote_items:
  - id: String (cuid) - уникальный ID
  - quote_id: String - ID КП
  - product_id: String - ID товара
  - quantity: Int - количество
  - unit_price: Float - цена за единицу
  - total_price: Float - итоговая цена
  - notes: String? - примечания

Связи:
  - quote - КП

Индексы:
  - quote_id, product_id
```

### SupplierOrder (Заказ у поставщика)
```prisma
supplier_orders:
  - id: String (cuid) - уникальный ID
  - number: String? - номер заказа (например, "SUPPLIER-Заказ-123")
  - parent_document_id: String? - ID родительского документа (Order)
  - cart_session_id: String? - сессия корзины
  - executor_id: String - ID исполнителя
  - supplier_name: String - название поставщика
  - supplier_email: String? - email поставщика
  - supplier_phone: String? - телефон поставщика
  - status: String (default: "PENDING") - статус заказа
  - order_date: DateTime (default: now()) - дата заказа
  - expected_date: DateTime? - ожидаемая дата поставки
  - notes: String? - примечания
  - cart_data: String? (JSON) - данные корзины
  - total_amount: Float? - общая сумма
  - created_at, updated_at: DateTime

Индексы:
  - executor_id, status, created_at, parent_document_id

Статусы:
  PENDING → ORDERED → RECEIVED_FROM_SUPPLIER → COMPLETED
  CANCELLED (из любого статуса)
```

### Document (Универсальный документ - устаревший)
```prisma
documents:
  - id: String (cuid) - уникальный ID
  - clientId: String - ID клиента
  - type: String - тип ('quote', 'invoice', 'order')
  - status: String (default: "draft") - статус
  - content: String (JSON) - содержимое документа
  - documentData: String? (JSON) - дополнительные данные
  - created_at, updated_at: DateTime

Связи:
  - client - клиент
```

---

## 4. 🔔 УВЕДОМЛЕНИЯ И ИСТОРИЯ

### Notification (Уведомления)
```prisma
notifications:
  - id: String (cuid) - уникальный ID
  - user_id: String - ID пользователя
  - client_id: String? - ID клиента (опционально)
  - document_id: String? - ID документа (опционально)
  - type: String - тип уведомления (invoice_paid, status_changed, etc.)
  - title: String - заголовок
  - message: String - текст уведомления
  - is_read: Boolean (default: false) - прочитано ли
  - created_at: DateTime

Связи:
  - user - пользователь
  - client - клиент (опционально)

Индексы:
  - user_id, is_read, created_at
```

### DocumentComment (Комментарии к документам)
```prisma
document_comments:
  - id: String (cuid) - уникальный ID
  - document_id: String - ID документа (quote, invoice, supplier_order)
  - user_id: String - ID пользователя, оставившего комментарий
  - text: String - текст комментария
  - created_at, updated_at: DateTime

Связи:
  - user - пользователь

Индексы:
  - document_id, user_id, created_at
```

### DocumentHistory (История изменений документов)
```prisma
document_history:
  - id: String (cuid) - уникальный ID
  - document_id: String - ID документа
  - user_id: String - ID пользователя, совершившего действие
  - action: String - тип действия (status_change, created, updated, etc.)
  - old_value: String? - старое значение
  - new_value: String? - новое значение
  - details: String? (JSON) - дополнительные детали
  - created_at: DateTime

Связи:
  - user - пользователь

Индексы:
  - document_id, user_id, action, created_at
```

---

## 5. ⚙️ СИСТЕМНЫЕ НАСТРОЙКИ

### SystemSetting (Системные настройки)
```prisma
system_settings:
  - id: String (cuid) - уникальный ID
  - key: String (unique) - ключ настройки
  - value: String - значение настройки
  - description: String? - описание
  - created_at, updated_at: DateTime
```

### ImportTemplate (Шаблоны импорта)
```prisma
import_templates:
  - id: String (cuid) - уникальный ID
  - catalog_category_id: String (unique) - ID категории каталога
  - name: String - название шаблона
  - description: String? - описание
  - required_fields: String (JSON, default: "[]") - обязательные поля
  - calculator_fields: String (JSON, default: "[]") - поля для калькулятора
  - export_fields: String (JSON, default: "[]") - поля для экспорта
  - template_config: String? (JSON) - конфигурация шаблона
  - field_mappings: String? (JSON) - маппинг полей
  - validation_rules: String? (JSON) - правила валидации
  - is_active: Boolean (default: true) - активен ли шаблон
  - created_at, updated_at: DateTime

Связи:
  - catalog_category - категория каталога
  - import_history[] - история импортов

Индексы:
  - catalog_category_id
```

### ImportHistory (История импортов)
```prisma
import_history:
  - id: String (cuid) - уникальный ID
  - template_id: String? - ID шаблона
  - catalog_category_id: String - ID категории каталога
  - filename: String - имя файла
  - file_size: Int? - размер файла
  - imported_count: Int (default: 0) - количество импортированных записей
  - error_count: Int (default: 0) - количество ошибок
  - status: String (default: "pending") - статус импорта
  - errors: String (JSON, default: "[]") - список ошибок
  - import_data: String? (JSON) - данные импорта
  - created_at: DateTime

Связи:
  - template - шаблон импорта

Индексы:
  - template_id
```

### ExportSetting (Настройки экспорта)
```prisma
export_settings:
  - id: String (cuid) - уникальный ID
  - catalog_category_id: String - ID категории каталога
  - export_type: String - тип экспорта
  - fields_config: String (JSON, default: "[]") - конфигурация полей
  - display_config: String (JSON, default: "{}") - конфигурация отображения
  - created_at, updated_at: DateTime

Связи:
  - catalog_category - категория каталога

Уникальный индекс:
  - catalog_category_id + export_type
```

### FrontendCategory (Фронтенд категории)
```prisma
frontend_categories:
  - id: String (cuid) - уникальный ID
  - name: String - название
  - slug: String (unique) - URL slug
  - description: String? - описание
  - icon: String? - иконка
  - catalog_category_ids: String (JSON, default: "[]") - массив ID категорий каталога
  - display_config: String (JSON, default: "{}") - конфигурация отображения
  - property_mapping: String? (JSON) - маппинг свойств
  - photo_mapping: String? (JSON) - маппинг фото
  - photo_data: String? (JSON) - данные фото
  - is_active: Boolean (default: true) - активна ли категория
  - created_at, updated_at: DateTime

Индексы:
  - slug
```

### ConstructorConfig (Конфигурации конструкторов)
```prisma
constructor_configs:
  - id: String (cuid) - уникальный ID
  - name: String - название
  - description: String? - описание
  - config: String (JSON) - конфигурация конструктора
  - is_active: Boolean (default: true) - активна ли конфигурация
  - created_at, updated_at: DateTime
```

### Page (Страницы)
```prisma
pages:
  - id: String (cuid) - уникальный ID
  - title: String - заголовок страницы
  - description: String (default: "") - описание
  - url: String (unique) - URL страницы
  - isPublished: Boolean (default: false) - опубликована ли
  - createdAt, updatedAt: DateTime

Связи:
  - elements[] - элементы страницы
```

### PageElement (Элементы страницы)
```prisma
page_elements:
  - id: String (cuid) - уникальный ID
  - pageId: String - ID страницы
  - type: String - тип элемента
  - props: String (JSON, default: "{}") - свойства элемента
  - position: String (JSON, default: "{}") - позиция {x, y}
  - size: String (JSON, default: "{}") - размер {width, height}
  - zIndex: Int (default: 0) - z-index
  - parentId: String? - ID родительского элемента
  - createdAt, updatedAt: DateTime

Связи:
  - page - страница
```

---

## 🔗 СВЯЗИ МЕЖДУ ДОКУМЕНТАМИ

### Цепочка документов:

```
Order (Заказ) - ОСНОВНОЙ ДОКУМЕНТ
  ├── Invoice (Счет) - one-to-one через order_id
  ├── Quote (КП) - many через parent_document_id
  └── SupplierOrder (Заказ у поставщика) - many через parent_document_id
```

### Универсальные поля связей:

1. **`parent_document_id`** (String?)
   - Ссылка на родительский документ
   - `null` для Order (основной документ)
   - `order_id` для Invoice, Quote, SupplierOrder

2. **`cart_session_id`** (String?)
   - Сессия корзины для группировки документов
   - Используется для дедубликации

3. **`cart_data`** (String? JSON)
   - Данные корзины для перегенерации
   - Используется для дедубликации

### Специальные связи:

- **Order ↔ Invoice**: One-to-one
  - `Order.invoice_id` → `Invoice.id`
  - `Invoice.order_id` → `Order.id` (@unique)

---

## 📊 ИНДЕКСЫ И ОПТИМИЗАЦИЯ

Основные индексы созданы для:
- Связей (`client_id`, `order_id`, `invoice_id`, etc.)
- Частых запросов (`status`, `created_at`, `is_active`)
- Поиска (`phone`, `email`, `number`)
- Уникальности (`@unique` для важных полей)

---

## 🔄 ЖИЗНЕННЫЕ ЦИКЛЫ ДОКУМЕНТОВ

См. документацию:
- `docs/DOCUMENT_LOGIC_COMPLETE.md` - полная логика документов
- `docs/DOCUMENT_LINKS_LOGIC.md` - логика связей документов

---

**Обновлено:** 2025-01-05

