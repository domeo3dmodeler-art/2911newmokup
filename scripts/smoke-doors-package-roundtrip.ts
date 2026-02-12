import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { getCategoryIdByName } from '../lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '../lib/property-photos';

const prisma = new PrismaClient();
const ROOT = path.join(__dirname, '..');
const DOORS_FILE_PATH = path.join(ROOT, '1002', 'final_filled 30.01.xlsx');
const TMP_EXPORT_PATH = path.join(ROOT, '1002', `smoke_export_${Date.now()}.xlsx`);
const BACKUP_PATH = path.join(ROOT, '1002', `final_filled.backup.smoke.${Date.now()}.xlsx`);

function parseProps(value: unknown): Record<string, any> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (typeof value === 'object') return value as Record<string, any>;
  return {};
}

function toRows<T extends Record<string, any>>(rows: T[]): any[][] {
  if (rows.length === 0) return [[]];
  const headers = Object.keys(rows[0]);
  return [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ''))];
}

async function exportDoorsPackageToFile(targetPath: string) {
  const [doorsCatId, nalichnikiCatId, kitsCatId, handlesCatId, limitersCatId] = await Promise.all([
    getCategoryIdByName('Межкомнатные двери'),
    getCategoryIdByName('Наличники'),
    getCategoryIdByName('Комплекты фурнитуры'),
    getCategoryIdByName('Ручки и завертки'),
    getCategoryIdByName('Ограничители'),
  ]);
  if (!doorsCatId) {
    throw new Error('Категория "Межкомнатные двери" не найдена');
  }

  const [doorsProducts, colorPhotos, nalichniki, kits, handles, limiters] = await Promise.all([
    prisma.product.findMany({ where: { catalog_category_id: doorsCatId }, select: { properties_data: true } }),
    prisma.propertyPhoto.findMany({
      where: { categoryId: doorsCatId, propertyName: DOOR_COLOR_PROPERTY },
      select: { propertyValue: true, photoPath: true, photoType: true },
      orderBy: [{ propertyValue: 'asc' }, { photoType: 'asc' }],
    }),
    nalichnikiCatId
      ? prisma.product.findMany({
          where: { catalog_category_id: nalichnikiCatId },
          select: { name: true, description: true, properties_data: true, images: { select: { url: true }, where: { is_primary: true } } },
        })
      : [],
    kitsCatId ? prisma.product.findMany({ where: { catalog_category_id: kitsCatId }, select: { name: true, description: true, base_price: true } }) : [],
    handlesCatId
      ? prisma.product.findMany({
          where: { catalog_category_id: handlesCatId },
          select: { name: true, description: true, base_price: true, is_active: true, properties_data: true, images: { select: { url: true, sort_order: true }, orderBy: { sort_order: 'asc' } } },
        })
      : [],
    limitersCatId
      ? prisma.product.findMany({
          where: { catalog_category_id: limitersCatId },
          select: { name: true, description: true, base_price: true, properties_data: true, images: { select: { url: true }, where: { is_primary: true } } },
        })
      : [],
  ]);

  const pricesRows: Array<Record<string, any>> = [];
  const optionsMap = new Map<string, Record<string, any>>();
  const glassRows: Array<Record<string, any>> = [];
  const edgeMap = new Map<string, Record<string, any>>();
  const modelSuppliers = new Map<string, string>();
  const knownModelNames = new Set<string>();
  const knownModelCodes = new Set<string>();
  const codeToModelName = new Map<string, string>();

  for (const p of doorsProducts) {
    const props = parseProps(p.properties_data);
    const modelName = String(props['Название модели'] ?? props['Domeo_Название модели для Web'] ?? '').trim();
    const code = String(props['Код модели Domeo (Web)'] ?? '').trim();
    if (!modelName || !code) continue;
    knownModelNames.add(modelName);
    knownModelCodes.add(code);
    if (!codeToModelName.has(code)) codeToModelName.set(code, modelName);
    const supplier = String(props['Поставщик'] ?? '').trim();
    if (supplier && !modelSuppliers.has(modelName)) modelSuppliers.set(modelName, supplier);

    pricesRows.push({
      'Код модели Domeo (Web)': code,
      'Название модели': modelName,
      'Стиль Domeo (Web)': props['Domeo_Стиль Web'] ?? props['Стиль Domeo (Web)'] ?? '',
      Поставщик: supplier,
      'Высота, мм': props['Высота/мм'] ?? '',
      'Ширины, мм': props['Ширина/мм'] ?? '',
      'Толщина, мм': props['Толщина, мм'] ?? '',
      'Тип покрытия': props['Тип покрытия'] ?? '',
      Стекло: props['Стекло'] ?? '',
      'Кромка в базе': props['Кромка в базе'] ?? '',
      'Цена опт': props['Цена опт'] ?? '',
      'Цена РРЦ': props['Цена РРЦ'] ?? '',
    });

    if (!optionsMap.has(modelName)) {
      optionsMap.set(modelName, {
        'Название модели': modelName,
        Поставщик: props['Domeo_Опции_Поставщик'] ?? '',
        'Название наполнения': props['Domeo_Опции_Название_наполнения'] ?? '',
        'Звукоизоляция (дБ)': props['Domeo_Опции_Звукоизоляция_дБ'] ?? '',
        'Надбавка 2301-2500мм (%) к высоте 2000': props['Domeo_Опции_Надбавка_2301_2500_процент'] ?? '',
        'Надбавка 2501-3000мм (%) к высоте 2000': props['Domeo_Опции_Надбавка_2501_3000_процент'] ?? '',
        'Реверс доступен (Да/Нет)': props['Domeo_Опции_Реверс_доступен'] ?? '',
        'Надбавка за реверс (руб)': props['Domeo_Опции_Надбавка_реверс_руб'] ?? '',
        'Порог доступен (Да/Нет)': props['Domeo_Опции_Порог_доступен'] ?? '',
        'Цена порога (руб)': props['Domeo_Опции_Цена_порога_руб'] ?? '',
        'Зеркало доступно (Да/Нет)': props['Domeo_Опции_Зеркало_доступно'] ?? '',
        'Зеркало: Одна сторона (руб)': props['Domeo_Опции_Зеркало_одна_сторона_руб'] ?? '',
        'Зеркало: Две стороны (руб)': props['Domeo_Опции_Зеркало_две_стороны_руб'] ?? '',
      });
    }

    const glass = Array.isArray(props['Domeo_Стекло_доступность']) ? props['Domeo_Стекло_доступность'] : [];
    const glassSuppliers = Array.isArray(props['Domeo_Стекло_Поставщики']) ? props['Domeo_Стекло_Поставщики'] : [];
    for (const g of glass) {
      if (!g) continue;
      glassRows.push({
        'Код модели Domeo (Web)': code,
        Поставщик: glassSuppliers[0] ?? '',
        'Название модели': modelName,
        'Доступные цвета стекол для модели': g,
      });
    }

    if (!edgeMap.has(modelName)) {
      edgeMap.set(modelName, {
        'Название модели': modelName,
        'Кромка включена в базовую цену (Да/Нет)': props['Domeo_Кромка_в_базе_включена'] ?? 'Нет',
        'Базовая кромка (самая дешевая), Цвет': props['Domeo_Кромка_базовая_цвет'] ?? '',
        'Опции кромки доступны (Да/Нет)': props['Domeo_Кромка_опции_доступны'] ?? '',
        'Наценка за кромку как за опцию': props['Domeo_Кромка_наценка_как_опция'] ?? '',
        'Цвет 2': props['Domeo_Кромка_Цвет_2'] ?? '',
        'Наценка за Цвет 2': props['Domeo_Кромка_Наценка_Цвет_2'] ?? '',
        'Цвет 3': props['Domeo_Кромка_Цвет_3'] ?? '',
        'Наценка за Цвет 3': props['Domeo_Кромка_Наценка_Цвет_3'] ?? '',
        'Цвет 4': props['Domeo_Кромка_Цвет_4'] ?? '',
        'Наценка за Цвет 4': props['Domeo_Кромка_Наценка_Цвет_4'] ?? '',
      });
    }
  }

  const colorGroups = new Map<string, { modelName: string; coatingType: string; colorName: string; cover: string; gallery: string[]; supplier: string }>();
  const humanPhotoSignatures = new Set<string>();
  const codeEntries: Array<{ code: string; coatingType: string; colorName: string; photoType: string; photoPath: string }> = [];
  for (const p of colorPhotos) {
    const [modelNameRaw, coatingType, colorName] = String(p.propertyValue ?? '').split('|');
    const modelName = (modelNameRaw || '').trim();
    if (!modelName || !coatingType || !colorName) continue;
    const photoType = p.photoType || '';
    const photoPath = p.photoPath || '';
    if (knownModelCodes.has(modelName)) {
      codeEntries.push({ code: modelName, coatingType, colorName, photoType, photoPath });
      continue;
    }
    const key = `${modelName}|${coatingType}|${colorName}`;
    if (!colorGroups.has(key)) {
      colorGroups.set(key, {
        modelName,
        coatingType,
        colorName,
        cover: '',
        gallery: [],
        supplier: modelSuppliers.get(modelName) || '',
      });
    }
    const g = colorGroups.get(key)!;
    if (photoType === 'cover') g.cover = photoPath;
    else if (photoType.startsWith('gallery_') && photoPath) g.gallery.push(photoPath);
    if (photoPath) {
      humanPhotoSignatures.add(`${modelName}|${coatingType}|${colorName}|${photoType}|${photoPath}`);
    }
  }
  for (const entry of codeEntries) {
    const humanModelName = codeToModelName.get(entry.code);
    const hasHumanEquivalent =
      !!humanModelName &&
      humanPhotoSignatures.has(
        `${humanModelName}|${entry.coatingType}|${entry.colorName}|${entry.photoType}|${entry.photoPath}`,
      );
    if (hasHumanEquivalent) continue;
    const key = `${entry.code}|${entry.coatingType}|${entry.colorName}`;
    if (!colorGroups.has(key)) {
      colorGroups.set(key, {
        modelName: entry.code,
        coatingType: entry.coatingType,
        colorName: entry.colorName,
        cover: '',
        gallery: [],
        supplier: '',
      });
    }
    const g = colorGroups.get(key)!;
    if (entry.photoType === 'cover') g.cover = entry.photoPath;
    else if (entry.photoType.startsWith('gallery_') && entry.photoPath) g.gallery.push(entry.photoPath);
  }
  const colorRows = Array.from(colorGroups.values()).map((c) => ({
    'Название модели': c.modelName,
    Поставщик: c.supplier,
    'Тип покрытия': c.coatingType,
    'Цвет/отделка': c.colorName,
    'Ссылка на обложку': c.cover,
    'Ссылки на галерею (через ;)': c.gallery.join(';'),
  }));

  const nalichnikiRows = nalichniki.map((p) => {
    const props = parseProps(p.properties_data);
    return {
      Поставщик: props['Поставщик'] ?? '',
      'Наличник: Название': p.name ?? '',
      'Наличник: Описание': p.description ?? '',
      'Наличник: Фото (ссылка)': p.images?.[0]?.url ?? '',
    };
  });
  const kitsRows = kits.map((p) => ({
    'Комплект фурнитуры: Название': p.name ?? '',
    Описание: p.description ?? '',
    Цена: p.base_price ?? 0,
  }));
  const handlesRows = handles.map((p) => {
    const props = parseProps(p.properties_data);
    const cover = p.images?.find((i) => i.sort_order === 0)?.url ?? p.images?.[0]?.url ?? '';
    const zav = p.images?.find((i) => i.sort_order === 1)?.url ?? '';
    return {
      'Тип (Ручка/Завертка)': props['Тип (Ручка/Завертка)'] ?? '',
      'Название (Domeo_наименование для Web)': p.name ?? '',
      Описание: p.description ?? '',
      Группа: props['Группа'] ?? '',
      'Цена продажи (руб)': props['Цена продажи (руб)'] ?? '',
      'Цена закупки (руб)': props['Цена закупки (руб)'] ?? '',
      'Цена РРЦ (руб)': p.base_price ?? 0,
      'Фото (ссылка)': cover,
      'Порядок сортировки': props['Порядок сортировки'] ?? '',
      'Активна (Да/Нет)': p.is_active ? 'Да' : 'Нет',
      'Завертка, цена РРЦ': props['Завертка, цена РРЦ'] ?? '',
      'Фото завертки (ссылка)': zav,
    };
  });
  const limitersRows = limiters.map((p) => {
    const props = parseProps(p.properties_data);
    return {
      'ID товара': props['ID товара'] ?? '',
      Название: p.name ?? '',
      'Тип (магнитный врезной / напольный / настенный)': props['Тип (магнитный врезной / напольный / настенный)'] ?? '',
      Описание: p.description ?? '',
      'Цена опт (руб)': props['Цена опт (руб)'] ?? '',
      'Цена РРЦ (руб)': p.base_price ?? 0,
      'Фото (путь)': p.images?.[0]?.url ?? '',
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(pricesRows)), 'Цены базовые');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(colorRows)), 'Цвет');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(Array.from(optionsMap.values()))), 'Опции');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(glassRows)), 'Стекло_доступность');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(Array.from(edgeMap.values()))), 'Наценка за кромку');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(nalichnikiRows)), 'Наличники');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(kitsRows)), 'Фурнитура');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(handlesRows)), '04 Ручки Завертки');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(toRows(limitersRows)), '05 Ограничители');
  XLSX.writeFile(wb, targetPath);
}

