// app/lib/import/registry.ts
import { doorsAdapter } from './adapters/doors';

const registry: Record<string, any> = {
  doors: doorsAdapter,
  // windows: windowsAdapter, // подключим позже
};

export const getAdapter = (category: string) => registry[category.toLowerCase()];