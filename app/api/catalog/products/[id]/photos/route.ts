import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { getLoggingContextFromRequest } from '@/lib/auth/logging-context';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { NotFoundError, ValidationError } from '@/lib/api/errors';
import { requireAuth } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  return withErrorHandling(
    requireAuth(async (req, user) => {
      const loggingContext = getLoggingContextFromRequest(req);
      const { id } = await params;

      // Получаем товар
      const product = await prisma.product.findUnique({
        where: { id },
        select: {
          id: true,
          sku: true,
          properties_data: true
        }
      });

      if (!product) {
        throw new NotFoundError('Товар', id);
      }

      // Парсим свойства
      const properties = typeof product.properties_data === 'string' 
        ? JSON.parse(product.properties_data) 
        : product.properties_data;

      // Проверяем наличие фотографий
      if (!properties.photos || !Array.isArray(properties.photos) || properties.photos.length === 0) {
        throw new ValidationError('У товара нет фотографий');
      }

      // Удаляем массив фотографий
      delete properties.photos;

      // Обновляем товар
      await prisma.product.update({
        where: { id },
        data: {
          properties_data: JSON.stringify(properties)
        }
      });

      return apiSuccess({ message: `Фотографии товара ${product.sku} успешно удалены` }, 'Фотографии удалены');
    }),
    'catalog/products/[id]/photos/DELETE'
  )(request);
}
