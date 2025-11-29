// api/quote-templates/[id]/route.ts
// API роут для операций с отдельным шаблоном КП

import { NextRequest, NextResponse } from 'next/server';
import { quoteTemplateService } from '@/lib/templates/quote-templates';
import { logger } from '@/lib/logging/logger';

// GET /api/quote-templates/[id] - Получить шаблон по ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const template = quoteTemplateService.getTemplateById(params.id);

    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template
    });

  } catch (error: unknown) {
    logger.error('Error fetching quote template', 'quote-templates/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Ошибка при получении шаблона КП' },
      { status: 500 }
    );
  }
}

// PUT /api/quote-templates/[id] - Обновить шаблон
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    
    const updatedTemplate = quoteTemplateService.updateTemplate(params.id, body);

    if (!updatedTemplate) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate
    });

  } catch (error: unknown) {
    logger.error('Error updating quote template', 'quote-templates/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Ошибка при обновлении шаблона КП' },
      { status: 500 }
    );
  }
}

// DELETE /api/quote-templates/[id] - Удалить шаблон
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const deleted = quoteTemplateService.deleteTemplate(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Шаблон успешно удален'
    });

  } catch (error: unknown) {
    logger.error('Error deleting quote template', 'quote-templates/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { error: 'Ошибка при удалении шаблона КП' },
      { status: 500 }
    );
  }
}
