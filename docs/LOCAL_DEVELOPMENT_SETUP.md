# 🚀 Настройка локальной разработки

## ✅ Что я рекомендую (Вариант 2 с Docker)

### Преимущества:
1. ✅ **Не нужно решать проблемы с сетью** - Prisma в Docker имеет доступ
2. ✅ **Полная изоляция** - PostgreSQL и Redis в контейнерах
3. ✅ **Одинаковая среда** с staging
4. ✅ **Быстрый старт** - всего несколько команд
5. ✅ **Данные сохраняются** - используется volumes

---

## 📋 План настройки

### Шаг 1: Обновить schema.prisma для поддержки обоих БД

**Вариант А: Два файла schema**

Создать `prisma/schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "windows"]  // Для локальной разработки
}

datasource db {
  provider = "postgresql"  // Можно использовать SQLite или Postgres
  url      = env("DATABASE_URL")
}
```

Создать `prisma/schema.production.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x", "windows"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Вариант Б: Один schema, разные DATABASE_URL**

Оставить как есть в `schema.prisma` - использовать PostgreSQL везде.

---

### Шаг 2: Добавить скрипты в package.json

```json
{
  "scripts": {
    "dev:local": "cross-env DATABASE_URL=\"postgresql://dev_user:dev_password@localhost:5434/domeo_dev\" next dev",
    "dev:docker": "docker compose -f docker-compose.local.yml up -d && npm run dev:local",
    "dev:setup": "npm run dev:docker && npm run prisma:generate && npm run prisma:push",
    "dev:clean": "docker compose -f docker-compose.local.yml down -v"
  }
}
```

---

### Шаг 3: Workflow разработки

```bash
# 1. Первый запуск - поднять БД и настроить схему
npm run dev:setup

# 2. Разрабатывать
npm run dev:local

# 3. После изменений schema - применить миграции
npm run prisma:migrate

# 4. Перед деплоем на staging
git push origin develop

# 5. На ВМ автоматически применяется миграция
```

---

## 🔄 Стратегия работы с миграциями БД

### Проблема: Не потерять данные при изменении схемы

**Решение:**

1. **Использовать Prisma Migrate**

```bash
# Добавили поле в schema.prisma
npx prisma migrate dev --name add_new_field

# Prisma автоматически создаст:
# - SQL миграцию
# - Файл в prisma/migrations/

# При деплое на staging автоматически применится:
docker exec domeo-staging-app npx prisma migrate deploy
```

2. **Backup перед миграцией**

```bash
# На staging перед деплоем
docker exec domeo-staging-postgres pg_dump -U staging_user -d domeo_staging > backup_$(date +%Y%m%d).sql

# Если что-то пошло не так - восстановить:
docker exec -i domeo-staging-postgres psql -U staging_user -d domeo_staging < backup_YYYYMMDD.sql
```

3. **Правила изменения схемы:**

```
❌ НЕЛЬЗЯ просто менять типы (String → Int)
✅ Можно добавлять optional поля
✅ Можно добавлять новые таблицы
✅ Можно удалять данные через миграции
```

4. **Пример безопасной миграции:**

```sql
-- Шаг 1: Добавить новое поле как nullable
ALTER TABLE users ADD COLUMN new_field TEXT;

-- Шаг 2: Заполнить данные для существующих записей
UPDATE users SET new_field = 'default' WHERE new_field IS NULL;

-- Шаг 3: Сделать поле обязательным
ALTER TABLE users ALTER COLUMN new_field SET NOT NULL;
```

---

## 🎯 Моя рекомендация

**Используйте следующий workflow:**

```bash
# === ЛОКАЛЬНО ===
# 1. Запустить БД
docker compose -f docker-compose.local.yml up -d

# 2. Настроить схему впервые
npx prisma generate
npx prisma db push

# 3. Разрабатывать
npm run dev

# 4. Когда меняете schema.prisma
npx prisma migrate dev --name description_of_change

# === DEPLOYMENT ===
# 1. Закоммитить изменения
git add prisma/
git commit -m "Add new field to schema"
git push origin develop

# 2. На ВМ автоматически:
# - Pull код
# - npx prisma migrate deploy
# - Перезапуск контейнеров
```

---

## 📝 Что нужно сделать

1. Запустить `docker compose -f docker-compose.local.yml up -d`
2. Создать `.env.local` с DATABASE_URL
3. Выполнить `npx prisma generate`
4. Выполнить `npx prisma db push` 
5. Запустить `npm run dev`

**Начинаем?**

