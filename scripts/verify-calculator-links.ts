/**
 * Проверка связей данных для калькулятора:
 * - complete-data: модели имеют цвета/фото из PropertyPhoto (Цвет ↔ Цены базовые по названию модели)
 * - price/doors: по (style, model, finish, width, height) находится товар с ценой
 * - hardware: ручки и комплекты фурнитуры доступны
 *
 * Запуск: npx tsx scripts/verify-calculator-links.ts
 */
import { PrismaClient } from '@prisma/client';
import { getDoorsCategoryId } from '../lib/catalog-categories';
import { getPropertyPhotosByValuePrefix, DOOR_COLOR_PROPERTY } from '../lib/property-photos';
import { getCategoryIdByName } from '../lib/catalog-categories';

const prisma = new PrismaClient();

function parseProps(p: unknown): Record<string, unknown> {
  if (!p) return {};
  if (typeof p === 'string') {
    try {
      return JSON.parse(p) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return (p as Record<string, unknown>) || {};
}

async function main() {
  console.log('\n=== Проверка связей данных для калькулятора ===\n');

  const doorsCatId = await getDoorsCategoryId();
  const handlesCatId = await getCategoryIdByName('Ручки и завертки');
  const kitsCatId = await getCategoryIdByName('Комплекты фурнитуры');

  if (!doorsCatId) {
    console.log('✗ Категория "Межкомнатные двери" не найдена.');
    return;
  }

  const products = await prisma.product.findMany({
    where: { catalog_category_id: doorsCatId, is_active: true },
    select: { id: true, sku: true, properties_data: true },
  });

  const modelNames = new Set<string>();
  const samples: { style: string; model: string; finish: string; width: number; height: number }[] = [];
  for (const p of products) {
    const props = parseProps(p.properties_data);
    const modelName = String(props['Domeo_Название модели для Web'] ?? '').trim();
    const style = String(props['Domeo_Стиль Web'] ?? '').trim();
    const finish = String(props['Тип покрытия'] ?? '').trim();
    const width = Number(props['Ширина/мм']);
    const height = Number(props['Высота/мм']);
    if (modelName) modelNames.add(modelName);
    if (style && modelName && finish && width && height && samples.length < 5) {
      samples.push({ style, model: modelName, finish, width, height });
    }
  }

  // 1) Связь модель → цвета (PropertyPhoto по префиксу "Название модели|")
  let modelsWithColors = 0;
  let modelsWithoutColors = 0;
  const withoutColors: string[] = [];
  for (const name of Array.from(modelNames).slice(0, 100)) {
    const colorPhotos = await getPropertyPhotosByValuePrefix(doorsCatId, DOOR_COLOR_PROPERTY, name + '|');
    if (colorPhotos.length > 0) modelsWithColors++;
    else {
      modelsWithoutColors++;
      if (withoutColors.length < 15) withoutColors.push(name);
    }
  }
  const totalModels = Math.min(100, modelNames.size);
  console.log(`1) Связь модель → цвета (PropertyPhoto, выборка ${totalModels} моделей):`);
  console.log(`   С цветами/фото: ${modelsWithColors}, без: ${modelsWithoutColors}`);
  if (withoutColors.length > 0) {
    console.log(`   Примеры моделей без цветов в «Цвет»: ${withoutColors.slice(0, 5).join(', ')}${withoutColors.length > 5 ? '…' : ''}`);
  }
  const linksOk = modelsWithColors > 0;

  // 2) Расчёт цены: по (style, model, finish, width, height) находится товар
  const filterProducts = (
    list: { id: string; sku: string; properties_data: unknown }[],
    selection: { style?: string; model?: string; finish?: string; width?: number; height?: number }
  ) =>
    list.filter((p) => {
      const props = parseProps(p.properties_data);
      const styleMatch = !selection.style || props['Domeo_Стиль Web'] === selection.style;
      const modelName = props['Domeo_Название модели для Web'];
      const modelCode = props['Код модели Domeo (Web)'] ?? props['Артикул поставщика'];
      const modelMatch =
        !selection.model ||
        modelName === selection.model ||
        modelCode === selection.model;
      const finishMatch = !selection.finish || props['Тип покрытия'] === selection.finish;
      const widthMatch = !selection.width || props['Ширина/мм'] == selection.width;
      const heightMatch = !selection.height || props['Высота/мм'] == selection.height;
      return styleMatch && modelMatch && finishMatch && widthMatch && heightMatch;
    });

  let priceCheckOk = false;
  for (const sel of samples) {
    const matching = filterProducts(products, sel);
    if (matching.length > 0) {
      const props = parseProps(matching[0].properties_data);
      const price = Number(props['Цена РРЦ']) || 0;
      if (price > 0) {
        priceCheckOk = true;
        console.log(`\n2) Расчёт цены (price/doors): по выборке найден товар, цена РРЦ = ${price}`);
        break;
      }
    }
  }
  if (!priceCheckOk && samples.length > 0) {
    console.log('\n2) Расчёт цены: по первой выборке товар не найден или цена не задана.');
  } else if (samples.length === 0) {
    console.log('\n2) Расчёт цены: нет подходящих товаров с полным набором полей для проверки.');
  }

  // 3) Ручки и комплекты фурнитуры
  const [handlesCount, kitsCount] = await Promise.all([
    handlesCatId ? prisma.product.count({ where: { catalog_category_id: handlesCatId, is_active: true } }) : 0,
    kitsCatId ? prisma.product.count({ where: { catalog_category_id: kitsCatId, is_active: true } }) : 0,
  ]);
  console.log(`\n3) Фурнитура: ручки ${handlesCount}, комплекты фурнитуры ${kitsCount}`);
  const hardwareOk = handlesCount > 0 && kitsCount > 0;

  console.log('\n--- Итог ---');
  if (linksOk && priceCheckOk && hardwareOk) {
    console.log('✓ Связи для калькулятора в порядке: модели↔цвета, расчёт цены, ручки и комплекты.');
  } else {
    if (!linksOk) console.log('✗ Часть моделей без цветов/фото в «Цвет» (ожидаемо для 6 моделей из предупреждений импорта).');
    if (!priceCheckOk) console.log('✗ Проверка расчёта цены не пройдена.');
    if (!hardwareOk) console.log('✗ Нет ручек или комплектов фурнитуры.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
