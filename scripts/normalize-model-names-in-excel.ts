/**
 * Нормализация «Название модели» во всех вкладках Excel:
 * Канонические имена берём из листа «Цены базовые».
 * Во всех листах заменяем значение на каноническое, если совпадает имя без концовки « кр.» / « иск.п.».
 * Так везде будет одно и то же полное имя, различаться может только приписка в конце (кр. или иск.п.) — приводим к варианту из «Цены базовые».
 *
 * Пример: в Цены базовые есть "Дверное полотно Rimini 3 ПГ кр.";
 * в Опции было "Дверное полотно Rimini 3 ПГ" или "Дверное полотно Rimini 3 ПГ иск.п." → заменяем на "Дверное полотно Rimini 3 ПГ кр."
 *
 * Запуск: npx tsx scripts/normalize-model-names-in-excel.ts
 * Файл изменяется на месте: 1002/final_filled 30.01.xlsx
 */
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

const SUFFIXES = [' кр.', ' кр', ' иск.п.', ' иск.п'];

/** Имя без концовки " кр." / " иск.п." — база для сопоставления */
function getBaseName(name: string): string {
  let s = name.trim();
  for (const suffix of SUFFIXES) {
    if (s.endsWith(suffix)) {
      s = s.slice(0, -suffix.length).trim();
      break;
    }
  }
  return s;
}

function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error('Файл не найден:', FILE_PATH);
    process.exit(1);
  }

  const wb = XLSX.readFile(FILE_PATH, { raw: false });

  // 1) Собираем канонические имена из «Цены базовые»
  const pricesSheet = wb.Sheets['Цены базовые'];
  if (!pricesSheet) {
    console.error('Лист «Цены базовые» не найден.');
    process.exit(1);
  }
  const pricesRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(pricesSheet);
  const headerKey = Object.keys(pricesRows[0] || {}).find(
    (k) => k.replace(/\s+/g, ' ').trim() === 'Название модели'
  )!;
  const canonicalNames = new Set<string>();
  for (const row of pricesRows) {
    const v = row[headerKey];
    const s = typeof v === 'string' ? v.trim() : String(v ?? '').trim();
    if (s) canonicalNames.add(s);
  }

  // 2) База → каноническое имя (если одна база даёт несколько каноников — берём первый)
  const baseToCanonical = new Map<string, string>();
  for (const canonical of canonicalNames) {
    const base = getBaseName(canonical);
    if (!baseToCanonical.has(base)) baseToCanonical.set(base, canonical);
  }

  // 3) Во всех листах с столбцом «Название модели» заменяем на каноническое по базе
  let totalReplacements = 0;
  const sheetsWithModelCol = wb.SheetNames.filter((name) => {
    const ws = wb.Sheets[name];
    if (!ws) return false;
    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
    const headers = (rows[0] as unknown as string[]) || [];
    return headers.some((h) => String(h ?? '').replace(/\s+/g, ' ').trim() === 'Название модели');
  });

  for (const sheetName of sheetsWithModelCol) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;

    const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
    if (rows.length === 0) continue;

    const headers = (rows[0] as unknown as string[]) || [];
    const colIndex = headers.findIndex(
      (h) => String(h ?? '').replace(/\s+/g, ' ').trim() === 'Название модели'
    );
    if (colIndex === -1) continue;

    let sheetCount = 0;
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r] as unknown as (string | number)[];
      if (!row || colIndex >= row.length) continue;
      const raw = row[colIndex];
      const current = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
      if (!current) continue;

      const base = getBaseName(current);
      const canonical = baseToCanonical.get(base);
      if (canonical && current !== canonical) {
        row[colIndex] = canonical;
        sheetCount++;
        if (sheetCount <= 5) {
          console.log(`  [${sheetName}] "${current}" → "${canonical}"`);
        }
      }
    }
    if (sheetCount > 0) {
      const newWs = XLSX.utils.aoa_to_sheet(rows);
      wb.Sheets[sheetName] = newWs;
      totalReplacements += sheetCount;
      if (sheetCount > 5) console.log(`  [${sheetName}] ... и ещё ${sheetCount - 5} замен`);
      console.log(`  [${sheetName}] всего замен: ${sheetCount}`);
    }
  }

  if (totalReplacements > 0) {
    try {
      XLSX.writeFile(wb, FILE_PATH);
      console.log('\nИтого замен:', totalReplacements);
      console.log('Файл сохранён:', FILE_PATH);
    } catch (err: unknown) {
      const fallback = FILE_PATH.replace(/\.xlsx$/i, '_normalized.xlsx');
      XLSX.writeFile(wb, fallback);
      console.log('\nИтого замен:', totalReplacements);
      console.log('Исходный файл занят (закройте его в Excel/редакторе). Результат записан в:', fallback);
      console.log('Скопируйте содержимое в исходный файл или переименуйте после закрытия.');
    }
  } else {
    console.log('Замен не требуется (все имена уже совпадают с каноническими из «Цены базовые»).');
  }
}

main();
