# 🚀 Onboarding для нового чата - Проект Domeo

**Дата обновления**: 2025-01-06  
**Версия**: 2.0

---

## 📋 ТЕКУЩЕЕ СОСТОЯНИЕ ПРОЕКТА

### ✅ Завершенные фазы рефакторинга

**Фаза 1-5: Архитектурный рефакторинг (завершено)**
- ✅ Централизация логики дедупликации документов
- ✅ Создание слоя сервисов (DocumentService, ExportService)
- ✅ Создание слоя репозиториев (DocumentRepository, ClientRepository, ProductRepository)
- ✅ Валидация и типизация (Zod схемы, убраны все `any`)
- ✅ Стандартизация обработки ошибок (apiSuccess/apiError, кастомные классы ошибок)

**Фаза 6: Рефакторинг API routes (завершено)**
- ✅ Отрефакторено 24+ API routes в `app/api/admin/`
- ✅ Все библиотечные файлы в `lib/` используют глобальный `prisma`
- ✅ Удалены все `prisma.$disconnect()` вызовы
- ✅ Заменены основные `console.log` на централизованный `logger`
- ✅ Стандартизированы API ответы через `apiSuccess`/`apiError`

**Фаза 7: Рефакторинг библиотечных файлов (завершено)**
- ✅ Все 10 библиотечных файлов используют глобальный `prisma`
- ✅ Централизованное логирование через `logger`
- ✅ Улучшена типобезопасность

### 📊 Статистика проекта

- **Технологии**: Next.js 15.5.6, React 19.2.0, TypeScript 5.5.4, Prisma 5.22.0
- **База данных**: PostgreSQL (production), SQLite (development)
- **API Routes**: 200+ endpoints
- **Отрефакторено**: 24+ API routes, 10 библиотечных файлов
- **Удалено дублирования**: 500+ строк кода
- **Покрытие типизацией**: 100% ключевых модулей

### 🎯 Ключевые улучшения

1. **Архитектура**: Четкое разделение слоев (API → Service → Repository → Database)
2. **Типобезопасность**: Zod схемы для валидации, убраны все `any`
3. **Обработка ошибок**: Стандартизированные форматы ответов, кастомные классы ошибок
4. **Логирование**: Централизованный `logger` из `lib/logging/logger.ts`
5. **База данных**: Глобальный `prisma` экземпляр из `lib/prisma.ts`

---

## 🏗️ АРХИТЕКТУРА ПРОЕКТА

### C4 Model - Уровни архитектуры

**Уровень 1: System Context**
```
Пользователи (Комплектатор, Исполнитель, Администратор)
    ↓ HTTPS
Domeo Platform (Next.js Web Application)
    ↓
PostgreSQL Database | Yandex Object Storage | GitHub
```

**Уровень 2: Container (Контейнеры)**
- **Web Application** (Next.js) - React UI, Server-Side Rendering
- **API Layer** (Next.js API Routes) - REST API, Authentication, Business Logic
- **Database** (PostgreSQL) - Хранение данных через Prisma ORM

**Уровень 3: Component (Компоненты)**

**Структура слоев:**
```
app/api/                    # API Routes (контроллеры)
    ↓
lib/services/               # Business Logic (сервисы)
    ↓
lib/repositories/           # Data Access (репозитории)
    ↓
lib/prisma.ts              # Database (Prisma Client)
```

**Ключевые компоненты:**

1. **API Layer** (`app/api/`)
   - REST API endpoints
   - Аутентификация через `requireAuth`/`requireAuthAndPermission`
   - Стандартизированные ответы через `apiSuccess`/`apiError`
   - Обработка ошибок через `withErrorHandling` HOC

2. **Service Layer** (`lib/services/`)
   - `DocumentService` - управление документами (Order, Invoice, Quote)
   - `ExportService` - экспорт документов (PDF, Excel, CSV)
   - `CatalogService` - управление каталогом товаров
   - `CatalogImportService` - импорт каталога
   - `SimpleImportService` - простой импорт товаров
   - `ProductPartialUpdateService` - частичное обновление товаров
   - `DatabaseOptimizationService` - оптимизация БД

3. **Repository Layer** (`lib/repositories/`)
   - `DocumentRepository` - работа с документами
   - `ClientRepository` - работа с клиентами
   - `ProductRepository` - работа с товарами
   - `BaseRepository` - базовый репозиторий с кешированием

4. **Validation Layer** (`lib/validation/`)
   - Zod схемы для валидации входных данных
   - Middleware для валидации запросов

5. **Auth Layer** (`lib/auth/`)
   - JWT токены (`lib/auth/jwt.ts`)
   - Middleware для аутентификации (`lib/auth/middleware.ts`)
   - Helpers для получения пользователя (`lib/auth/request-helpers.ts`)

