import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { logger } from '@/lib/logging/logger';

async function getHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    logger.info('Получение статистики', 'admin/stats', { userId: user.userId });
    
    // Получаем реальные данные из БД
    const categories = await prisma.catalogCategory.findMany({
      where: { is_active: true },
      include: {
        products: {
          select: { id: true }
        }
      }
    });

    // Получаем статистику импортов
    const importHistory = await prisma.importHistory.findMany({
      orderBy: { created_at: 'desc' },
      take: 100
    });

    // Группируем импорты по категориям
    const categoryImportStats: { [key: string]: { count: number, lastImport: string | null } } = {};
    
    importHistory.forEach(importItem => {
      const categoryId = importItem.catalog_category_id;
      if (!categoryImportStats[categoryId]) {
        categoryImportStats[categoryId] = { count: 0, lastImport: null };
      }
      categoryImportStats[categoryId].count++;
      if (!categoryImportStats[categoryId].lastImport) {
        categoryImportStats[categoryId].lastImport = importItem.created_at.toISOString();
      }
    });

    // Формируем активные категории
    const activeCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      totalProducts: category.products.length,
      lastImport: categoryImportStats[category.id]?.lastImport || null,
      totalImports: categoryImportStats[category.id]?.count || 0,
      isActive: category.is_active
    }));
    
    // Общая статистика
    const totalStats = {
      totalCategories: activeCategories.length,
      totalProducts: activeCategories.reduce((sum, cat) => sum + cat.totalProducts, 0),
      lastImport: activeCategories.reduce((latest, cat) => {
        if (!cat.lastImport) return latest;
        if (!latest) return cat.lastImport;
        return new Date(cat.lastImport) > new Date(latest) ? cat.lastImport : latest;
      }, null as string | null),
      totalImports: activeCategories.reduce((sum, cat) => sum + cat.totalImports, 0)
    };
    
    const result = {
      categories: activeCategories,
      total: totalStats
    };
    
    logger.info('Статистика получена', 'admin/stats', { 
      totalCategories: totalStats.totalCategories,
      totalProducts: totalStats.totalProducts,
      totalImports: totalStats.totalImports
    });
    
    return apiSuccess(result);
  } catch (error) {
    logger.error('Error fetching stats', 'admin/stats', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка получения статистики', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/stats/GET'
);

async function postHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { imported, filename, category } = await req.json();
    
    // Создаем запись в истории импортов
    if (category) {
      await prisma.importHistory.create({
        data: {
          catalog_category_id: category,
          filename: filename || 'unknown',
          imported_count: imported || 0,
          status: 'completed',
          created_at: new Date()
        }
      });
      
      logger.info('Создана запись истории импорта', 'admin/stats', { userId: user.userId, category, imported });
    }
    
    return apiSuccess({ success: true });
  } catch (error) {
    logger.error('Error updating stats', 'admin/stats', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка обновления статистики', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'admin/stats/POST'
);
