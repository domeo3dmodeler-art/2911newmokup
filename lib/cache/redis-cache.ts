// lib/cache/redis-cache.ts
// Профессиональная система кэширования с Redis
// Оптимизирована для работы с большими объемами данных товаров

import Redis from 'ioredis';
import { logger } from '../logging/logger';

// Конфигурация Redis
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
};

// Создаем экземпляр Redis
const redis = new Redis(redisConfig);

// Обработка ошибок подключения
redis.on('error', (error: Error) => {
  logger.error('Redis connection error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
});

redis.on('connect', () => {
  logger.info('Redis connected successfully', 'redis-cache');
});

// Типы для кэширования
export enum CacheKey {
  PRODUCTS = 'products',
  CATEGORIES = 'categories',
  CLIENTS = 'clients',
  QUOTES = 'quotes',
  ORDERS = 'orders',
  INVOICES = 'invoices',
  USER_SESSION = 'user_session',
  SEARCH_RESULTS = 'search_results',
  STATISTICS = 'statistics',
}

// Интерфейс для конфигурации кэша
export interface CacheConfig {
  ttl?: number; // Time to live в секундах
  tags?: string[]; // Теги для группового удаления
  compress?: boolean; // Сжатие данных
}

export class RedisCacheService {
  /**
   * Устанавливает значение в кэш
   */
  async set<T>(
    key: string,
    value: T,
    config: CacheConfig = {}
  ): Promise<boolean> {
    try {
      const { ttl = 3600, tags = [], compress = false } = config;
      
      let serializedValue: string;
      
      if (compress && typeof value === 'object') {
        // Простое сжатие для больших объектов
        serializedValue = JSON.stringify(value);
      } else {
        serializedValue = JSON.stringify(value);
      }

      const pipeline = redis.pipeline();
      
      // Основное значение
      pipeline.setex(key, ttl, serializedValue);
      
      // Теги для группового удаления
      if (tags.length > 0) {
        const tagKey = `tags:${key}`;
        pipeline.sadd(tagKey, ...tags);
        pipeline.expire(tagKey, ttl);
      }

      await pipeline.exec();
      
      return true;
    } catch (error) {
      logger.error('Redis set error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key } : { error: String(error), key });
      return false;
    }
  }

  /**
   * Получает значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Redis get error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key } : { error: String(error), key });
      return null;
    }
  }

  /**
   * Удаляет значение из кэша
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await redis.del(key);
      return result > 0;
    } catch (error) {
      logger.error('Redis delete error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key } : { error: String(error), key });
      return false;
    }
  }

  /**
   * Удаляет все ключи по тегу
   */
  async deleteByTag(tag: string): Promise<number> {
    try {
      const pattern = `tags:*`;
      const keys = await redis.keys(pattern);
      
      let deletedCount = 0;
      
      for (const key of keys) {
        const isMember = await redis.sismember(key, tag);
        if (isMember) {
          const mainKey = key.replace('tags:', '');
          await redis.del(mainKey);
          await redis.del(key);
          deletedCount++;
        }
      }
      
      return deletedCount;
    } catch (error) {
      logger.error('Redis deleteByTag error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, tag } : { error: String(error), tag });
      return 0;
    }
  }

  /**
   * Проверяет существование ключа
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key } : { error: String(error), key });
      return false;
    }
  }

  /**
   * Устанавливает время жизни ключа
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Redis expire error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key, ttl } : { error: String(error), key, ttl });
      return false;
    }
  }

  /**
   * Получает время жизни ключа
   */
  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Redis ttl error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key } : { error: String(error), key });
      return -1;
    }
  }

  /**
   * Инкрементирует числовое значение
   */
  async increment(key: string, value: number = 1): Promise<number> {
    try {
      return await redis.incrby(key, value);
    } catch (error) {
      logger.error('Redis increment error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key, value } : { error: String(error), key, value });
      return 0;
    }
  }

  /**
   * Получает или устанавливает значение (get-or-set pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    try {
      // Пытаемся получить из кэша
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      // Если нет в кэше, получаем из фабрики
      const value = await factory();
      
      // Сохраняем в кэш
      await this.set(key, value, config);
      
      return value;
    } catch (error) {
      logger.error('Redis getOrSet error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, key } : { error: String(error), key });
      // В случае ошибки кэша, возвращаем результат фабрики
      return await factory();
    }
  }

  /**
   * Кэширует результат функции с автоматическим обновлением
   */
  async cacheFunction<T>(
    key: string,
    fn: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    return this.getOrSet(key, fn, config);
  }

  /**
   * Очищает весь кэш
   */
  async flushAll(): Promise<boolean> {
    try {
      await redis.flushall();
      return true;
    } catch (error) {
      logger.error('Redis flushAll error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return false;
    }
  }

  /**
   * Получает статистику кэша
   */
  async getStats(): Promise<{
    memory: string;
    keyspace: Record<string, string>;
    connectedClients: number;
  }> {
    try {
      const info = await redis.info();
      const lines = info.split('\r\n');
      
      const stats: {
        memory: string;
        keyspace: Record<string, string>;
        connectedClients: number;
      } = {
        memory: '',
        keyspace: {},
        connectedClients: 0,
      };

      for (const line of lines) {
        if (line.startsWith('used_memory_human:')) {
          stats.memory = line.split(':')[1] || '';
        } else if (line.startsWith('db')) {
          const [db, info] = line.split(':');
          if (db && info) {
            stats.keyspace[db] = info;
          }
        } else if (line.startsWith('connected_clients:')) {
          const clients = line.split(':')[1];
          if (clients) {
            stats.connectedClients = parseInt(clients) || 0;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Redis getStats error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return {
        memory: '0B',
        keyspace: {},
        connectedClients: 0,
      };
    }
  }

  /**
   * Закрывает соединение с Redis
   */
  async disconnect(): Promise<void> {
    try {
      await redis.quit();
    } catch (error) {
      logger.error('Redis disconnect error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    }
  }
}

// Экспортируем экземпляр сервиса
export const cacheService = new RedisCacheService();

// Утилиты для работы с кэшем
export class CacheUtils {
  /**
   * Генерирует ключ кэша для товаров
   */
  static productKey(id: string): string {
    return `${CacheKey.PRODUCTS}:${id}`;
  }

  /**
   * Генерирует ключ кэша для списка товаров
   */
  static productsListKey(filters: Record<string, any>): string {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${CacheKey.PRODUCTS}:list:${filterStr}`;
  }

  /**
   * Генерирует ключ кэша для категорий
   */
  static categoryKey(id: string): string {
    return `${CacheKey.CATEGORIES}:${id}`;
  }

  /**
   * Генерирует ключ кэша для поиска
   */
  static searchKey(query: string, filters: Record<string, any> = {}): string {
    const filterStr = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${CacheKey.SEARCH_RESULTS}:${query}:${filterStr}`;
  }

  /**
   * Генерирует ключ кэша для статистики
   */
  static statisticsKey(type: string, period: string): string {
    return `${CacheKey.STATISTICS}:${type}:${period}`;
  }

  /**
   * Инвалидирует кэш по паттерну
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await redis.del(...keys);
    } catch (error) {
      logger.error('Cache invalidation error', 'redis-cache', error instanceof Error ? { error: error.message, stack: error.stack, pattern } : { error: String(error), pattern });
      return 0;
    }
  }
}
