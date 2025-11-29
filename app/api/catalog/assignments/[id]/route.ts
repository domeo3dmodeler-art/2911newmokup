import { NextRequest, NextResponse } from 'next/server';
import { catalogService } from '@/lib/services/catalog.service';
import { UpdatePropertyAssignmentDto } from '@/lib/types/catalog';
import { logger } from '@/lib/logging/logger';

// PUT /api/catalog/assignments/[id] - Обновить назначение свойства
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data: UpdatePropertyAssignmentDto = await request.json();

    const assignment = await catalogService.updatePropertyAssignment(params.id, data);
    return NextResponse.json(assignment);
  } catch (error) {
    logger.error('Error updating property assignment', 'catalog/assignments/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Failed to update property assignment' },
      { status: 500 }
    );
  }
}

// DELETE /api/catalog/assignments/[id] - Удалить назначение свойства
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await catalogService.removePropertyAssignment(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting property assignment', 'catalog/assignments/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Failed to delete property assignment' },
      { status: 500 }
    );
  }
}
