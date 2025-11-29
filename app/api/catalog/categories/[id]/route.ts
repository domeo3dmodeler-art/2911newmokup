import { NextRequest, NextResponse } from 'next/server';
import { catalogService } from '@/lib/services/catalog.service';
import { UpdateCatalogCategoryDto } from '@/lib/types/catalog';
import { logger } from '@/lib/logging/logger';

// GET /api/catalog/categories/[id] - Получить категорию по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await catalogService.getCategoryById(params.id);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    logger.error('Error fetching catalog category', 'catalog/categories/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Failed to fetch catalog category' },
      { status: 500 }
    );
  }
}

// PUT /api/catalog/categories/[id] - Обновить категорию
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateCatalogCategoryDto = await request.json();

    // Валидация
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    const category = await catalogService.updateCategory(params.id, data);
    return NextResponse.json(category);
  } catch (error) {
    logger.error('Error updating catalog category', 'catalog/categories/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Failed to update catalog category' },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/categories/[id] - Удалить категорию
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await catalogService.deleteCategory(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting catalog category', 'catalog/categories/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete catalog category' },
      { status: 500 }
    );
  }
}
