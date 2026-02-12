import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

function getColumn(row: Record<string, unknown>, logicalName: string): string {
  const need = logicalName.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(row)) {
    if (k.replace(/\s+/g, ' ').trim() === need) return String(row[k] ?? '').trim();
  }
  return String(row[logicalName] ?? '').trim();
}

function parseProps(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>;
  return {};
}

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`Файл не найден: ${FILE_PATH}`);
  }

  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) {
    throw new Error('Категория "Межкомнатные двери" не найдена');
  }

  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  const toJson = (sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [] as Record<string, unknown>[];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  };

  const pricesRows = toJson('Цены базовые');
  const colorRows = toJson('Цвет');

  const excelPairs = new Set<string>();
  const excelCodes = new Set<string>();
  const excelNames = new Set<string>();
  const nameToCodes = new Map<string, Set<string>>();

  for (const row of pricesRows) {
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const name = getColumn(row, 'Название модели');
    if (!code || !name) continue;
    const pair = `${code}|||${name}`;
    excelPairs.add(pair);
    excelCodes.add(code);
    excelNames.add(name);
    if (!nameToCodes.has(name)) nameToCodes.set(name, new Set());
    nameToCodes.get(name)!.add(code);
  }

  const dbProducts = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { id: true, sku: true, properties_data: true },
  });

  const dbPairs = new Set<string>();
  const dbCodes = new Set<string>();
  const dbNames = new Set<string>();
  for (const p of dbProducts) {
    const props = parseProps(p.properties_data);
    const code = String(props['Код модели Domeo (Web)'] ?? '').trim();
    const name = String(props['Название модели'] ?? '').trim();
    if (!code || !name) continue;
    dbPairs.add(`${code}|||${name}`);
    dbCodes.add(code);
    dbNames.add(name);
  }

  const pairsMissingInDb = [...excelPairs].filter((x) => !dbPairs.has(x));
  const pairsExtraInDb = [...dbPairs].filter((x) => !excelPairs.has(x));
  const codesMissingInDb = [...excelCodes].filter((x) => !dbCodes.has(x));
  const namesMissingInDb = [...excelNames].filter((x) => !dbNames.has(x));

  const ppColorCover = await prisma.propertyPhoto.findMany({
    where: {
      categoryId: doorsCategoryId,
      propertyName: DOOR_COLOR_PROPERTY,
      photoType: 'cover',
    },
    select: { propertyValue: true },
  });
  const ppSet = new Set(ppColorCover.map((x) => String(x.propertyValue || '')));

  let colorRowsTotal = 0;
  let colorNameCoverFound = 0;
  let colorCodeCoverFound = 0;
  const colorNameMissing: string[] = [];
  const colorCodeMissing: string[] = [];

  for (const row of colorRows) {
    const modelName = getColumn(row, 'Название модели');
    const coatingType = String(row['Тип покрытия'] ?? '').trim();
    const colorName = String(row['Цвет/отделка'] ?? '').trim();
    const cover = String(row['Ссылка на обложку'] ?? '').trim();
    if (!modelName || !cover) continue;
    colorRowsTotal++;

    const byName = `${modelName}|${coatingType}|${colorName}`;
    if (ppSet.has(byName)) colorNameCoverFound++;
    else if (colorNameMissing.length < 20) colorNameMissing.push(byName);

    const codes = nameToCodes.get(modelName);
    if (codes && codes.size > 0) {
      let foundByAnyCode = false;
      for (const code of codes) {
        const byCode = `${code}|${coatingType}|${colorName}`;
        if (ppSet.has(byCode)) {
          foundByAnyCode = true;
          break;
        }
      }
      if (foundByAnyCode) colorCodeCoverFound++;
      else if (colorCodeMissing.length < 20) {
        colorCodeMissing.push(`${modelName}|${coatingType}|${colorName}`);
      }
    }
  }

  const duplicateCodesInExcel = new Map<string, Set<string>>();
  for (const pair of excelPairs) {
    const [code, name] = pair.split('|||');
    if (!duplicateCodesInExcel.has(code)) duplicateCodesInExcel.set(code, new Set());
    duplicateCodesInExcel.get(code)!.add(name);
  }
  const multiModelCodes = [...duplicateCodesInExcel.entries()]
    .filter(([, names]) => names.size > 1)
    .map(([code, names]) => ({ code, names: [...names] }));

  console.log('\n=== Сверка Excel ↔ БД (коды/модели) ===\n');
  console.log('Excel (Цены базовые):');
  console.log('  Уникальных кодов:', excelCodes.size);
  console.log('  Уникальных моделей:', excelNames.size);
  console.log('  Уникальных пар код+модель:', excelPairs.size);
  console.log('');
  console.log('БД (товары дверей):');
  console.log('  Уникальных кодов:', dbCodes.size);
  console.log('  Уникальных моделей:', dbNames.size);
  console.log('  Уникальных пар код+модель:', dbPairs.size);
  console.log('');
  console.log('Сопоставление код+модель:');
  console.log('  Пар из Excel, отсутствующих в БД:', pairsMissingInDb.length);
  console.log('  Лишних пар в БД (нет в Excel):', pairsExtraInDb.length);
  console.log('  Кодов из Excel, отсутствующих в БД:', codesMissingInDb.length);
  console.log('  Моделей из Excel, отсутствующих в БД:', namesMissingInDb.length);
  if (pairsMissingInDb.length > 0) {
    console.log('  Примеры missing pair:', pairsMissingInDb.slice(0, 10));
  }
  if (pairsExtraInDb.length > 0) {
    console.log('  Примеры extra pair:', pairsExtraInDb.slice(0, 10));
  }

  console.log('\nПроверка "Цвет" -> PropertyPhoto cover:');
  console.log('  Строк Цвет с обложкой в Excel:', colorRowsTotal);
  console.log('  Найдено cover по имени модели:', colorNameCoverFound);
  console.log('  Найдено cover по коду модели:', colorCodeCoverFound);
  console.log('  Отсутствуют cover по имени:', colorRowsTotal - colorNameCoverFound);
  console.log('  Отсутствуют cover по коду:', colorRowsTotal - colorCodeCoverFound);
  if (colorNameMissing.length) {
    console.log('  Примеры отсутствующих по имени:', colorNameMissing.slice(0, 10));
  }
  if (colorCodeMissing.length) {
    console.log('  Примеры отсутствующих по коду:', colorCodeMissing.slice(0, 10));
  }

  console.log('\nКоды с несколькими моделями (допустимо по вашему правилу):', multiModelCodes.length);
  if (multiModelCodes.length) {
    multiModelCodes.slice(0, 20).forEach((x) => {
      console.log(`  - ${x.code}: ${x.names.join(' | ')}`);
    });
  }

  const ok =
    pairsMissingInDb.length === 0 &&
    pairsExtraInDb.length === 0 &&
    codesMissingInDb.length === 0 &&
    namesMissingInDb.length === 0;

  console.log('\nИтог:', ok ? 'OK — пары код+модель согласованы' : 'Есть расхождения, смотрите выше');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
