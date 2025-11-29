import { NextRequest, NextResponse } from 'next/server';
import { simpleImportService } from '../../../../lib/services/simple-import.service';
import { logger } from '../../../../lib/logging/logger';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const catalogCategoryId = formData.get('catalogCategoryId') as string;
    const updateExisting = formData.get('updateExisting') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Файл не предоставлен' },
        { status: 400 }
      );
    }
    
    if (!catalogCategoryId) {
      return NextResponse.json(
        { success: false, error: 'ID категории не предоставлен' },
        { status: 400 }
      );
    }
    
    logger.info('Получен файл для простого импорта', 'admin/simple-import', { fileName: file.name, catalogCategoryId, updateExisting });
    
    // Конвертируем файл в Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    
    // Выполняем простой импорт
    const result = await simpleImportService.importProducts(
      fileBuffer,
      catalogCategoryId,
      {
        skipEmptyValues: true,
        validateRequiredFields: true,
        updateExisting: updateExisting
      }
    );
    
    logger.info('Результат простого импорта', 'admin/simple-import', { result });
    
    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      warnings: result.warnings,
      message: result.success 
        ? `Импорт завершен: ${result.imported} новых товаров, ${result.updated} обновлено`
        : 'Импорт завершен с ошибками'
    });
    
  } catch (error) {
    logger.error('Ошибка API простого импорта', 'admin/simple-import', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка импорта', 
        details: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const catalogCategoryId = searchParams.get('catalogCategoryId');
    const action = searchParams.get('action');
    
    if (!catalogCategoryId) {
      return NextResponse.json(
        { success: false, error: 'ID категории не предоставлен' },
        { status: 400 }
      );
    }
    
    if (action === 'template') {
      // Создаем шаблон Excel файла
      const templateBuffer = await simpleImportService.createTemplateFile(catalogCategoryId);
      
      return new NextResponse(templateBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="template_${catalogCategoryId}.xlsx"`
        }
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Неизвестное действие' },
      { status: 400 }
    );
    
  } catch (error) {
    logger.error('Ошибка API простого импорта (GET)', 'admin/simple-import', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Ошибка получения данных', 
        details: error instanceof Error ? error.message : 'Неизвестная ошибка' 
      },
      { status: 500 }
    );
  }
}