import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseProps(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') return value as Record<string, unknown>;
  return {};
}

async function main() {
  const root = await prisma.catalogCategory.findFirst({
    where: { name: 'Каталог' },
    select: { id: true, name: true },
  });
  const doors = await prisma.catalogCategory.findFirst({
    where: { name: 'Межкомнатные двери' },
    select: { id: true, parent_id: true },
  });
  if (!root || !doors) {
    throw new Error('Категории каталога не найдены');
  }
  const treeOk = doors.parent_id === root.id;
  console.log('tree_check', treeOk ? 'PASS' : 'FAIL', { root: root.id, doorsParent: doors.parent_id });

  const products = await prisma.product.findMany({
    where: { catalog_category_id: doors.id },
    select: { id: true, sku: true, properties_data: true },
    take: 3,
    orderBy: { updated_at: 'desc' },
  });
  if (products.length < 3) {
    throw new Error('Недостаточно товаров для smoke-теста обновления');
  }

  const key = '__smoke_bulk_key';
  const marker = `smoke-${Date.now()}`;
  const backups = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    props: parseProps(p.properties_data),
  }));

  for (const p of backups) {
    const next = { ...p.props, [key]: marker };
    await prisma.product.update({
      where: { id: p.id },
      data: { properties_data: JSON.stringify(next) },
    });
  }

  const afterUpdate = await prisma.product.findMany({
    where: { id: { in: backups.map((b) => b.id) } },
    select: { id: true, properties_data: true },
  });
  const updatedOk = afterUpdate.every((p) => parseProps(p.properties_data)[key] === marker);
  console.log('edit_and_bulk_update_check', updatedOk ? 'PASS' : 'FAIL', {
    updated: afterUpdate.length,
    key,
    marker,
  });

  for (const p of backups) {
    await prisma.product.update({
      where: { id: p.id },
      data: { properties_data: JSON.stringify(p.props) },
    });
  }

  const afterRollback = await prisma.product.findMany({
    where: { id: { in: backups.map((b) => b.id) } },
    select: { id: true, properties_data: true },
  });
  const rollbackOk = afterRollback.every((p) => parseProps(p.properties_data)[key] === undefined);
  console.log('rollback_check', rollbackOk ? 'PASS' : 'FAIL');

  if (!treeOk || !updatedOk || !rollbackOk) {
    process.exitCode = 1;
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
