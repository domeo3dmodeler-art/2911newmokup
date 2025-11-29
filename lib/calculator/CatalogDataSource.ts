/**
 * 🛍️ ИНТЕГРАЦИЯ КАЛЬКУЛЯТОРА С КАТАЛОГОМ ТОВАРОВ
 * Позволяет использовать данные из каталога в формулах
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  base_price: number;
  stock_quantity: number;
  properties_data: Record<string, any>;
  images?: string[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  products_count: number;
  subcategories: CatalogCategory[];
}

export class CatalogDataSource {
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут

  /**
   * 🔍 Получить товар по ID или SKU
   */
  async getProduct(identifier: string): Promise<CatalogProduct | null> {
    const cacheKey = `product_${identifier}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { id: identifier },
            { sku: identifier }
          ]
        },
        include: {
          images: true
        }
      });

      if (!product) return null;

      const result: CatalogProduct = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        base_price: product.base_price,
        stock_quantity: product.stock_quantity,
        properties_data: this.parseProperties(product.properties_data),
        images: product.images?.map(img => img.url) || []
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Ошибка получения товара', 'lib/calculator/CatalogDataSource', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return null;
    }
  }

  /**
   * 🏷️ Получить цену товара
   */
  async getProductPrice(identifier: string): Promise<number> {
    const product = await this.getProduct(identifier);
    return product?.base_price || 0;
  }

  /**
   * 📊 Получить свойство товара
   */
  async getProductProperty(identifier: string, propertyKey: string): Promise<any> {
    const product = await this.getProduct(identifier);
    
    if (!product) return null;

    // Проверяем основные поля
    if (propertyKey === 'price') return product.base_price;
    if (propertyKey === 'name') return product.name;
    if (propertyKey === 'sku') return product.sku;
    if (propertyKey === 'stock') return product.stock_quantity;

    // Проверяем в properties_data
    return product.properties_data[propertyKey] || null;
  }

  /**
   * 🔍 Найти товары по фильтрам
   */
  async findProducts(filters: {
    categoryId?: string;
    priceMin?: number;
    priceMax?: number;
    properties?: Record<string, any>;
    limit?: number;
    offset?: number;
  }): Promise<CatalogProduct[]> {
    const cacheKey = `products_${JSON.stringify(filters)}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const whereClause: any = {};

      // Фильтр по категории
      if (filters.categoryId) {
        whereClause.catalog_category_id = filters.categoryId;
      }

      // Фильтр по цене
      if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
        whereClause.base_price = {};
        if (filters.priceMin !== undefined) {
          whereClause.base_price.gte = filters.priceMin;
        }
        if (filters.priceMax !== undefined) {
          whereClause.base_price.lte = filters.priceMax;
        }
      }

      const products = await prisma.product.findMany({
        where: whereClause,
        include: {
          images: true
        },
        take: filters.limit || 100,
        skip: filters.offset || 0,
        orderBy: { created_at: 'desc' }
      });

      const results: CatalogProduct[] = products.map(product => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        base_price: product.base_price,
        stock_quantity: product.stock_quantity,
        properties_data: this.parseProperties(product.properties_data),
        images: product.images?.map(img => img.url) || []
      }));

      // Дополнительная фильтрация по свойствам
      let filteredResults = results;
      if (filters.properties) {
        filteredResults = results.filter(product => {
          return Object.entries(filters.properties!).every(([key, value]) => {
            const productValue = product.properties_data[key];
            
            if (Array.isArray(value)) {
              return value.includes(productValue);
            }
            
            if (typeof value === 'object' && value.min !== undefined || value.max !== undefined) {
              const numValue = parseFloat(productValue);
              if (isNaN(numValue)) return false;
              
              if (value.min !== undefined && numValue < value.min) return false;
              if (value.max !== undefined && numValue > value.max) return false;
              
              return true;
            }
            
            return productValue === value;
          });
        });
      }

      this.setCache(cacheKey, filteredResults);
      return filteredResults;

    } catch (error) {
      logger.error('Ошибка поиска товаров', 'lib/calculator/CatalogDataSource', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return [];
    }
  }

  /**
   * 📈 Получить статистику по товарам
   */
  async getProductStats(categoryId?: string): Promise<{
    totalCount: number;
    avgPrice: number;
    minPrice: number;
    maxPrice: number;
    totalValue: number;
  }> {
    const cacheKey = `stats_${categoryId || 'all'}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const whereClause = categoryId ? { catalog_category_id: categoryId } : {};

      const stats = await prisma.product.aggregate({
        where: whereClause,
        _count: { id: true },
        _avg: { base_price: true },
        _min: { base_price: true },
        _max: { base_price: true },
        _sum: { base_price: true }
      });

      const result = {
        totalCount: stats._count.id,
        avgPrice: stats._avg.base_price || 0,
        minPrice: stats._min.base_price || 0,
        maxPrice: stats._max.base_price || 0,
        totalValue: stats._sum.base_price || 0
      };

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Ошибка получения статистики', 'lib/calculator/CatalogDataSource', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return {
        totalCount: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        totalValue: 0
      };
    }
  }

  /**
   * 🏗️ Получить категории каталога
   */
  async getCategories(): Promise<CatalogCategory[]> {
    const cacheKey = 'categories';
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const categories = await prisma.catalogCategory.findMany({
        orderBy: { name: 'asc' }
      });

      // Строим дерево категорий
      const categoryMap = new Map<string, CatalogCategory>();
      const rootCategories: CatalogCategory[] = [];

      // Создаем объекты категорий
      categories.forEach(cat => {
        categoryMap.set(cat.id, {
          id: cat.id,
          name: cat.name,
          products_count: cat.products_count || 0,
          subcategories: []
        });
      });

      // Строим иерархию
      categories.forEach(cat => {
        const categoryObj = categoryMap.get(cat.id)!;
        
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          const parent = categoryMap.get(cat.parent_id)!;
          parent.subcategories.push(categoryObj);
        } else {
          rootCategories.push(categoryObj);
        }
      });

      this.setCache(cacheKey, rootCategories);
      return rootCategories;

    } catch (error) {
      logger.error('Ошибка получения категорий', 'lib/calculator/CatalogDataSource', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return [];
    }
  }

  /**
   * 🔧 Получить доступные свойства товаров в категории
   */
  async getCategoryProperties(categoryId: string): Promise<Array<{
    key: string;
    name: string;
    type: 'string' | 'number' | 'boolean';
    values: any[];
  }>> {
    const cacheKey = `properties_${categoryId}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const products = await prisma.product.findMany({
        where: { catalog_category_id: categoryId },
        select: { properties_data: true },
        take: 1000 // Ограничиваем для производительности
      });

      const propertyMap = new Map<string, {
        key: string;
        name: string;
        type: 'string' | 'number' | 'boolean';
        values: Set<any>;
      }>();

      // Анализируем свойства
      products.forEach(product => {
        const properties = this.parseProperties(product.properties_data);
        
        Object.entries(properties).forEach(([key, value]) => {
          if (!propertyMap.has(key)) {
            propertyMap.set(key, {
              key,
              name: key,
              type: this.detectType(value),
              values: new Set()
            });
          }
          
          const prop = propertyMap.get(key)!;
          if (value !== null && value !== undefined && value !== '') {
            prop.values.add(value);
          }
        });
      });

      // Преобразуем в результат
      const result = Array.from(propertyMap.values()).map(prop => ({
        key: prop.key,
        name: prop.name,
        type: prop.type,
        values: Array.from(prop.values).slice(0, 50) // Ограничиваем количество значений
      }));

      this.setCache(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Ошибка получения свойств категории', 'lib/calculator/CatalogDataSource', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return [];
    }
  }

  /**
   * 🧮 Функции для использования в формулах
   */
  getFormulaFunctions() {
    return {
      // Получить цену товара
      getPrice: async (identifier: string) => {
        return await this.getProductPrice(identifier);
      },

      // Получить свойство товара
      getProperty: async (identifier: string, property: string) => {
        return await this.getProductProperty(identifier, property);
      },

      // Найти товары и получить их цены
      findPrices: async (filters: any) => {
        const products = await this.findProducts(filters);
        return products.map(p => p.base_price);
      },

      // Подсчитать количество товаров
      countProducts: async (filters: any) => {
        const products = await this.findProducts(filters);
        return products.length;
      },

      // Получить среднюю цену
      avgPrice: async (categoryId?: string) => {
        const stats = await this.getProductStats(categoryId);
        return stats.avgPrice;
      },

      // Получить минимальную цену
      minPrice: async (categoryId?: string) => {
        const stats = await this.getProductStats(categoryId);
        return stats.minPrice;
      },

      // Получить максимальную цену
      maxPrice: async (categoryId?: string) => {
        const stats = await this.getProductStats(categoryId);
        return stats.maxPrice;
      }
    };
  }

  /**
   * 🔧 Вспомогательные методы
   */
  private parseProperties(propertiesData: string): Record<string, any> {
    try {
      if (typeof propertiesData === 'string') {
        return JSON.parse(propertiesData);
      }
      return propertiesData || {};
    } catch {
      return {};
    }
  }

  private detectType(value: any): 'string' | 'number' | 'boolean' {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string' && !isNaN(parseFloat(value))) return 'number';
    return 'string';
  }

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, value: any): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_TTL);
  }

  /**
   * 🗑️ Очистить кэш
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Синглтон для использования в приложении
export const catalogDataSource = new CatalogDataSource();
