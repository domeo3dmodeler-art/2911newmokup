/**
 * Проверка: все ли данные из final_filled 30.01.xlsx есть в БД и как связаны листы.
 * Связь между листами — по полю «Название модели».
 *
 * Выводит:
 * - Количество строк по каждому листу Excel vs записей в БД
 * - Модели из «Цены базовые», для которых нет данных в «Цвет» / «Опции» / «Наценка за кромку» / «Стекло_доступность»
 * - Модели из «Цвет»/«Опции»/…, которых нет в «Цены базовые»
 * - Итог: всё ли в БД и что вынести на обсуждение при отсутствии связей
 *
 * Запуск: npx tsx scripts/verify-excel-db-and-links.ts
 */
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { getCategoryIdByName } from '../lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, '..', '1002', 'final_filled 30.01.xlsx');

function getColumn(row: Record<string, unknown>, logicalName: string): string {
  const need = logicalName.replace(/\s+/g, ' ').trim();
  for (const k of Object.keys(row)) {
    if (k.replace(/\s+/g, ' ').trim() === need) return String(row[k] ?? '').trim();
  }
  return String(row[logicalName] ?? '').trim();
}

function slug(str: string): string {
  return String(str)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\wа-яё_-]/gi, '')
    .slice(0, 80) || 'item';
}

