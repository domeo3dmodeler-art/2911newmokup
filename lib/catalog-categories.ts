/**
 * Получение ID категорий каталога по имени.
 * Используется в API конфигуратора дверей, чтобы не зависеть от хардкода ID после пересоздания БД.
 */
import { prisma } from '@/lib/prisma';

const CATEGORY_NAMES = {
  DOORS: 'Межкомнатные двери',
  ARCHITRAVES: 'Наличники',
  HARDWARE_KITS: 'Комплекты фурнитуры',
  HANDLES: 'Ручки и завертки',
  LIMITERS: 'Ограничители',
  ROOT: 'Каталог',
} as const;

let cache: Partial<Record<string, string>> = {};

/**
 * Возвращает ID категории по имени (ищет по точному совпадению name).
 */
export async function getCategoryIdByName(name: string): Promise<string | null> {
  if (cache[name]) return cache[name];
  const cat = await prisma.catalogCategory.findFirst({
    where: { name },
    select: { id: true },
  });
  if (cat) cache[name] = cat.id;
  return cat?.id ?? null;
}

/**
 * ID категории "Межкомнатные двери" (для API дверей и конфигуратора).
 */
export async function getDoorsCategoryId(): Promise<string | null> {
  return getCategoryIdByName(CATEGORY_NAMES.DOORS);
}

/**
 * ID категории "Комплекты фурнитуры".
 */
export async function getHardwareKitsCategoryId(): Promise<string | null> {
  return getCategoryIdByName(CATEGORY_NAMES.HARDWARE_KITS);
}

/**
 * ID категории "Ручки и завертки".
 */
export async function getHandlesCategoryId(): Promise<string | null> {
  return getCategoryIdByName(CATEGORY_NAMES.HANDLES);
}

/**
 * ID категории "Ограничители".
 */
export async function getLimitersCategoryId(): Promise<string | null> {
  return getCategoryIdByName(CATEGORY_NAMES.LIMITERS);
}

/**
 * Сбрасывает кэш (например, после импорта/миграций).
 */
export function clearCategoryIdCache(): void {
  cache = {};
}

export { CATEGORY_NAMES };
