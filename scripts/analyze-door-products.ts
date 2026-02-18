/**
 * Анализ товаров дверей в локальной БД: объём, дубликаты, лишние записи.
 * Запуск: npx tsx scripts/analyze-door-products.ts
 */
import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';

const prisma = new PrismaClient();

const MODEL_CODE_KEY = 'Код модели Domeo (Web)';
const WIDTH_KEY = 'Ширина/мм';
const HEIGHT_KEY = 'Высота/мм';
const FINISH_KEY = 'Тип покрытия';
const COLOR_KEY = 'Цвет/Отделка';
const SUPPLIER_KEY = 'Поставщик';

type Props = Record<string, unknown>;

function getStr(props: Props, key: string): string {
  const v = props[key];
  return (v != null && typeof v === 'string' ? v : String(v ?? '')).trim();
}

function getNum(props: Props, key: string): number {
  const v = props[key];
  return typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0;
}

/** Ключ одной логической конфигурации двери (модель + размер + покрытие + цвет) */
function logicalKey(code: string, width: number, height: number, finish: string, color: string): string {
  return [code, width, height, finish || '—', color || '—'].join('|');
}

/** Ключ с поставщиком — полная уникальность товара */
function fullKey(code: string, width: number, height: number, finish: string, color: string, supplier: string): string {
  return [logicalKey(code, width, height, finish, color), supplier || '—'].join('|');
}

/** Базовая комбинация без цвета: модель + размер + покрытие. Цвет зависит от модели, не от размера — хранение по цвету раздуло БД. */
function baseKey(code: string, width: number, height: number, finish: string): string {
  return [code, width, height, finish || '—'].join('|');
}

