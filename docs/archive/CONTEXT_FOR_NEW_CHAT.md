# Контекст для нового чата - Восстановление рабочих функций

## Ситуация

Проект **Domeo** (Next.js 15.5.6, React 19.2.0, TypeScript 5.5.4) - конфигуратор межкомнатных дверей.

**Проблема**: После множества изменений и улучшений некоторые рабочие функции сломались. Нужно восстановить рабочие функции, не потеряв прогресс разработки.

## Что было сделано (последние изменения)

### 1. Рефакторинг и оптимизация
- Замена `any` типов на конкретные типы
- Разбиение больших компонентов на меньшие
- Добавление централизованного логирования (`clientLogger`, `logger`)
- Исправление ошибок линтера

### 2. Исправления API и аутентификации
- Удаление `requireAuth` из публичных API (`/api/catalog/doors/*`, `/api/price/doors`)
- Исправление обработки ошибок JSON парсинга
- Добавление нормализации путей для изображений

### 3. Работа с галереей фотографий
- Компонент `ModernPhotoGallery` для отображения галереи
- API маршруты: `/api/catalog/doors/complete-data`, `/api/catalog/doors/photos-batch`
- Нормализация путей изображений (`/uploads/products/`, `/uploadsproducts/`)
- Логика перелистывания галереи при клике (когда не в режиме зума)

### 4. Исправления UI
- Кнопка "Выбрать" под превью модели
- Улучшение видимости элементов (z-index)
- Исправление условного рендеринга компонентов

## Текущие проблемы

### 1. Кнопка "Выбрать"
- **Проблема**: Кнопка "Выбрать" может не отображаться или быть невидимой
- **Файл**: `app/doors/page.tsx` (строки ~2502-2525)
- **Последние изменения**: Добавлен z-index и упрощена логика рендеринга

### 2. Перелистывание галереи
- **Проблема**: Галерея должна перелистываться при клике по изображению (когда не в режиме зума)
- **Файл**: `components/ModernPhotoGallery.tsx` (строки ~202-239)
- **Статус**: По логам работает, но возможно визуально не обновляется

### 3. Ошибки 401/403
- **Проблема**: Некоторые API возвращают 401/403 для авторизованных пользователей
- **Файлы**: 
  - `app/api/users/me/route.ts`
  - `app/api/admin/stats/route.ts`
  - `app/api/complectator/stats/route.ts`

### 4. Favicon 404
- **Проблема**: `favicon.ico:1 Failed to load resource: the server responded with a status of 404`
- **Файл**: `app/layout.tsx` (добавлен `icons` в metadata)

## Критичные файлы

### Основные компоненты
1. **`app/doors/page.tsx`** - главная страница конфигуратора дверей
   - Состояние: `sel`, `models`, `selectedModelCard`
   - Кнопка "Выбрать": строки ~2502-2525
   - Рендеринг галереи: строки ~2437-2498

2. **`components/ModernPhotoGallery.tsx`** - компонент галереи
   - Логика перелистывания: `nextPhoto()`, `prevPhoto()` (строки ~90-105)
   - Обработчики кликов: `onClick`, `onMouseDown`, `onPointerDown` (строки ~202-239)
   - Состояние: `currentIndex`, `isZoomed`

3. **`app/api/catalog/doors/complete-data/route.ts`** - API для получения данных модели
   - Нормализация путей фотографий: `normalizePhotoPath()`

4. **`app/api/uploads/[...path]/route.ts`** - API для статических файлов
   - Обработка путей `/uploadsproducts/` → `/uploads/products/`

### Логирование
- **`lib/logging/client-logger.ts`** - клиентский логгер
- **`lib/logging/logger.ts`** - серверный логгер

## История Git (последние коммиты)

```
603ae5e fix: улучшена видимость кнопки Выбрать, добавлен z-index
8d323f2 debug: добавлено логирование для отладки кнопки Выбрать
61e1332 fix: исправлена логика перелистывания галереи
9fc49d3 fix: исправлены ошибки линтера
b6b6d48 fix: исправлены ошибки линтера - добавлены проверки на undefined
9896fae fix: исправлен условный рендеринг ModernPhotoGallery
```

