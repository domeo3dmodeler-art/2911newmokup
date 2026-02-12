import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const names = [
    'Каталог',
    'Межкомнатные двери',
    'Наличники',
    'Комплекты фурнитуры',
    'Ручки и завертки',
    'Ограничители',
  ];
  const cats = await prisma.catalogCategory.findMany({
    where: { name: { in: names } },
    select: { id: true, name: true, path: true },
    orderBy: { name: 'asc' },
  });
  console.log(JSON.stringify(cats, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

