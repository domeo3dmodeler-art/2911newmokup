# Чек-лист проверок и исправлений

Рекомендуемый порядок запуска скриптов для проверки данных и фото.

## 1. Фото: отображение и пути

| Шаг | Скрипт | Что проверяет | Исправление |
|-----|--------|----------------|-------------|
| 1.1 | `npx tsx scripts/verify-all-photos-display.ts` | Все ли пути в PropertyPhoto/ProductImage локальные, есть ли файлы на диске | `--fix-http-to-empty` — заменить оставшиеся http и некорректные photoPath (текст вместо пути) на пустую строку |
| 1.2 | `npx tsx scripts/verify-photo-download-and-binding.ts` | Скачаны ли файлы по Excel, привязка в БД, наличие файлов по путям | Докачать фото или обновить привязку; очистить текст в photoPath (см. 1.1) |
| 1.3 | `npx tsx scripts/verify-photo-display-flow.ts` | Цепочка путь → img src (lib/configurator/image-src) | — |
| 1.4 | `npx tsx scripts/verify-ui-photos.ts` | API complete-data и hardware отдают пути, файлы есть в public/ | Требует запущенный dev: `npm run dev` |

## 2. Данные и связи

| Шаг | Скрипт | Что проверяет | Примечание |
|-----|--------|----------------|------------|
| 2.1 | `npx tsx scripts/verify-data-loaded.ts` | Совпадение ожиданий из Excel (1002/final_filled 30.01.xlsx) с БД | Расхождения Наличники/Двери возможны при ручном изменении БД или другой версии Excel |
| 2.2 | `npx tsx scripts/verify-calculator-links.ts` | Связи модель↔цвета, расчёт цены, ручки и комплекты | Часть моделей без цветов — см. docs/MISSING_DATA_REPORT.md |
| 2.3 | `npx tsx scripts/diagnose-door-photos.ts` | Категория дверей, товары, PropertyPhoto по артикулу/цвету, ProductImage | Диагностика причин отсутствия фото у моделей |
| 2.4 | `npx tsx scripts/verify-excel-db-and-links.ts` | Связи листов Excel по «Название модели», правила Стекло/Кромка | Обновляет docs/MISSING_DATA_REPORT.md и docs/DISCREPANCIES_AND_RULES.md |

## Что было исправлено в текущей сессии

- **verify-all-photos-display**: очищены 8 записей PropertyPhoto, где в `photoPath` был текст (например «пока не добавляем», «не рассматриваем эту модель») вместо пути — теперь отображается placeholder.
- **verify-photo-download-and-binding**: после очистки — 1490/1490 путей с существующими файлами на диске.
- Все проверки 1.1–1.4 и 2.1–2.4 выполнены; расхождения Excel↔БД и отсутствие связей для части моделей зафиксированы в MISSING_DATA_REPORT.md и DISCREPANCIES_AND_RULES.md.

## Быстрый прогон (после изменений в БД или public/uploads)

```bash
npx tsx scripts/verify-all-photos-display.ts
npx tsx scripts/verify-photo-download-and-binding.ts
npx tsx scripts/verify-photo-display-flow.ts
```

При необходимости исправить оставшиеся http и текст в путях:

```bash
npx tsx scripts/verify-all-photos-display.ts --fix-http-to-empty
```