## Что нужно сделать

### Приоритет 1: Восстановить рабочие функции
1. **Кнопка "Выбрать"** - должна быть видна и работать
2. **Перелистывание галереи** - должно работать при клике по изображению
3. **Отображение фотографий** - все фотографии должны загружаться корректно

### Приоритет 2: Исправить ошибки
1. **401/403 ошибки** - проверить аутентификацию для API
2. **Favicon 404** - убедиться, что favicon доступен
3. **Ошибки линтера** - исправить оставшиеся ошибки типов

### Приоритет 3: Оптимизация
1. Уменьшить количество логов в production
2. Оптимизировать рендеринг компонентов
3. Улучшить обработку ошибок

## Подход к решению

### Вариант 1: Постепенное восстановление
1. Найти рабочие версии функций в истории Git
2. Сравнить с текущими версиями
3. Восстановить рабочие части, сохранив новые улучшения

### Вариант 2: Откат и постепенное применение изменений
1. Создать ветку от рабочего коммита
2. Постепенно применять изменения с тестированием
3. Убедиться, что каждая функция работает

### Вариант 3: Исправление текущей версии
1. Исправить проблемы в текущей версии
2. Протестировать каждую функцию
3. Убедиться, что все работает

## Полезные команды

### Git
```bash
# Просмотр истории изменений файла
git log --oneline --all -- app/doors/page.tsx

# Сравнение версий
git diff <commit1> <commit2> -- app/doors/page.tsx

# Просмотр конкретного коммита
git show <commit_hash>

# Создание ветки от рабочего коммита
git checkout -b restore-working-functions <commit_hash>
```

### Проверка работоспособности
```bash
# Локальный запуск
npm run dev

# Проверка линтера
npm run lint

# Проверка типов
npm run type-check
```

## Дополнительная информация

### Структура данных
- **`selectedModelCard`**: объект с данными выбранной модели
  - `model`: string - название модели
  - `photo`: string | null - путь к обложке
  - `photos`: { cover: string | null, gallery: string[] } - структура фотографий
  - `hasGallery`: boolean - есть ли галерея

### Состояние компонента DoorsPage
- `sel.model`: string | undefined - выбранная модель
- `isModelSelected`: boolean - выбрана ли модель
- `isModelCollapsed`: boolean - свернут ли блок моделей

### API endpoints
- `/api/catalog/doors/complete-data` - полные данные модели (GET)
- `/api/catalog/doors/photos-batch` - пакетная загрузка фотографий (POST)
- `/api/uploads/products/...` - статические файлы изображений
- `/api/price/doors` - расчет цены (GET, POST)

## Инфраструктура

### Серверы и окружения

#### Staging (Тестовая ВМ)
- **IP**: `130.193.40.35`
- **Порт**: `3001`
- **URL**: `http://130.193.40.35:3001`
- **Пользователь**: `ubuntu`
- **Путь**: `/opt/domeo`
- **SSH ключ**: `C:\Users\petr2\.ssh\ssh-key-1757583003347\ssh-key-1757583003347`

#### Production
- **IP**: `130.193.40.35` (тот же сервер)
- **Порт**: `3000`
- **URL**: `http://130.193.40.35:3000`
- **Платформа**: Yandex Cloud Managed Kubernetes (MK8S)
- **Namespace**: `prod`
- **Container Registry**: `cr.yandex/crpuein3jvjccnafs2vc`

### Docker и контейнеризация

#### Docker Compose файлы
- **`docker-compose.staging-dev.yml`** - Staging с hot reload (dev режим)
- **`docker-compose.staging.yml`** - Staging production-like
- **`docker-compose.production.yml`** - Production с полным стеком
- **`docker-compose.production-full.yml`** - Production с мониторингом

