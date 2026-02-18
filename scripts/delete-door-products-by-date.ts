/**
 * Удаляет «новые» товары дверей (созданные после 12.02 — волна с размножением по цвету),
 * оставляя только «старые» (created_at 12.02), с которыми раньше всё работало.
 *
 * Запуск:
 *   npx tsx scripts/delete-door-products-by-date.ts --dry-run   # только отчёт
 *   npx tsx scripts/delete-door-products-by-date.ts             # удаление
 */
import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';

const prisma = new PrismaClient();

/** Оставляем товары с created_at до этой даты (включительно — весь день 12.02). Всё что после — удаляем. */
const CUTOFF_END = new Date('2026-02-13T00:00:00.000Z');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const doorsCatId = await getDoorsCategoryId();
  if (!doorsCatId) {
    console.error('Категория «Межкомнатные двери» не найдена.');
    process.exit(1);
  }

  const toDelete = await prisma.product.findMany({
    where: {
      catalog_category_id: doorsCatId,
      created_at: { gte: CUTOFF_END },
    },
    select: { id: true, sku: true, created_at: true },
  });

  const toKeep = await prisma.product.count({
    where: {
      catalog_category_id: doorsCatId,
      created_at: { lt: CUTOFF_END },
    },
  });

  console.log('Категория «Межкомнатные двери»');
  console.log('Оставляем товары с created_at <', CUTOFF_END.toISOString(), '(старые, 12.02):', toKeep);
  console.log('Удаляем товары с created_at >=', CUTOFF_END.toISOString(), '(новые, 16.02):', toDelete.length);

  if (toDelete.length === 0) {
    console.log('Удалять нечего.');
    return;
  }

  if (dryRun) {
    console.log('\n--dry-run: удаление не выполнялось.');
    console.log('Примеры SKU к удалению:', toDelete.slice(0, 5).map((p) => p.sku));
    return;
  }

  const ids = toDelete.map((p) => p.id);
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });
  console.log('Удалено записей:', result.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
