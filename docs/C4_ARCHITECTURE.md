# 🏗️ C4 Architecture - Domeo Platform

**Дата создания**: 2025-11-06  
**Версия**: 1.0  
**Методология**: C4 Model (Context, Container, Component, Code)

---

## 📊 Уровень 1: System Context (Контекст системы)

### Описание
Domeo — это NoCode платформа для создания конфигураторов товаров и управления продажами. Система позволяет комплектаторам создавать коммерческие предложения, счета и заказы на основе каталога товаров.

### Диаграмма контекста

```
┌─────────────────────────────────────────────────────────────┐
│                        Пользователи                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Комплектатор │  │  Исполнитель │  │  Администратор│     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │                  │                  │
          └──────────────────┼──────────────────┘
                            │
                            │ HTTPS
                            │
          ┌─────────────────▼─────────────────┐
          │      Domeo Platform               │
          │  (Next.js Web Application)        │
          └─────────────────┬─────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          │                 │                 │
    ┌─────▼─────┐    ┌──────▼──────┐  ┌──────▼──────┐
    │PostgreSQL │    │ Yandex      │  │  GitHub     │
    │ Database  │    │ Object      │  │  (Git)      │
    │           │    │ Storage     │  │             │
    └───────────┘    └─────────────┘  └─────────────┘
```

### Актеры и их потребности

1. **Комплектатор**
   - Создание заказов из корзины
   - Экспорт документов (КП, Счета)
   - Управление статусами заказов до PAID
   - Просмотр каталога товаров

2. **Исполнитель**
   - Просмотр заказов со статусом PAID+
   - Управление статусами заказов после PAID
   - Создание заказов у поставщика

3. **Администратор**
   - Полный доступ ко всем функциям
   - Управление пользователями и каталогом
   - Импорт/экспорт данных

### Внешние системы

1. **PostgreSQL Database**
   - Хранение всех данных приложения
   - Модели: User, Client, Order, Invoice, Quote, Product, CatalogCategory

2. **Yandex Object Storage**
   - Хранение файлов (фото товаров, проекты)
   - Интеграция через SDK

3. **GitHub**
   - Версионирование кода
   - CI/CD через GitHub Actions

---

## 📦 Уровень 2: Container (Контейнеры)

### Описание контейнеров

```
┌─────────────────────────────────────────────────────────────┐
│                    Domeo Platform                            │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Web Application (Next.js)                            │  │
│  │  - React UI Components                                 │  │
│  │  - Server-Side Rendering                              │  │
│  │  - API Routes                                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  API Layer (Next.js API Routes)                        │  │
│  │  - REST API Endpoints                                 │  │
│  │  - Authentication & Authorization                      │  │
│  │  - Business Logic                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Services Layer (lib/)                                 │  │
│  │  - Document Service                                    │  │
│  │  - Export Service                                      │  │
│  │  - Catalog Service                                     │  │
│  │  - Auth Service                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Data Access Layer (Prisma ORM)                        │  │
│  │  - Database Queries                                    │  │
│  │  - Data Models                                         │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
    ┌────▼────┐         ┌────▼────┐         ┌────▼────┐
    │PostgreSQL│         │ Yandex  │         │ Browser │
    │ Database │         │ Storage │         │ (Client)│
    └──────────┘         └─────────┘         └─────────┘
```

### Технологии контейнеров

1. **Web Application**
   - Next.js 15.5.6 (App Router)
   - React 19.2.0
   - TypeScript 5.5.4
   - Tailwind CSS 3.3.10

2. **API Layer**
   - Next.js API Routes
   - JWT Authentication
   - REST API

3. **Services Layer**
   - Business Logic Services
   - Export Services (PDF, Excel)
   - Import Services
   - Document Services

4. **Data Access Layer**
   - Prisma ORM 5.22.0
   - PostgreSQL Client

---

## 🧩 Уровень 3: Component (Компоненты)

### Структура компонентов

