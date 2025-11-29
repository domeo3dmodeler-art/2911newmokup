/**
 * Утилиты для оптимизации запросов к базе данных
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

/**
 * Оптимизированный запрос для получения товаров с пагинацией
 */
export async function getProductsOptimized(params: {
  categoryId?: string;
  categoryName?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  search?: string;
}) {
  const {
    categoryId,
    categoryName,
    isActive = true,
    limit = 50,
    offset = 0,
    search
  } = params;

  // Строим условие WHERE
  const where: any = {};
  
  if (isActive !== undefined) {
    where.is_active = isActive;
  }
  
  if (categoryId) {
    where.catalog_category_id = categoryId;
  }
  
  if (categoryName) {
    where.catalog_category = {
      name: categoryName
    };
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { model: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Выполняем запрос с оптимизацией
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        model: true,
        series: true,
        base_price: true,
        properties_data: true,
        catalog_category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: [
        { created_at: 'desc' }
      ]
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Оптимизированный запрос для получения товаров по свойствам
 */
export async function getProductsByProperties(params: {
  categoryName: string;
  properties: Record<string, any>;
  limit?: number;
}) {
  const { categoryName, properties, limit = 100 } = params;

  // Получаем товары из категории
  const products = await prisma.product.findMany({
    where: {
      is_active: true,
      catalog_category: {
        name: categoryName
      }
    },
    select: {
      id: true,
      sku: true,
      name: true,
      properties_data: true
    },
    take: limit
  });

  // Фильтруем по свойствам на клиенте (пока нет индексов по JSON)
  const filteredProducts = products.filter(product => {
    try {
      const productProperties = product.properties_data ? 
        (typeof product.properties_data === 'string' ? 
          JSON.parse(product.properties_data) : 
          product.properties_data) : {};

      // Проверяем соответствие всех свойств
      return Object.entries(properties).every(([key, value]) => {
        if (value === undefined || value === null) return true;
        return productProperties[key] === value;
      });
    } catch (error) {
      logger.error('Error parsing product properties', 'lib/utils/database-optimization', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return false;
    }
  });

  return filteredProducts;
}

/**
 * Оптимизированный запрос для получения категорий с товарами
 */
export async function getCategoriesWithProducts(params: {
  isActive?: boolean;
  includeProductCount?: boolean;
  limit?: number;
}) {
  const {
    isActive = true,
    includeProductCount = true,
    limit = 100
  } = params;

  const where: any = {};
  if (isActive !== undefined) {
    where.is_active = isActive;
  }

  const include: any = {};
  if (includeProductCount) {
    include._count = {
      select: {
        products: {
          where: { is_active: true }
        }
      }
    };
  }

  return prisma.catalogCategory.findMany({
    where,
    include,
    take: limit,
    orderBy: [
      { level: 'asc' },
      { sort_order: 'asc' },
      { name: 'asc' }
    ]
  });
}

/**
 * Оптимизированный запрос для получения статистики
 */
export async function getOptimizedStats() {
  const [
    totalProducts,
    activeProducts,
    totalCategories,
    activeCategories,
    totalUsers,
    totalClients,
    recentOrders,
    recentQuotes
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { is_active: true } }),
    prisma.catalogCategory.count(),
    prisma.catalogCategory.count({ where: { is_active: true } }),
    prisma.user.count(),
    prisma.client.count(),
    prisma.order.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 дней
        }
      }
    }),
    prisma.quote.count({
      where: {
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 дней
        }
      }
    })
  ]);

  return {
    products: {
      total: totalProducts,
      active: activeProducts,
      inactive: totalProducts - activeProducts
    },
    categories: {
      total: totalCategories,
      active: activeCategories,
      inactive: totalCategories - activeCategories
    },
    users: {
      total: totalUsers
    },
    clients: {
      total: totalClients
    },
    recent: {
      orders: recentOrders,
      quotes: recentQuotes
    }
  };
}

/**
 * Оптимизированный запрос для поиска товаров
 */
export async function searchProductsOptimized(params: {
  query: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}) {
  const { query, categoryId, limit = 20, offset = 0 } = params;

  const where: any = {
    is_active: true,
    OR: [
      { name: { contains: query, mode: 'insensitive' } },
      { sku: { contains: query, mode: 'insensitive' } },
      { model: { contains: query, mode: 'insensitive' } },
      { series: { contains: query, mode: 'insensitive' } }
    ]
  };

  if (categoryId) {
    where.catalog_category_id = categoryId;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        sku: true,
        name: true,
        model: true,
        series: true,
        base_price: true,
        catalog_category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: [
        { name: 'asc' }
      ]
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Оптимизированный запрос для получения изображений товаров
 */
export async function getProductImagesOptimized(productIds: string[]) {
  if (productIds.length === 0) return [];

  return prisma.productImage.findMany({
    where: {
      product_id: {
        in: productIds
      },
      is_primary: true
    },
    select: {
      id: true,
      product_id: true,
      url: true,
      alt_text: true
    }
  });
}

/**
 * Оптимизированный запрос для получения клиентов с пагинацией
 */
export async function getClientsOptimized(params: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const { search, limit = 50, offset = 0 } = params;

  const where: any = {};
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        created_at: true,
        _count: {
          select: {
            orders: true,
            quotes: true
          }
        }
      },
      take: limit,
      skip: offset,
      orderBy: [
        { created_at: 'desc' }
      ]
    }),
    prisma.client.count({ where })
  ]);

  return {
    clients,
    total,
    hasMore: offset + limit < total
  };
}

/**
 * Утилита для проверки производительности запроса
 */
export async function measureQueryPerformance<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.info(`Query "${queryName}" completed`, 'lib/utils/database-optimization', { queryName, duration });
    
    if (duration > 1000) {
      logger.warn(`Slow query detected: "${queryName}"`, 'lib/utils/database-optimization', { queryName, duration });
    }
    
    return result;
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logger.error(`Query "${queryName}" failed`, 'lib/utils/database-optimization', { queryName, duration, error: error instanceof Error ? error.message : String(error) });
    throw error;
  }
}

/**
 * Утилита для батчевой обработки запросов
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processFn: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processFn(batch);
    results.push(...batchResults);
    
    logger.info(`Processed batch`, 'lib/utils/database-optimization', { 
      batchNumber: Math.floor(i / batchSize) + 1, 
      totalBatches: Math.ceil(items.length / batchSize) 
    });
  }
  
  return results;
}

/**
 * Утилита для оптимизации соединений
 */
export async function optimizeConnections() {
  // Проверяем количество активных соединений
  const connectionCount = await prisma.$queryRaw`
    SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active';
  `;
  
  const count = (connectionCount as any)[0]?.count || 0;
  logger.info('Active connections', 'lib/utils/database-optimization', { count });
  
  // Рекомендации по оптимизации
  if (count > 50) {
    logger.warn('High number of active connections detected', 'lib/utils/database-optimization', { count });
  }
}

// Экспорт prisma не нужен, используется глобальный экземпляр