#### Dockerfile файлы
- **`Dockerfile`** - Базовый для разработки
- **`Dockerfile.staging`** - Для staging окружения
- **`Dockerfile.production`** - Для production окружения

#### Staging Dev (Hot Reload)
```yaml
# docker-compose.staging-dev.yml
services:
  staging-postgres:  # PostgreSQL 15 на порту 5433
  staging-redis:     # Redis 7 на порту 6380
  staging-app:       # Node.js 20 с hot reload на порту 3001
```

**Особенности**:
- Монтирование всего проекта для hot reload
- Отдельный volume для `node_modules`
- Автоматическая установка зависимостей
- Автоматическая генерация Prisma Client
- Dev режим Next.js (`npm run dev`)

#### Production
```yaml
# docker-compose.production.yml
services:
  postgres:    # PostgreSQL 15
  redis:       # Redis 7
  app:         # Next.js standalone
  nginx:       # Reverse proxy
  prometheus:  # Мониторинг
  grafana:     # Дашборды
```

### База данных

#### Staging
- **Тип**: PostgreSQL 15 Alpine
- **Контейнер**: `domeo-staging-postgres`
- **Порт**: `5433:5432` (внешний:внутренний)
- **База**: `domeo_staging`
- **Пользователь**: `staging_user`
- **Пароль**: `staging_password`
- **Volume**: `staging_postgres_data`

#### Production
- **Тип**: PostgreSQL 15 Alpine
- **База**: Из переменной окружения `POSTGRES_DB`
- **Пользователь**: Из переменной окружения `POSTGRES_USER`
- **Пароль**: Из переменной окружения `POSTGRES_PASSWORD`
- **Volume**: `postgres_data`

### Кэш (Redis)

#### Staging
- **Контейнер**: `domeo-staging-redis`
- **Порт**: `6380:6379`
- **Пароль**: `staging_redis_password`
- **Volume**: `staging_redis_data`

#### Production
- **Пароль**: Из переменной окружения `REDIS_PASSWORD`
- **Volume**: `redis_data`
- **AOF**: Включен (`--appendonly yes`)

### Переменные окружения

#### Файлы конфигурации
- **`env.example`** - Шаблон для локальной разработки
- **`env.staging`** - Для staging окружения
- **`env.production`** - Для production окружения

#### Ключевые переменные
```bash
# База данных
DATABASE_URL="postgresql://user:password@host:port/database"
POSTGRES_DB=domeo
POSTGRES_USER=domeo
POSTGRES_PASSWORD=secure_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Redis
REDIS_PASSWORD=your-redis-password
REDIS_URL=redis://:password@host:port

# Next.js
NODE_ENV=production|staging|development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Yandex Object Storage
YANDEX_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YANDEX_STORAGE_ACCESS_KEY_ID=your-access-key
YANDEX_STORAGE_SECRET_ACCESS_KEY=your-secret-key
YANDEX_STORAGE_BUCKET_NAME=your-bucket-name

# Мониторинг
GRAFANA_PASSWORD=your-grafana-password
```

## Пайплайн деплоя

### Git Workflow

#### Ветки
```
main (production) ←── develop (staging) ←── feature/new-feature
     ↑                    ↑                        ↑
   Только готовое      Тестирование            Разработка
```

#### Правила
1. **Разработка** - создавайте feature ветки от `develop`
2. **Тестирование** - мержите в `develop` для деплоя на staging
3. **Production** - мержите `develop` в `main` и создавайте теги

### Деплой на Staging

#### Вариант 1: Через Git (рекомендуется)
```powershell
# 1. Локально: коммит и push
git add .
git commit -m "описание изменений"
git push origin develop

# 2. На staging ВМ: pull и restart
ssh ubuntu@130.193.40.35
cd /opt/domeo
git pull origin develop
docker compose -f docker-compose.staging-dev.yml restart staging-app
```

#### Вариант 2: Скрипт деплоя (PowerShell)
```powershell
# Безопасный деплой исправлений на staging
.\scripts\deploy-fixes-to-staging.ps1

# С пропуском бэкапа
.\scripts\deploy-fixes-to-staging.ps1 -SkipBackup
```