6. **Logging** (`lib/logging/`)
   - Централизованный `logger` из `lib/logging/logger.ts`
   - Структурированное логирование с контекстом

### 📁 Структура проекта

```
domeo/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (200+ endpoints)
│   │   ├── admin/        # Административные API
│   │   ├── documents/    # API для документов
│   │   ├── export/       # API для экспорта
│   │   └── ...
│   ├── admin/            # Административные страницы
│   ├── complectator/     # Личный кабинет комплектатора
│   ├── executor/         # Личный кабинет исполнителя
│   └── ...
├── lib/                   # Библиотека (бизнес-логика)
│   ├── services/         # Сервисы (бизнес-логика)
│   ├── repositories/     # Репозитории (доступ к данным)
│   ├── auth/             # Аутентификация и авторизация
│   ├── validation/       # Валидация (Zod схемы)
│   ├── api/              # API утилиты (response, errors)
│   ├── logging/          # Логирование
│   ├── prisma.ts         # Глобальный Prisma Client
│   └── ...
├── prisma/                # Prisma схемы и миграции
├── scripts/               # Скрипты для деплоя и разработки
├── docs/                  # Документация
│   ├── C4_ARCHITECTURE.md
│   ├── ARCHITECTURE.md
│   ├── REFACTORING_SUMMARY.md
│   └── ...
└── docker-compose.*.yml   # Docker конфигурации
```

---

## 🔄 ПАЙПЛАЙН РАЗРАБОТКИ И ДЕПЛОЯ

### Схема пайплайна

```
Локальная разработка (Windows)
    ↓
git add + commit
    ↓
git push origin develop
    ↓
GitHub (репозиторий: domeo3dmodeler-art/domeo2510)
    ↓
Обновление на staging ВМ (git pull)
    ↓
Hot Reload (перезапуск контейнера)
    ↓
Изменения видны на http://130.193.40.35:3001
```

### Детальный процесс

#### 1. Локальная разработка

**Окружение:**
- OS: Windows 10/11
- Node.js: 20.x
- IDE: VS Code / Cursor
- База данных: SQLite (через Prisma) или PostgreSQL (через SSH туннель)

**Команды:**
```powershell
# Запуск dev сервера
npm run dev                    # Порт 3000

# Проверка типов
npm run type-check

# Линтинг
npm run lint

# Работа с БД
npm run prisma:studio          # Prisma Studio
npm run prisma:migrate         # Применить миграции
```

#### 2. Git workflow

**Основные ветки:**
- `develop` - staging/development (текущая рабочая ветка)
- `main` - production-ready код

**Процесс коммита и пуша:**

**Автоматический (рекомендуется):**
```powershell
# PowerShell скрипт (делает все автоматически)
.\scripts\git-sync-to-staging.ps1 "Описание изменений"
```

**Что делает скрипт:**
1. ✅ Проверяет изменения в git
2. ✅ Добавляет все изменения (`git add -A`)
3. ✅ Создает коммит с указанным сообщением
4. ✅ Отправляет на GitHub (`git push origin develop`)
5. ✅ Обновляет код на staging ВМ (`git pull`)
6. ✅ Перезапускает контейнер для hot reload

**Ручной процесс:**
```bash
# Локально
git add .
git commit -m "Описание изменений"
git push origin develop
```

#### 3. Staging ВМ (тестовая среда)

**Информация о ВМ:**
- **IP**: 130.193.40.35
- **Порт**: 3001
- **URL**: http://130.193.40.35:3001
- **SSH**: `ssh ubuntu@130.193.40.35`
- **Директория проекта**: `/opt/domeo`
- **Docker Compose**: `docker-compose.staging-dev.yml`

**Hot Reload режим:**
- ✅ Весь код монтируется как volume (`.:/app`)
- ✅ Next.js запущен в dev режиме (`npm run dev`)
- ✅ Изменения применяются автоматически при `git pull`
- ✅ Перезапуск контейнера применяет изменения мгновенно

**Обновление на staging ВМ:**

**Автоматически (через скрипт):**
```powershell
# Скрипт делает git pull и перезапуск автоматически
.\scripts\git-sync-to-staging.ps1 "Описание изменений"
```

**Вручную:**
```bash
# SSH на ВМ
ssh ubuntu@130.193.40.35

# Перейти в директорию проекта
cd /opt/domeo

# Получить изменения
git pull origin develop

# Перезапустить контейнер (hot reload)
docker compose -f docker-compose.staging-dev.yml restart staging-app

# Или использовать скрипт на ВМ
./scripts/update-staging.sh
```

