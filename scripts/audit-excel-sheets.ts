/**
 * Аудит вкладок и столбцов final_filled 30.01.xlsx:
 * - список всех листов и заголовков столбцов в файле;
 * - сопоставление с тем, что читает импорт (import-final-filled.ts);
 * - столбцы в файле, но не используемые импортом;
 * - столбцы, которые импорт ожидает; если в файле нет — предупреждение.
 *
 * Запуск: npx tsx scripts/audit-excel-sheets.ts
 * Файл: 1002/final_filled 30.01.xlsx
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

/** Нормализация названия столбца для сравнения (как getColumn: trim, схлопнуть пробелы) */
function norm(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Столбцы, которые импорт использует по листам (логические имена — могут совпадать с заголовком или с небольшими отличиями) */
const COLUMNS_USED_BY_IMPORT: Record<string, string[]> = {
  'Цены базовые': [
    'Код модели Domeo (Web)',
    'Название модели',
    'Стиль Domeo (Web)',
    'Поставщик',
    'Высота, мм',
    'Ширины, мм',
    'Толщина, мм',
    'Тип покрытия',
    'Стекло',
    'Кромка в базе',
    'Цена опт',
    'Цена РРЦ',
  ],
  Цвет: [
    'Название модели',
    'Поставщик',
    'Тип покрытия',
    'Цвет/отделка',
    'Ссылка на обложку',
    'Ссылки на галерею (через ;)',
  ],
  Опции: [
    'Название модели',
    'Поставщик',
    'Название наполнения',
    'Звукоизоляция (дБ)',
    'Надбавка 2301-2500мм (%) к высоте 2000',
    'Надбавка 2501-3000мм (%) к высоте 2000',
    'Реверс доступен (Да/Нет)',
    'Надбавка за реверс (руб)',
    'Порог доступен (Да/Нет)',
    'Цена порога (руб)',
    'Зеркало доступно (Да/Нет)',
    'Зеркало: Одна сторона (руб)',
    'Зеркало: Две стороны (руб)',
  ],
  Стекло_доступность: [
    'Код модели Domeo (Web)',
    'Поставщик',
    'Название модели',
    'Доступные цвета стекол для модели',
  ],
  'Наценка за кромку': [
    'Название модели',
    'Кромка включена в базовую цену (Да/Нет)',
    'Базовая кромка (самая дешевая), Цвет',
    'Опции кромки доступны (Да/Нет)',
    'Наценка за кромку как за опцию',
    'Цвет 2',
    'Наценка за Цвет 2',
    'Цвет 3',
    'Наценка за Цвет 3',
    'Цвет 4',
    'Наценка за Цвет 4',
  ],
  Наличники: [
    'Поставщик',
    'Наличник: Название',
    'Наличник: Описание',
    'Наличник: Фото (ссылка)',
  ],
  Фурнитура: [
    'Комплект фурнитуры: Название',
    'Описание',
    'Цена',
  ],
  '04 Ручки Завертки': [
    'Тип (Ручка/Завертка)',
    'Название (Domeo_наименование для Web)',
    'Описание',
    'Группа',
    'Цена продажи (руб)',
    'Цена закупки (руб)',
    'Цена РРЦ (руб)',
    'Фото (ссылка)',
    'Порядок сортировки',
    'Активна (Да/Нет)',
    'Завертка, цена РРЦ',
    'Фото завертки (ссылка)',
  ],
  '05 Ограничители': [
    'ID товара',
    'Название',
    'Тип (магнитный врезной / напольный / настенный)',
    'Описание',
    'Цена опт (руб)',
    'Цена РРЦ (руб)',
    'Фото (путь)',
  ],
};

function main() {
  const fileExists = fs.existsSync(FILE_PATH);
  if (!fileExists) {
    console.error('Файл не найден:', FILE_PATH);
    console.error('Будет сформирован отчёт по ожидаемой структуре (по коду импорта).');
    console.error('Положите final_filled 30.01.xlsx в папку 1002/ и запустите снова для полного сравнения.');
  }

  const wb = fileExists ? XLSX.readFile(FILE_PATH, { raw: false }) : null;
  const report: string[] = [];

  report.push('# Аудит вкладок final_filled 30.01.xlsx');
  report.push('');
  report.push('Сравнение: что есть в файле vs что читает импорт (import-final-filled.ts).');
  if (!fileExists) report.push('');
  if (!fileExists) report.push('**Файл не найден — ниже только ожидаемая структура по коду импорта.**');
  report.push('');
  report.push('---');
  report.push('');

  const allSheets = wb ? wb.SheetNames : Object.keys(COLUMNS_USED_BY_IMPORT);
  report.push('## 1. Список листов');
  report.push('');
  report.push('| № | Лист | Строк (приблиз.) | Столбцов в файле | Используется импортом |');
  report.push('|---|------|------------------|-------------------|------------------------|');

  for (let i = 0; i < allSheets.length; i++) {
    const name = allSheets[i];
    let rowCount = 0;
    let colCount = 0;
    if (wb) {
      const ws = wb.Sheets[name];
      if (ws) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1, defval: '' });
        const headers = (rows[0] as unknown[]) || [];
        colCount = headers.map((h) => norm(String(h ?? ''))).filter(Boolean).length;
        rowCount = Math.max(0, rows.length - 1);
      }
    }
    const used = COLUMNS_USED_BY_IMPORT[name] ? 'да' : 'нет (не импортируем)';
    report.push(`| ${i + 1} | ${name} | ${rowCount} | ${colCount} | ${used} |`);
  }

  report.push('');
  report.push('---');
  report.push('');
  report.push('## 2. По листам: столбцы в файле vs используемые импортом');
  report.push('');

  for (const sheetName of allSheets) {
    let inFile: string[] = [];
    if (wb) {
      const ws = wb.Sheets[sheetName];
      if (ws) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { header: 1, defval: '' });
        const headers = (rows[0] as unknown[]) || [];
        inFile = headers.map((h) => norm(String(h ?? ''))).filter(Boolean);
      }
    }
    const inFileSet = new Set(inFile);
    const usedList = COLUMNS_USED_BY_IMPORT[sheetName] || [];
    const usedSet = new Set(usedList.map(norm));

    report.push(`### ${sheetName}`);
    report.push('');
    if (inFile.length > 0) {
      report.push('**В файле (заголовки):**');
      inFile.forEach((h, idx) => report.push(`- ${idx + 1}. \`${h}\``));
      report.push('');
    } else if (fileExists) {
      report.push('**В файле:** лист пустой или без заголовков.');
      report.push('');
    } else {
      report.push('**В файле:** (файл не найден — запустите скрипт с файлом в 1002/).');
      report.push('');
    }

    if (usedList.length > 0) {
      report.push('**Импорт использует:**');
      usedList.forEach((u) => report.push(`- \`${u}\``));
      report.push('');

      if (inFile.length > 0) {
        const inFileNotUsed = inFile.filter((h) => !usedSet.has(h));
        const usedNorm = usedList.map((u) => ({ orig: u, n: norm(u) }));
        const usedButMissing = usedNorm.filter(({ n }) => !inFileSet.has(n));

        if (inFileNotUsed.length > 0) {
          report.push('**В файле есть, но импорт не использует:**');
          inFileNotUsed.forEach((h) => report.push(`- \`${h}\``));
          report.push('');
        }

        if (usedButMissing.length > 0) {
          report.push('**Импорт ожидает, в файле нет (или другое написание):**');
          usedButMissing.forEach(({ orig }) => report.push(`- \`${orig}\``));
          report.push('');
        }
      }
    } else {
      report.push('Импорт этот лист не обрабатывает.');
      report.push('');
    }

    report.push('---');
    report.push('');
  }

  report.push('## 3. Атрибуты дверей в properties_data');
  report.push('');
  report.push('Импорт записывает в товар двери (Product.properties_data) поля из нескольких листов. Источники:');
  report.push('');
  report.push('| Ключ в properties_data | Источник (лист → столбец) | Примечание |');
  report.push('|------------------------|----------------------------|------------|');
  report.push('| Код модели Domeo (Web) | Цены базовые | |');
  report.push('| Название модели, Domeo_Название модели для Web | Цены базовые → Название модели | |');
  report.push('| Артикул поставщика | Цены базовые → Код модели Domeo (Web) | |');
  report.push('| Стиль Domeo (Web), Domeo_Стиль Web | Цены базовые | |');
  report.push('| Ширина/мм, Высота/мм | Цены базовые (разворот по Ширины, мм × Высота, мм) | |');
  report.push('| Тип покрытия | Цены базовые | |');
  report.push('| Поставщик, Толщина мм, Стекло, Кромка в базе, Цена опт, Цена РРЦ | Цены базовые | |');
  report.push('| Domeo_Опции_* (реверс, порог, зеркало, наполнение и т.д.) | Опции (по Название модели) | Если модели нет в Опции — опций нет |');
  report.push('| Domeo_Опции_Поставщик | Опции → Поставщик | |');
  report.push('| Domeo_Стекло_доступность | Стекло_доступность (по Название модели) | |');
  report.push('| Domeo_Стекло_Поставщики | Стекло_доступность → Поставщик | массив уникальных поставщиков |');
  report.push('| Domeo_Цвет_Поставщики | Цвет → Поставщик | массив уникальных поставщиков по модели |');
  report.push('| Domeo_Кромка_* | Наценка за кромку (по Название модели) | Если модели нет — edge_in_base = Нет |');
  report.push('');
  report.push('**Атрибуты, которых нет в Excel (и не заполняются импортом):**');
  report.push('- `Domeo_Цвет` — цвет выбирается в конфигураторе из списка (лист «Цвет» → PropertyPhoto); для товара двери одно значение на вариант не хранится, фильтр цены допускает null.');
  report.push('- `Тип конструкции` — в листе «Цены базовые» отдельного столбца нет; при необходимости добавить в Excel и в импорт.');
  report.push('');

  const out = report.join('\n');
  console.log(out);

  const outPath = path.join(__dirname, '..', 'docs', 'EXCEL_SHEETS_AUDIT.md');
  fs.writeFileSync(outPath, out, 'utf8');
  console.error('\nОтчёт записан в', outPath);
}

main();
