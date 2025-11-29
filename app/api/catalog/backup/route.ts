import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiSuccess, apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';
import * as XLSX from 'xlsx';

// GET /api/catalog/backup - Создать бэкап каталога
async function getHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    logger.info('Создание бэкапа каталога', 'catalog/backup', { userId: user.userId });
    // Получаем все категории каталога
    const categories = await prisma.catalogCategory.findMany({
      orderBy: [
        { level: 'asc' },
        { sortOrder: 'asc' }
      ]
    });

    if (categories.length === 0) {
      throw new ValidationError('Каталог пуст, нет данных для бэкапа');
    }

    // Строим иерархическую структуру для Excel
    const excelData: any[][] = [];
    
    // Заголовки
    const maxLevel = Math.max(...categories.map(cat => cat.level));
    const headers = [];
    for (let i = 1; i <= maxLevel; i++) {
      headers.push(`Уровень ${i}`);
    }
    excelData.push(headers);

    // Группируем категории по уровням
    const categoriesByLevel = new Map<number, any[]>();
    categories.forEach(cat => {
      if (!categoriesByLevel.has(cat.level)) {
        categoriesByLevel.set(cat.level, []);
      }
      categoriesByLevel.get(cat.level)!.push(cat);
    });

    // Строим строки для Excel
    const processedCategories = new Set<string>();
    
    categories.forEach(category => {
      if (processedCategories.has(category.id)) return;
      
      // Строим полный путь категории
      const pathParts = category.path ? category.path.split('/') : [];
      const fullPath = [...pathParts, category.name];
      
      // Создаем строку для Excel
      const row = new Array(maxLevel).fill('');
      fullPath.forEach((part, index) => {
        if (index < maxLevel) {
          row[index] = part;
        }
      });
      
      excelData.push(row);
      processedCategories.add(category.id);
    });

    // Создаем Excel файл
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Каталог');

    // Устанавливаем ширину колонок
    worksheet['!cols'] = [];
    for (let i = 0; i < maxLevel; i++) {
      worksheet['!cols'].push({ width: 30 });
    }

    // Генерируем буфер
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Создаем имя файла с датой
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    const filename = `catalog_backup_${dateStr}_${timeStr}.xlsx`;

    logger.info('Бэкап каталога создан', 'catalog/backup', { filename, categoriesCount: categories.length });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    logger.error('Error creating catalog backup', 'catalog/backup', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при создании бэкапа', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'catalog/backup/GET'
);

// POST /api/catalog/backup - Восстановить каталог из бэкапа
async function postHandler(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    logger.info('Восстановление каталога из бэкапа', 'catalog/backup', { userId: user.userId });
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      throw new ValidationError('Файл не найден');
    }

    // Читаем Excel файл
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертируем в массив массивов
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Пропускаем заголовки
    const rows = data.slice(1).filter(row => row.length > 0);
    
    if (rows.length === 0) {
      throw new ValidationError('Файл не содержит данных');
    }

    // Начинаем транзакцию
    let categoriesCount = 0;
    await prisma.$transaction(async (tx) => {
      // Очищаем существующий каталог
      await tx.catalogCategory.deleteMany({});
      
      // Создаем карту для отслеживания созданных категорий
      const categoryMap = new Map<string, string>(); // fullPath -> id
      
      // Обрабатываем каждую строку
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const row = rows[rowIndex] as any[];
        
        // Фильтруем пустые ячейки
        const filledValues = row.filter(cell => cell && cell.toString().trim() !== '');
        
        if (filledValues.length === 0) continue;
        
        // Создаем все промежуточные категории
        for (let i = 0; i < filledValues.length; i++) {
          const currentPath = filledValues.slice(0, i + 1).join('|');
          const currentName = filledValues[i].toString().trim();
          const currentLevel = i + 1;
          const currentParentPath = i > 0 ? filledValues.slice(0, i).join('|') : '';
          
          // Если категория еще не создана
          if (!categoryMap.has(currentPath)) {
            // Определяем parent_id
            let parentId: string | undefined;
            if (currentParentPath) {
              parentId = categoryMap.get(currentParentPath);
            }
            
            // Создаем категорию
            const category = await tx.catalogCategory.create({
              data: {
                name: currentName,
                level: currentLevel,
                path: currentParentPath ? currentParentPath.split('|').join('/') : '',
                parentId: parentId,
                sortOrder: rowIndex + 1
              }
            });
            
            categoryMap.set(currentPath, category.id);
            categoriesCount++;
          }
        }
      }
    });

    logger.info('Каталог успешно восстановлен из бэкапа', 'catalog/backup', { userId: user.userId, categoriesCount });

    return apiSuccess({
      message: 'Каталог успешно восстановлен из бэкапа'
    });

  } catch (error) {
    logger.error('Error restoring catalog from backup', 'catalog/backup', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Ошибка при восстановлении каталога', 500);
  }
}

export const POST = withErrorHandling(
  requireAuthAndPermission(postHandler, 'ADMIN'),
  'catalog/backup/POST'
);
