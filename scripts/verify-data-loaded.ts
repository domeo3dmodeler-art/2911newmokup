/**
 * Проверка: все ли данные из final_filled 30.01.xlsx загружены в БД.
 * Сравнивает ожидаемое количество записей (по логике импорта) с фактическим в БД.
 *
 * Запуск:
 *   npx tsx scripts/verify-data-loaded.ts
 *   npx tsx scripts/verify-data-loaded.ts --strict
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';
import { getCategoryIdByName } from '../lib/catalog-categories';

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');
const OPERATIONAL_EXCLUSIONS_PATH = path.join(__dirname, 'verification-operational-exclusions.json');

function getColumn(row: Record<string, unknown>, logicalName: string): string {
  const need = logicalName.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(row)) {
    if (k.replace(/\s+/g, ' ').trim() === need) return String(row[k] ?? '').trim();
  }
  return String(row[logicalName] ?? '').trim();
}

function parseList(s: unknown): number[] {
  const str = String(s ?? '').trim();
  if (!str) return [];
  return str
    .split(/[,;]/)
    .map((x) => parseInt(x.replace(/\s/g, ''), 10))
    .filter((n) => !isNaN(n) && n > 0);
}

function slug(str: string): string {
  return String(str)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\wа-яё_-]/gi, '')
    .slice(0, 80) || 'item';
}

function okByMode(expected: number, actual: number, strict: boolean): boolean {
  return strict ? actual === expected : actual >= expected;
}

function loadOperationalExclusions(): Set<string> {
  if (!fs.existsSync(OPERATIONAL_EXCLUSIONS_PATH)) return new Set<string>();
  try {
    const raw = JSON.parse(fs.readFileSync(OPERATIONAL_EXCLUSIONS_PATH, 'utf8'));
    if (!Array.isArray(raw?.excludeDoorModelNames)) return new Set<string>();
    return new Set<string>(
      raw.excludeDoorModelNames
        .map((x: unknown) => String(x || '').trim())
        .filter(Boolean),
    );
  } catch {
    return new Set<string>();
  }
}

async function main() {
  const strictMode = process.argv.includes('--strict');
  const operationalMode = process.argv.includes('--operational');
  const excludedDoorModels = operationalMode ? loadOperationalExclusions() : new Set<string>();

  if (!fs.existsSync(FILE_PATH)) {
    console.error('Файл не найден:', FILE_PATH);
    process.exit(1);
  }

  const workbook = XLSX.readFile(FILE_PATH, { cellDates: true, raw: false });
  const toJson = (sheetName: string) => {
    const ws = workbook.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  };

  // —— Ожидаемые количества из файла (логика как в импорте: уникальные slug) ——
  const nalichnikiRows = toJson('Наличники').filter((r) => getColumn(r, 'Наличник: Название'));
  const nalichnikiSlugs = new Set(nalichnikiRows.map((r) => `nal_${slug(getColumn(r, 'Наличник: Название'))}`));
  const furnituraRows = toJson('Фурнитура').filter((r) => String(r['Комплект фурнитуры: Название'] ?? '').trim());
  const ruchkiRows = toJson('04 Ручки Завертки').filter((r) => getColumn(r, 'Название (Domeo_наименование для Web)'));
  const limitersRows = toJson('05 Ограничители').filter((r) => String(r['Название'] ?? '').trim());
  const furnituraSlugs = new Set(furnituraRows.map((r) => `kit_${slug(String(r['Комплект фурнитуры: Название'] ?? ''))}`));
  const ruchkiSlugs = new Set(ruchkiRows.map((r) => `handle_${slug(String(r['Название (Domeo_наименование для Web)'] ?? ''))}`));
  const limitersSlugs = new Set(limitersRows.map((r) => `lim_${slug(String(r['Название'] ?? ''))}`));

  const doorSlugs = new Set<string>();
  const pricesRows = toJson('Цены базовые');
  for (const row of pricesRows) {
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const modelName = getColumn(row, 'Название модели');
    if (operationalMode && excludedDoorModels.has(modelName)) continue;
    const heights = parseList(row['Высота, мм']);
    const widths = parseList(row['Ширины, мм']);
    if (!code || (!heights.length && !widths.length)) continue;
    const heightList = heights.length ? heights : [2000];
    const widthList = widths.length ? widths : [800];
    const coatingType = String(row['Тип покрытия'] ?? '').trim();
    const coatingSlug = slug(coatingType || 'base');
    for (const h of heightList) {
      for (const w of widthList) {
        const modelName = getColumn(row, 'Название модели');
        doorSlugs.add(`door_${slug(code)}_${slug(modelName)}_${w}_${h}_${coatingSlug}`);
      }
    }
  }
  const expectedDoors = doorSlugs.size;

  // Ожидаемое количество cover в PropertyPhoto с учётом дублирования по коду модели:
  // 1) Название модели|Тип покрытия|Цвет/отделка
  // 2) Код модели Domeo (Web)|Тип покрытия|Цвет/отделка (если код найден по модели)
  const modelNameToCode = new Map<string, string>();
  for (const row of pricesRows) {
    const modelName = getColumn(row, 'Название модели');
    if (operationalMode && excludedDoorModels.has(modelName)) continue;
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    if (modelName && code) modelNameToCode.set(modelName, code);
  }

  const colorRows = toJson('Цвет');
  const expectedCoverKeys = new Set<string>();
  colorRows.forEach((r) => {
    const modelName = getColumn(r, 'Название модели');
    if (operationalMode && excludedDoorModels.has(modelName)) return;
    const coatingType = String(r['Тип покрытия'] ?? '').trim();
    const colorName = String(r['Цвет/отделка'] ?? '').trim();
    const coverUrl = String(r['Ссылка на обложку'] ?? '').trim();
    if (!modelName || !coverUrl) return;
    expectedCoverKeys.add(`${modelName}|${coatingType}|${colorName}|cover`);
    const modelCode = modelNameToCode.get(modelName);
    if (modelCode) {
      expectedCoverKeys.add(`${modelCode}|${coatingType}|${colorName}|cover`);
    }
  });
  const expectedColorPhotos = expectedCoverKeys.size;

  // —— Фактические количества в БД ——
  const doorsCatId = await getCategoryIdByName('Межкомнатные двери');
  const nalichnikiCatId = await getCategoryIdByName('Наличники');
  const furnituraCatId = await getCategoryIdByName('Комплекты фурнитуры');
  const ruchkiCatId = await getCategoryIdByName('Ручки и завертки');
  const limitersCatId = await getCategoryIdByName('Ограничители');

  const [dbNalichniki, dbFurnitura, dbRuchki, dbLimiters, dbDoors, dbColorPhotos] = await Promise.all([
    nalichnikiCatId ? prisma.product.count({ where: { catalog_category_id: nalichnikiCatId } }) : 0,
    furnituraCatId ? prisma.product.count({ where: { catalog_category_id: furnituraCatId } }) : 0,
    ruchkiCatId ? prisma.product.count({ where: { catalog_category_id: ruchkiCatId } }) : 0,
    limitersCatId ? prisma.product.count({ where: { catalog_category_id: limitersCatId } }) : 0,
    doorsCatId ? prisma.product.count({ where: { catalog_category_id: doorsCatId } }) : 0,
    doorsCatId
      ? prisma.propertyPhoto.count({
          where: { categoryId: doorsCatId, propertyName: DOOR_COLOR_PROPERTY, photoType: 'cover' },
        })
      : 0,
  ]);
  let dbColorPhotosOperational = dbColorPhotos;
  if (operationalMode && doorsCatId) {
    const coverRows = await prisma.propertyPhoto.findMany({
      where: { categoryId: doorsCatId, propertyName: DOOR_COLOR_PROPERTY, photoType: 'cover' },
      select: { propertyValue: true },
    });
    const actualKeys = new Set(coverRows.map((r) => String(r.propertyValue || '')));
    let matched = 0;
    expectedCoverKeys.forEach((k) => {
      const pv = k.replace(/\|cover$/, '');
      if (actualKeys.has(pv)) matched++;
    });
    dbColorPhotosOperational = matched;
  }

  // —— Отчёт ——
  const rows: { source: string; expected: number; actual: number; ok: boolean }[] = [
    {
      source: 'Наличники (Product)',
      expected: nalichnikiSlugs.size,
      actual: dbNalichniki,
      ok: okByMode(nalichnikiSlugs.size, dbNalichniki, strictMode),
    },
    {
      source: 'Фурнитура (Product)',
      expected: furnituraSlugs.size,
      actual: dbFurnitura,
      ok: okByMode(furnituraSlugs.size, dbFurnitura, strictMode),
    },
    {
      source: 'Ручки и завертки (Product)',
      expected: ruchkiSlugs.size,
      actual: dbRuchki,
      ok: okByMode(ruchkiSlugs.size, dbRuchki, strictMode),
    },
    {
      source: 'Ограничители (Product)',
      expected: limitersSlugs.size,
      actual: dbLimiters,
      ok: okByMode(limitersSlugs.size, dbLimiters, strictMode),
    },
    {
      source: 'Двери (Product, Цены базовые)',
      expected: expectedDoors,
      actual: dbDoors,
      ok: okByMode(expectedDoors, dbDoors, strictMode),
    },
    {
      source: 'Цвет (PropertyPhoto cover)',
      expected: expectedColorPhotos,
      actual: operationalMode ? dbColorPhotosOperational : dbColorPhotos,
      ok: okByMode(expectedColorPhotos, operationalMode ? dbColorPhotosOperational : dbColorPhotos, strictMode),
    },
  ];

  console.log('\n=== Проверка загрузки данных из файла в БД ===\n');
  console.log('Источник файла: 1002/final_filled 30.01.xlsx\n');
  console.log(`Режим: ${strictMode ? 'STRICT (ожидается точное совпадение)' : 'RELAXED (допускается actual >= expected)'}\n`);
  if (operationalMode) {
    console.log(`Operational exclusions: ${excludedDoorModels.size} моделей`);
    if (excludedDoorModels.size > 0) {
      console.log('Исключены модели:', Array.from(excludedDoorModels).join('; '));
    }
    console.log('');
  }
  let allOk = true;
  for (const r of rows) {
    const status = r.ok ? '✓' : '✗';
    if (!r.ok) allOk = false;
    const delta = r.actual - r.expected;
    const deltaLabel = delta === 0 ? '0' : (delta > 0 ? `+${delta}` : `${delta}`);
    console.log(`${status} ${r.source}: ожидалось ${r.expected}, в БД ${r.actual} (дельта ${deltaLabel})`);
  }
  console.log('');
  if (allOk) {
    console.log('Итог: все данные из файла загружены в БД.');
  } else {
    console.log('Итог: есть расхождения.');
    if (!strictMode) {
      console.log('Подсказка: для строгой проверки чистой базы используйте --strict после очистки категорий и полного импорта.');
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
