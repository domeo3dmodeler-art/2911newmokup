# 🏗️ Полная архитектура проекта Domeo

**Версия документа**: 1.0  
**Дата создания**: 2025-11-01  
**Статус**: Production

---

## 📋 Оглавление

1. [Общее описание проекта](#общее-описание-проекта)
2. [Технологический стек](#технологический-стек)
3. [Архитектура приложения](#архитектура-приложения)
4. [Структура проекта](#структура-проекта)
5. [База данных](#база-данных)
6. [Модули и функционал](#модули-и-функционал)
7. [API Архитектура](#api-архитектура)
8. [Инфраструктура](#инфраструктура)
9. [CI/CD](#cicd)
10. [Безопасность и авторизация](#безопасность-и-авторизация)
11. [Хранилище данных](#хранилище-данных)

---

## 📖 Общее описание проекта

**Domeo** — это NoCode платформа для создания конфигураторов товаров и управления продажами. Система предназначена для работы с каталогом товаров (двери, фурнитура), создания коммерческих предложений, счетов, заказов и управления клиентской базой.

### Основные возможности:
- **Управление каталогом**: Импорт/экспорт товаров, категории, свойства
- **Конфигураторы**: NoCode конструкторы для создания конфигураторов товаров
- **Документооборот**: Генерация КП, счетов, заказов с PDF экспортом
- **Клиентская база**: Управление клиентами и их документами
- **Аналитика**: Статистика по котировкам и продажам
- **Многоролевая система**: Админ, комплектатор, исполнитель

---

## 🔧 Технологический стек

### Frontend
- **Framework**: Next.js 15.5.6 (App Router)
- **UI Library**: React 19.2.0
- **Language**: TypeScript 5.5.4
- **Styling**: Tailwind CSS 3.3.10
- **UI Components**: 
  - Radix UI (доступность)
  - Lucide React (иконки)
  - Sonner (уведомления)
  - React DnD (drag & drop)
- **State Management**: React Context API
- **Forms**: Native React forms с валидацией

### Backend
- **Runtime**: Node.js (в контейнере)
- **API Framework**: Next.js API Routes
- **ORM**: Prisma 5.22.0
- **Authentication**: JWT (jose 6.1.0)
- **Password Hashing**: bcryptjs 2.4.3
- **PDF Generation**: Puppeteer 24.25.0, Chromium
- **Excel Export**: ExcelJS 4.4.0, XLSX 0.18.5
- **Templates**: Handlebars 4.7.8

### База данных
- **Production**: PostgreSQL 15-alpine
- **Development**: SQLite (через Prisma)
- **ORM**: Prisma Client

### Инфраструктура
- **Containerization**: Docker
- **Orchestration**: Kubernetes (Managed K8s Yandex Cloud)
- **Registry**: Yandex Container Registry
- **Cloud Provider**: Yandex Cloud (ru-central1-b)
- **Load Balancer**: Yandex Network Load Balancer (NLB)
- **Storage**: PersistentVolumeClaim (PVC) для uploads

### DevOps
- **CI/CD**: GitHub Actions (скрипты в репозитории)
- **Configuration Management**: Kustomize
- **Monitoring**: Prometheus (конфигурация в проекте)
- **Logging**: Winston 3.11.0

---

## 🏛️ Архитектура приложения

### Общая архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Yandex Cloud                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Network Load Balancer (NLB)               │  │
│  │         External IP: 158.160.202.117:80          │  │
│  └──────────────────────────────────────────────────┘  │
│                        │                                 │
│                        ▼                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │      Kubernetes Cluster (cat9eenl393qj44riti4)   │  │
│  │  ┌────────────────────────────────────────────┐  │  │
│  │  │  Namespace: prod                           │  │  │
│  │  │  ┌──────────────────┐  ┌────────────────┐  │  │  │
│  │  │  │  Deployment: app │  │ StatefulSet:   │  │  │  │
│  │  │  │  Replicas: 2     │  │ postgres       │  │  │  │
│  │  │  │  Port: 3001      │  │ Port: 5432     │  │  │  │
│  │  │  └──────────────────┘  └────────────────┘  │  │  │
│  │  │         │                     │             │  │  │
│  │  │         └─────────┬───────────┘             │  │  │
│  │  │                   ▼                         │  │  │
│  │  │         ┌──────────────────┐                │  │  │
│  │  │         │  PVC: app-uploads │                │  │  │
│  │  │         │  5Gi, ReadWriteOnce│               │  │  │
│  │  │         └──────────────────┘                │  │  │
│  │  └────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Архитектура приложения (Next.js)

```
┌─────────────────────────────────────────────────────────┐
│                      Next.js App                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │           App Router (app/)                       │   │
│  │  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │  Pages       │  │  API Routes              │  │   │
│  │  │  (React SSR) │  │  (Server Actions)        │  │   │
│  │  └──────────────┘  └──────────────────────────┘  │   │
│  │         │                      │                  │   │
│  │         └──────────┬───────────┘                  │   │
│  │                    ▼                              │   │
│  │         ┌──────────────────────┐                  │   │
│  │         │  Middleware          │                  │   │
│  │         │  (Auth & Routing)    │                  │   │
│  │         └──────────────────────┘                  │   │
│  └──────────────────────────────────────────────────┘   │
│         │                     │                         │
│         ▼                     ▼                         │
│  ┌──────────────┐    ┌──────────────────┐             │
│  │  Components  │    │  lib/            │             │
│  │  (UI/Logic)  │    │  (Services/Utils)│             │
│  └──────────────┘    └──────────────────┘             │
│         │                     │                         │
│         └──────────┬──────────┘                         │
│                    ▼                                    │
│         ┌──────────────────────┐                        │
│         │  Prisma Client       │                        │
│         └──────────────────────┘                        │
│                    │                                     │
│                    ▼                                     │
│         ┌──────────────────────┐                        │
│         │  PostgreSQL          │                        │
│         │  (K8s StatefulSet)   │                        │
│         └──────────────────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Структура проекта

```
domeo/
├── app/                          # Next.js App Router
│   ├── admin/                   # Админ-панель
│   │   ├── analytics/           # Аналитика
│   │   ├── catalog/             # Управление каталогом
│   │   ├── categories/          # Управление категориями
│   │   ├── clients/             # Управление клиентами
│   │   ├── configurator/        # Конфигуратор
│   │   ├── doors/               # Специфичные функции для дверей
│   │   ├── import/              # Импорт данных
│   │   ├── products/            # Управление товарами
│   │   ├── settings/            # Настройки
│   │   └── users/               # Управление пользователями
│   │
│   ├── api/                     # API Routes (Backend)
│   │   ├── admin/               # Админ API
│   │   │   ├── import/          # Импорт данных
│   │   │   ├── export/          # Экспорт данных
│   │   │   ├── categories/      # API категорий
│   │   │   ├── products/        # API товаров
│   │   │   └── analytics/       # API аналитики
│   │   ├── auth/                # Аутентификация
│   │   ├── catalog/             # API каталога
│   │   ├── clients/             # API клиентов
│   │   ├── documents/           # API документов (КП, счета, заказы)
│   │   ├── quotes/              # API котировок
│   │   ├── invoices/            # API счетов
│   │   ├── orders/              # API заказов
│   │   ├── cart/                # API корзины
│   │   ├── calculator/          # API калькулятора
│   │   ├── notifications/        # API уведомлений
│   │   └── health/              # Health check
│   │
│   ├── catalog/                 # Публичный каталог
│   ├── doors/                   # Страница дверей
│   ├── login/                   # Страница входа
│   ├── quotes/                  # Просмотр котировок
│   ├── invoices/                # Просмотр счетов
│   ├── orders/                  # Просмотр заказов
│   ├── configurator/            # Конфигуратор (публичный)
│   ├── constructor/             # Конструктор (публичный)
│   └── layout.tsx               # Корневой layout
│
├── components/                   # React компоненты
│   ├── admin/                   # Компоненты админ-панели
│   ├── analytics/               # Компоненты аналитики
│   ├── cart/                    # Компоненты корзины
│   ├── category-builder/         # Построитель категорий
│   ├── configurator/             # Компоненты конфигуратора
│   ├── constructor/             # Компоненты конструктора
│   ├── documents/                # Компоненты документов
│   ├── export/                   # Компоненты экспорта
│   ├── import/                   # Компоненты импорта
│   ├── nocode/                  # NoCode компоненты
│   ├── page-builder/            # Построитель страниц
│   ├── ui/                      # Базовые UI компоненты
│   └── layout/                   # Компоненты макета
│
├── lib/                          # Утилиты и сервисы
│   ├── auth/                    # Аутентификация
│   ├── analytics/               # Аналитика
│   ├── calculator/              # Калькулятор
│   ├── cart/                    # Сервисы корзины
│   ├── documents/               # Генерация документов
│   ├── export/                  # Экспорт (PDF, Excel)
│   ├── import/                  # Импорт данных
│   ├── notifications/           # Уведомления
│   ├── pdf/                     # PDF генерация
│   ├── prisma.ts                # Prisma Client
│   ├── db.ts                    # Database utilities
│   └── services/                # Бизнес-логика
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma            # Схема базы данных
│   └── migrations/              # Миграции БД
│
├── k8s/                         # Kubernetes манифесты
│   ├── base/                    # Базовые манифесты
│   │   ├── deployment.yaml      # Deployment приложения
│   │   ├── service.yaml         # Service (LoadBalancer)
│   │   ├── postgres.yaml        # PostgreSQL StatefulSet
│   │   ├── uploads-pvc.yaml    # PVC для фото
│   │   ├── configmap.yaml       # ConfigMap
│   │   ├── secret.yaml          # Secrets
│   │   └── kustomization.yaml   # Kustomize конфигурация
│   └── overlays/
│       └── prod/               # Production overlay
│           └── kustomization.yaml
│
├── scripts/                     # Скрипты
│   ├── build_and_push.ps1       # Сборка и пуш образа
│   ├── rollout.sh               # Деплой новой версии
│   ├── rollback.sh              # Откат версии
│   └── run_db_migration.sh      # Миграции БД
│
├── backup/                      # Резервные копии
│   ├── prod_seed_clean.sql     # Бэкап БД
│   └── uploads_backup.tar.gz   # Бэкап фото
│
├── public/                      # Статические файлы
│   └── uploads/                # Загруженные файлы (локально)
│
├── hooks/                       # React hooks
├── types/                       # TypeScript типы
├── middleware.ts                # Next.js middleware (auth)
├── package.json                 # Зависимости
├── next.config.mjs              # Next.js конфигурация
├── tailwind.config.js           # Tailwind конфигурация
└── tsconfig.json                # TypeScript конфигурация
```

---

## 🗄️ База данных

### Обзор

База данных использует PostgreSQL 15 и управляется через Prisma ORM. Схема включает **28 основных таблиц**, организованных по функциональным областям.

### Основные сущности

#### 1. **Пользователи и авторизация**
- `users` — пользователи системы (админы, комплектаторы, исполнители)
  - Роли: `admin`, `complectator`, `executor`
  - JWT аутентификация

#### 2. **Каталог товаров**
- `catalog_categories` — иерархические категории товаров
  - Поддержка многоуровневой структуры (parent_id)
  - Path для быстрого поиска
- `products` — товары каталога
  - SKU (уникальный артикул)
  - Динамические свойства в JSON (`properties_data`)
  - Связь с категориями
- `product_images` — изображения товаров
- `product_properties` — определения свойств товаров
  - Типы: text, number, select, etc.
- `category_property_assignments` — привязка свойств к категориям

#### 3. **Клиенты и документы**
- `clients` — клиенты компании
  - Персональные данные
  - Кастомные поля (JSON)
- `quotes` — коммерческие предложения (КП)
- `quote_items` — позиции КП
- `invoices` — счета на оплату
- `invoice_items` — позиции счетов
- `orders` — заказы клиентов
- `order_items` — позиции заказов
- `supplier_orders` — заказы поставщикам
- `documents` — универсальная таблица документов

#### 4. **Связи документов**
- `parent_document_id` — ссылка на родительский документ (КП → Счет → Заказ)
- `cart_session_id` — группировка документов одной корзины
- `cart_data` — JSON данных корзины для перегенерации

#### 5. **Фото товаров**
- `property_photos` — привязка фото к комбинациям свойств
  - `categoryId` + `propertyName` + `propertyValue` → `photoPath`
  - Типы фото: `cover`, `gallery_1`, `gallery_2`, etc.

#### 6. **Импорт/Экспорт**
- `import_templates` — шаблоны импорта для категорий
  - Маппинг полей
  - Валидация
- `import_history` — история импортов
- `export_settings` — настройки экспорта

#### 7. **Конструкторы и конфигураторы**
- `constructor_configs` — конфигурации конструкторов
- `constructor_configurations` — устаревшая таблица
- `frontend_categories` — категории для фронтенда
- `page` — страницы конструктора
- `page_elements` — элементы страниц

#### 8. **Уведомления и история**
- `notifications` — уведомления пользователям
- `document_comments` — комментарии к документам
- `document_history` — история изменений документов

#### 9. **Системные настройки**
- `system_settings` — системные параметры

### Диаграмма связей (основные)

```
users
  ├── document_comments
  ├── document_history
  └── notifications

clients
  ├── quotes
  ├── invoices
  ├── orders
  ├── documents
  └── notifications

catalog_categories
  ├── products
  ├── category_property_assignments
  ├── export_settings
  └── import_templates

products
  ├── product_images
  └── quote_items / invoice_items / order_items

quotes / invoices / orders
  ├── quote_items / invoice_items / order_items
  └── (parent_document_id связь)

property_photos (standalone)
```

### Индексы и производительность

- Индексы на внешние ключи (`catalog_category_id`, `client_id`, etc.)
- GIN индексы на JSON поля (`properties_data`)
- Составные индексы для поиска фото
- Индексы на даты для истории

### Миграции

⚠️ **ВАЖНО**: Миграции БД отключены в CI/CD
- Схема БД стабильна и не меняется автоматически
- Изменения схемы выполняются только вручную после бэкапа
- Текущая схема восстановлена из тестовой ВМ

---

## 🧩 Модули и функционал

### 1. Управление каталогом (Catalog Management)

#### Импорт товаров
- **Универсальный импорт**: `/admin/catalog/import`
  - Поддержка Excel/CSV
  - Маппинг полей через шаблоны
  - Валидация обязательных полей
  - Исправление кодировки UTF-8
- **Специализированный импорт**: 
  - Импорт дверей (`/admin/import/doors`)
  - Импорт фото (`/admin/import/photos`)
- **История импорта**: Логирование всех импортов с ошибками

#### Экспорт товаров
- **Экспорт прайс-листов**: Excel/XLSX
- **Экспорт конфигураций**: JSON для калькуляторов
- **Быстрый экспорт**: `/api/admin/export/fast`

#### Управление категориями
- **Иерархическая структура**: Древовидная структура категорий
- **Построитель категорий**: NoCode инструмент для настройки категорий
- **Привязка свойств**: Настройка свойств для каждой категории

### 2. Конфигураторы и конструкторы

#### Конфигуратор товаров (`/configurator`)
- NoCode построитель конфигураторов
- Привязка категорий каталога
- Формулы расчета цены
- Экспорт конфигураций

#### Конструктор страниц (`/constructor`)
- Drag & Drop построитель
- Блоки: каталог, детали товара, корзина
- Настройка свойств и отображения
- Превью в реальном времени
- Профессиональный режим

#### Page Builder (`/page-builder`)
- Полнофункциональный построитель страниц
- Элементы: текст, изображения, формы, каталог
- Шаблоны страниц
- Публикация страниц

### 3. Документооборот

#### Генерация документов
- **Коммерческие предложения (КП)**
  - Генерация из корзины
  - PDF экспорт с шаблонами Handlebars
  - Нумерация: `КП-{timestamp}`
- **Счета на оплату**
  - Связь с родительским КП
  - Дата оплаты (due_date)
- **Заказы клиентов**
  - Дата доставки
  - Статусы: PENDING, PROCESSING, DELIVERED, CANCELLED
- **Заказы поставщикам**
  - Экспорт в Excel для фабрик
  - Статусы и отслеживание

#### Дедупликация документов
- Предотвращение создания дубликатов
- Сравнение по `cart_session_id`, `client_id`, `items`, `total_amount`
- Возврат существующего документа при совпадении

#### Связи документов
- `parent_document_id` — цепочка: КП → Счет → Заказ
- `cart_session_id` — группировка документов одной корзины
- История изменений
- Комментарии к документам

### 4. Корзина (Cart)

#### Функционал корзины
- **Многокатегорийная корзина**: Товары из разных категорий
- **Сессии корзины**: Группировка по `cart_session_id`
- **Восстановление из документа**: Возможность восстановить корзину из КП/Счета/Заказа
- **Экспорт в документы**: Создание КП, счетов, заказов из корзины
- **Сохранение для клиента**: Привязка корзины к клиенту

#### Управление ценой
- Пересчет цены при изменении свойств
- Скидки и промокоды
- Валидация корзины перед экспортом

### 5. Калькулятор стоимости

#### Формулы расчета
- Привязка к категориям и свойствам
- Поддержка сложных формул
- Кэширование результатов

#### Конфигурации калькулятора
- Сохранение конфигураций в БД
- Публичный доступ к калькуляторам

### 6. Управление клиентами

#### CRM функционал
- Список клиентов
- Детали клиента
- История документов клиента
- Кастомные поля (JSON)

#### Документы клиента
- Все документы клиента в одном месте
- Фильтрация по типу (КП, счет, заказ)
- Статусы документов

### 7. Аналитика

#### Статистика котировок
- Количество КП
- Конверсия (КП → Счет → Заказ)
- Средняя сумма КП
- Графики и дашборды

#### Отчеты
- Экспорт статистики
- Фильтрация по датам
- Группировка по клиентам

### 8. Уведомления

#### Типы уведомлений
- `invoice_paid` — счет оплачен
- `status_changed` — изменение статуса документа
- `document_created` — создан новый документ

#### Система уведомлений
- Хранение в БД (`notifications`)
- Отметка прочитанных
- Привязка к пользователям и клиентам

### 9. Управление фото

#### Загрузка фото
- **Привязка к свойствам**: `categoryId` + `propertyName` + `propertyValue`
- **Типы фото**: cover, gallery_1, gallery_2, etc.
- **Массовая загрузка**: Bulk upload через интерфейс
- **Хранение**: PVC в K8s (`/app/public/uploads`)

#### Отображение фото
- Галлереи товаров
- Предпросмотр в конструкторе
- Оптимизация изображений (Next.js Image)

### 10. Админ-панель

#### Управление пользователями
- Создание пользователей
- Роли и права доступа
- Активность пользователей

#### Настройки системы
- Системные параметры
- Шаблоны документов
- Конфигурации экспорта

---

## 🌐 API Архитектура

### RESTful API Endpoints

Все API endpoints находятся в `app/api/` и используют Next.js API Routes.

#### Аутентификация (`/api/auth`)
- `POST /api/auth/login` — вход в систему
- `POST /api/auth/register` — регистрация (если доступно)

#### Каталог (`/api/catalog`)
- `GET /api/catalog/products` — список товаров
- `GET /api/catalog/products/[id]` — детали товара
- `GET /api/catalog/categories` — категории
- `GET /api/catalog/categories/tree` — дерево категорий
- `GET /api/catalog/doors/[sku]` — информация о двери по SKU
- `GET /api/catalog/doors/photos` — фото дверей
- `POST /api/catalog/import` — импорт товаров

#### Клиенты (`/api/clients`)
- `GET /api/clients` — список клиентов
- `GET /api/clients/[id]` — детали клиента
- `POST /api/clients` — создание клиента
- `GET /api/clients/[id]/documents` — документы клиента

#### Документы (`/api/documents`)
- `POST /api/documents/create` — создание документа
- `POST /api/documents/create-batch` — массовое создание
- `POST /api/documents/generate` — генерация PDF
- `GET /api/documents/[id]` — детали документа
- `GET /api/documents/[id]/chain` — цепочка документов
- `GET /api/documents/[id]/history` — история изменений
- `POST /api/documents/[id]/comments` — комментарии
- `POST /api/documents/[id]/status` — изменение статуса
- `GET /api/documents/[id]/export` — экспорт документа

#### Котировки (`/api/quotes`)
- `GET /api/quotes` — список котировок
- `POST /api/quotes/from-cart` — создание из корзины
- `GET /api/quotes/[id]` — детали котировки
- `GET /api/quotes/[id]/export` — экспорт PDF

#### Корзина (`/api/cart`)
- `POST /api/cart/save-to-client` — сохранение корзины
- `POST /api/cart/restore-from-document` — восстановление
- `POST /api/cart/export/doors` — экспорт дверей

#### Админ API (`/api/admin`)
- `POST /api/admin/import/unified` — универсальный импорт
- `POST /api/admin/import/doors` — импорт дверей
- `POST /api/admin/export/price-list` — прайс-лист
- `GET /api/admin/products` — управление товарами
- `POST /api/admin/products/bulk-edit` — массовое редактирование
- `GET /api/admin/analytics` — аналитика

#### Уведомления (`/api/notifications`)
- `GET /api/notifications` — список уведомлений
- `POST /api/notifications/[id]/read` — отметка прочитанного

#### Health Check (`/api/health`)
- `GET /api/health` — проверка работоспособности
  - Возвращает 204 (No Content) при успехе

### Формат запросов/ответов

- **Content-Type**: `application/json`
- **Аутентификация**: JWT токен в cookie (`auth-token` или `domeo-auth-token`)
- **Ответы**: JSON с полями `success`, `data`, `error`

### Обработка ошибок

- Стандартные HTTP коды: 200, 201, 400, 401, 403, 404, 500
- JSON ответы с `{ error: "message" }`
- Логирование ошибок через Winston

---

## ☁️ Инфраструктура

### Облачная инфраструктура

- **Провайдер**: Yandex Cloud
- **Регион**: ru-central1-b
- **Kubernetes**: Managed K8s кластер `cat9eenl393qj44riti4`
- **Namespace**: `prod`

### Kubernetes ресурсы

#### Deployment `app`
```yaml
replicas: 2
image: cr.yandex/crpuein3jvjccnafs2vc/app:v20251030202308
port: 3001
env:
  - NODE_ENV=production
  - PORT=3001
  - DATABASE_URL=postgresql://staging_user:staging_password@postgres:5432/domeo_staging
  - JWT_SECRET (из Secret)
probes:
  readiness: /api/health (5s initial, 10s period)
  liveness: /api/health (15s initial, 20s period)
resources:
  requests: cpu=100m, memory=128Mi
  limits: cpu=500m, memory=512Mi
volumes:
  - uploads (PVC: app-uploads, mountPath: /app/public/uploads)
```

#### Service `app`
```yaml
type: LoadBalancer
externalTrafficPolicy: Cluster
ports:
  - 80 → 3001
annotations:
  service.beta.kubernetes.io/yandex-load-balancer-type: "external"
```

#### StatefulSet `postgres`
```yaml
replicas: 1
image: postgres:15-alpine
env:
  POSTGRES_DB: domeo_staging
  POSTGRES_USER: staging_user
  POSTGRES_PASSWORD: staging_password
  PGDATA: /var/lib/postgresql/data/pgdata
volumeClaimTemplate:
  storage: 10Gi (ReadWriteOnce)
```

#### PVC `app-uploads`
```yaml
storage: 5Gi
accessMode: ReadWriteOnce
mountPath: /app/public/uploads
```

### Сеть

- **External IP**: `158.160.202.117:80`
- **Внутренний Service**: `postgres:5432` (ClusterIP)
- **Health Endpoint**: `http://158.160.202.117/api/health`

### Хранилище

1. **База данных**: PVC 10Gi для PostgreSQL
2. **Фото**: PVC 5Gi для uploads (575 файлов, ~74MB)
3. **Резервные копии**: Локальные файлы в `backup/`

### Конфигурация (Kustomize)

- **Base**: `k8s/base/` — общие манифесты
- **Overlay**: `k8s/overlays/prod/` — production специфичные настройки
- **Image tag**: Управляется через `kustomization.yaml`

---

## 🔄 CI/CD

### Процесс деплоя

#### Сборка образа
```bash
# Скрипты
./scripts/build_and_push.sh app <tag>
# или Windows
./scripts/build_and_push.ps1 -ImageName app -Tag <tag>
```

#### Публикация в реестр
- **Registry**: Yandex Container Registry
- **Repository**: `cr.yandex/crpuein3jvjccnafs2vc/app`
- **Tag формат**: `v{YYYYMMDD}{HHMMSS}` (например, `v20251030202308`)

#### Деплой в K8s
```bash
# Через скрипт
./scripts/rollout.sh <tag>

# Или вручную
kubectl apply -k k8s/overlays/prod
kubectl -n prod set image deployment/app app=cr.yandex/.../app:<tag>
kubectl -n prod rollout status deploy/app
```

#### Откат
```bash
./scripts/rollback.sh
# или
kubectl -n prod rollout undo deploy/app
```

### GitHub Actions (если используется)

- **Workflow файл**: `.github/workflows/prod-deploy.yml`
- **Триггеры**: 
  - Push в `main`
  - Ручной запуск (`workflow_dispatch`)
- **Секреты**:
  - `YC_SA_KEY` — JSON ключ сервисного аккаунта
  - `IMAGE_REPO` — репозиторий образа

### ⚠️ Важные ограничения

1. **Миграции БД отключены** — схема не меняется автоматически
2. **Фиксированные учетные данные** — `staging_user`/`staging_password`
3. **Теги версий** — всегда использовать конкретные теги (не `latest`)

---

## 🔐 Безопасность и авторизация

### Аутентификация

#### JWT токены
- **Библиотека**: `jose` 6.1.0
- **Секрет**: `JWT_SECRET` (из Kubernetes Secret)
- **Хранение**: Cookie (`auth-token` или `domeo-auth-token`)
- **Срок действия**: Настраивается при генерации

#### Middleware (`middleware.ts`)
- Проверка токена для защищенных путей
- Извлечение роли из payload
- Добавление `x-user-id` и `x-user-role` в headers

### Роли и права доступа

#### Роли пользователей
1. **admin** — полный доступ
2. **complectator** — комплектатор (каталог, клиенты)
3. **executor** — исполнитель (каталог, экспорт заказов)

#### Защищенные пути

**Требуют авторизации** (любая роль):
- `/admin/*`
- `/complectator/*`
- `/executor/*`
- `/universal/*`

**Только для админов**:
- `/admin/users`
- `/admin/settings`
- `/admin/analytics`
- `/admin/categories/builder`
- `/admin/catalog/import`

**Для комплектаторов** (admin + complectator):
- `/admin/categories`
- `/admin/catalog`
- `/admin/clients`

**Для исполнителей** (admin + executor):
- `/admin/catalog`
- `/api/cart/export/doors/factory`

**Публичные пути**:
- `/`
- `/login`
- `/catalog`
- `/doors`

### Пароли

- **Хеширование**: bcryptjs
- **Хранение**: `password_hash` в таблице `users`

---

## 💾 Хранилище данных

### Файловое хранилище

#### Локальное хранилище (PVC)
- **Путь**: `/app/public/uploads`
- **Размер**: 5Gi
- **Тип**: ReadWriteOnce (монтируется на один pod)
- **Структура**: `/app/public/uploads/products/{categoryId}/{filename}`

#### Резервные копии
- **Локально**: `backup/uploads_backup.tar.gz` (~75MB)
- **Восстановление**:
  ```bash
  kubectl -n prod cp ./backup/uploads_backup.tar.gz <pod>:/tmp/
  kubectl -n prod exec <pod> -- tar xzf /tmp/uploads_backup.tar.gz -C /app/public/uploads
  ```

### База данных

#### Бэкапы
- **Локально**: `backup/prod_seed_clean.sql` (~8.5MB)
- **Создание нового бэкапа**:
  ```bash
  # На тестовой ВМ или из K8s
  pg_dump -U staging_user -d domeo_staging > backup.sql
  ```

#### Восстановление
- Миграции выполняются вручную
- Схема стабильна и не меняется автоматически

---

## 📊 Мониторинг и логирование

### Логирование

- **Библиотека**: Winston 3.11.0
- **Уровни**: error, warn, info, debug
- **Файлы**: `logs/app.log`, `logs/error.log`, `logs/access.log`

### Health Checks

- **Endpoint**: `/api/health`
- **Проверка**: HTTP GET, возвращает 204
- **Kubernetes**: Readiness и Liveness probes

### Метрики (планируется)

- Prometheus конфигурация в `monitoring/prometheus.yml`
- Alert rules в `monitoring/alert_rules.yml`

---

## 🚀 Производительность и оптимизация

### Next.js оптимизации

- **Output**: `standalone` для Docker
- **Image optimization**: WebP/AVIF форматы
- **Code splitting**: Автоматический через webpack
- **CSS optimization**: `optimizeCss: true`

### База данных

- Индексы на внешние ключи
- GIN индексы на JSON поля
- Connection pooling через Prisma

### Кэширование

- Next.js встроенное кэширование
- Кэш для уникальных значений свойств
- Кэш для формул калькулятора

---

## 📝 Заключение

Domeo — это комплексная NoCode платформа для управления каталогом товаров и документооборота. Система построена на современном стеке (Next.js 15, React 19, PostgreSQL) и развернута в Kubernetes на Yandex Cloud.

### Ключевые особенности архитектуры:
1. **Модульность**: Четкое разделение на модули (каталог, документы, корзина, конструкторы)
2. **Масштабируемость**: Kubernetes с 2 репликами приложения
3. **Безопасность**: JWT аутентификация с ролевой моделью
4. **Гибкость**: JSON поля для динамических свойств товаров
5. **Отказоустойчивость**: Health checks, PVC для данных

### Статус системы:
✅ Все системы работают  
✅ База данных и фото восстановлены в проде  
✅ Документооборот функционирует  
✅ Импорт/экспорт товаров работает  

---

**Последнее обновление**: 2025-11-01  
**Версия приложения**: v20251030202308