**Проверка статуса:**
```bash
# Проверка health
curl http://130.193.40.35:3001/api/health

# Логи контейнера
docker compose -f docker-compose.staging-dev.yml logs --tail=50 staging-app

# Статус контейнеров
docker compose -f docker-compose.staging-dev.yml ps
```

#### 4. Production (если нужно)

**Процесс:**
1. Код в ветке `main`
2. GitHub Actions автоматически деплоит
3. Или ручной деплой через скрипты

---

## 🔧 КЛЮЧЕВЫЕ КОМПОНЕНТЫ И ПАТТЕРНЫ

### 1. API Routes - Стандартный паттерн

```typescript
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

async function handler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    // Business logic here
    
    return apiSuccess({ data: result });
  } catch (error) {
    logger.error('Error description', 'api/route', error instanceof Error ? { error: error.message } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Error message', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission('PERMISSION_NAME')
)(handler);
```

### 2. Service Layer - Пример

```typescript
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { DocumentRepository } from '@/lib/repositories/document.repository';

export class DocumentService {
  private documentRepo: DocumentRepository;
  
  constructor() {
    this.documentRepo = new DocumentRepository(prisma);
  }
  
  async createDocument(data: CreateDocumentInput) {
    // Business logic here
    return await this.documentRepo.create(data);
  }
}
```

### 3. Repository Layer - Пример

```typescript
import { prisma } from '@/lib/prisma';
import { BaseRepository } from './base.repository';

export class DocumentRepository extends BaseRepository<Document, CreateInput, UpdateInput> {
  constructor(prisma: any) {
    super(prisma, 'order', 'orders');
  }
  
  // Custom methods here
}
```

### 4. Логирование

```typescript
import { logger } from '@/lib/logging/logger';

// Info
logger.info('Operation completed', 'module/function', { data });

// Error
logger.error('Operation failed', 'module/function', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });

// Debug
logger.debug('Debug info', 'module/function', { data });

// Warn
logger.warn('Warning message', 'module/function', { data });
```

---

## 📚 ДОКУМЕНТАЦИЯ

### Основные документы

1. **Архитектура:**
   - `docs/C4_ARCHITECTURE.md` - C4 модель архитектуры
   - `docs/ARCHITECTURE.md` - Полная архитектура проекта

2. **Рефакторинг:**
   - `docs/REFACTORING_SUMMARY.md` - Итоги рефакторинга

3. **Workflow:**
   - `docs/GIT_SYNC_WORKFLOW.md` - Git синхронизация и hot reload
   - `docs/DEVELOPMENT_WORKFLOW.md` - Процесс разработки

4. **Onboarding:**
   - `NEW_CHAT_ONBOARDING.md` - Этот файл

---

## 🚨 ВАЖНЫЕ ЗАМЕЧАНИЯ

### ⚠️ Критичные моменты

1. **Prisma Client:**
   - ✅ ВСЕГДА используйте глобальный `prisma` из `lib/prisma.ts`
   - ❌ НИКОГДА не создавайте `new PrismaClient()` в коде
   - ❌ НИКОГДА не вызывайте `prisma.$disconnect()` в API routes

2. **Логирование:**
   - ✅ Используйте `logger` из `lib/logging/logger.ts`
   - ❌ НЕ используйте `console.log`/`console.error` в production коде

3. **API Responses:**
   - ✅ Используйте `apiSuccess`/`apiError` для стандартизированных ответов
   - ❌ НЕ используйте `NextResponse.json` напрямую (кроме специальных случаев)

4. **Аутентификация:**
   - ✅ Все защищенные routes должны использовать `requireAuth`/`requireAuthAndPermission`
   - ✅ Используйте `withErrorHandling` HOC для обработки ошибок

5. **Типизация:**
   - ✅ Используйте Zod схемы для валидации входных данных
   - ❌ НЕ используйте `any` типы

### 📝 Стиль кода

- **TypeScript**: Строгая типизация, без `any`
- **Именование**: camelCase для переменных, PascalCase для классов
- **Форматирование**: Prettier (настроен в проекте)
- **Линтинг**: ESLint (настроен в проекте)

---

## 🔗 ПОЛЕЗНЫЕ ССЫЛКИ

- **Staging**: http://130.193.40.35:3001
- **Health Check**: http://130.193.40.35:3001/api/health
- **GitHub**: https://github.com/domeo3dmodeler-art/domeo2510
- **Ветка**: `develop`

---

## 📞 КОНТАКТЫ И ПОДДЕРЖКА

- **SSH на staging**: `ssh ubuntu@130.193.40.35`
- **Директория проекта на ВМ**: `/opt/domeo`
- **Docker Compose файл**: `docker-compose.staging-dev.yml`

---

**Последнее обновление**: 2025-01-06  
**Версия документа**: 2.0
