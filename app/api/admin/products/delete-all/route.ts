import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

async function deleteHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      throw new ValidationError('ID категории обязателен');
    }

    logger.info('Удаление всех товаров категории', 'admin/products/delete-all', { userId: user.userId, categoryId });

    // Подсчитываем количество товаров до удаления
    const countBefore = await prisma.product.count({
      where: { catalog_category_id: categoryId }
    });

    logger.info(`Найдено товаров для удаления: ${countBefore}`, 'admin/products/delete-all', { categoryId, countBefore });

    if (countBefore === 0) {
      logger.info('В категории нет товаров для удаления', 'admin/products/delete-all', { categoryId });
      return apiSuccess({
        deleted: 0,
        message: 'В категории нет товаров для удаления'
      });
    }

    // Удаляем все товары категории
    const deleteResult = await prisma.product.deleteMany({
      where: { catalog_category_id: categoryId }
    });

    logger.info(`Удалено товаров: ${deleteResult.count}`, 'admin/products/delete-all', { categoryId, deletedCount: deleteResult.count });

    // Обновляем счетчик товаров в категории
    await prisma.catalogCategory.update({
      where: { id: categoryId },
      data: { products_count: 0 }
    });

    logger.info(`Обновлен счетчик товаров для категории ${categoryId}: 0`, 'admin/products/delete-all', { categoryId });

    // Обновляем счетчики всех родительских категорий
    try {
      const category = await prisma.catalogCategory.findUnique({
        where: { id: categoryId }
      });

      if (category && category.parent_id) {
        // Рекурсивно обновляем счетчики родительских категорий
        const updateParentCounts = async (parentId: string) => {
          const parentCategory = await prisma.catalogCategory.findUnique({
            where: { id: parentId },
            include: {
              subcategories: true
            }
          });

          if (parentCategory) {
            // Подсчитываем общее количество товаров в подкатегориях
            let totalProducts = 0;
            for (const subcategory of parentCategory.subcategories) {
              const subcategoryProducts = await prisma.product.count({
                where: { catalog_category_id: subcategory.id }
              });
              totalProducts += subcategoryProducts;
            }

            // Обновляем счетчик родительской категории
            await prisma.catalogCategory.update({
              where: { id: parentId },
              data: { products_count: totalProducts }
            });

            logger.debug(`Обновлен счетчик родительской категории ${parentId}: ${totalProducts}`, 'admin/products/delete-all', { parentId, totalProducts });

            // Если есть еще родитель, продолжаем рекурсивно
            if (parentCategory.parent_id) {
              await updateParentCounts(parentCategory.parent_id);
            }
          }
        };

        await updateParentCounts(category.parent_id);
      }
    } catch (updateError) {
      logger.error('Ошибка при обновлении счетчиков родительских категорий', 'admin/products/delete-all', updateError instanceof Error ? { error: updateError.message, stack: updateError.stack } : { error: String(updateError) });
    }

    logger.info('Товары успешно удалены', 'admin/products/delete-all', { categoryId, deletedCount: deleteResult.count });

    return apiSuccess({
      deleted: deleteResult.count,
      message: `Успешно удалено ${deleteResult.count} товаров`
    });

  } catch (error) {
    logger.error('Ошибка при удалении товаров', 'admin/products/delete-all', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при удалении товаров', 500);
  }
}

export const DELETE = withErrorHandling(
  requireAuthAndPermission(deleteHandler, 'ADMIN'),
  'admin/products/delete-all/DELETE'
);