**Что делает скрипт**:
1. Проверяет SSH подключение
2. Проверяет health check
3. Создает бэкап (база данных + код)
4. Получает изменения из Git (`git pull origin develop`)
5. Пересобирает образ (если нужно)
6. Перезапускает сервисы
7. Проверяет health check после деплоя

#### Вариант 3: Hot Reload синхронизация
```powershell
# Одноразовая синхронизация
.\scripts\sync-to-staging.ps1

# С перезапуском контейнера
.\scripts\sync-to-staging.ps1 -Force

# Режим наблюдения (автосинхронизация)
.\scripts\sync-to-staging.ps1 -Watch
```

**Что синхронизируется**:
- `app/`
- `components/`
- `lib/`
- `public/`
- `prisma/`
- `scripts/`
- Конфигурационные файлы (`package.json`, `tsconfig.json`, и т.д.)

**Исключается**:
- `node_modules/`
- `.next/`
- `.git/`
- `.env.*`

#### Вариант 4: Полная пересборка
```bash
# На staging ВМ
cd /opt/domeo
git pull origin develop
docker compose -f docker-compose.staging-dev.yml build --no-cache staging-app
docker compose -f docker-compose.staging-dev.yml up -d
```

### Деплой на Production

#### Kubernetes (Yandex Cloud MK8S)

**Prerequisites**:
- `kubeconfig` с доступом к namespace `prod`
- Docker auth к `cr.yandex/crpuein3jvjccnafs2vc`
- `kubectl` (с kustomize)

**One-time setup**:
```bash
# 1. Создание secrets
kubectl -n prod create secret generic app-secrets \
  --from-literal=DATABASE_URL="<db_url>" \
  --from-literal=JWT_SECRET="<jwt>" \
  --dry-run=client -o yaml | kubectl apply -f -

# 2. Первое применение
kubectl apply -k k8s/overlays/prod
```

**Build and push**:
```bash
# Linux/macOS
./scripts/build_and_push.sh app v1.0.0

# Windows
./scripts/build_and_push.ps1 -ImageName app -Tag v1.0.0
```

**Rollout**:
```bash
./scripts/rollout.sh v1.0.0
kubectl -n prod rollout history deployment/app-prod
```

**Rollback**:
```bash
./scripts/rollback.sh
kubectl -n prod rollout undo deployment/app-prod --to-revision=<N>
```

**Manual DB migrations** (только после бэкапа):
```bash
# Установить MIGRATION_CMD в scripts/run_db_migration.sh
./scripts/run_db_migration.sh
```

#### Docker Compose (альтернатива)

```bash
# На production сервере
cd /opt/domeo
git pull origin main
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

### Скрипты деплоя

#### PowerShell скрипты
- **`scripts/deploy-fixes-to-staging.ps1`** - Безопасный деплой на staging
- **`scripts/sync-to-staging.ps1`** - Синхронизация кода для hot reload
- **`scripts/safe-deploy-to-staging.ps1`** - Безопасный деплой с проверками
- **`scripts/restart-staging.ps1`** - Перезапуск staging сервисов
- **`scripts/check-staging.ps1`** - Проверка статуса staging
- **`scripts/monitor-environments.ps1`** - Мониторинг окружений
- **`scripts/build_and_push.ps1`** - Сборка и push образа в registry

#### Bash скрипты
- **`scripts/deploy_vm.sh`** - Деплой на VM
- **`scripts/deploy-to-k8s-prod.sh`** - Деплой в Kubernetes
- **`scripts/rollout.sh`** - Rollout в production
- **`scripts/rollback.sh`** - Rollback в production
- **`scripts/run_db_migration.sh`** - Миграции базы данных
- **`scripts/backup_database.sh`** - Бэкап базы данных
- **`scripts/health-check.sh`** - Health check
- **`scripts/monitor-environments.sh`** - Мониторинг окружений

### Мониторинг и проверка

#### Health Check
```bash
# Staging
curl http://130.193.40.35:3001/api/health

