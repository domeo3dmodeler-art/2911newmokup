// lib/repositories/product.repository.ts
// Репозиторий для работы с товарами
// Оптимизирован для больших объемов данных с поддержкой поиска и фильтрации

import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './base.repository';
import { SearchParams } from '../types/pagination';
import { logger } from '../monitoring/logger';
import { BusinessMetrics } from '../monitoring/metrics';

export interface ProductWithImages extends Product {
  images: ProductImage[];
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CreateProductInput {
  category_id: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  series?: string;
  base_price: number;
  currency?: string;
  stock_quantity?: number;
  min_order_qty?: number;
  weight?: number;
  dimensions?: Record<string, unknown>;
  specifications?: Record<string, unknown>;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export interface UpdateProductInput {
  category_id?: string;
  sku?: string;
  name?: string;
  description?: string;
  brand?: string;
  model?: string;
  series?: string;
  base_price?: number;
  currency?: string;
  stock_quantity?: number;
  min_order_qty?: number;
  weight?: number;
  dimensions?: Record<string, unknown>;
  specifications?: Record<string, unknown>;
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export class ProductRepository extends BaseRepository<
  ProductWithImages,
  CreateProductInput,
  UpdateProductInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'product', 'products');
  }

  protected getIncludeOptions() {
    return {
      images: {
        orderBy: { sort_order: 'asc' },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    };
  }

  protected getSearchFields(): string[] {
    return ['name', 'description', 'brand', 'model', 'series', 'sku'];
  }

  /**
   * Находит товар по SKU
   */
  async findBySku(sku: string): Promise<ProductWithImages | null> {
    const cacheKey = `products:sku:${sku}`;
    
    return cacheService.cacheFunction(
      cacheKey,
      async () => {
        const product = await this.prisma.product.findUnique({
          where: { sku },
          include: this.getIncludeOptions(),
        });

        return product as ProductWithImages;
      },
      { ttl: 300, tags: ['products'] }
    );
  }

  /**
   * Находит товары по категории
   */
  async findByCategory(
    categoryId: string,
    params: SearchParams = {}
  ): Promise<PaginationResult<ProductWithImages>> {
    const searchParams = {
      ...params,
      filters: {
        ...params.filters,
        category_id: categoryId,
      },
    };

    return this.findMany(searchParams);
  }

  /**
   * Находит товары по бренду
   */
  async findByBrand(
    brand: string,
    params: SearchParams = {}
  ): Promise<PaginationResult<ProductWithImages>> {
    const searchParams = {
      ...params,
      filters: {
        ...params.filters,
        brand: brand,
      },
    };

    return this.findMany(searchParams);
  }

  /**
   * Находит товары по тегам
   */
  async findByTags(
    tags: string[],
    params: SearchParams = {}
  ): Promise<PaginationResult<ProductWithImages>> {
    const searchParams = {
      ...params,
      filters: {
        ...params.filters,
        tags: tags,
      },
    };

    return this.findMany(searchParams);
  }

  /**
   * Находит товары в ценовом диапазоне
   */
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    params: SearchParams = {}
  ): Promise<PaginationResult<ProductWithImages>> {
    const searchParams = {
      ...params,
      filters: {
        ...params.filters,
        base_price: {
          operator: 'between',
          value: [minPrice, maxPrice],
        },
      },
    };

    return this.findMany(searchParams);
  }

  /**
   * Находит товары на складе
   */
  async findInStock(params: SearchParams = {}): Promise<PaginationResult<ProductWithImages>> {
    const searchParams = {
      ...params,
      filters: {
        ...params.filters,
        stock_quantity: {
          operator: 'gt',
          value: 0,
        },
      },
    };

    return this.findMany(searchParams);
  }

  /**
   * Находит рекомендуемые товары
   */
  async findFeatured(params: SearchParams = {}): Promise<PaginationResult<ProductWithImages>> {
    const searchParams = {
      ...params,
      filters: {
        ...params.filters,
        is_featured: true,
        is_active: true,
      },
    };

    return this.findMany(searchParams);
  }

