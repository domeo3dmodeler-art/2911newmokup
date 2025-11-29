import { NextRequest, NextResponse } from 'next/server';
import { catalogService } from '@/lib/services/catalog.service';
import { UpdateProductPropertyDto } from '@/lib/types/catalog';
import { logger } from '@/lib/logging/logger';

// PUT /api/catalog/properties/[id] - Обновить свойство
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdateProductPropertyDto = await request.json();

    // Валидация
    if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
      return NextResponse.json(
        { error: 'Name cannot be empty' },
        { status: 400 }
      );
    }

    if (data.type) {
      const validTypes = ['text', 'number', 'select', 'boolean', 'date', 'file'];
      if (!validTypes.includes(data.type)) {
        return NextResponse.json(
          { error: 'Invalid property type' },
          { status: 400 }
        );
      }
    }

    // Для select полей нужны опции
    if (data.type === 'select' && (!data.options || data.options.length === 0)) {
      return NextResponse.json(
        { error: 'Options are required for select type' },
        { status: 400 }
      );
    }

    const property = await catalogService.updateProperty(params.id, data);
    return NextResponse.json(property);
  } catch (error) {
    logger.error('Error updating product property', 'catalog/properties/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Failed to update product property' },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/properties/[id] - Удалить свойство
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await catalogService.deleteProperty(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting product property', 'catalog/properties/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete product property' },
      { status: 500 }
    );
  }
}