# Production
curl http://130.193.40.35:3000/api/health

# Через npm
npm run health:staging
npm run health:prod
```

#### Проверка статуса контейнеров
```bash
# На staging ВМ
cd /opt/domeo
docker compose -f docker-compose.staging-dev.yml ps
docker compose -f docker-compose.staging-dev.yml logs -f staging-app
```

#### Мониторинг
```bash
# PowerShell
npm run monitor:ps1

# Bash
npm run monitor
```

### Бэкапы

#### Автоматические бэкапы
Скрипт `deploy-fixes-to-staging.ps1` создает бэкапы:
- **База данных**: `pg_dump` в `/tmp/domeo-backup-<timestamp>/database_backup.sql`
- **Код**: `git archive` в `/tmp/domeo-backup-<timestamp>/code_backup.tar.gz`

#### Ручные бэкапы
```bash
# База данных
./scripts/backup_database.sh

# Или через Docker
docker exec domeo-staging-postgres pg_dump -U staging_user -d domeo_staging > backup.sql
```

### Откат изменений

#### Staging
```bash
# На staging ВМ
cd /opt/domeo
git log --oneline  # Найти нужный коммит
git checkout <commit_hash>
docker compose -f docker-compose.staging-dev.yml restart staging-app
```

#### Production (Kubernetes)
```bash
# Просмотр истории
kubectl -n prod rollout history deployment/app-prod

# Откат к предыдущей версии
kubectl -n prod rollout undo deployment/app-prod

# Откат к конкретной версии
kubectl -n prod rollout undo deployment/app-prod --to-revision=<N>
```

### NPM скрипты

```json
{
  "dev": "next dev -p 3000",
  "dev:quick": "powershell -ExecutionPolicy Bypass -File scripts/dev-local-quick.ps1",
  "dev:tunnel": "powershell -ExecutionPolicy Bypass -File scripts/start-ssh-tunnel.ps1",
  "build": "next build",
  "build:staging": "NODE_ENV=staging next build",
  "build:prod": "NODE_ENV=production next build",
  "start:staging": "NODE_ENV=staging next start -p 3001",
  "start:prod": "NODE_ENV=production next start -p 3000",
  "deploy:staging": "chmod +x scripts/deploy-staging.sh && ./scripts/deploy-staging.sh",
  "deploy:prod": "chmod +x scripts/deploy-production.sh && ./scripts/deploy-production.sh",
  "health:staging": "curl -f http://130.193.40.35:3001/api/health",
  "health:prod": "curl -f http://130.193.40.35:3000/api/health",
  "monitor": "chmod +x scripts/monitor-environments.sh && ./scripts/monitor-environments.sh",
  "monitor:ps1": "powershell -ExecutionPolicy Bypass -File scripts/monitor-environments.ps1"
}
```

## Контакты и ресурсы

- **Репозиторий**: GitHub (ветка `develop` для staging, `main` для production)
- **Тестовая ВМ**: `130.193.40.35:3001` (staging)
- **Production**: `130.193.40.35:3000` или через Kubernetes
- **Документация**: 
  - `docs/PHOTO_GALLERY_LOGIC.md` - логика галереи
  - `docs/DEPLOY.md` - руководство по деплою
  - `docs/DEPLOY_TO_K8S.md` - деплой в Kubernetes
  - `docs/ARCHITECTURE.md` - архитектура проекта

## Важные замечания

1. **Не удалять логирование** - оно критично для отладки
2. **Сохранить типизацию** - не возвращаться к `any`
3. **Тестировать каждое изменение** - проверять на тестовой ВМ
4. **Коммитить часто** - чтобы можно было откатиться

## Следующие шаги

1. Проанализировать историю Git для поиска рабочей версии
2. Сравнить рабочие версии с текущими
3. Восстановить рабочие функции
4. Протестировать все функции
5. Убедиться, что новый прогресс сохранен