async function main() {
  const doorsCategoryId = await getDoorsCategoryId();
  if (!doorsCategoryId) {
    console.error('Категория «Межкомнатные двери» не найдена.');
    process.exit(1);
  }

  const allProducts = await prisma.product.findMany({
    where: { catalog_category_id: doorsCategoryId },
    select: { id: true, sku: true, is_active: true, properties_data: true, created_at: true },
  });

  const activeProducts = allProducts.filter((p) => p.is_active);
  const inactiveProducts = allProducts.filter((p) => !p.is_active);

  console.log('\n=== Товары дверей в БД ===\n');
  console.log('Всего записей в категории «Межкомнатные двери»:', allProducts.length);
  console.log('  is_active: true:', activeProducts.length);
  console.log('  is_active: false:', inactiveProducts.length);

  // Разница по времени создания
  const dates = allProducts.map((p) => (p.created_at instanceof Date ? p.created_at : new Date(p.created_at)));
  if (dates.length > 0) {
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    console.log('\n--- Даты создания товаров (created_at) ---');
    console.log('Минимум:', min.toISOString());
    console.log('Максимум:', max.toISOString());
    const byDay = new Map<string, number>();
    for (const d of dates) {
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const sortedDays = Array.from(byDay.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedDays.length <= 30) {
      console.log('По дням:');
      sortedDays.forEach(([day, count]) => console.log('  ', day, count));
    } else {
      const byMonth = new Map<string, number>();
      for (const [day, count] of sortedDays) {
        const month = day.slice(0, 7);
        byMonth.set(month, (byMonth.get(month) ?? 0) + count);
      }
      console.log('По месяцам:');
      Array.from(byMonth.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([month, count]) => console.log('  ', month, count));
    }
  }

  // Парсим свойства
  const parsed = activeProducts.map((p) => {
    const props: Props =
      typeof p.properties_data === 'string'
        ? (JSON.parse(p.properties_data) as Props)
        : (p.properties_data as Props) || {};
    const code = getStr(props, MODEL_CODE_KEY);
    const width = getNum(props, WIDTH_KEY);
    const height = getNum(props, HEIGHT_KEY);
    const finish = getStr(props, FINISH_KEY) || getStr(props, 'Материал/Покрытие');
    const color = getStr(props, COLOR_KEY);
    const supplier = getStr(props, SUPPLIER_KEY);
    return {
      id: p.id,
      sku: p.sku,
      code,
      width,
      height,
      finish,
      color,
      supplier,
      hasCode: !!code,
      hasSize: !!(width && height),
    };
  });

  const withoutCode = parsed.filter((x) => !x.hasCode);
  const withoutSize = parsed.filter((x) => !x.hasSize);

  console.log('\n--- Качество данных (активные) ---');
  console.log('Без кода модели (Код модели Domeo (Web)):', withoutCode.length);
  if (withoutCode.length > 0 && withoutCode.length <= 10) {
    withoutCode.forEach((x) => console.log('  ', x.sku));
  } else if (withoutCode.length > 10) {
    withoutCode.slice(0, 5).forEach((x) => console.log('  ', x.sku));
    console.log('  ... и ещё', withoutCode.length - 5);
  }
  console.log('Без размера (ширина/высота):', withoutSize.length);

  // Группировка по модели
  const byModel = new Map<string, typeof parsed>();
  for (const x of parsed) {
    if (!x.code) continue;
    if (!byModel.has(x.code)) byModel.set(x.code, []);
    byModel.get(x.code)!.push(x);
  }

  // Базовые комбинации (модель + размер + покрытие) без цвета — как было ~2000 до добавления цвета в товары
  const baseKeys = new Set<string>();
  const baseToColors = new Map<string, Set<string>>();
  for (const x of parsed) {
    if (!x.code || !x.hasSize) continue;
    const b = baseKey(x.code, x.width, x.height, x.finish);
    baseKeys.add(b);
    if (!baseToColors.has(b)) baseToColors.set(b, new Set());
    if (x.color) baseToColors.get(b)!.add(x.color);
  }
  const avgColorsPerBase =
    baseToColors.size > 0
      ? Array.from(baseToColors.values()).reduce((s, set) => s + set.size, 0) / baseToColors.size
      : 0;

  console.log('\n--- Базовые комбинации (модель + размер + покрытие, без цвета) ---');
  console.log(
    'Уникальных базовых комбинаций (как до добавления цвета в товары):',
    baseKeys.size,
    '— при одной записи на базу было бы',
    baseKeys.size,
    'товаров вместо',
    parsed.length
  );
  console.log(
    'Среднее число разных цветов на одну базу:',
    avgColorsPerBase.toFixed(1),
    '— раздувание в ~',
    (parsed.length / Math.max(1, baseKeys.size)).toFixed(1),
    'раз'
  );

  const modelCounts = Array.from(byModel.entries())
    .map(([code, arr]) => ({ code, count: arr.length }))
    .sort((a, b) => b.count - a.count);

  console.log('\n--- Модели (по количеству товаров) ---');
  console.log('Уникальных кодов моделей:', modelCounts.length);
  console.log('Топ-20 моделей по числу товаров:');
  modelCounts.slice(0, 20).forEach(({ code, count }) => {
    console.log(`  ${code}: ${count} товаров`);
  });

  // Дубликаты: одна и та же логическая конфигурация (модель+размер+покрытие+цвет) — несколько записей
  const byLogical = new Map<string, typeof parsed>();
  for (const x of parsed) {
    if (!x.code || !x.hasSize) continue;
    const k = logicalKey(x.code, x.width, x.height, x.finish, x.color);
    if (!byLogical.has(k)) byLogical.set(k, []);
    byLogical.get(k)!.push(x);
  }

  const logicalDuplicates = Array.from(byLogical.entries()).filter(([, arr]) => arr.length > 1);
  const totalDuplicateRows = logicalDuplicates.reduce((sum, [, arr]) => sum + arr.length - 1, 0);

  console.log('\n--- Дубликаты по конфигурации (модель + размер + покрытие + цвет) ---');
  console.log(
    'Конфигураций с более чем одним товаром:',
    logicalDuplicates.length,
    '— лишних записей (если оставить по одной на конфигурацию):',
    totalDuplicateRows
  );

  // Разбивка: дубликаты с одним поставщиком (явно лишние) vs разные поставщики (варианты)
  const sameSupplierDupes: Array<{ key: string; count: number; skus: string[] }> = [];
  const multiSupplierDupes: Array<{ key: string; suppliers: string[]; count: number }> = [];
  for (const [k, arr] of logicalDuplicates) {
    const suppliers = new Set(arr.map((x) => x.supplier || '—'));
    if (suppliers.size === 1) {
      sameSupplierDupes.push({
        key: k,
        count: arr.length,
        skus: arr.map((x) => x.sku),
      });
    } else {
      multiSupplierDupes.push({
        key: k,
        suppliers: Array.from(suppliers),
        count: arr.length,
      });
    }
  }

  const redundantSameSupplier = sameSupplierDupes.reduce((s, d) => s + d.count - 1, 0);
  console.log('  С одним поставщиком (кандидаты на удаление):', sameSupplierDupes.length, 'конфигураций, лишних записей:', redundantSameSupplier);
  if (sameSupplierDupes.length > 0 && sameSupplierDupes.length <= 5) {
    sameSupplierDupes.forEach((d) => {
      console.log('    ', d.key, '→', d.count, 'шт:', d.skus.slice(0, 2).join(', '), d.skus.length > 2 ? '...' : '');
    });
  } else if (sameSupplierDupes.length > 5) {
    sameSupplierDupes.slice(0, 3).forEach((d) => {
      console.log('    ', d.key, '→', d.count, 'шт');
    });
    console.log('    ... и ещё', sameSupplierDupes.length - 3, 'конфигураций');
  }
  console.log('  С разными поставщиками (варианты поставки):', multiSupplierDupes.length, 'конфигураций');

  // Полные дубликаты: один и тот же fullKey (включая поставщика) — дважды в БД
  const byFull = new Map<string, typeof parsed>();
  for (const x of parsed) {
    if (!x.code || !x.hasSize) continue;
    const k = fullKey(x.code, x.width, x.height, x.finish, x.color, x.supplier);
    if (!byFull.has(k)) byFull.set(k, []);
    byFull.get(k)!.push(x);
  }
  const fullDuplicates = Array.from(byFull.entries()).filter(([, arr]) => arr.length > 1);
  console.log('\n--- Полные дубликаты (одна конфигурация + один поставщик = несколько записей) ---');
  console.log('Таких групп (однозначно лишние):', fullDuplicates.length);
  const totalFullRedundant = fullDuplicates.reduce((s, [, arr]) => s + arr.length - 1, 0);
  console.log('Лишних записей:', totalFullRedundant);
  if (fullDuplicates.length > 0 && fullDuplicates.length <= 5) {
    fullDuplicates.forEach(([k, arr]) => {
      console.log('  ', k, '→ SKU:', arr.map((x) => x.sku).join(', '));
    });
  }

  // Сводка
  console.log('\n=== Сводка ===');
  console.log('Всего активных товаров дверей:', activeProducts.length);
  console.log('Неактивных (уже скрыты из каталога):', inactiveProducts.length);
  console.log('Без кода модели:', withoutCode.length);
  console.log('Лишних при объединении по (модель+размер+покрытие+цвет), один поставщик:', redundantSameSupplier);
  console.log('Полных дубликатов (одинаковый поставщик + конфигурация):', totalFullRedundant);
  console.log(
    '\nРекомендация: удалить неактивные и полные дубликаты; для конфигураций с одним поставщиком оставить по одной записи на конфигурацию (скрипт дедупликации можно добавить по результатам).'
  );
  console.log(
    '\nСмысл раздувания: цвет привязан к названию модели, а не к размеру. Хранение отдельного товара на каждую (модель, размер, покрытие, цвет) дало рост с ~2000 до ~12k. Вариант нормализации: хранить по одной записи на (модель, размер, покрытие), а цвета брать с уровня модели (PropertyPhoto, coatings из API).'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
