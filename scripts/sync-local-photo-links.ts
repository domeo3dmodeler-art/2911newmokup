import { PrismaClient } from '@prisma/client';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.propertyPhoto.findMany({
    where: {
      propertyName: DOOR_COLOR_PROPERTY,
      photoType: 'cover',
    },
    select: {
      id: true,
      propertyValue: true,
      photoPath: true,
    },
  });

  const localByKey = new Map<string, string>();
  for (const row of rows) {
    if (row.photoPath && row.photoPath.startsWith('/uploads/')) {
      if (!localByKey.has(row.propertyValue)) {
        localByKey.set(row.propertyValue, row.photoPath);
      }
    }
  }

  let updated = 0;
  for (const row of rows) {
    const localPath = localByKey.get(row.propertyValue);
    if (!localPath) continue;
    if (row.photoPath === localPath) continue;
    if (row.photoPath?.startsWith('http://') || row.photoPath?.startsWith('https://')) {
      await prisma.propertyPhoto.update({
        where: { id: row.id },
        data: { photoPath: localPath },
      });
      updated++;
    }
  }

  console.log('Color cover keys with local path:', localByKey.size);
  console.log('Updated external rows to local paths:', updated);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
