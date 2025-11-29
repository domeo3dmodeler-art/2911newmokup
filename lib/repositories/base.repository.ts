// lib/repositories/base.repository.ts
// Базовый репозиторий с поддержкой пагинации, кэширования и мониторинга
// Оптимизирован для работы с большими объемами данных

import { PrismaClient } from '@prisma/client';
import { 
  PaginationParams, 
  PaginationResult, 
  SearchParams,
  PaginationUtils,
  SortUtils,
  FilterUtils
} from '../types/pagination';
import { cacheService, CacheUtils } from '../cache/redis-cache';
import { logger } from '../monitoring/logger';
import { metrics, BusinessMetrics } from '../monitoring/metrics';

export abstract class BaseRepository<T, CreateInput, UpdateInput> {
  protected prisma: PrismaClient;
  protected tableName: string;
  protected cachePrefix: string;

  constructor(prisma: PrismaClient, tableName: string, cachePrefix: string) {
    this.prisma = prisma;
    this.tableName = tableName;
    this.cachePrefix = cachePrefix;
  }

  /**
   * Создает новую запись
   */
  async create(data: CreateInput): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma[this.tableName].create({
        data,
        include: this.getIncludeOptions(),
      });

      // Инвалидируем кэш
      await this.invalidateCache();

      // Логируем операцию
      logger.database('create', `Created ${this.tableName}`, {
        operation: 'create',
        metadata: { id: (result as any).id },
      });

      // Метрики
      BusinessMetrics.databaseQuery('create', Date.now() - startTime, true);

