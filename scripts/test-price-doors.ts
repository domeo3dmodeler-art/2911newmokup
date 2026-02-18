/**
 * Тест расчёта цен дверей: проверяет, для каких комбинаций параметров цена находится, для каких — нет.
 * Запуск:
 *   npx tsx scripts/test-price-doors.ts           # нужен .env с DATABASE_URL (PostgreSQL)
 *   npx tsx scripts/test-price-doors.ts --api     # тест через HTTP (npm run dev должен быть запущен)
 *
 * В браузере: при не найденной цене в консоли (F12) появятся [Цена не найдена] + параметры и debug от API.
 */

import { prisma } from '../lib/prisma';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { filterProducts, diagnoseFilterSteps, type ProductWithProps } from '../lib/price/doors-price-engine';
import type { PriceSelection } from '../lib/price/doors-price-engine';

const USE_API = process.argv.includes('--api');
const BASE = 'http://localhost:3000';

async function loadProducts(): Promise<ProductWithProps[]> {
  const categoryId = await getDoorsCategoryId();
  if (!categoryId) return [];
  const rows = await prisma.product.findMany({
    where: { catalog_category_id: categoryId, is_active: true },
    select: { id: true, sku: true, name: true, model: true, series: true, base_price: true, properties_data: true },
    orderBy: { id: 'asc' },
    take: 3000,
  });
  return rows as ProductWithProps[];
}

function parseProps(p: unknown): Record<string, unknown> {
  if (!p) return {};
  if (typeof p === 'string') {
    try {
      return JSON.parse(p) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return p as Record<string, unknown>;
}

function getStr(props: Record<string, unknown>, key: string): string {
  const v = props[key];
  return (v != null ? String(v).trim() : '') || '';
}

function getNum(props: Record<string, unknown>, key: string): number | undefined {
  const v = props[key];
  if (v == null) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

interface TestCase {
  model: string;
  style: string;
  finish: string;
  color: string;
  width: number;
  height: number;
  filling: string;
}

async function main() {
  console.log('Загрузка товаров дверей...');
  let products: ProductWithProps[];
  try {
    products = await loadProducts();
  } catch (e) {
    console.error('Ошибка подключения к БД. Запустите с DATABASE_URL в .env или используйте --api при запущенном dev-сервере.');
    throw e;
  }
  console.log(`Загружено товаров: ${products.length}\n`);

  const cases: TestCase[] = [];
  const seen = new Set<string>();

  for (const p of products.slice(0, 500)) {
    const props = parseProps(p.properties_data);
    const model = getStr(props, 'Код модели Domeo (Web)');
    const style = getStr(props, 'Domeo_Стиль Web');
    const finish = getStr(props, 'Тип покрытия');
    const color = getStr(props, 'Цвет/Отделка');
    const width = getNum(props, 'Ширина/мм');
    const height = getNum(props, 'Высота/мм');
    const filling = getStr(props, 'Domeo_Опции_Название_наполнения');
    if (!model || !finish) continue;
    const key = `${model}|${style}|${finish}|${color}|${width}|${height}|${filling}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cases.push({
      model,
      style: style || 'Классика',
      finish,
      color,
      width: width ?? 700,
      height: height ?? 2100,
      filling: filling || 'Сильвер',
    });
  }

  console.log(`Тестовых комбинаций: ${cases.length}\n`);
  console.log('--- Тест через движок (filterProducts) ---\n');

  let ok = 0;
  let fail = 0;
  const failedSteps: Record<string, number> = {};

  for (const tc of cases.slice(0, 80)) {
    const selection: PriceSelection = {
      model: tc.model,
      style: tc.style,
      finish: tc.finish,
      color: tc.color || undefined,
      width: tc.width,
      height: tc.height,
      filling: tc.filling || undefined,
    };
    const matched = filterProducts(products, selection, true, true, false);
    if (matched.length > 0) {
      ok++;
    } else {
      fail++;
      const diag = diagnoseFilterSteps(products, selection);
      const firstFail = diag.find((s) => s.count === 0)?.step ?? diag[0]?.step ?? '?';
      failedSteps[firstFail] = (failedSteps[firstFail] ?? 0) + 1;
      if (fail <= 5) {
        console.log(`NOT FOUND: model=${tc.model} style=${tc.style} finish=${tc.finish} color=${tc.color || '(пусто)'} ${tc.width}x${tc.height} filling=${tc.filling}`);
        console.log('  Диагностика:', diag);
      }
    }
  }

  console.log(`\nИтого: цена найдена ${ok}, не найдена ${fail}`);
  if (Object.keys(failedSteps).length > 0) {
    console.log('Чаще всего отсев на шаге:', Object.entries(failedSteps).sort((a, b) => b[1] - a[1]).slice(0, 3));
  }

  if (USE_API && cases.length > 0) {
    console.log('\n--- Тест через API POST /api/price/doors (2 запроса) ---');
    const tc = cases[0];
    const body = {
      selection: {
        model: tc.model,
        style: tc.style,
        finish: tc.finish,
        color: tc.color || undefined,
        width: tc.width,
        height: tc.height,
        filling: tc.filling || undefined,
      },
    };
    try {
      const res = await fetch(`${BASE}/api/price/doors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log('Ответ:', res.status, data.notFound ? 'notFound' : `total=${data.total}`, data.debug ? '\n  debug: ' + JSON.stringify(data.debug, null, 2) : '');
    } catch (e) {
      console.log('Ошибка запроса к API:', e);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
