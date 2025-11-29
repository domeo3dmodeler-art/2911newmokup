import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { logger } from '@/lib/logging/logger';

interface ImportedProduct {
  id: string;
  category: string;
  imported_at: string;
  [key: string]: unknown;
}

// Простое хранилище в памяти для демонстрации
// В реальном приложении это будет база данных
let importedProducts: ImportedProduct[] = [];

async function getHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    logger.info('Получение товаров', 'admin/products', { userId: user.userId, category, limit, offset });

    // Получаем товары из базы данных
    let whereClause: Record<string, unknown> = {};
    if (category && category !== 'all') {
      whereClause = { catalog_category_id: category };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: whereClause,
        skip: offset,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.product.count({
        where: whereClause
      })
    ]);

    // Преобразуем товары в формат для фронтенда
    const formattedProducts = products.map(product => ({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      brand: product.brand,
      model: product.model,
      base_price: product.base_price,
      stock_quantity: product.stock_quantity,
      specifications: JSON.parse(product.specifications || '{}'),
      is_active: product.is_active,
      created_at: product.created_at,
      category: product.catalog_category_id
    }));

    logger.info('Товары получены', 'admin/products', { productsCount: products.length, total });

    return apiSuccess({
      products: formattedProducts,
      total: total,
      category: category || 'all',
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    logger.error('Error fetching products', 'admin/products', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка получения товаров', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/products/GET'
);

async function postHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { products, category } = await req.json();
    
    logger.info('Сохранение товаров в базу данных', 'admin/products', { userId: user.userId, productsCount: products?.length, category });
    
    if (!products || products.length === 0) {
      logger.info('Нет товаров для сохранения', 'admin/products', { userId: user.userId });
      return apiSuccess({ 
        imported: 0,
        message: 'Нет товаров для сохранения'
      });
    }
    
    // Сохраняем товары в базу данных
    const savedProducts = [];
    
    for (const product of products) {
      try {
        // Создаем товар в базе данных
        const savedProduct = await prisma.product.create({
          data: {
            catalog_category_id: category,
            sku: product.sku || `SKU_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: product.name || 'Без названия',
            base_price: parseFloat(product.price || product.base_price || 0),
            stock_quantity: parseInt(product.stock || product.stock_quantity || 0),
            brand: product.brand || '',
            model: product.model || '',
            description: product.description || '',
            specifications: JSON.stringify(product.specifications || {}),
            is_active: true
          }
        });
        
        savedProducts.push(savedProduct);
        logger.debug('Товар сохранен', 'admin/products', { productId: savedProduct.id, productName: savedProduct.name });
        
      } catch (productError) {
        logger.error('Error saving product', 'admin/products', {
          product: product,
          error: productError instanceof Error ? productError.message : String(productError),
          errorCode: productError && typeof productError === 'object' && 'code' in productError ? String(productError.code) : undefined
        });
        // Продолжаем с остальными товарами
      }
    }
    
    // Также добавляем в память для совместимости
    interface ProductInput {
      sku?: string;
      name?: string;
      price?: string | number;
      base_price?: string | number;
      stock?: string | number;
      stock_quantity?: string | number;
      brand?: string;
      model?: string;
      description?: string;
      specifications?: Record<string, unknown>;
      [key: string]: unknown;
    }
    const productsWithIds = products.map((product: ProductInput, index: number) => ({
      ...product,
      id: `product_${Date.now()}_${index}`,
      category: category || 'unknown',
      imported_at: new Date().toISOString()
    }));
    
    importedProducts.push(...productsWithIds);
    
    logger.info('Товары успешно сохранены', 'admin/products', { 
      userId: user.userId,
      savedToDatabase: savedProducts.length,
      totalInMemory: importedProducts.length
    });
    
    return apiSuccess({ 
      imported: savedProducts.length,
      total: importedProducts.length,
      database_saved: savedProducts.length,
      message: `Успешно сохранено ${savedProducts.length} товаров в базу данных`
    });
    
  } catch (error) {
    logger.error('Error importing products', 'admin/products', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка импорта товаров', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/products/POST'
);