```
┌─────────────────────────────────────────────────────────────┐
│              Web Application Container                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages Layer (app/*/page.tsx)                         │  │
│  │  ├── Dashboard Pages                                  │  │
│  │  ├── Admin Pages                                      │  │
│  │  ├── Catalog Pages                                    │  │
│  │  └── Document Pages                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Components Layer (components/)                      │  │
│  │  ├── UI Components (ui/)                            │  │
│  │  ├── Document Components (documents/)                │  │
│  │  ├── Cart Components (cart/)                        │  │
│  │  ├── Admin Components (admin/)                      │  │
│  │  └── Layout Components (layout/)                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes Layer (app/api/)                         │  │
│  │  ├── Auth API (auth/)                                │  │
│  │  ├── Documents API (documents/)                      │  │
│  │  ├── Orders API (orders/)                            │  │
│  │  ├── Catalog API (catalog/)                         │  │
│  │  ├── Export API (export/)                           │  │
│  │  └── Admin API (admin/)                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Services Layer (lib/)                                │  │
│  │  ├── Document Service                                 │  │
│  │  │   ├── Deduplication Service                       │  │
│  │  │   ├── Document Creation Service                   │  │
│  │  │   └── Status Management Service                   │  │
│  │  ├── Export Service                                   │  │
│  │  │   ├── PDF Generator (Puppeteer)                   │  │
│  │  │   ├── Excel Generator                             │  │
│  │  │   └── CSV Generator                               │  │
│  │  ├── Catalog Service                                 │  │
│  │  │   ├── Product Service                             │  │
│  │  │   ├── Category Service                            │  │
│  │  │   └── Import/Export Service                      │  │
│  │  ├── Auth Service                                    │  │
│  │  │   ├── JWT Service                                 │  │
│  │  │   ├── Permission Service                          │  │
│  │  │   └── Role Management Service                     │  │
│  │  └── Cart Service                                    │  │
│  │      ├── Cart Management                              │  │
│  │      └── Price Calculation                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Data Access Layer (Prisma)                           │  │
│  │  ├── User Repository                                  │  │
│  │  ├── Document Repository                              │  │
│  │  ├── Catalog Repository                               │  │
│  │  └── Client Repository                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Ключевые компоненты

#### 1. Document Service
- **Ответственность**: Управление жизненным циклом документов (Order, Invoice, Quote)
- **Функции**:
  - Создание документов с дедубликацией
  - Управление статусами
  - Связывание документов (parent-child)
- **Зависимости**: Prisma, Deduplication Service

#### 2. Export Service
- **Ответственность**: Генерация документов в различных форматах
- **Функции**:
  - PDF генерация через Puppeteer
  - Excel генерация через ExcelJS
  - CSV генерация
- **Зависимости**: Puppeteer, ExcelJS, Document Service

#### 3. Deduplication Service
- **Ответственность**: Предотвращение создания дубликатов документов
- **Функции**:
  - Нормализация товаров
  - Сравнение содержимого корзины
  - Поиск существующих документов
- **Зависимости**: Prisma

#### 4. Auth Service
- **Ответственность**: Аутентификация и авторизация
- **Функции**:
  - JWT генерация/валидация
  - Проверка прав доступа
  - Управление ролями
- **Зависимости**: JWT, Prisma

#### 5. Catalog Service
- **Ответственность**: Управление каталогом товаров
- **Функции**:
  - CRUD операции с товарами
  - Импорт/экспорт данных
  - Управление категориями
- **Зависимости**: Prisma, Import/Export Services

---

## 🔍 Уровень 4: Code (Код) - Ключевые классы и функции

### Document Service

```typescript
// lib/documents/deduplication.ts
export function normalizeItems(items: any[]): any[]
export function compareCartContent(items1: any[], items2String: string | null): boolean
export async function findExistingOrder(...)
export async function findExistingDocument(...)

// lib/export/puppeteer-generator.ts
export async function exportDocumentWithPDF(...)
export async function generatePDFWithPuppeteer(data: any): Promise<Buffer>
export async function generateExcelFast(data: any): Promise<Buffer>
```

### Auth Service

```typescript
// lib/auth/permissions.ts
export function canUserCreateDocument(role: string, type: string): boolean
export function canUserChangeStatus(role: string, type: string, currentStatus: string, newStatus: string): boolean

// lib/auth/jwt.ts
export function generateToken(userId: string, role: string): string
export function verifyToken(token: string): DecodedToken
```

### API Routes

```typescript
// app/api/export/fast/route.ts
export async function POST(request: NextRequest)

// app/api/documents/create/route.ts
export async function POST(req: NextRequest)

