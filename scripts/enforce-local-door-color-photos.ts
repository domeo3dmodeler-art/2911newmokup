import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();

function fileExistsForUploadPath(uploadPath: string): boolean {
  if (!uploadPath.startsWith('/uploads/')) return false;
  const rel = uploadPath.slice('/uploads/'.length);
  const full = path.join(process.cwd(), 'public', 'uploads', rel);
  return fs.existsSync(full);
}

async function main() {
  const placeholder = '/uploads/placeholders/door-missing.svg';

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

  const byKey = new Map<string, Array<{ id: string; photoPath: string }>>();
  for (const row of rows) {
    const list = byKey.get(row.propertyValue) ?? [];
    list.push({ id: row.id, photoPath: row.photoPath ?? '' });
    byKey.set(row.propertyValue, list);
  }

  let groupsWithLocal = 0;
  let groupsFallbackToPlaceholder = 0;
  let updatedRows = 0;

  for (const [, group] of byKey) {
    const validLocal = group.find(
      (r) => r.photoPath.startsWith('/uploads/') && fileExistsForUploadPath(r.photoPath)
    );
    const targetPath = validLocal?.photoPath ?? placeholder;

    if (validLocal) groupsWithLocal++;
    else groupsFallbackToPlaceholder++;

    for (const row of group) {
      if (row.photoPath !== targetPath) {
        await prisma.propertyPhoto.update({
          where: { id: row.id },
          data: { photoPath: targetPath },
        });
        updatedRows++;
      }
    }
  }

  console.log('Color keys total:', byKey.size);
  console.log('Keys with local image:', groupsWithLocal);
  console.log('Keys with placeholder fallback:', groupsFallbackToPlaceholder);
  console.log('Rows updated:', updatedRows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
