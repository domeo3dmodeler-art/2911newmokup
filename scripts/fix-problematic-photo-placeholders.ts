import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const placeholder = '/uploads/placeholders/door-missing.svg';

  const where = {
    OR: [
      { photoPath: { contains: 'не рассматриваем эту модель' } },
      { photoPath: { contains: 'пока не добавляем - необходимо сделать новый вариант модели' } },
    ],
  } as const;

  const before = await prisma.propertyPhoto.count({ where });
  const result = await prisma.propertyPhoto.updateMany({
    where,
    data: { photoPath: placeholder },
  });
  const after = await prisma.propertyPhoto.count({ where });

  console.log('Problematic paths before:', before);
  console.log('Updated:', result.count);
  console.log('Problematic paths after:', after);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