      return result as T;
    } catch (error) {
      BusinessMetrics.databaseQuery('create', Date.now() - startTime, false);
      logger.error(`Error creating ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Находит запись по ID
   */
  async findById(id: string): Promise<T | null> {
    const cacheKey = CacheUtils.productKey(id);
    
    return cacheService.cacheFunction(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        try {
          const result = await this.prisma[this.tableName].findUnique({
            where: { id },
            include: this.getIncludeOptions(),
          });

          BusinessMetrics.databaseQuery('findById', Date.now() - startTime, true);
          return result as T;
        } catch (error) {
          BusinessMetrics.databaseQuery('findById', Date.now() - startTime, false);
          logger.error(`Error finding ${this.tableName} by ID`, error as Error);
          throw error;
        }
      },
      { ttl: 300, tags: [this.cachePrefix] }
    );
  }

  /**
   * Обновляет запись
   */
  async update(id: string, data: UpdateInput): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma[this.tableName].update({
        where: { id },
        data,
        include: this.getIncludeOptions(),
      });

      // Инвалидируем кэш
      await this.invalidateCache(id);

      logger.database('update', `Updated ${this.tableName}`, {
        operation: 'update',
        metadata: { id },
      });

      BusinessMetrics.databaseQuery('update', Date.now() - startTime, true);
      return result as T;
    } catch (error) {
      BusinessMetrics.databaseQuery('update', Date.now() - startTime, false);
      logger.error(`Error updating ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Удаляет запись
   */
  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.prisma[this.tableName].delete({
        where: { id },
      });

      // Инвалидируем кэш
      await this.invalidateCache(id);

      logger.database('delete', `Deleted ${this.tableName}`, {
        operation: 'delete',
        metadata: { id },
      });

      BusinessMetrics.databaseQuery('delete', Date.now() - startTime, true);
    } catch (error) {
      BusinessMetrics.databaseQuery('delete', Date.now() - startTime, false);
      logger.error(`Error deleting ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Находит записи с пагинацией и фильтрацией
   */
  async findMany(params: SearchParams): Promise<PaginationResult<T>> {
    const { pagination, filters, sort, query } = params;
    
    // Валидируем параметры пагинации
    const validPagination = PaginationUtils.validatePagination(
      pagination || { page: 1, limit: 20 }
    );

    // Создаем ключ кэша
    const cacheKey = this.createCacheKey(params);
    
    return cacheService.cacheFunction(
      cacheKey,
      async () => {
        const startTime = Date.now();
        
        try {
          // Получаем общее количество записей
          const total = await this.getTotalCount(filters, query);
          
          // Получаем данные
          const data = await this.getPaginatedData(
            validPagination,
            filters,
            sort,
            query
          );

          BusinessMetrics.databaseQuery('findMany', Date.now() - startTime, true);
          
          return PaginationUtils.createPaginationResult(
            data as T[],
            total,
            validPagination
          );
        } catch (error) {
          BusinessMetrics.databaseQuery('findMany', Date.now() - startTime, false);
          logger.error(`Error finding ${this.tableName}`, error as Error);
          throw error;
        }
      },
      { ttl: 60, tags: [this.cachePrefix] }
    );
  }

  /**
   * Получает общее количество записей
   */
  protected async getTotalCount(
    filters?: Record<string, any>,
    query?: string
  ): Promise<number> {
    const { whereClause, params } = FilterUtils.createWhereClause(filters || {});
    const { searchClause, params: searchParams } = FilterUtils.createSearchParams(
      query || '',
      this.getSearchFields()
    );

    const allParams = [...params, ...searchParams];
    const whereSQL = whereClause + searchClause;

    const sql = `
      SELECT COUNT(*) as count 
      FROM ${this.tableName} 
      ${whereSQL}
    `;

    const result = await this.prisma.$queryRawUnsafe(sql, ...allParams);
    return parseInt((result as any)[0].count);
  }

  /**
   * Получает данные с пагинацией
   */
  protected async getPaginatedData(
    pagination: PaginationParams,
    filters?: Record<string, any>,
    sort?: any[],
    query?: string
  ): Promise<any[]> {
    const { whereClause, params } = FilterUtils.createWhereClause(filters || {});
    const { searchClause, params: searchParams } = FilterUtils.createSearchParams(
      query || '',
      this.getSearchFields()
    );
    const orderClause = SortUtils.createOrderByClause(sort || []);
    const sqlParams = PaginationUtils.createSqlParams(pagination);

    const allParams = [...params, ...searchParams, sqlParams.limit, sqlParams.offset];

    const sql = `
      SELECT * 
      FROM ${this.tableName} 
      ${whereClause} ${searchClause}
      ${orderClause}
      LIMIT $${allParams.length - 1} OFFSET $${allParams.length}
    `;

    return this.prisma.$queryRawUnsafe(sql, ...allParams);
  }

  /**
   * Создает ключ кэша для параметров поиска
   */
  protected createCacheKey(params: SearchParams): string {
    const { pagination, filters, sort, query } = params;
    
    const keyParts = [
      this.cachePrefix,
      'list',
      pagination?.page || 1,
      pagination?.limit || 20,
    ];

    if (query) {
      keyParts.push('q', query.substring(0, 50));
    }

    if (filters) {
      const filterStr = Object.entries(filters)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      keyParts.push('f', filterStr);
    }

    if (sort && sort.length > 0) {
      const sortStr = sort.map(s => `${s.field}:${s.direction}`).join('|');
      keyParts.push('s', sortStr);
    }

    return keyParts.join(':');
  }

  /**
   * Инвалидирует кэш
   */
  protected async invalidateCache(id?: string): Promise<void> {
    try {
      if (id) {
        await cacheService.delete(CacheUtils.productKey(id));
      }
      
      // Инвалидируем все кэши списков
      await cacheService.deleteByTag(this.cachePrefix);
    } catch (error) {
      logger.warn('Error invalidating cache', { error: error.message });
    }
  }

  /**
   * Абстрактные методы для переопределения в наследниках
   */
  protected abstract getIncludeOptions(): any;
  protected abstract getSearchFields(): string[];

  /**
   * Получает статистику таблицы
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
  }> {
    const cacheKey = `${this.cachePrefix}:stats`;
    
    return cacheService.cacheFunction(
      cacheKey,
      async () => {
        const [total, active, inactive] = await Promise.all([
          this.prisma[this.tableName].count(),
          this.prisma[this.tableName].count({ where: { is_active: true } }),
          this.prisma[this.tableName].count({ where: { is_active: false } }),
        ]);

        return { total, active, inactive };
      },
      { ttl: 300 }
    );
  }

  /**
   * Выполняет массовое обновление
   */
  async bulkUpdate(
    ids: string[],
    data: UpdateInput
  ): Promise<{ count: number }> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma[this.tableName].updateMany({
        where: { id: { in: ids } },
        data,
      });

      // Инвалидируем кэш для всех затронутых записей
      await Promise.all(ids.map(id => this.invalidateCache(id)));

      logger.database('bulkUpdate', `Bulk updated ${result.count} ${this.tableName}`, {
        operation: 'bulkUpdate',
        metadata: { count: result.count },
      });

      BusinessMetrics.databaseQuery('bulkUpdate', Date.now() - startTime, true);
      return result;
    } catch (error) {
      BusinessMetrics.databaseQuery('bulkUpdate', Date.now() - startTime, false);
      logger.error(`Error bulk updating ${this.tableName}`, error as Error);
      throw error;
    }
  }

  /**
   * Выполняет массовое удаление
   */
  async bulkDelete(ids: string[]): Promise<{ count: number }> {
    const startTime = Date.now();
    
    try {
      const result = await this.prisma[this.tableName].deleteMany({
        where: { id: { in: ids } },
      });

      // Инвалидируем кэш для всех затронутых записей
      await Promise.all(ids.map(id => this.invalidateCache(id)));

      logger.database('bulkDelete', `Bulk deleted ${result.count} ${this.tableName}`, {
        operation: 'bulkDelete',
        metadata: { count: result.count },
      });

      BusinessMetrics.databaseQuery('bulkDelete', Date.now() - startTime, true);
      return result;
    } catch (error) {
      BusinessMetrics.databaseQuery('bulkDelete', Date.now() - startTime, false);
      logger.error(`Error bulk deleting ${this.tableName}`, error as Error);
      throw error;
    }
  }
}
