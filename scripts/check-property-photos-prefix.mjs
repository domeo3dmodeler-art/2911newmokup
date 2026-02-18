import { config } from 'dotenv';
config({ path: '.env.postgresql' });
config({ path: '.env' });

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const rows = await prisma.propertyPhoto.findMany({
  where: { propertyName: 'Domeo_Модель_Цвет' },
  select: { propertyValue: true },
  take: 20,
});
console.log('Sample propertyValue (first 20):');
rows.forEach((r) => console.log(' ', r.propertyValue));

const base1 = await prisma.propertyPhoto.findMany({
  where: {
    propertyName: 'Domeo_Модель_Цвет',
    propertyValue: { startsWith: 'DomeoDoors_Base_1|' },
  },
  select: { propertyValue: true },
});
console.log('\nDomeoDoors_Base_1| count:', base1.length);
base1.slice(0, 8).forEach((r) => console.log(' ', r.propertyValue));

const oneProduct = await prisma.product.findFirst({
  where: {
    catalog_category_id: (await prisma.catalogCategory.findFirst({ where: { name: 'Межкомнатные двери' }, select: { id: true } }))?.id,
  },
  select: { properties_data: true },
});
const props = oneProduct?.properties_data ? JSON.parse(oneProduct.properties_data) : {};
console.log('\nSample product Тип покрытия:', props['Тип покрытия']);
console.log('Sample product Код модели Domeo (Web):', props['Код модели Domeo (Web)']);

await prisma.$disconnect();
