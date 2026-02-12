import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { getDoorsCategoryId } from '../lib/catalog-categories';

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

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

function parsePrice(v: unknown): number {
  const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
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

type Row = {
  code: string;
  model: string;
  width: number;
  height: number;
  finish: string;
  price: number;
};

function keyOf(r: Row): string {
  return `${r.code}|||${r.width}|||${r.height}|||${r.finish}`;
}

function buildGroups(rows: Row[]): Map<string, Row[]> {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = keyOf(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return groups;
}

function conflictGroups(groups: Map<string, Row[]>): Map<string, Row[]> {
  const out = new Map<string, Row[]>();
  for (const [k, rows] of groups.entries()) {
    const priceSet = new Set(rows.map((r) => r.price));
    if (priceSet.size > 1) out.set(k, rows);
  }
  return out;
}

async function main() {
  if (!fs.existsSync(FILE_PATH)) throw new Error(`Файл не найден: ${FILE_PATH}`);
  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  const ws = wb.Sheets['Цены базовые'];
  if (!ws) throw new Error('Лист "Цены базовые" не найден');
  const pricesRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });

  const excelRows: Row[] = [];
  for (const row of pricesRows) {
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const model = getColumn(row, 'Название модели');
    const finish = String(row['Тип покрытия'] ?? '').trim();
    const price = parsePrice(row['Цена РРЦ']);
    if (!code || !model) continue;
    const heights = parseList(row['Высота, мм']);
    const widths = parseList(row['Ширины, мм']);
    const heightList = heights.length ? heights : [2000];
    const widthList = widths.length ? widths : [800];
    for (const h of heightList) {
      for (const w of widthList) {
        excelRows.push({ code, model, width: w, height: h, finish, price });
      }
    }
  }

  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) throw new Error('Категория дверей не найдена');
  const products = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { properties_data: true, base_price: true },
  });
  const dbRows: Row[] = products
    .map((p) => {
      const props = parseProps(p.properties_data);
      return {
        code: String(props['Код модели Domeo (Web)'] ?? '').trim(),
        model: String(props['Название модели'] ?? '').trim(),
        width: Number(props['Ширина/мм'] ?? 0),
        height: Number(props['Высота/мм'] ?? 0),
        finish: String(props['Тип покрытия'] ?? '').trim(),
        price: Number(p.base_price ?? 0),
      };
    })
    .filter((r) => r.code && r.model && r.width > 0 && r.height > 0);

  const excelGroups = buildGroups(excelRows);
  const dbGroups = buildGroups(dbRows);
  const excelConf = conflictGroups(excelGroups);
  const dbConf = conflictGroups(dbGroups);

  const excelKeys = new Set(excelConf.keys());
  const dbKeys = new Set(dbConf.keys());
  const onlyExcelKeys = [...excelKeys].filter((k) => !dbKeys.has(k));
  const onlyDbKeys = [...dbKeys].filter((k) => !excelKeys.has(k));
  const bothKeys = [...excelKeys].filter((k) => dbKeys.has(k));

  const rowCount = (m: Map<string, Row[]>, keys: string[]) =>
    keys.reduce((acc, k) => acc + (m.get(k)?.length ?? 0), 0);
  const onlyExcelRows = rowCount(excelConf, onlyExcelKeys);
  const onlyDbRows = rowCount(dbConf, onlyDbKeys);
  const bothExcelRows = rowCount(excelConf, bothKeys);
  const bothDbRows = rowCount(dbConf, bothKeys);

  const byCodeOnlyExcel = new Map<string, number>();
  for (const k of onlyExcelKeys) {
    const [code] = k.split('|||');
    byCodeOnlyExcel.set(code, (byCodeOnlyExcel.get(code) || 0) + 1);
  }
  const topOnlyExcelCodes = [...byCodeOnlyExcel.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log('\n=== Анализ разницы конфликтов Excel vs DB ===\n');
  console.log('Конфликтные ключи (код+ширина+высота+покрытие):');
  console.log('  Excel:', excelKeys.size);
  console.log('  DB   :', dbKeys.size);
  console.log('  Только Excel:', onlyExcelKeys.length);
  console.log('  Только DB   :', onlyDbKeys.length);
  console.log('  Общие       :', bothKeys.length);
  console.log('');
  console.log('Строки в конфликтных группах:');
  console.log('  Только Excel (строк):', onlyExcelRows);
  console.log('  Только DB (строк):', onlyDbRows);
  console.log('  Общие ключи -> строк Excel:', bothExcelRows);
  console.log('  Общие ключи -> строк DB   :', bothDbRows);
  console.log('');
  console.log('Топ кодов, формирующих "только Excel" (ключей):');
  topOnlyExcelCodes.forEach(([code, cnt]) => console.log(`  - ${code}: ${cnt}`));
  console.log('');
  console.log('Примеры ключей только Excel:');
  onlyExcelKeys.slice(0, 20).forEach((k) => console.log('  -', k));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