function verifyWorkbook(filePath: string) {
  const wb = XLSX.readFile(filePath, { raw: false });
  const expected = [
    'Цены базовые',
    'Цвет',
    'Опции',
    'Стекло_доступность',
    'Наценка за кромку',
    'Наличники',
    'Фурнитура',
    '04 Ручки Завертки',
    '05 Ограничители',
  ];
  const missing = expected.filter((s) => !wb.SheetNames.includes(s));
  if (missing.length) {
    throw new Error(`В export xlsx отсутствуют листы: ${missing.join(', ')}`);
  }
}

async function main() {
  if (!fs.existsSync(DOORS_FILE_PATH)) {
    throw new Error(`Не найден исходный файл: ${DOORS_FILE_PATH}`);
  }

  console.log('1) Экспорт пакета doors из БД...');
  await exportDoorsPackageToFile(TMP_EXPORT_PATH);
  verifyWorkbook(TMP_EXPORT_PATH);
  console.log('   export PASS:', TMP_EXPORT_PATH);

  console.log('2) Backup текущего final_filled...');
  fs.copyFileSync(DOORS_FILE_PATH, BACKUP_PATH);

  try {
    console.log('3) Подмена final_filled экспортом и обратный импорт...');
    fs.copyFileSync(TMP_EXPORT_PATH, DOORS_FILE_PATH);
    execSync('npx tsx scripts/import-final-filled.ts', {
      cwd: ROOT,
      stdio: 'inherit',
    });

    console.log('4) Строгая проверка после roundtrip...');
    const verifyOut = execSync('npx tsx scripts/verify-data-loaded.ts --strict', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    process.stdout.write(verifyOut);
    if (verifyOut.includes('✗') || verifyOut.includes('Итог: есть расхождения.')) {
      throw new Error('Roundtrip verify-data-loaded --strict обнаружил расхождения');
    }
    console.log('roundtrip PASS');
  } finally {
    console.log('5) Восстановление исходного final_filled...');
    if (fs.existsSync(BACKUP_PATH)) {
      fs.copyFileSync(BACKUP_PATH, DOORS_FILE_PATH);
      fs.unlinkSync(BACKUP_PATH);
    }
    if (fs.existsSync(TMP_EXPORT_PATH)) {
      fs.unlinkSync(TMP_EXPORT_PATH);
    }
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
