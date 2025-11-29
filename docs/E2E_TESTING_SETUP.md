# Настройка E2E тестирования

**Дата создания**: 01.11.2025

---

## ✅ Создана базовая структура E2E тестов

### Установленные компоненты

1. **Playwright конфигурация** (`playwright.config.ts`)
   - Настройка для E2E тестов
   - Поддержка Chrome/Firefox/Safari
   - Автоматический запуск dev сервера
   - Скриншоты и видео при ошибках

2. **Критические тесты аутентификации** (`e2e/auth.spec.ts`)
   - ✅ Тест 1: Успешный вход
   - ✅ Тест 2: Неуспешный вход
   - ✅ Тест 3: Защита защищенных путей
   - ✅ Тест 4: Rate limiting

3. **Тесты работы с документами** (`e2e/documents.spec.ts`)
   - ✅ Тест 5: Создание клиента
   - ✅ Тест 6: Создание КП из корзины
   - ✅ Тест 7: Изменение статуса документа
   - ✅ Тест 8: Экспорт документа в PDF

4. **Тесты health check** (`e2e/health.spec.ts`)
   - ✅ Проверка health check endpoint
   - ✅ Проверка подключения к БД

---

## Установка зависимостей

```bash
npm install --save-dev @playwright/test
npx playwright install
```

---

## Настройка переменных окружения

Создайте файл `.env.test` или установите переменные:

```env
TEST_BASE_URL=http://localhost:3000
TEST_USER_EMAIL=complectator@example.com
TEST_USER_PASSWORD=password
TEST_COMPLECTATOR_EMAIL=complectator@example.com
TEST_COMPLECTATOR_PASSWORD=password
TEST_EXECUTOR_EMAIL=executor@example.com
TEST_EXECUTOR_PASSWORD=password
```

---

## Запуск тестов

### Локально

```bash
# Все тесты
npm run test:e2e

# Конкретный файл
npx playwright test e2e/auth.spec.ts

# В UI режиме (интерактивно)
npm run test:e2e:ui

# С открытым браузером
npm run test:e2e:headed
```

### В CI/CD

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test --reporter=html
```

---

## Что нужно сделать перед использованием

1. **Создать тестовых пользователей в БД**:
   - `complectator@example.com` / `password`
   - `executor@example.com` / `password`
   - `admin@example.com` / `password`

2. **Настроить тестовые данные**:
   - Убедиться что есть товары в каталоге
   - Убедиться что есть клиенты (или тесты их создадут)

3. **Проверить селекторы**:
   - Тесты используют общие селекторы (button:has-text, input[name])
   - Возможно потребуется адаптация под реальный UI

---

## Расширение тестов

### Добавить новый тест

1. Создать файл в `e2e/` папке
2. Использовать структуру:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test.describe('Название группы тестов', () => {
     test('Название теста', async ({ page }) => {
       // Код теста
     });
   });
   ```

### Добавить helper функции

Создать файл `e2e/helpers.ts`:

```typescript
export async function login(page: any, role: string) {
  // Реализация
}

export async function createClient(page: any, data: any) {
  // Реализация
}
```

---

## Примечания

- Тесты используют реальную базу данных
- Рекомендуется использовать отдельную тестовую БД
- Некоторые тесты могут требовать предварительной настройки данных

---

**Последнее обновление**: 01.11.2025