// app/api/orders/[id]/status/route.ts
export async function PUT(req: NextRequest)
```

---

## 🚨 Критические проблемы архитектуры

### Проблема 1: Дублирование логики дедубликации

**Местоположение**: 
- `lib/export/puppeteer-generator.ts` (удалено ✅)
- `lib/documents/deduplication.ts` (централизовано ✅)
- `app/api/documents/create/route.ts` (дублирование)
- `app/api/documents/create-batch/route.ts` (дублирование)

**Проблема**: Одна и та же логика реализована в нескольких местах

**Решение**: Использовать централизованные функции из `lib/documents/deduplication.ts`

---

### Проблема 2: Отсутствие слоя сервисов

**Местоположение**: Бизнес-логика разбросана по API routes

**Проблема**: 
- API routes содержат бизнес-логику напрямую
- Нет переиспользования кода
- Сложно тестировать

**Решение**: Создать слой сервисов (`lib/services/`)

---

### Проблема 3: Смешивание ответственности в API routes

**Местоположение**: `app/api/*/route.ts`

**Проблема**:
- API routes делают валидацию, бизнес-логику и работу с БД
- Нет разделения на слои

**Решение**: 
- API routes только для HTTP обработки
- Бизнес-логика в сервисах
- Валидация в отдельном слое

---

### Проблема 4: Отсутствие типизации данных

**Местоположение**: Везде используется `any`

**Проблема**:
- Нет типобезопасности
- Сложно отслеживать структуру данных
- Ошибки на этапе выполнения

**Решение**: Создать типы для всех сущностей

---

### Проблема 5: Нет централизованной обработки ошибок

**Местоположение**: Каждый API route обрабатывает ошибки по-своему

**Проблема**:
- Непоследовательная обработка ошибок
- Разные форматы ответов

**Решение**: Создать middleware для обработки ошибок

---

### Проблема 6: Прямое использование Prisma в компонентах

**Местоположение**: API routes напрямую используют `prisma`

**Проблема**:
- Нет абстракции над БД
- Сложно менять ORM
- Нет кеширования

**Решение**: Создать слой репозиториев

---

### Проблема 7: Нет валидации входных данных

**Местоположение**: API routes

**Проблема**:
- Нет валидации запросов
- Ошибки на этапе выполнения

**Решение**: Использовать Zod или Yup для валидации

---

### Проблема 8: Нет логирования

**Местоположение**: Большинство компонентов

**Проблема**:
- Сложно отлаживать
- Нет мониторинга

**Решение**: Внедрить централизованное логирование (уже есть `lib/logging/logger.ts`, но используется не везде)

---

### Проблема 9: Нет кеширования

**Местоположение**: Каталог, документы

**Проблема**:
- Медленные запросы
- Нагрузка на БД

**Решение**: Внедрить Redis или in-memory кеш

---

### Проблема 10: Нет тестов

**Местоположение**: Весь проект

**Проблема**:
- Нет автоматических тестов
- Сложно рефакторить

**Решение**: Добавить unit и integration тесты

---

## 📋 План исправления проблем

### Фаза 1: Рефакторинг дедубликации (✅ Завершено)
- [x] Удалить дублирование в `puppeteer-generator.ts`
- [x] Использовать централизованные функции

### Фаза 2: Создание слоя сервисов
- [ ] Создать `lib/services/document.service.ts`
- [ ] Создать `lib/services/export.service.ts`
- [ ] Создать `lib/services/catalog.service.ts`
- [ ] Рефакторинг API routes для использования сервисов

### Фаза 3: Создание слоя репозиториев
- [ ] Создать `lib/repositories/document.repository.ts`
- [ ] Создать `lib/repositories/catalog.repository.ts`
- [ ] Абстрагировать Prisma

### Фаза 4: Валидация и типизация
- [ ] Создать типы для всех сущностей
- [ ] Внедрить Zod для валидации
- [ ] Убрать `any` из кода

### Фаза 5: Обработка ошибок и логирование
- [ ] Создать middleware для ошибок
- [ ] Внедрить логирование везде
- [ ] Стандартизировать форматы ответов

### Фаза 6: Кеширование и оптимизация
- [ ] Внедрить Redis
- [ ] Добавить кеширование каталога
- [ ] Оптимизировать запросы к БД

### Фаза 7: Тестирование
- [ ] Добавить unit тесты для сервисов
- [ ] Добавить integration тесты для API
- [ ] Настроить CI/CD для тестов

---

## 📊 Метрики качества архитектуры

### Текущее состояние

- **Дублирование кода**: 🔴 Высокое (3+ места с одинаковой логикой)
- **Разделение ответственности**: 🔴 Плохое (API routes делают всё)
- **Типизация**: 🔴 Плохая (много `any`)
- **Тестирование**: 🔴 Отсутствует
- **Документация**: 🟡 Частичная
- **Логирование**: 🟡 Частичное
- **Кеширование**: 🔴 Отсутствует

### Целевое состояние

- **Дублирование кода**: 🟢 Минимальное (< 5%)
- **Разделение ответственности**: 🟢 Хорошее (четкие слои)
- **Типизация**: 🟢 Полная (0 `any`)
- **Тестирование**: 🟢 Покрытие > 80%
- **Документация**: 🟢 Полная (C4 + код)
- **Логирование**: 🟢 Везде
- **Кеширование**: 🟢 Для всех медленных операций

---

**Статус**: Архитектура документирована, проблемы определены, план исправления создан

