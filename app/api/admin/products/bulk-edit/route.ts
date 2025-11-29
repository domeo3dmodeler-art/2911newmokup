import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError, NotFoundError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

interface BulkUpdateRequest {
  updates: Array<{
    id: string;
    updates: {
      name?: string;
      base_price?: number;
      stock_quantity?: number;
      brand?: string;
      model?: string;
    };
  }>;
}

async function postHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body: BulkUpdateRequest = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError('Не предоставлены данные для обновления');
    }

    logger.info('Массовое обновление товаров', 'admin/products/bulk-edit', { userId: user.userId, updatesCount: updates.length });

    const results = [];
    const errors = [];

    // Обрабатываем обновления по одному для лучшего контроля ошибок
    for (const update of updates) {
      try {
        const { id, updates: productUpdates } = update;

        // Проверяем существование товара
        const existingProduct = await prisma.product.findUnique({
          where: { id },
          select: { id: true, sku: true, name: true }
        });

        if (!existingProduct) {
          errors.push(`Товар с ID ${id} не найден`);
          continue;
        }

        // Обновляем товар
        const updatedProduct = await prisma.product.update({
          where: { id },
          data: productUpdates,
          select: {
            id: true,
            sku: true,
            name: true,
            base_price: true,
            stock_quantity: true,
            brand: true,
            model: true
          }
        });

        results.push({
          id: updatedProduct.id,
          sku: updatedProduct.sku,
          name: updatedProduct.name,
          updated: true
        });

        logger.debug('Товар обновлен', 'admin/products/bulk-edit', { productId: updatedProduct.id, sku: updatedProduct.sku });

      } catch (error) {
        logger.error(`Ошибка обновления товара ${update.id}`, 'admin/products/bulk-edit', error instanceof Error ? { error: error.message } : { error: String(error) });
        errors.push(`Товар ${update.id}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      }
    }

    logger.info('Массовое обновление завершено', 'admin/products/bulk-edit', { 
      userId: user.userId,
      updated: results.length, 
      errors: errors.length 
    });

    return apiSuccess({
      updated: results.length,
      errors: errors.length,
      results,
      errorDetails: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    logger.error('Error in bulk edit', 'admin/products/bulk-edit', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка массового обновления товаров', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/products/bulk-edit/POST'
);

// GET endpoint для получения информации о товарах для массового редактирования
async function getHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    
    if (!categoryId) {
      throw new ValidationError('categoryId обязателен');
    }

    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    if (isNaN(limit) || limit < 1 || limit > 1000) {
      throw new ValidationError('limit должен быть числом от 1 до 1000');
    }

    if (isNaN(offset) || offset < 0) {
      throw new ValidationError('offset должен быть неотрицательным числом');
    }

    logger.info('Получение товаров для массового редактирования', 'admin/products/bulk-edit', { userId: user.userId, categoryId, limit, offset });


    const products = await prisma.product.findMany({
      where: { catalog_category_id: categoryId },
      select: {
        id: true,
        sku: true,
        name: true,
        base_price: true,
        stock_quantity: true,
        brand: true,
        model: true
      },
      take: limit,
      skip: offset,
      orderBy: { sku: 'asc' }
    });

    const total = await prisma.product.count({
      where: { catalog_category_id: categoryId }
    });

    logger.info('Товары для массового редактирования получены', 'admin/products/bulk-edit', { categoryId, productsCount: products.length, total });

    return apiSuccess({
      products,
      total,
      limit,
      offset
    });

  } catch (error) {
    logger.error('Error in bulk edit GET', 'admin/products/bulk-edit', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка получения товаров для массового редактирования', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/products/bulk-edit/GET'
);
