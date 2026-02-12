import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { getDoorsCategoryId } from '../lib/catalog-categories';

const prisma = new PrismaClient();
const ROOT = path.join(__dirname, '..');
const FILE_PATH = path.join(ROOT, '1002', 'final_filled 30.01.xlsx');
const OUT_PATH = path.join(ROOT, '1002', `price-conflicts-${Date.now()}.xlsx`);

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
  source: 'Excel' | 'DB';
  code: string;
  model: string;
  supplier: string;
  width: number;
  height: number;
  finish: string;
  priceRrc: number;
  fillingName: string;
  soundDb: string;
  reference: string;
};

function groupKey(r: Pick<Row, 'code' | 'width' | 'height' | 'finish' | 'fillingName'>): string {
  return `${r.code}|||${r.width}|||${r.height}|||${r.finish}|||${r.fillingName}`;
}

function buildConflictRows(rows: Row[]): Array<Record<string, unknown>> {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = groupKey(row);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const rawOut: Array<Record<string, unknown>> = [];
  for (const [key, items] of groups.entries()) {
    const prices = Array.from(new Set(items.map((i) => i.priceRrc))).sort((a, b) => a - b);
    if (prices.length <= 1) continue;
    const [code, w, h, finish, fillingName] = key.split('|||');
    for (const item of items) {
      rawOut.push({
        Источник: item.source,
        'Код модели Domeo (Web)': code,
        'Название модели': item.model,
        Поставщик: item.supplier,
        'Ширина, мм': Number(w),
        'Высота, мм': Number(h),
        'Тип покрытия': finish,
        'Цена РРЦ': item.priceRrc,
        'Название наполнения': fillingName,
        'Звукоизоляция (дБ)': item.soundDb,
        'Цены в конфликтной группе': prices.join('; '),
        Ref: item.reference,
      });
    }
  }

  const compact = new Map<string, Record<string, unknown> & { _sizes: Set<string> }>();
  for (const row of rawOut) {
    const size = `${row['Ширина, мм']}x${row['Высота, мм']}`;
    const key = [
      row['Источник'],
      row['Код модели Domeo (Web)'],
      row['Название модели'],
      row['Поставщик'],
      row['Тип покрытия'],
      row['Название наполнения'],
      row['Звукоизоляция (дБ)'],
      row['Цена РРЦ'],
      row['Цены в конфликтной группе'],
    ].join('|||');
    if (!compact.has(key)) {
      compact.set(key, {
        ...row,
        _sizes: new Set<string>(),
      });
    }
    compact.get(key)!._sizes.add(size);
  }

  const out = Array.from(compact.values()).map((row) => {
    const sizes = Array.from(row._sizes).sort((a, b) => {
      const [aw, ah] = a.split('x').map(Number);
      const [bw, bh] = b.split('x').map(Number);
      return ah - bh || aw - bw;
    });
    return {
      ...row,
      'Размеры (ШxВ)': sizes.join('; '),
      'Кол-во размеров': sizes.length,
      'Ширина, мм': undefined,
      'Высота, мм': undefined,
      Ref: undefined,
    };
  });

  return out.sort((a, b) => {
    const ka = `${a['Код модели Domeo (Web)']}|${a['Тип покрытия']}|${a['Название наполнения']}|${a['Название модели']}|${a['Размеры (ШxВ)']}`;
    const kb = `${b['Код модели Domeo (Web)']}|${b['Тип покрытия']}|${b['Название наполнения']}|${b['Название модели']}|${b['Размеры (ШxВ)']}`;
    return ka.localeCompare(kb, 'ru');
  });
}

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    throw new Error(`Файл не найден: ${FILE_PATH}`);
  }

  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  const pricesSheet = wb.Sheets['Цены базовые'];
  const optionsSheet = wb.Sheets['Опции'];
  if (!pricesSheet) throw new Error('Лист "Цены базовые" не найден');

  const pricesRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(pricesSheet, { defval: '', raw: false });
  const optionsRows = optionsSheet
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(optionsSheet, { defval: '', raw: false })
    : [];

  const optionByModel = new Map<string, { fillingName: string; soundDb: string }>();
  for (const row of optionsRows) {
    const modelName = getColumn(row, 'Название модели');
    if (!modelName || optionByModel.has(modelName)) continue;
    optionByModel.set(modelName, {
      fillingName: String(row['Название наполнения'] ?? '').trim(),
      soundDb: String(row['Звукоизоляция (дБ)'] ?? '').trim(),
    });
  }

  const excelSourceRows: Row[] = [];
  for (let i = 0; i < pricesRows.length; i++) {
    const row = pricesRows[i];
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const model = getColumn(row, 'Название модели');
    const finish = String(row['Тип покрытия'] ?? '').trim();
    const priceRrc = parsePrice(row['Цена РРЦ']);
    if (!code || !model) continue;
    const heights = parseList(row['Высота, мм']);
    const widths = parseList(row['Ширины, мм']);
    const heightList = heights.length ? heights : [2000];
    const widthList = widths.length ? widths : [800];
    const option = optionByModel.get(model) || { fillingName: '', soundDb: '' };
    for (const h of heightList) {
      for (const w of widthList) {
        excelSourceRows.push({
          source: 'Excel',
          code,
          model,
      supplier: String(row['Поставщик'] ?? '').trim(),
          width: w,
          height: h,
          finish,
          priceRrc,
          fillingName: option.fillingName,
          soundDb: option.soundDb,
          reference: `excel_row_${i + 2}`,
        });
      }
    }
  }

  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) throw new Error('Категория дверей не найдена');

  const dbProducts = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { id: true, base_price: true, properties_data: true },
  });

  const dbSourceRows: Row[] = dbProducts
    .map((p) => {
      const props = parseProps(p.properties_data);
      return {
        source: 'DB' as const,
        code: String(props['Код модели Domeo (Web)'] ?? '').trim(),
        model: String(props['Название модели'] ?? '').trim(),
        supplier: String(props['Поставщик'] ?? '').trim(),
        width: Number(props['Ширина/мм'] ?? 0),
        height: Number(props['Высота/мм'] ?? 0),
        finish: String(props['Тип покрытия'] ?? '').trim(),
        priceRrc: Number(p.base_price ?? 0),
        fillingName: String(props['Domeo_Опции_Название_наполнения'] ?? '').trim(),
        soundDb: String(props['Domeo_Опции_Звукоизоляция_дБ'] ?? '').trim(),
        reference: p.id,
      };
    })
    .filter((r) => r.code && r.model && r.width > 0 && r.height > 0);

  const excelConflicts = buildConflictRows(excelSourceRows);
  const dbConflicts = buildConflictRows(dbSourceRows);

  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    outWb,
    XLSX.utils.json_to_sheet(excelConflicts.length ? excelConflicts : [{ Info: 'Конфликты не найдены' }]),
    'Конфликты_Excel',
  );
  XLSX.utils.book_append_sheet(
    outWb,
    XLSX.utils.json_to_sheet(dbConflicts.length ? dbConflicts : [{ Info: 'Конфликты не найдены' }]),
    'Конфликты_БД',
  );
  XLSX.utils.book_append_sheet(
    outWb,
    XLSX.utils.json_to_sheet([
      {
        'Конфликт (критерий)': 'Одинаковые Код + Ширина + Высота + Тип покрытия + Название наполнения, но разные Цена РРЦ',
        'Строк конфликтов Excel': excelConflicts.length,
        'Строк конфликтов БД': dbConflicts.length,
      },
    ]),
    'Сводка',
  );

  XLSX.writeFile(outWb, OUT_PATH);
  console.log('Файл отчета создан:', OUT_PATH);
  console.log('Конфликтов Excel (строк):', excelConflicts.length);
  console.log('Конфликтов БД (строк):', dbConflicts.length);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
