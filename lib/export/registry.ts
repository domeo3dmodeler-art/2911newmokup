// lib/export/registry.ts
// Реестр адаптеров экспорта по категориям

import { doorsExportAdapter } from '@/app/lib/export/adapters/doors';

const registry: Record<string, any> = {
  doors: doorsExportAdapter,
  // windows: windowsExportAdapter, // подключим позже
};

export const getExportAdapter = (category: string) => {
  const adapter = registry[category.toLowerCase()];
  if (!adapter) {
    throw new Error(`Адаптер экспорта для категории "${category}" не найден`);
  }
  return adapter;
};

export const getSupportedCategories = (): string[] => {
  return Object.keys(registry);
};

