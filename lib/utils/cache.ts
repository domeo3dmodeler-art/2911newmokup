/**
 * Утилиты для кэширования часто используемых данных
 */

import { logger } from '../logging/logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live в миллисекундах
}

class MemoryCache {
  private cache = new Map<string, CacheItem<unknown>>();

  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Проверяем срок действия
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Проверяем срок действия
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Получить статистику кэша
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Глобальный экземпляр кэша
export const cache = new MemoryCache();

/**
 * Декоратор для кэширования результатов функций
 */
export function cached<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  ttlMs: number = 5 * 60 * 1000
): T {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    
    // Проверяем кэш
    const cached = cache.get(key);
    if (cached !== null) {
      logger.debug('Cache hit for key', 'cache-utils', { key });
      return cached;
    }

    // Выполняем функцию и кэшируем результат
    logger.debug('Cache miss for key, executing function', 'cache-utils', { key });
    const result = fn(...args);
    
    // Если результат - Promise, кэшируем после выполнения
    if (result instanceof Promise) {
      return result.then(data => {
        cache.set(key, data, ttlMs);
        return data;
      });
    } else {
      cache.set(key, result, ttlMs);
      return result;
    }
  }) as T;
}

/**
 * Кэширование для Prisma запросов
 */
export async function cachedPrismaQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000
): Promise<T> {
  // Проверяем кэш
  const cached = cache.get<T>(key);
  if (cached !== null) {
    logger.debug('Cache hit for Prisma query', 'cache-utils', { key });
    return cached;
  }

  // Выполняем запрос и кэшируем результат
  logger.debug('Cache miss for Prisma query, executing query', 'cache-utils', { key });
  const result = await queryFn();
  cache.set(key, result, ttlMs);
  
  return result;
}

/**
 * Генераторы ключей для кэширования
 */
export const cacheKeys = {
  // Кэш для доступных параметров дверей
  availableDoorParams: (style: string, model: string) => 
    `available_params:doors:${style}:${model}`,
  
  // Кэш для товаров категории
  categoryProducts: (categoryName: string) => 
    `products:category:${categoryName}`,
  
  // Кэш для комплектов фурнитуры
  hardwareKits: () => 
    `products:hardware_kits`,
  
  // Кэш для ручек
  handles: () => 
    `products:handles`,
  
  // Кэш для категорий каталога
  catalogCategories: () => 
    `catalog:categories`,
  
  // Кэш для статистики
  adminStats: () => 
    `stats:admin`,
  
  // Кэш для пользователей
  users: () => 
    `users:all`
};

/**
 * Очистка кэша по паттерну
 */
export function clearCacheByPattern(pattern: string): number {
  let cleared = 0;
  const keys = Array.from(cache['cache'].keys());
  
  for (const key of keys) {
    if (key.includes(pattern)) {
      cache.delete(key);
      cleared++;
    }
  }
  
  logger.info('Cleared cache entries matching pattern', 'cache-utils', { cleared, pattern });
  return cleared;
}

/**
 * Middleware для очистки кэша при изменениях
 */
export function invalidateCacheOnChange(entityType: string): void {
  // Очищаем кэш при изменении товаров
  if (entityType === 'product') {
    clearCacheByPattern('products:');
    clearCacheByPattern('available_params:');
  }
  
  // Очищаем кэш при изменении категорий
  if (entityType === 'category') {
    clearCacheByPattern('catalog:');
    clearCacheByPattern('products:category:');
  }
  
  // Очищаем кэш при изменении пользователей
  if (entityType === 'user') {
    clearCacheByPattern('users:');
  }
}

/**
 * Утилиты для отладки кэша
 */
export function logCacheStats(): void {
  const stats = cache.getStats();
  logger.debug('Cache Statistics', 'cache-utils', {
    size: stats.size,
    keys: stats.keys.slice(0, 10), // Показываем первые 10 ключей
    totalKeys: stats.keys.length
  });
}

export function warmupCache(): void {
  logger.info('Warming up cache', 'cache-utils');
  // Здесь можно добавить предзагрузку часто используемых данных
  logger.info('Cache warmup completed', 'cache-utils');
}
