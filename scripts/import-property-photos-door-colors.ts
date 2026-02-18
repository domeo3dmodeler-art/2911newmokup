/**
 * Загрузка строк в PropertyPhoto (Domeo_Модель_Цвет) — данные для отображения цветов по модели и покрытию.
 * Запуск: npx tsx scripts/import-property-photos-door-colors.ts [--dry-run]
 * Требуется DATABASE_URL (подхватывается из .env.postgresql или .env).
 */
import { config } from 'dotenv';
config({ path: '.env.postgresql' });
config({ path: '.env.local' });
config({ path: '.env' });

const PROPERTY_NAME = 'Domeo_Модель_Цвет';
const PHOTO_TYPE = 'cover';

const ROWS: { propertyValue: string; photoPath: string }[] = [
  { propertyValue: 'DomeoDoors_Cluster_3|Эмаль|Белоснежный', photoPath: '/uploads/final-filled/doors/Дверное_полотно_Twin_3_ПГ_Rustica_кр._Эмаль_Белоснежный_cover.png' },
  { propertyValue: 'DomeoDoors_Cluster_3|Эмаль|Кремово-белый', photoPath: '/uploads/final-filled/doors/Дверное_полотно_Twin_3_ПГ_Rustica_кр._Эмаль_Кремово-белый_cover.png' },
  { propertyValue: 'DomeoDoors_Cluster_3|Эмаль|Телегрей (RAL 7047)', photoPath: '/uploads/final-filled/doors/Дверное_полотно_Twin_3_ПГ_Rustica_кр._Эмаль_Телегрей_(RAL_7047)_cover.png' },
  { propertyValue: 'DomeoDoors_Meteor_1|Эмаль|Агат (Ral 7038)', photoPath: '/uploads/final-filled/doors/Дверь_Molis_1_эмаль_ДГ_Исполнение_Эмаль_Агат_(Ral_7038)_cover.png' },
  { propertyValue: 'DomeoDoors_Meteor_1|Белый (RAL 9003)', photoPath: '/uploads/final-filled/doors/Дверь_Molis_1_Белый_(RAL_9003)_cover.png' },
  { propertyValue: 'DomeoDoors_Meteor_1|Эмаль|Белый (RAL 9010)', photoPath: '/uploads/final-filled/doors/Дверь_Molis_1_эмаль_ДГ_Исполнение_Эмаль_Белый_(RAL_9010)_cover.png' },
  { propertyValue: 'DomeoDoors_Quantum_2|Эмаль|Синий (NCS S 6010-B10G)', photoPath: '/uploads/final-filled/doors/Дверь_Enigma_1_ДГ-Эмаль_Синий_(NCS_S_6010-B10G)_cover.png' },
];

async function main() {
  const { getDoorsCategoryId } = await import('../lib/catalog-categories');
  const { upsertPropertyPhoto } = await import('../lib/property-photos');

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
    console.log('\n--dry-run: записи не создаются.');
    ROWS.forEach((r, i) => console.log(`  ${i + 1}. ${r.propertyValue} -> ${r.photoPath}`));
    return;
  }

  let ok = 0;
  let err = 0;
  for (const row of ROWS) {
    const result = await upsertPropertyPhoto(
      categoryId,
      PROPERTY_NAME,
      row.propertyValue,
      row.photoPath,
      PHOTO_TYPE,
      { mimeType: 'image/png' }
    );
    if (result) {
      ok++;
      console.log('OK:', row.propertyValue);
    } else {
      err++;
      console.error('Ошибка:', row.propertyValue);
    }
  }
  console.log('\nГотово. Успешно:', ok, 'Ошибок:', err);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
