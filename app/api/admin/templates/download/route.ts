import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuthAndPermission } from '@/lib/auth/middleware';
import { getAuthenticatedUser } from '@/lib/auth/request-helpers';
import { apiError, ApiErrorCode, withErrorHandling } from '@/lib/api/response';
import { ValidationError, NotFoundError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';
import * as XLSX from 'xlsx';
import { fixFieldsEncoding } from '@/lib/encoding-utils';

async function getHandler(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const catalogCategoryId = searchParams.get('catalogCategoryId');

    if (!catalogCategoryId) {
      throw new ValidationError('catalogCategoryId is required');
    }

    logger.info('Скачивание шаблона импорта', 'admin/templates/download', { userId: user.userId, catalogCategoryId });

    // Получаем шаблон для категории
    const template = await prisma.importTemplate.findUnique({
      where: { catalog_category_id: catalogCategoryId },
      include: {
        catalog_category: {
          select: { name: true }
        }
      }
    });

    if (!template) {
      throw new NotFoundError('Template not found for this category');
    }

    logger.info('Шаблон найден', 'admin/templates/download', { templateId: template.id, categoryName: template.catalog_category?.name });

    // Парсим поля шаблона с исправлением кодировки
    let requiredFields = JSON.parse(template.required_fields || '[]');
    const calculatorFields = JSON.parse(template.calculator_fields || '[]');
    const exportFields = JSON.parse(template.export_fields || '[]');
    const templateConfig = JSON.parse(template.template_config || '{}');
    
    // Исправляем кодировку полей
    requiredFields = fixFieldsEncoding(requiredFields);
    const fixedExportFields = fixFieldsEncoding(exportFields);

    // Создаем заголовки для Excel файла - используем все поля для экспорта
    const headers = Array.isArray(fixedExportFields) && fixedExportFields.length > 0 ? fixedExportFields : 
                   Array.isArray(requiredFields) ? requiredFields : 
                   ['Артикул поставщика', 'Domeo_Название модели для Web'];
    
    // Создаем примеры данных для каждого поля
    const exampleData = headers.map((header: string) => {
      switch (header) {
        case 'Артикул поставщика':
          return 'SUP-001';
        case 'Domeo_Название модели для Web':
          return 'Модель А';
        case 'Ширина/мм':
          return 800;
        case 'Высота/мм':
          return 2000;
        case 'Толщина/мм':
          return 40;
        case 'Тип покрытия':
          return 'Экошпон';
        case 'Domeo_Цвет':
          return 'Дуб';
        case 'Domeo_Стиль Web':
          return 'Современный';
        case 'Тип конструкции':
          return 'Царговая';
        case 'Тип открывания':
          return 'Распашная';
        case 'Поставщик':
          return 'Поставщик А';
        case 'Ед.изм.':
          return 'шт';
        case 'Склад/заказ':
          return 'Склад';
        case 'Цена опт':
          return 15000;
        case 'Кромка':
          return 'Да';
        case 'Стоимость надбавки за кромку':
          return 500;
        case 'Молдинг':
          return 'Нет';
        case 'Стекло':
          return 'Нет';
        case 'Фабрика_Коллекция':
          return 'Коллекция А';
        case 'Фабрика_Цвет/Отделка':
          return 'Дуб светлый';
        case 'photos':
          return 'photo1.jpg, photo2.jpg';
        case 'Domeo_Название модели для Web':
          return 'Модель А';
        case 'Domeo_Стиль Web':
          return 'Современный';
        case 'Тип покрытия':
          return 'ПВХ';
        case 'Domeo_Цвет':
          return 'Белый';
        case 'Ширина/мм':
          return 600;
        case 'Высота/мм':
          return 2000;
        case 'Толщина/мм':
          return 40;
        case 'Тип открывания':
          return 'Распашная';
        case 'Поставщик':
          return 'Поставщик А';
        case 'Ед.изм.':
          return 'шт';
        case 'Склад/заказ':
          return 'В наличии';
        // Поля для ручек
        case 'SKU внутреннее':
          return 'SKU_1760026930363_mfr6sjeo5';
        case 'Domeo_наименование для Web':
          return 'MIRA_BL';
        case 'Domeo_наименование ручки_1С':
          return 'MIRA_BL';
        case 'Domeo_цена группы Web':
          return 2500;
        case 'Бренд':
          return 'Morelli';
        case 'Группа':
          return 'Базовый';
        case 'Наличие в шоуруме':
          return 'да';
        case 'Поставщик':
          return 'Morelli';
        case 'Фабрика_артикул':
          return '9013946';
        case 'Фабрика_наименование':
          return 'MIRA MH-54-S6 BL';
        case 'Цена опт':
          return 1319;
        case 'Цена розница':
          return 2175;
        default:
          return 'Пример';
      }
    });

    // Создаем Excel файл
    const excelData = [
      headers,
      exampleData
    ];

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    
    // Настраиваем кодировку для правильного отображения русских символов
    ws['!cols'] = headers.map(() => ({ width: 20 }));
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Шаблон');

    // Добавляем инструкции на отдельный лист
    const instructionsData = [
      ['ИНСТРУКЦИЯ ПО ЗАПОЛНЕНИЮ ШАБЛОНА'],
      [''],
      ['ПОЛЯ ШАБЛОНА:'],
      ...requiredFields.map((field: string) => [field, 'Поле для импорта товаров']),
      [''],
      ['ВАЖНО:'],
      ['- Заголовки должны точно совпадать с шаблоном'],
      ['- Не удаляйте и не переименовывайте столбцы'],
      ['- Заполните все поля шаблона'],
      ['- SKU генерируется автоматически']
    ];

    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Инструкция');

    // Генерируем буфер с правильной кодировкой
    const buffer = XLSX.write(wb, { 
      type: 'buffer', 
      bookType: 'xlsx',
      cellStyles: true,
      compression: true
    });

    // Возвращаем файл с безопасным именем
    const categoryName = template.catalog_category?.name || 'category';
    const safeCategoryName = categoryName.replace(/[^a-zA-Z0-9]/g, '_'); // Заменяем все не-ASCII символы на подчеркивания
    const fileName = `template_${safeCategoryName}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    logger.info('Шаблон Excel создан', 'admin/templates/download', { fileName, categoryName: template.catalog_category?.name });
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    logger.error('Error generating template', 'admin/templates/download', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    if (error instanceof ValidationError || error instanceof NotFoundError) {
      throw error;
    }
    return apiError(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Failed to generate template', 500);
  }
}

export const GET = withErrorHandling(
  requireAuthAndPermission(getHandler, 'ADMIN'),
  'admin/templates/download/GET'
);
