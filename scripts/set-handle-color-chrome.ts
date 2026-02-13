/**
 * Устанавливает Цвет = "Хром" для указанных ручек (PLATEAU_белый, EON_ХРОМ+БЕЛЫЙ, FLEX_ХРОМ+белый и похожих).
 * Обновляет properties_data['Цвет'] в Product.
 *
 * Запуск: npx tsx scripts/set-handle-color-chrome.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client';
import { getHandlesCategoryId } from '../lib/catalog-categories';

const prisma = new PrismaClient();

const HANDLE_NAMES_FOR_CHROME = [
  'PLATEAU_белый',
  'EON_ХРОМ+БЕЛЫЙ',
  'FLEX_ХРОМ+белый',
  'AZRIELI_СатинМат',
  'PISA_никель черн',
];

function normalizeForMatch(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const handlesCatId = await getHandlesCategoryId();
  if (!handlesCatId) {
    console.error('Категория «Ручки и завертки» не найдена.');
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    where: { catalog_category_id: handlesCatId },
    select: { id: true, name: true, properties_data: true },
  });

  const normalizedTargets = new Set(HANDLE_NAMES_FOR_CHROME.map(normalizeForMatch));
  let updated = 0;

  for (const product of products) {
    let displayName = product.name;
    try {
      const props = typeof product.properties_data === 'string'
        ? JSON.parse(product.properties_data)
        : product.properties_data || {};
      displayName = (props['Domeo_наименование для Web'] as string) || (props['Domeo_наименование ручки_1С'] as string) || product.name;
    } catch {
      // ignore
    }
    const normalized = normalizeForMatch(displayName);
    const isTarget = normalizedTargets.has(normalized) || HANDLE_NAMES_FOR_CHROME.some((n) => normalizeForMatch(n) === normalized);
    if (!isTarget) continue;

    let props: Record<string, unknown> = {};
    try {
      props = typeof product.properties_data === 'string'
        ? JSON.parse(product.properties_data)
        : (product.properties_data as Record<string, unknown>) || {};
    } catch {
      props = {};
    }
    if ((props['Цвет'] as string) === 'Хром') {
      continue;
    }
    props['Цвет'] = 'Хром';

    if (dryRun) {
      console.log('[dry-run] Установить Цвет=Хром:', displayName);
      updated++;
      continue;
    }
    await prisma.product.update({
      where: { id: product.id },
      data: { properties_data: JSON.stringify(props) },
    });
    console.log('Обновлено:', displayName);
    updated++;
  }

  console.log('Итого: установлено Цвет=Хром для', updated, 'ручек.');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
