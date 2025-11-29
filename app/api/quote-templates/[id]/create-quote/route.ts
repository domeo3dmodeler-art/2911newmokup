// api/quote-templates/[id]/create-quote/route.ts
// API роут для создания КП из шаблона

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import { quoteTemplateService } from '@/lib/templates/quote-templates';
import { applyPricing } from '@/lib/doors/pricing';

// POST /api/quote-templates/[id]/create-quote - Создать КП из шаблона
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    
    // Получаем шаблон
    const template = quoteTemplateService.getTemplateById(params.id);
    if (!template) {
      return NextResponse.json(
        { error: 'Шаблон не найден' },
        { status: 404 }
      );
    }

    // Создаем КП из шаблона с пользовательскими данными
    const quoteData = quoteTemplateService.createQuoteFromTemplate(params.id, {
      title: body.title || template.template.title,
      clientInfo: {
        ...template.template.clientInfo,
        ...body.clientInfo
      },
      notes: body.notes || template.template.notes
    });

    if (!quoteData) {
      return NextResponse.json(
        { error: 'Ошибка при создании КП из шаблона' },
        { status: 500 }
      );
    }

    // Применяем ценообразование для расчета итоговой суммы
    const pricedItems = applyPricing(quoteData.items);
    const total = pricedItems.reduce((sum, item) => sum + item.sum_rrc, 0);

    // Создаем КП в базе данных
    const quote = await prisma.quote.create({
      data: {
        title: quoteData.title,
        status: 'draft',
        items: quoteData.items,
        total: total,
        currency: quoteData.items[0]?.currency || 'RUB',
        clientInfo: quoteData.clientInfo,
        notes: quoteData.notes
      },
      select: {
        id: true,
        title: true,
        status: true,
        items: true,
        total: true,
        currency: true,
        clientInfo: true,
        notes: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'КП успешно создан из шаблона',
      quote: {
        ...quote,
        total: Number(quote.total),
        items: JSON.parse(JSON.stringify(quote.items)),
        clientInfo: quote.clientInfo ? JSON.parse(JSON.stringify(quote.clientInfo)) : null
      },
      template: {
        id: template.id,
        name: template.name,
        description: template.description
      }
    }, { status: 201 });

  } catch (error: unknown) {
    logger.error('Error creating quote from template', 'api/quote-templates/[id]/create-quote', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Ошибка при создании КП из шаблона' },
      { status: 500 }
    );
  }
}
