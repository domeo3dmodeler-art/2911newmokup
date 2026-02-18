/**
 * То же, что delete-door-products-by-date.ts, но в .mjs для запуска через node (без tsx).
 * Удаляет товары дверей с created_at >= 2026-02-13.
 * Запуск: node scripts/delete-door-products-by-date.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CUTOFF_END = new Date('2026-02-13T00:00:00.000Z');

async function getDoorsCategoryId() {
  const cat = await prisma.catalogCategory.findFirst({
    where: { name: 'Межкомнатные двери' },
    select: { id: true },
  });
  return cat?.id ?? null;
}

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
    select: { id: true, sku: true },
  });

  const toKeep = await prisma.product.count({
    where: {
      catalog_category_id: doorsCatId,
      created_at: { lt: CUTOFF_END },
    },
  });

  console.log('Категория «Межкомнатные двери»');
  console.log('Оставляем товары с created_at <', CUTOFF_END.toISOString(), '(старые, 12.02):', toKeep);
  console.log('Удаляем товары с created_at >=', CUTOFF_END.toISOString(), '(новые):', toDelete.length);

  if (toDelete.length === 0) {
    console.log('Удалять нечего.');
    await prisma.$disconnect();
    return;
  }

  if (dryRun) {
    console.log('\n--dry-run: удаление не выполнялось.');
    console.log('Примеры SKU к удалению:', toDelete.slice(0, 5).map((p) => p.sku));
    await prisma.$disconnect();
    return;
  }

  const ids = toDelete.map((p) => p.id);
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });
  console.log('Удалено записей:', result.count);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
