# ⚡ Быстрая справка по работе с Cursor

## 🎯 Типичные задачи и их решения

### Изменить UI компонент

```bash
# 1. Найти и прочитать
read_file: "components/Component.tsx"
grep: "Component" # найти все использования

# 2. Изменить
search_replace: "старое -> новое"

# 3. Проверить
read_lints: ["components/Component.tsx"]
grep: "Component" # проверить импорты
```

### Унифицировать компоненты

```bash
# 1. Найти все варианты
grep: "createClient|newClient"

# 2. Выбрать эталон
read_file: "app/doors/page.tsx"

# 3. Создать единый компонент
write: "components/clients/CreateClientModal.tsx"

# 4. Заменить везде
search_replace: "старая форма -> CreateClientModal"

# 5. Удалить дубликаты
```

### Изменить схему БД

```bash
# 1. Прочитать схему
read_file: "prisma/schema.prisma"

# 2. Найти использования
grep: "ModelName|fieldName"

# 3. Изменить
search_replace: "prisma/schema.prisma"

# 4. Обновить типы
run_terminal_cmd: "npx prisma generate"

# 5. Обновить репозиторий
read_file: "lib/repositories/model.repository.ts"
search_replace: "старый код -> новый"

# 6. Обновить валидацию
read_file: "lib/validation/model.schemas.ts"
search_replace: "старая схема -> новая"

# 7. Обновить API
read_file: "app/api/models/route.ts"
search_replace: "старый код -> новый"
```

### Создать новый API эндпоинт

```bash
# 1. Посмотреть пример
read_file: "app/api/clients/route.ts"

# 2. Создать новый
write: "app/api/new-endpoint/route.ts"

# 3. Создать валидацию
read_file: "lib/validation/client.schemas.ts"
# создать схему по аналогии

# 4. Проверить
read_lints: ["app/api/new-endpoint/route.ts"]
```

### Добавить новое поле в форму

```bash
# 1. Найти форму
grep: "FormComponent|ModalComponent"

# 2. Прочитать
read_file: "components/Form.tsx"

# 3. Добавить поле в состояние
search_replace: "state: { field1, field2 } -> { field1, field2, newField }"

# 4. Добавить в UI
search_replace: "<!-- поля --> -> <!-- поля + новое поле -->"

# 5. Обновить валидацию (если нужно)
read_file: "lib/validation/schema.ts"
search_replace: "старая схема -> новая"

# 6. Обновить API (если нужно)
read_file: "app/api/endpoint/route.ts"
search_replace: "старая логика -> новая"
```

### Исправить ошибку

```bash
# 1. Найти ошибку
read_lints: ["path/to/file.tsx"]

# 2. Прочитать файл
read_file: "path/to/file.tsx"

# 3. Найти проблемное место
grep: "ошибочный код"

# 4. Исправить
search_replace: "ошибочный код -> правильный"

# 5. Проверить
read_lints: ["path/to/file.tsx"]
```

### Деплой изменений

```bash
# 1. Проверить статус
run_terminal_cmd: "git status"

# 2. Добавить файлы
run_terminal_cmd: "git add -A"

# 3. Закоммитить
run_terminal_cmd: "git commit -m 'Описание изменений'"

# 4. Запушить
run_terminal_cmd: "git push origin develop"

# 5. Применить на VM
run_terminal_cmd: "ssh ubuntu@130.193.40.35 'cd /opt/domeo && git pull origin develop && docker compose -f docker-compose.staging-dev.yml restart staging-app'"
```

---

## 🔍 Часто используемые поиски

### Найти все использования компонента
```bash
grep: "ComponentName"
```

### Найти все API вызовы
```bash
grep: "fetch.*\/api\/endpoint"
```

### Найти все формы
```bash
glob_file_search: "**/*Form*.tsx"
glob_file_search: "**/*Modal*.tsx"
```

### Найти все API роуты
```bash
glob_file_search: "**/api/**/route.ts"
```

### Найти все репозитории
```bash
glob_file_search: "**/*repository*.ts"
```

---

## ⚠️ Частые ошибки и их решение

### Ошибка: "Cannot find module"
```bash
# Проверить импорт
grep: "import.*Component"
# Проверить путь
read_file: "components/Component.tsx"
# Исправить путь в импорте
```

### Ошибка: "Property does not exist"
```bash
# Проверить типы
read_file: "types.ts"
# Обновить типы
search_replace: "старый тип -> новый"
# Обновить использование
grep: "propertyName"
```

### Ошибка: "Prisma schema error"
```bash
# Проверить схему
read_file: "prisma/schema.prisma"
# Сгенерировать типы
run_terminal_cmd: "npx prisma generate"
```

### Ошибка: "Linter error"
```bash
# Прочитать ошибку
read_lints: ["path/to/file.tsx"]
# Исправить
search_replace: "ошибочный код -> правильный"
```

---

## 📋 Чек-лист перед коммитом

- [ ] `read_lints` - нет ошибок
- [ ] `grep` - проверил все использования
- [ ] Локально работает
- [ ] Коммит-сообщение понятное
- [ ] Один коммит = одна задача

---

## 🎨 Паттерны кода

### Создание компонента
```typescript
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface ComponentProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Component({ isOpen, onClose }: ComponentProps) {
  const [state, setState] = useState('');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Title">
      {/* content */}
    </Modal>
  );
}
```

### Создание API роута
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/api/response';
import { requireAuth } from '@/lib/auth/middleware';

async function handler(request: NextRequest) {
  // логика
  return apiSuccess(data);
}

export const GET = withErrorHandling(requireAuth(handler), 'endpoint/GET');
```

### Создание схемы валидации
```typescript
import { z } from 'zod';

export const schema = z.object({
  field: z.string().min(1, 'Обязательное поле'),
});

export type Type = z.infer<typeof schema>;
```

---

## 🚀 Ускорение работы

### Используй TODO списки
```typescript
todo_write({
  merge: false,
  todos: [
    { id: '1', status: 'in_progress', content: 'Задача 1' },
    { id: '2', status: 'pending', content: 'Задача 2' },
  ]
})
```

### Параллельные чтения
```typescript
// Вместо последовательного чтения
read_file: "file1.tsx"
read_file: "file2.tsx"

// Можно читать параллельно (автоматически)
read_file: "file1.tsx"
read_file: "file2.tsx" // выполнится параллельно
```

### Используй codebase_search
```typescript
// Вместо grep для понимания контекста
codebase_search: "Как работает система уведомлений?"
```

---

## 📞 Если что-то не работает

1. **Проверь линтер** - `read_lints`
2. **Проверь все использования** - `grep`
3. **Прочитай файл полностью** - `read_file`
4. **Проверь типы** - `read_file: "types.ts"`
5. **Проверь логи** - на VM через SSH

---

**Обновляй этот документ по мере накопления опыта!**
