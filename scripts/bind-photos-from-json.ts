/**
 * Привязывает скачанные фото к товарам в БД по данным из photo-entries.json и resolved-urls.json.
 * Вызывается после загрузки картинок через MCP-браузер и download-one-image.ts.
 *
 * Запуск:
 *   npx tsx scripts/bind-photos-from-json.ts [--entries=photo-entries.json] [--resolved=resolved-urls.json]
 */
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as fs from 'fs';
import { DOOR_COLOR_PROPERTY, upsertPropertyPhoto } from '../lib/property-photos';

const prisma = new PrismaClient();
const IDS_PATH = path.join(__dirname, 'catalog-tree-ids.json');
const ENTRIES_PATH_DEFAULT = path.join(__dirname, 'photo-entries.json');
const RESOLVED_PATH_DEFAULT = path.join(__dirname, 'resolved-urls.json');

interface PhotoEntry {
  sheet: string;
  productKey: string;
  photoType: string;
  url: string;
  propertyValue?: string;
}

function normalizeSheetName(sheet: string | undefined): string {
  return String(sheet ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function isSheet(sheet: string | undefined, expected: string): boolean {
  const s = normalizeSheetName(sheet);
  const e = normalizeSheetName(expected);
  return s === e || s.includes(e);
}

async function main() {
  const entriesArg = process.argv.find((a) => a.startsWith('--entries='));
  const resolvedArg = process.argv.find((a) => a.startsWith('--resolved='));
  const entriesPath = entriesArg ? path.resolve(entriesArg.slice('--entries='.length).trim()) : ENTRIES_PATH_DEFAULT;
  const resolvedPath = resolvedArg ? path.resolve(resolvedArg.slice('--resolved='.length).trim()) : RESOLVED_PATH_DEFAULT;

  if (!fs.existsSync(entriesPath)) {
    console.error('Файл записей не найден:', entriesPath);
    process.exit(1);
  }
  if (!fs.existsSync(resolvedPath)) {
    console.error('Файл разрешённых URL не найден:', resolvedPath);
    process.exit(1);
  }

  const entriesData = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
  const entries: PhotoEntry[] = Array.isArray(entriesData.entries) ? entriesData.entries : entriesData;
  const resolved: Record<string, string> = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  const urlToLocalPath = new Map<string, string>(Object.entries(resolved));

  let categoryIds: Record<string, string>;
  if (fs.existsSync(IDS_PATH)) {
    categoryIds = JSON.parse(fs.readFileSync(IDS_PATH, 'utf8'));
  } else {
    const list = await prisma.catalogCategory.findMany({
      where: { name: { in: ['Межкомнатные двери', 'Наличники', 'Комплекты фурнитуры', 'Ручки и завертки', 'Ограничители'] } },
      select: { id: true, name: true },
    });
    categoryIds = {};
    list.forEach((c) => (categoryIds[c.name] = c.id));
  }
  const doorsCatId = categoryIds['Межкомнатные двери'];
  const nalichnikiCatId = categoryIds['Наличники'];
  const ruchkiCatId = categoryIds['Ручки и завертки'];
  const limitersCatId = categoryIds['Ограничители'];

  let boundNal = 0,
    boundColor = 0,
    boundRuchki = 0,
    boundLim = 0;

  for (const e of entries) {
    const resolvedLocalPath = urlToLocalPath.get(e.url);
    const hasResolvedLocalPath = !!resolvedLocalPath;
    const localPath = resolvedLocalPath || e.url;
    if (isSheet(e.sheet, 'Наличники') && nalichnikiCatId) {
      const product = await prisma.product.findFirst({ where: { sku: e.productKey, catalog_category_id: nalichnikiCatId } });
      if (product) {
        const existing = await prisma.productImage.findFirst({ where: { product_id: product.id } });
        if (!existing) {
          await prisma.productImage.create({
            data: {
              product_id: product.id,
              filename: path.basename(localPath),
              original_name: 'nalichnik.jpg',
              url: localPath,
              mime_type: 'image/jpeg',
              is_primary: true,
              sort_order: 0,
            },
          });
          boundNal++;
        } else if (urlToLocalPath.has(e.url)) {
          await prisma.productImage.update({ where: { id: existing.id }, data: { url: localPath } });
          boundNal++;
        }
      }
    } else if (isSheet(e.sheet, 'Цвет') && doorsCatId && e.propertyValue) {
      // Do not overwrite already local bindings with unresolved external URLs.
      if (!hasResolvedLocalPath) continue;
      await upsertPropertyPhoto(doorsCatId, DOOR_COLOR_PROPERTY, e.propertyValue, localPath, e.photoType);
      boundColor++;
    } else if (isSheet(e.sheet, '04 Ручки Завертки') && ruchkiCatId) {
      const product = await prisma.product.findFirst({ where: { sku: e.productKey, catalog_category_id: ruchkiCatId } });
      if (product) {
        const existingImages = await prisma.productImage.findMany({ where: { product_id: product.id }, orderBy: { sort_order: 'asc' } });
        const isMain = e.photoType === 'main';
        const sortOrder = isMain ? 0 : 1;
        const sameSlot = existingImages.find((i) => i.sort_order === sortOrder);
        if (!sameSlot) {
          await prisma.productImage.create({
            data: {
              product_id: product.id,
              filename: path.basename(localPath),
              original_name: isMain ? 'handle.jpg' : 'zaverтка.jpg',
              url: localPath,
              mime_type: 'image/jpeg',
              is_primary: isMain,
              sort_order: sortOrder,
            },
          });
          boundRuchki++;
        } else if (urlToLocalPath.has(e.url)) {
          await prisma.productImage.update({ where: { id: sameSlot.id }, data: { url: localPath } });
          boundRuchki++;
        }
      }
    } else if (isSheet(e.sheet, '05 Ограничители') && limitersCatId) {
      const product = await prisma.product.findFirst({ where: { sku: e.productKey, catalog_category_id: limitersCatId } });
      if (product) {
        const existing = await prisma.productImage.findFirst({ where: { product_id: product.id } });
        if (!existing) {
          await prisma.productImage.create({
            data: {
              product_id: product.id,
              filename: path.basename(localPath),
              original_name: 'limiter.jpg',
              url: localPath,
              mime_type: 'image/jpeg',
              is_primary: true,
              sort_order: 0,
            },
          });
          boundLim++;
        } else if (urlToLocalPath.has(e.url)) {
          await prisma.productImage.update({ where: { id: existing.id }, data: { url: localPath } });
          boundLim++;
        }
      }
    }
  }

  console.log('Привязки в БД: наличники', boundNal, 'цвет/PropertyPhoto', boundColor, 'ручки', boundRuchki, 'ограничители', boundLim);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
