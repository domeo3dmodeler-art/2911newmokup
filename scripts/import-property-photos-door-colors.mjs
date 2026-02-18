/**
 * Загрузка строк в PropertyPhoto (Domeo_Модель_Цвет) для отображения нескольких цветов на модель-покрытие.
 * Запуск на ВМ: cd ~/1002doors && node scripts/import-property-photos-door-colors.mjs [--dry-run]
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PROPERTY_NAME = 'Domeo_Модель_Цвет';
const PHOTO_TYPE = 'cover';

const ROWS = [
  { propertyValue: 'DomeoDoors_Cluster_3|Эмаль|Белоснежный', photoPath: '/uploads/final-filled/doors/Дверное_полотно_Twin_3_ПГ_Rustica_кр._Эмаль_Белоснежный_cover.png' },
  { propertyValue: 'DomeoDoors_Cluster_3|Эмаль|Кремово-белый', photoPath: '/uploads/final-filled/doors/Дверное_полотно_Twin_3_ПГ_Rustica_кр._Эмаль_Кремово-белый_cover.png' },
  { propertyValue: 'DomeoDoors_Cluster_3|Эмаль|Телегрей (RAL 7047)', photoPath: '/uploads/final-filled/doors/Дверное_полотно_Twin_3_ПГ_Rustica_кр._Эмаль_Телегрей_(RAL_7047)_cover.png' },
  { propertyValue: 'DomeoDoors_Meteor_1|Эмаль|Агат (Ral 7038)', photoPath: '/uploads/final-filled/doors/Дверь_Molis_1_эмаль_ДГ_Исполнение_Эмаль_Агат_(Ral_7038)_cover.png' },
  { propertyValue: 'DomeoDoors_Meteor_1|Белый (RAL 9003)', photoPath: '/uploads/final-filled/doors/Дверь_Molis_1_Белый_(RAL_9003)_cover.png' },
  { propertyValue: 'DomeoDoors_Meteor_1|Эмаль|Белый (RAL 9010)', photoPath: '/uploads/final-filled/doors/Дверь_Molis_1_эмаль_ДГ_Исполнение_Эмаль_Белый_(RAL_9010)_cover.png' },
  { propertyValue: 'DomeoDoors_Quantum_2|Эмаль|Синий (NCS S 6010-B10G)', photoPath: '/uploads/final-filled/doors/Дверь_Enigma_1_ДГ-Эмаль_Синий_(NCS_S_6010-B10G)_cover.png' },
];

async function getDoorsCategoryId() {
  const cat = await prisma.catalogCategory.findFirst({
    where: { name: 'Межкомнатные двери' },
    select: { id: true },
  });
  return cat?.id ?? null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const categoryId = await getDoorsCategoryId();
  if (!categoryId) {
    console.error('Категория «Межкомнатные двери» не найдена.');
    process.exit(1);
  }

  console.log('Категория дверей:', categoryId);
  console.log('Свойство:', PROPERTY_NAME);
  console.log('Строк к загрузке:', ROWS.length);
  if (dryRun) {
    console.log('--dry-run: записи не создаются.');
    ROWS.forEach((r, i) => console.log(' ', i + 1, r.propertyValue));
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  for (const row of ROWS) {
    await prisma.propertyPhoto.upsert({
      where: {
        categoryId_propertyName_propertyValue_photoType: {
          categoryId,
          propertyName: PROPERTY_NAME,
          propertyValue: row.propertyValue,
          photoType: PHOTO_TYPE,
        },
      },
      update: { photoPath: row.photoPath, updatedAt: new Date() },
      create: {
        categoryId,
        propertyName: PROPERTY_NAME,
        propertyValue: row.propertyValue,
        photoPath: row.photoPath,
        photoType: PHOTO_TYPE,
      },
    });
    ok++;
    console.log('OK:', row.propertyValue);
  }
  console.log('Готово. Загружено:', ok);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
