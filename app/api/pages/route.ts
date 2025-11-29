import { NextRequest, NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

interface PageElementInput {
  type: string;
  props?: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  parentId?: string | null;
}

// GET - получить все страницы
export async function GET() {
  try {
    const pages = await prisma.page.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        elements: true,
        _count: {
          select: { elements: true }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      pages: pages.map(page => ({
        id: page.id,
        title: page.title,
        description: page.description,
        isPublished: page.isPublished,
        url: page.url,
        elementsCount: page._count.elements,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      }))
    });
  } catch (error) {
    logger.error('Error fetching pages', 'pages', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST - создать новую страницу
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      logger.error('JSON parsing error', 'pages', { error: jsonError instanceof Error ? jsonError.message : String(jsonError) });
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    logger.debug('Received body', 'pages', { hasTitle: !!body?.title, hasElements: !!body?.elements, elementsCount: body?.elements?.length });
    const { title, description, elements, isPublished = false } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    // Генерируем уникальный URL
    const baseUrl = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    let url = baseUrl;
    let counter = 1;
    
    // Проверяем уникальность URL
    while (await prisma.page.findUnique({ where: { url } })) {
      url = `${baseUrl}-${counter}`;
      counter++;
    }

    // Создаем страницу
    const page = await prisma.page.create({
      data: {
        title,
        description: description || '',
        url,
        isPublished,
        elements: {
          create: (elements as PageElementInput[])?.map((element: PageElementInput, index: number) => ({
            type: element.type,
            props: JSON.stringify(element.props || {}),
            position: JSON.stringify(element.position || { x: 0, y: 0 }),
            size: JSON.stringify(element.size || { width: 300, height: 200 }),
            zIndex: element.zIndex || index,
            parentId: element.parentId || null
          })) || []
        }
      },
      include: {
        elements: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      page: {
        id: page.id,
        title: page.title,
        description: page.description,
        url: page.url,
        isPublished: page.isPublished,
        elements: page.elements.map(element => ({
          id: element.id,
          type: element.type,
          props: JSON.parse(element.props || '{}'),
          position: JSON.parse(element.position || '{}'),
          size: JSON.parse(element.size || '{}'),
          zIndex: element.zIndex,
          parentId: element.parentId
        })),
        createdAt: page.createdAt,
        updatedAt: page.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error creating page', 'pages', error instanceof Error ? { error: error.message, stack: error.stack, title: body?.title } : { error: String(error), title: body?.title });
    return NextResponse.json(
      { success: false, error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
