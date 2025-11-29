import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api/response';
import { logger } from '@/lib/logging/logger';

async function deleteHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    logger.info('Очистка каталога', 'catalog/clear', { userId: user.userId, role: user.role });

    // Очищаем все категории каталога
    const result = await prisma.catalogCategory.deleteMany({});
    
    logger.info('Каталог успешно очищен', 'catalog/clear', { deletedCount: result.count });
    
    return apiSuccess({
      message: `Удалено ${result.count} категорий каталога`,
      deletedCount: result.count
    });
  } catch (error) {
    logger.error('Error clearing catalog', 'catalog/clear', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при очистке каталога', 500);
  }
}

export const DELETE = requireAuthAndPermission(deleteHandler, 'ADMIN');
