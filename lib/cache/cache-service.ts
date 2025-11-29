// lib/cache/cache-service.ts
// Сервис кэширования для оптимизации производительности

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 1000; // Максимальное количество элементов в кэше
  private defaultTTL = 5 * 60 * 1000; // 5 минут по умолчанию

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // Сохранение данных в кэш
  set<T>(key: string, data: T, ttl?: number): void {
    // Удаляем старые элементы если кэш переполнен
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, item);
  }

  // Получение данных из кэша
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Проверяем, не истек ли срок действия
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  // Получение или установка данных (паттерн cache-aside)
  async getOrSet<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    // Пытаемся получить из кэша
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Если нет в кэше, загружаем и сохраняем
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }

  // Удаление из кэша
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Очистка всего кэша
  clear(): void {
    this.cache.clear();
  }

  // Очистка устаревших элементов
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    // Если все еще переполнен, удаляем самые старые элементы
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize * 0.1)); // Удаляем 10% самых старых
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Получение статистики кэша
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    keys: string[];
  } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Подсчет hit rate будет добавлен позже
      keys: Array.from(this.cache.keys())
    };
  }

  // Предустановленные ключи кэша
  static getCacheKeys() {
    return {
      CATEGORIES: 'categories',
      PRODUCTS: (categoryId?: string) => `products_${categoryId || 'all'}`,
      USER_PROFILE: (userId: string) => `user_${userId}`,
      ANALYTICS: (type: string) => `analytics_${type}`,
      TEMPLATES: 'templates'
    };
  }
}



