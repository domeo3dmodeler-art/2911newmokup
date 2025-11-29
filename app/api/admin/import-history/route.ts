import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

async function getHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    logger.info('Получение истории импортов', 'admin/import-history', { userId: user.userId, category });
    
    if (!category) {
      throw new ValidationError('Категория не указана');
    }
    
    // Получаем историю импортов из базы данных
    const history = await prisma.importHistory.findMany({
      where: {
        catalog_category_id: category
      },
      select: {
        id: true,
        filename: true,
        imported_count: true,
        status: true,
        created_at: true,
        errors: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    // Форматируем данные для совместимости с фронтендом
    const formattedHistory = history.map(item => ({
      id: item.id,
      filename: item.filename,
      imported_at: item.created_at.toISOString(),
      products_count: item.imported_count,
      status: item.status === 'completed' ? 'completed' : 'failed',
      error_message: item.errors
    }));
    
    logger.info('История импортов получена', 'admin/import-history', { category, count: formattedHistory.length });
    
    return apiSuccess({
      history: formattedHistory,
      category: category
    });
  } catch (error) {
    logger.error('Error fetching import history', 'admin/import-history', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка получения истории импортов', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/import-history/GET'
);

async function postHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { category, filename, imported, status, error_message } = await req.json();
    
    logger.info('Создание записи истории импорта', 'admin/import-history', { userId: user.userId, category, filename, imported });
    
    if (!category || !filename) {
      throw new ValidationError('Категория и имя файла обязательны');
    }
    
    // Создаем запись в истории импортов
    const importRecord = await prisma.importHistory.create({
      data: {
        catalog_category_id: category,
        filename: filename,
        imported_count: imported || 0,
        status: status || 'completed',
        errors: error_message || '[]',
        created_at: new Date()
      }
    });
    
    logger.info('Запись истории импорта создана', 'admin/import-history', { importRecordId: importRecord.id });
    
    return apiSuccess({
      id: importRecord.id,
      message: "Запись истории импорта создана"
    });
  } catch (error) {
    logger.error('Error creating import history', 'admin/import-history', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка создания записи истории импорта', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/import-history/POST'
);