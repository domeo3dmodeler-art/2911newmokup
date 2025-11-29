// lib/repositories/cache.ts
// Простой in-memory кеш для репозиториев

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 300; // 5 минут по умолчанию

  /**
   * Получает значение из кеша
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Проверяем срок действия
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Сохраняет значение в кеш
   */
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { data: value, expiresAt });
  }

  /**
   * Удаляет значение из кеша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очищает весь кеш
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Удаляет все ключи, начинающиеся с префикса
   */
  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Получает размер кеша
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Очищает просроченные записи
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Singleton instance
export const simpleCache = new SimpleCache();

// Периодическая очистка просроченных записей (каждые 5 минут)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    simpleCache.cleanup();
  }, 5 * 60 * 1000);
}

