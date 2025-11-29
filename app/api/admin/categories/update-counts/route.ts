import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { logger } from '@/lib/logging/logger';

async function postHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    logger.info('Обновление счетчиков товаров', 'admin/categories/update-counts', { userId: user.userId });
    
    // Получаем все категории
    const categories = await prisma.catalogCategory.findMany({
      where: { is_active: true },
      orderBy: [
        { level: 'asc' },
        { sort_order: 'asc' },
        { name: 'asc' }
      ]
    });

    logger.info(`Найдено ${categories.length} категорий для обновления счетчиков`, 'admin/categories/update-counts');

    // Подсчитываем товары для каждой категории
    const updatedCounts = await Promise.all(
      categories.map(async (category) => {
        const productsCount = await prisma.product.count({
          where: {
            catalog_category_id: category.id
          }
        });

        // Обновляем счетчик в базе данных
        await prisma.catalogCategory.update({
          where: { id: category.id },
          data: { products_count: productsCount }
        });

        return {
          id: category.id,
          name: category.name,
          products_count: productsCount
        };
      })
    );

    logger.info('Счетчики обновлены', 'admin/categories/update-counts', { updatedCount: updatedCounts.length });

    return apiSuccess({
      message: `Обновлено ${updatedCounts.length} счетчиков`,
      counts: updatedCounts
    });

  } catch (error) {
    logger.error('Error updating product counts', 'admin/categories/update-counts', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Failed to update product counts', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/categories/update-counts/POST'
);