async function main() {
  if (!fs.existsSync(FILE_PATH)) {
    console.error('Файл не найден:', FILE_PATH);
    process.exit(1);
  }

  const wb = XLSX.readFile(FILE_PATH, { raw: false });
  const toJson = (sheetName: string): Record<string, unknown>[] => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
  };

  // ——— Собираем данные из Excel ———
  const pricesRows = toJson('Цены базовые');
  const colorRows = toJson('Цвет');
  const optionsRows = toJson('Опции');
  const edgeRows = toJson('Наценка за кромку');
  const glassRows = toJson('Стекло_доступность');
  const nalichnikiRows = toJson('Наличники');
  const furnituraRows = toJson('Фурнитура');
  const ruchkiRows = toJson('04 Ручки Завертки');
  const limitersRows = toJson('05 Ограничители');

  const modelNamesPrices = new Set(pricesRows.map((r) => getColumn(r, 'Название модели')).filter(Boolean));
  const modelNamesColor = new Set(colorRows.map((r) => getColumn(r, 'Название модели')).filter(Boolean));
  const modelNamesOptions = new Set(optionsRows.map((r) => getColumn(r, 'Название модели')).filter(Boolean));
  const modelNamesEdge = new Set(edgeRows.map((r) => getColumn(r, 'Название модели')).filter(Boolean));
  const modelNamesGlass = new Set(glassRows.map((r) => getColumn(r, 'Название модели')).filter(Boolean));

  // ——— Запросы к БД ———
  const doorsCatId = await getDoorsCategoryId();
  const nalichnikiCatId = await getCategoryIdByName('Наличники');
  const furnituraCatId = await getCategoryIdByName('Комплекты фурнитуры');
  const ruchkiCatId = await getCategoryIdByName('Ручки и завертки');
  const limitersCatId = await getCategoryIdByName('Ограничители');

  const doorsCount = doorsCatId
    ? await prisma.product.count({ where: { catalog_category_id: doorsCatId } })
    : 0;
  const nalichnikiCount = nalichnikiCatId
    ? await prisma.product.count({ where: { catalog_category_id: nalichnikiCatId } })
    : 0;
  const furnituraCount = furnituraCatId
    ? await prisma.product.count({ where: { catalog_category_id: furnituraCatId } })
    : 0;
  const ruchkiCount = ruchkiCatId
    ? await prisma.product.count({ where: { catalog_category_id: ruchkiCatId } })
    : 0;
  const limitersCount = limitersCatId
    ? await prisma.product.count({ where: { catalog_category_id: limitersCatId } })
    : 0;

  // PropertyPhoto для цветов дверей (лист «Цвет»): по категории и свойству
  let colorPhotosCount = 0;
  if (doorsCatId) {
    colorPhotosCount = await prisma.propertyPhoto.count({
      where: {
        categoryId: doorsCatId,
        propertyName: DOOR_COLOR_PROPERTY,
      },
    });
  }

  // Ожидаемое число товаров дверей: разворот по размерам + учёт уникальности SKU (как в импорте)
  const parseList = (s: unknown): number[] => {
    const str = String(s ?? '').trim();
    if (!str) return [];
    return str
      .split(/[,;]/)
      .map((x) => parseInt(x.replace(/\s/g, ''), 10))
      .filter((n) => !isNaN(n) && n > 0);
  };
  let expectedDoorsProducts = 0;
  const uniqueSkus = new Set<string>();
  for (const row of pricesRows) {
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const coatingType = String(row['Тип покрытия'] ?? '').trim();
    const coatingSlug = slug(coatingType || 'base');
    const heights = parseList(row['Высота, мм']);
    const widths = parseList(row['Ширины, мм']);
    const heightList = heights.length ? heights : [2000];
    const widthList = widths.length ? widths : [800];
    for (const h of heightList) {
      for (const w of widthList) {
        expectedDoorsProducts++;
        if (code) uniqueSkus.add(`door_${slug(code)}_${slug(modelName)}_${w}_${h}_${coatingSlug}`);
      }
    }
  }
  const expectedUniqueDoors = uniqueSkus.size;

  // Проверки правил: Стекло=Да → модель в Стекло_доступность; Кромка в базе=Да → модель в Наценка за кромку
  const glassYesButNotInGlass: Array<{ modelName: string; code?: string }> = [];
  const edgeYesButNotInEdge: Array<{ modelName: string; code?: string }> = [];
  for (const row of pricesRows) {
    const modelName = getColumn(row, 'Название модели');
    const code = String(row['Код модели Domeo (Web)'] ?? '').trim();
    const glassVal = String(row['Стекло'] ?? '').trim().toLowerCase();
    const edgeVal = String(row['Кромка в базе'] ?? '').trim().toLowerCase();
    if (!modelName) continue;
    if ((glassVal === 'да' || glassVal === 'да.') && !modelNamesGlass.has(modelName)) {
      glassYesButNotInGlass.push({ modelName, code: code || undefined });
    }
    if ((edgeVal === 'да' || edgeVal === 'да.') && !modelNamesEdge.has(modelName)) {
      edgeYesButNotInEdge.push({ modelName, code: code || undefined });
    }
  }

  // ——— Отчёт ———
  console.log('========== 1. Количество: Excel vs БД ==========\n');
  console.log('Лист «Цены базовые»:');
  console.log('  Строк в Excel:', pricesRows.length);
  console.log('  Комбинаций в развороте (строка × размеры):', expectedDoorsProducts);
  console.log('  Уникальных SKU (код+модель+ширина+высота+покрытие), как в импорте:', expectedUniqueDoors);
  console.log('  Товаров в БД (Межкомнатные двери):', doorsCount);
  if (expectedUniqueDoors > 0 && doorsCount !== expectedUniqueDoors) {
    console.log('  ⚠ Расхождение с уникальными SKU: ожидалось', expectedUniqueDoors, ', в БД', doorsCount);
  } else if (expectedDoorsProducts !== expectedUniqueDoors) {
    console.log('  Пояснение: импорт использует SKU = door_код_модель_ширина_высота_покрытие; одна запись на комбинацию (код, модель, размеры, тип покрытия). Разворот', expectedDoorsProducts, '→ уникальных записей', expectedUniqueDoors);
  }
  console.log('');
  console.log('Лист «Цвет»:');
  console.log('  Строк в Excel:', colorRows.length);
  console.log('  Записей PropertyPhoto (цвет/фото) в БД:', colorPhotosCount);
  console.log('');
  console.log('Лист «Наличники»: строк в Excel:', nalichnikiRows.length, '| товаров в БД:', nalichnikiCount);
  console.log('Лист «Фурнитура»: строк в Excel:', furnituraRows.length, '| товаров в БД:', furnituraCount);
  console.log('Лист «04 Ручки Завертки»: строк в Excel:', ruchkiRows.length, '| товаров в БД:', ruchkiCount);
  console.log('Лист «05 Ограничители»: строк в Excel:', limitersRows.length, '| товаров в БД:', limitersCount);
  console.log('');

  console.log('========== 2. Связи по «Название модели» ==========\n');
  const inPricesNotInColor = [...modelNamesPrices].filter((m) => !modelNamesColor.has(m));
  const inPricesNotInOptions = [...modelNamesPrices].filter((m) => !modelNamesOptions.has(m));
  const inPricesNotInEdge = [...modelNamesPrices].filter((m) => !modelNamesEdge.has(m));
  const inPricesNotInGlass = [...modelNamesPrices].filter((m) => !modelNamesGlass.has(m));
  const inColorNotInPrices = [...modelNamesColor].filter((m) => !modelNamesPrices.has(m));
  const inOptionsNotInPrices = [...modelNamesOptions].filter((m) => !modelNamesPrices.has(m));

  if (inPricesNotInColor.length > 0) {
    console.log('Модели из «Цены базовые», которых НЕТ в «Цвет» (в конфигураторе не будет фото/цветов):');
    console.log('  Количество:', inPricesNotInColor.length);
    console.log('  Примеры:', inPricesNotInColor.slice(0, 10).join('; '));
    if (inPricesNotInColor.length > 10) console.log('  ... и ещё', inPricesNotInColor.length - 10);
    console.log('');
  }
  if (inPricesNotInOptions.length > 0) {
    console.log('Модели из «Цены базовые», которых НЕТ в «Опции» (реверс/зеркало/порог не подтянутся):');
    console.log('  Количество:', inPricesNotInOptions.length);
    console.log('  Примеры:', inPricesNotInOptions.slice(0, 10).join('; '));
    if (inPricesNotInOptions.length > 10) console.log('  ... и ещё', inPricesNotInOptions.length - 10);
    console.log('');
  }
  if (inPricesNotInEdge.length > 0) {
    console.log('Модели из «Цены базовые», которых НЕТ в «Наценка за кромку»:');
    console.log('  Количество:', inPricesNotInEdge.length);
    console.log('  Примеры:', inPricesNotInEdge.slice(0, 5).join('; '));
    console.log('');
  }
  if (inPricesNotInGlass.length > 0) {
    console.log('Модели из «Цены базовые», которых НЕТ в «Стекло_доступность»:');
    console.log('  Количество:', inPricesNotInGlass.length);
    console.log('');
  }
  if (inColorNotInPrices.length > 0) {
    console.log('Модели из «Цвет», которых НЕТ в «Цены базовые» (связь не сработает):');
    console.log('  Количество:', inColorNotInPrices.length);
    console.log('  Примеры:', inColorNotInPrices.slice(0, 5).join('; '));
    console.log('');
  }
  if (inOptionsNotInPrices.length > 0) {
    console.log('Модели из «Опции», которых НЕТ в «Цены базовые» (часто разный поставщик/название):');
    console.log('  Количество:', inOptionsNotInPrices.length);
    console.log('  Примеры:', inOptionsNotInPrices.slice(0, 5).join('; '));
    console.log('');
  }

  console.log('========== 2.1 Правила: Стекло=Да и Кромка в базе=Да ==========\n');
  if (glassYesButNotInGlass.length > 0) {
    console.log('Нарушение: в «Цены базовые» столбец Стекло = Да, но модели НЕТ в «Стекло_доступность»:');
    console.log('  Количество:', glassYesButNotInGlass.length);
    glassYesButNotInGlass.slice(0, 10).forEach(({ modelName }) => console.log('  -', modelName));
    if (glassYesButNotInGlass.length > 10) console.log('  ... и ещё', glassYesButNotInGlass.length - 10);
    console.log('');
  }
  if (edgeYesButNotInEdge.length > 0) {
    console.log('Нарушение: в «Цены базовые» столбец Кромка в базе = Да, но модели НЕТ в «Наценка за кромку»:');
    console.log('  Количество:', edgeYesButNotInEdge.length);
    edgeYesButNotInEdge.slice(0, 10).forEach(({ modelName }) => console.log('  -', modelName));
    if (edgeYesButNotInEdge.length > 10) console.log('  ... и ещё', edgeYesButNotInEdge.length - 10);
    console.log('');
  }
  if (glassYesButNotInGlass.length === 0 && edgeYesButNotInEdge.length === 0) {
    console.log('Правила соблюдены: все модели с Стекло=Да есть в Стекло_доступность, все с Кромка в базе=Да — в Наценка за кромку.');
    console.log('');
  }

  console.log('========== 3. Итог и что вынести на обсуждение ==========\n');
  const allInDb =
    doorsCount >= (expectedDoorsProducts || 0) &&
    nalichnikiCount >= nalichnikiRows.length &&
    furnituraCount >= furnituraRows.length &&
    ruchkiCount >= ruchkiRows.length &&
    limitersCount >= limitersRows.length;
  console.log('Все ли данные из Excel есть в БД:', allInDb ? 'Да' : 'Нет (см. раздел 1)');
  console.log('');
  const hasMissingLinks =
    inPricesNotInColor.length > 0 ||
    inPricesNotInOptions.length > 0 ||
    inColorNotInPrices.length > 0 ||
    inOptionsNotInPrices.length > 0;
  if (hasMissingLinks) {
    console.log('Связи по «Название модели» отсутствуют для части моделей — ВЫНЕСТИ НА ОБСУЖДЕНИЕ:');
    console.log('  - Привести к единому «Название модели» в листах Цены базовые / Цвет / Опции (или добавить слияние по «Код модели Domeo (Web)» в импорте).');
    console.log('  - Или оставить как есть и принимать, что для части моделей не будет цветов/опций в конфигураторе.');
  } else {
    console.log('Связи по «Название модели»: у всех моделей из «Цены базовые» есть соответствующие строки в «Цвет» и «Опции».');
  }

  // ——— Запись полного отчёта о недостающих данных в файл ———
  const inEdgeNotInPrices = [...modelNamesEdge].filter((m) => !modelNamesPrices.has(m));
  const inGlassNotInPrices = [...modelNamesGlass].filter((m) => !modelNamesPrices.has(m));

  const reportPath = path.join(__dirname, '..', 'docs', 'MISSING_DATA_REPORT.md');
  const report: string[] = [
    '# Отчёт о недостающих данных (Excel ↔ связь по «Название модели»)',
    '',
    'Файл создан скриптом `scripts/verify-excel-db-and-links.ts`. Запуск: `npx tsx scripts/verify-excel-db-and-links.ts`',
    '',
    '---',
    '',
    '## 1. Сводка по количеству',
    '',
    '| Лист Excel | Строк в Excel | Связь с «Цены базовые» | Комментарий |',
    '|------------|---------------|------------------------|-------------|',
    `| Цены базовые | ${pricesRows.length} | — | Разворот по размерам: ${expectedDoorsProducts} комбинаций; **уникальных SKU** (код+модель+ширина+высота+покрытие): ${expectedUniqueDoors}; в БД: ${doorsCount}. Импорт: SKU = door_код_модель_W_H_покрытие — базовая цена зависит от типа покрытия. |`,
    `| Цвет | ${colorRows.length} | По «Название модели» | В конфигураторе не будет фото/цветов для моделей без строк в этом листе |`,
    `| Опции | ${optionsRows.length} | По «Название модели» | Реверс/зеркало/порог не подтянутся для моделей без строк |`,
    `| Наценка за кромку | ${edgeRows.length} | По «Название модели» | Варианты кромки по модели |`,
    `| Стекло_доступность | ${glassRows.length} | По «Название модели» | Доступные цвета стекол по модели |`,
    '',
    '### 1.1 Правила: Стекло=Да и Кромка в базе=Да',
    '',
    '- Если в «Цены базовые» у модели столбец **Стекло** = **Да**, модель должна быть во вкладке **Стекло_доступность**.',
    '- Если в «Цены базовые» у модели столбец **Кромка в базе** = **Да**, модель должна быть во вкладке **Наценка за кромку**.',
    '',
    ...(glassYesButNotInGlass.length > 0
      ? [
          '**Нарушения (Стекло=Да, но модели нет в Стекло_доступность):**',
          `Количество: ${glassYesButNotInGlass.length}`,
          '',
          ...glassYesButNotInGlass.map(({ modelName }) => `- ${modelName}`),
          '',
        ]
      : ['**Стекло=Да:** нарушений нет.', '']),
    ...(edgeYesButNotInEdge.length > 0
      ? [
          '**Нарушения (Кромка в базе=Да, но модели нет в Наценка за кромку):**',
          `Количество: ${edgeYesButNotInEdge.length}`,
          '',
          ...edgeYesButNotInEdge.map(({ modelName }) => `- ${modelName}`),
          '',
        ]
      : ['**Кромка в базе=Да:** нарушений нет.', '']),
    '---',
    '',
    '## 2. Модели из «Цены базовые», которых НЕТ в «Цвет»',
    '',
    '**Итог:** в конфигураторе для этих моделей не будет фото и вариантов цвета из листа «Цвет».',
    '',
    `**Количество:** ${inPricesNotInColor.length}`,
    '',
    '**Полный список (название модели):**',
    '',
    ...inPricesNotInColor.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 3. Модели из «Цены базовые», которых НЕТ в «Опции»',
    '',
    '**Итог:** для этих моделей в БД не попадут реверс, зеркало, порог, наполнение из листа «Опции».',
    '',
    `**Количество:** ${inPricesNotInOptions.length}`,
    '',
    '**Полный список (название модели):**',
    '',
    ...inPricesNotInOptions.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 4. Модели из «Цены базовые», которых НЕТ в «Наценка за кромку»',
    '',
    '**Итог:** варианты кромки и наценки по модели не подтянутся из этого листа.',
    '',
    `**Количество:** ${inPricesNotInEdge.length}`,
    '',
    '**Полный список (название модели):**',
    '',
    ...inPricesNotInEdge.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 5. Модели из «Цены базовые», которых НЕТ в «Стекло_доступность»',
    '',
    '**Итог:** доступные цвета стекол для модели не будут в properties_data.',
    '',
    `**Количество:** ${inPricesNotInGlass.length}`,
    '',
    '**Полный список (название модели):**',
    '',
    ...inPricesNotInGlass.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 6. Модели из «Цвет», которых НЕТ в «Цены базовые»',
    '',
    '**Итог:** эти строки листа «Цвет» не привязаны ни к одной модели калькулятора (связь не сработает).',
    '',
    `**Количество:** ${inColorNotInPrices.length}`,
    '',
    '**Полный список (название модели):**',
    '',
    ...inColorNotInPrices.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 7. Модели из «Опции», которых НЕТ в «Цены базовые»',
    '',
    '**Итог:** часто разный поставщик/название; опции этих строк не попадут в товары дверей.',
    '',
    `**Количество:** ${inOptionsNotInPrices.length}`,
    '',
    '**Полный список (название модели):**',
    '',
    ...inOptionsNotInPrices.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 8. Модели из «Наценка за кромку», которых НЕТ в «Цены базовые»',
    '',
    `**Количество:** ${inEdgeNotInPrices.length}`,
    '',
    ...(inEdgeNotInPrices.length > 0 ? ['**Полный список:**', '', ...inEdgeNotInPrices.sort().map((m) => `- ${m}`), ''] : []),
    '',
    '---',
    '',
    '## 9. Модели из «Стекло_доступность», которых НЕТ в «Цены базовые»',
    '',
    `**Количество:** ${inGlassNotInPrices.length}`,
    '',
    ...(inGlassNotInPrices.length > 0 ? ['**Полный список:**', '', ...inGlassNotInPrices.sort().map((m) => `- ${m}`), ''] : []),
    '',
    '---',
    '',
    '## 10. Рекомендации',
    '',
    '1. **Унифицировать «Название модели»** в листах Цены базовые, Цвет, Опции, Наценка за кромку, Стекло_доступность (одно и то же значение для одной и той же модели).',
    '2. **Либо в импорте** добавить слияние по «Код модели Domeo (Web)» (где он есть), чтобы подтягивать Цвет/Опции по коду, а не только по названию.',
    '3. **Лишние строки** в Цвет/Опции с названиями, которых нет в Цены базовые, — либо удалить, либо добавить соответствующие строки в Цены базовые.',
  ];

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report.join('\n'), 'utf8');
  console.log('\nПолный отчёт о недостающих данных записан в:', reportPath);

  // ——— Документ «Несоответствия и правила» (с учётом зафиксированных в ПО правил по умолчанию) ———
  const rulesPath = path.join(__dirname, '..', 'docs', 'DISCREPANCIES_AND_RULES.md');
  const rulesDoc = [
    '# Несоответствия данных и правила, зафиксированные в ПО',
    '',
    'Документ создаётся скриптом `scripts/verify-excel-db-and-links.ts`.',
    '',
    '---',
    '',
    '## 1. Правила по умолчанию (реализованы в коде)',
    '',
    '| Ситуация | Правило в ПО | Где реализовано |',
    '|-----------|---------------|------------------|',
    '| Модель из «Цены базовые» **нет** в листе «Наценка за кромку» | **Кромка включена в базовую цену** = **Нет** | Импорт: `import-final-filled.ts` (для товара двери задаётся `Domeo_Кромка_в_базе_включена = "Нет"`) |',
    '| Модель из «Цены базовые» **нет** в листе «Стекло_доступность» | **Стекло не доступно** (пустой список цветов стекла) | Импорт: не заполняется `Domeo_Стекло_доступность`; в API/калькуляторе для модели возвращается пустой массив вариантов стекла |',
    '| Строка из «Наценка за кромку», модели которой **нет** в «Цены базовые» | Для такой строки считаем **Кромка включена в базовую цену** = **Нет** (строка не используется ни для одного товара двери) | Документировано; при импорте эти строки не привязываются к товарам |',
    '',
    '### 1.1 Почему в БД меньше записей дверей, чем комбинаций в развороте',
    '',
    `В «Цены базовые» при развороте по размерам получается **${expectedDoorsProducts}** комбинаций (строка × ширина × высота). В БД записей дверей: **${doorsCount}**. Уникальных SKU (как в импорте): **${expectedUniqueDoors}**.`,
    '',
    'Импорт использует **SKU = door_код_модели_ширина_высота_покрытие**. Для каждой комбинации (код, модель, размеры, тип покрытия) создаётся отдельная запись с соответствующей базовой ценой из листа «Цены базовые». Таким образом **тип покрытия влияет на базовую цену двери**: разным покрытиям соответствуют разные товары и разные цены РРЦ.',
    '',
    '### 1.2 Правила согласованности Excel',
    '',
    '- Если у модели в «Цены базовые» столбец **Стекло** = **Да**, модель должна быть во вкладке **Стекло_доступность**.',
    '- Если у модели в «Цены базовые» столбец **Кромка в базе** = **Да**, модель должна быть во вкладке **Наценка за кромку**.',
    '',
    ...(glassYesButNotInGlass.length > 0
      ? [
          '**Нарушения (Стекло=Да, но модели нет в Стекло_доступность):**',
          `Количество: ${glassYesButNotInGlass.length}`,
          '',
          ...glassYesButNotInGlass.map(({ modelName }) => `- ${modelName}`),
          '',
        ]
      : ['**Стекло=Да:** нарушений нет.', '']),
    ...(edgeYesButNotInEdge.length > 0
      ? [
          '**Нарушения (Кромка в базе=Да, но модели нет в Наценка за кромку):**',
          `Количество: ${edgeYesButNotInEdge.length}`,
          '',
          ...edgeYesButNotInEdge.map(({ modelName }) => `- ${modelName}`),
          '',
        ]
      : ['**Кромка в базе=Да:** нарушений нет.', '']),
    '',
    '---',
    '',
    '## 2. Модели с применёнными умолчаниями',
    '',
    '### 2.1 Кромка: «Кромка включена в базовую цену» = Нет',
    '',
    'Для следующих моделей из «Цены базовые» в листе «Наценка за кромку» нет строки — в БД и калькуляторе применяется значение **Нет**.',
    '',
    `**Количество:** ${inPricesNotInEdge.length}`,
    '',
    ...inPricesNotInEdge.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '### 2.2 Стекло: не доступно',
    '',
    'Для следующих моделей из «Цены базовые» в листе «Стекло_доступность» нет строки — в калькуляторе для них не показывается выбор цвета стекла (стекло не доступно).',
    '',
    `**Количество:** ${inPricesNotInGlass.length}`,
    '',
    ...inPricesNotInGlass.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '### 2.3 Строки «Наценка за кромку» без соответствия в «Цены базовые»',
    '',
    'Для этих названий моделей нет товаров дверей; правило: **Кромка включена в базовую цену** = **Нет** (строка не используется).',
    '',
    `**Количество:** ${inEdgeNotInPrices.length}`,
    '',
    ...(inEdgeNotInPrices.length > 0 ? [...inEdgeNotInPrices.sort().map((m) => `- ${m}`), ''] : ['(нет таких строк)', '']),
    '',
    '---',
    '',
    '## 3. Остающиеся несоответствия (без подставляемого умолчания)',
    '',
    '### 3.1 Модели без данных в «Цвет»',
    '',
    'В конфигураторе для этих моделей не будет фото и вариантов цвета из листа «Цвет». Универсального умолчания нет — нужно либо добавить строки в «Цвет», либо оставить без фото/цвета.',
    '',
    `**Количество:** ${inPricesNotInColor.length}`,
    '',
    ...inPricesNotInColor.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '### 3.2 Модели без данных в «Опции»',
    '',
    'Для этих моделей в БД не попадут реверс, зеркало, порог, наполнение из листа «Опции». В калькуляторе опции по модели будут недоступны или пустые.',
    '',
    `**Количество:** ${inPricesNotInOptions.length}`,
    '',
    ...inPricesNotInOptions.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '### 3.3 Модели из «Цвет» без соответствия в «Цены базовые»',
    '',
    'Строки листа «Цвет» не привязаны ни к одной модели калькулятора.',
    '',
    `**Количество:** ${inColorNotInPrices.length}`,
    '',
    ...inColorNotInPrices.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '### 3.4 Модели из «Опции» без соответствия в «Цены базовые»',
    '',
    'Опции этих строк не попадут в товары дверей.',
    '',
    `**Количество:** ${inOptionsNotInPrices.length}`,
    '',
    ...inOptionsNotInPrices.sort().map((m) => `- ${m}`),
    '',
    '---',
    '',
    '## 4. Калькулятор: цвет стекла',
    '',
    '- Варианты цвета стекла по модели берутся из БД (поле `Domeo_Стекло_доступность`, данные из листа «Стекло_доступность», столбец «Доступные цвета стекол для модели»).',
    '- Выбор цвета стекла доступен во вкладке **Покрытие и Цвет** только если у модели есть варианты (иначе стекло не доступно).',
    '- Выбор **на цену не влияет**; значение отображается в **Спецификации**.',
    '',
  ];
  fs.writeFileSync(rulesPath, rulesDoc.join('\n'), 'utf8');
  console.log('Документ с правилами и несоответствиями записан в:', rulesPath);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