  /**
   * Получает похожие товары
   */
  async findSimilar(
    productId: string,
    limit: number = 10
  ): Promise<ProductWithImages[]> {
    const cacheKey = `products:similar:${productId}`;
    
    return cacheService.cacheFunction(
      cacheKey,
      async () => {
        // Получаем товар для анализа
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
          include: { category: true },
        });

        if (!product) {
          return [];
        }

        // Находим похожие товары по категории и тегам
        const similarProducts = await this.prisma.product.findMany({
          where: {
            AND: [
              { id: { not: productId } },
              { category_id: product.category_id },
              { is_active: true },
              ...(product.tags.length > 0 ? [
                { tags: { hasSome: product.tags } }
              ] : []),
            ],
          },
          include: this.getIncludeOptions(),
          take: limit,
          orderBy: [
            { is_featured: 'desc' },
            { created_at: 'desc' },
          ],
        });

        return similarProducts as ProductWithImages[];
      },
      { ttl: 600, tags: ['products'] }
    );
  }

  /**
   * Обновляет количество на складе
   */
  async updateStock(productId: string, quantity: number): Promise<ProductWithImages> {
    const startTime = Date.now();
    
    try {
      const product = await this.prisma.product.update({
        where: { id: productId },
        data: { stock_quantity: quantity },
        include: this.getIncludeOptions(),
      });

      // Инвалидируем кэш
      await this.invalidateCache(productId);

      logger.business('updateStock', `Updated stock for product ${productId}`, {
        metadata: { productId, quantity },
      });

      BusinessMetrics.databaseQuery('updateStock', Date.now() - startTime, true);
      return product as ProductWithImages;
    } catch (error) {
      BusinessMetrics.databaseQuery('updateStock', Date.now() - startTime, false);
      logger.error('Error updating product stock', error as Error);
      throw error;
    }
  }

  /**
   * Получает статистику товаров
   */
  async getProductStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    inStock: number;
    outOfStock: number;
    featured: number;
    byCategory: Array<{ category: string; count: number }>;
    byBrand: Array<{ brand: string; count: number }>;
  }> {
    const cacheKey = 'products:stats';
    
    return cacheService.cacheFunction(
      cacheKey,
      async () => {
        const [
          total,
          active,
          inactive,
          inStock,
          outOfStock,
          featured,
          byCategory,
          byBrand,
        ] = await Promise.all([
          this.prisma.product.count(),
          this.prisma.product.count({ where: { is_active: true } }),
          this.prisma.product.count({ where: { is_active: false } }),
          this.prisma.product.count({ where: { stock_quantity: { gt: 0 } } }),
          this.prisma.product.count({ where: { stock_quantity: 0 } }),
          this.prisma.product.count({ where: { is_featured: true } }),
          
          // Статистика по категориям
          this.prisma.product.groupBy({
            by: ['category_id'],
            _count: { id: true },
          }),
          
          // Статистика по брендам
          this.prisma.product.groupBy({
            by: ['brand'],
            where: { brand: { not: null } },
            _count: { id: true },
          }),
        ]);

        return {
          total,
          active,
          inactive,
          inStock,
          outOfStock,
          featured,
          byCategory: byCategory.map((item: { category_id: string; _count: { id: number } }) => ({
            category: item.category_id,
            count: item._count.id,
          })),
          byBrand: byBrand.map((item: { brand: string | null; _count: { id: number } }) => ({
            brand: item.brand || 'Unknown',
            count: item._count.id,
          })),
        };
      },
      { ttl: 300 }
    );
  }

  /**
   * Выполняет полнотекстовый поиск
   */
  async search(
    query: string,
    params: SearchParams = {}
  ): Promise<PaginationResult<ProductWithImages>> {
    const startTime = Date.now();
    
    try {
      // Логируем поиск
      BusinessMetrics.productSearched(query, 0);
      
      const searchParams = {
        ...params,
        query,
      };

      const result = await this.findMany(searchParams);
      
      // Обновляем метрики с количеством результатов
      BusinessMetrics.productSearched(query, result.pagination.total);
      
      logger.business('search', `Product search: "${query}"`, {
        metadata: { query, resultCount: result.pagination.total },
      });

      return result;
    } catch (error) {
      logger.error('Error searching products', error as Error);
      throw error;
    }
  }

  /**
   * Получает товары с изображениями
   */
  async findWithImages(params: SearchParams = {}): Promise<PaginationResult<ProductWithImages>> {
    return this.findMany(params);
  }

  /**
   * Добавляет изображение к товару
   */
  async addImage(
    productId: string,
    imageData: {
      filename: string;
      original_name: string;
      url: string;
      alt_text?: string;
      width?: number;
      height?: number;
      file_size?: number;
      mime_type: string;
      is_primary?: boolean;
      sort_order?: number;
    }
  ): Promise<ProductImage> {
    const startTime = Date.now();
    
    try {
      const image = await this.prisma.productImage.create({
        data: {
          product_id: productId,
          ...imageData,
        },
      });

      // Инвалидируем кэш товара
      await this.invalidateCache(productId);

      logger.storage('addImage', `Added image to product ${productId}`, {
        metadata: { productId, imageId: image.id },
      });

      BusinessMetrics.databaseQuery('addImage', Date.now() - startTime, true);
      return image;
    } catch (error) {
      BusinessMetrics.databaseQuery('addImage', Date.now() - startTime, false);
      logger.error('Error adding image to product', error as Error);
      throw error;
    }
  }

  /**
   * Удаляет изображение товара
   */
  async removeImage(imageId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      const image = await this.prisma.productImage.findUnique({
        where: { id: imageId },
        select: { product_id: true },
      });

      if (!image) {
        throw new Error('Image not found');
      }

      await this.prisma.productImage.delete({
        where: { id: imageId },
      });

      // Инвалидируем кэш товара
      await this.invalidateCache(image.product_id);

      logger.storage('removeImage', `Removed image ${imageId}`, {
        metadata: { imageId, productId: image.product_id },
      });

      BusinessMetrics.databaseQuery('removeImage', Date.now() - startTime, true);
    } catch (error) {
      BusinessMetrics.databaseQuery('removeImage', Date.now() - startTime, false);
      logger.error('Error removing product image', error as Error);
      throw error;
    }
  }
}

// Экспортируем экземпляр репозитория
import { prisma } from '@/lib/prisma';
export const productRepository = new ProductRepository(prisma);
