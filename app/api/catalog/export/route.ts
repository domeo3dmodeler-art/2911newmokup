import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/services/export.service';
import { logger } from '@/lib/logging/logger';

// POST /api/catalog/export - Экспорт товаров
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { catalogCategoryId, exportType, productIds } = data;

    if (!catalogCategoryId) {
      return NextResponse.json(
        { error: 'ID категории каталога не указан' },
        { status: 400 }
      );
    }

    if (!exportType || !['quote', 'invoice', 'supplier_order'].includes(exportType)) {
      return NextResponse.json(
        { error: 'Неверный тип экспорта' },
        { status: 400 }
      );
    }

    const result = await exportService.exportToExcel(
      catalogCategoryId,
      exportType,
      productIds
    );

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Error exporting products', 'catalog/export', error instanceof Error ? { error: error.message, stack: error.stack, catalogCategoryId, exportType } : { error: String(error), catalogCategoryId, exportType });
    return NextResponse.json(
      { error: 'Ошибка при экспорте товаров' },
      { status: 500 }
    );
  }
}

// GET /api/catalog/export/configs - Получить настройки экспорта
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogCategoryId = searchParams.get('catalogCategoryId');

    if (!catalogCategoryId) {
      return NextResponse.json(
        { error: 'ID категории каталога не указан' },
        { status: 400 }
      );
    }

    const configs = await exportService.getExportConfigs(catalogCategoryId);
    return NextResponse.json(configs);

  } catch (error) {
    logger.error('Error fetching export configs', 'catalog/export', error instanceof Error ? { error: error.message, stack: error.stack, catalogCategoryId } : { error: String(error), catalogCategoryId });
    return NextResponse.json(
      { error: 'Ошибка при получении настроек экспорта' },
      { status: 500 }
    );
  }
}
