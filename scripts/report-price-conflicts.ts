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

type ConflictItem = {
  key: string;
  code: string;
  width: number;
  height: number;
  finish: string;
  prices: number[];
  examples: string[];
};

function collectConflicts(
  rows: Array<{
    code: string;
    width: number;
    height: number;
    finish: string;
    price: number;
    model: string;
    sourceId: string;
  }>,
): ConflictItem[] {
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.code}|||${row.width}|||${row.height}|||${row.finish}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const out: ConflictItem[] = [];
  for (const [key, items] of groups.entries()) {
    const priceSet = new Set(items.map((x) => x.price));
    if (priceSet.size <= 1) continue;
    const [code, w, h, finish] = key.split('|||');
    out.push({
      key,
      code,
      width: Number(w),
      height: Number(h),
      finish,
      prices: Array.from(priceSet).sort((a, b) => a - b),
      examples: items.slice(0, 6).map((x) => `${x.model} [${x.sourceId}] => ${x.price}`),
    });
  }

  return out.sort((a, b) => a.code.localeCompare(b.code) || a.width - b.width || a.height - b.height);
}

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`Файл не найден: ${FILE_PATH}`);
  }

  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  const ws = wb.Sheets['Цены базовые'];
  if (!ws) throw new Error('Лист "Цены базовые" не найден');
  const excelRaw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });

  const excelRows: Array<{
    code: string;
    width: number;
    height: number;
    finish: string;
    price: number;
    model: string;
    sourceId: string;
  }> = [];
  for (let i = 0; i < excelRaw.length; i++) {
    const row = excelRaw[i];
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const model = getColumn(row, 'Название модели');
    const finish = String(row['Тип покрытия'] ?? '').trim();
    const price = parsePrice(row['Цена РРЦ']);
    if (!code) continue;
    const heights = parseList(row['Высота, мм']);
    const widths = parseList(row['Ширины, мм']);
    const heightList = heights.length ? heights : [2000];
    const widthList = widths.length ? widths : [800];
    for (const h of heightList) {
      for (const w of widthList) {
        excelRows.push({
          code,
          width: w,
          height: h,
          finish,
          price,
          model,
          sourceId: `excel_row_${i + 2}`,
        });
      }
    }
  }

  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) throw new Error('Категория дверей не найдена');
  const dbProducts = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { id: true, properties_data: true, base_price: true },
  });
  const dbRows = dbProducts
    .map((p) => {
      const props = parseProps(p.properties_data);
      const code = String(props['Код модели Domeo (Web)'] ?? '').trim();
      const model = String(props['Название модели'] ?? '').trim();
      const finish = String(props['Тип покрытия'] ?? '').trim();
      const width = Number(props['Ширина/мм'] ?? 0);
      const height = Number(props['Высота/мм'] ?? 0);
      const price = Number(p.base_price ?? 0);
      return {
        code,
        width,
        height,
        finish,
        price,
        model,
        sourceId: p.id,
      };
    })
    .filter((x) => x.code && x.width > 0 && x.height > 0);

  const excelConflicts = collectConflicts(excelRows);
  const dbConflicts = collectConflicts(dbRows);

  console.log('\n=== Конфликты цен РРЦ (одинаковые код+ширина+высота+покрытие) ===\n');

  console.log(`Excel: конфликтных групп = ${excelConflicts.length}`);
  if (excelConflicts.length > 0) {
    excelConflicts.slice(0, 50).forEach((c, idx) => {
      console.log(
        `${idx + 1}. ${c.code} | ${c.width}x${c.height} | ${c.finish || '(пусто)'} | цены: ${c.prices.join(', ')}`,
      );
      c.examples.forEach((e) => console.log(`   - ${e}`));
    });
    if (excelConflicts.length > 50) {
      console.log(`... и еще ${excelConflicts.length - 50} групп`);
    }
  }

  console.log(`\nDB: конфликтных групп = ${dbConflicts.length}`);
  if (dbConflicts.length > 0) {
    dbConflicts.slice(0, 50).forEach((c, idx) => {
      console.log(
        `${idx + 1}. ${c.code} | ${c.width}x${c.height} | ${c.finish || '(пусто)'} | цены: ${c.prices.join(', ')}`,
      );
      c.examples.forEach((e) => console.log(`   - ${e}`));
    });
    if (dbConflicts.length > 50) {
      console.log(`... и еще ${dbConflicts.length - 50} групп`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
