import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

interface PageElementInput {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  zIndex?: number;
  parentId?: string | null;
}

// Простой API для создания страниц без Prisma
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      logger.error('JSON parsing error', 'pages/simple-create', { error: jsonError instanceof Error ? jsonError.message : String(jsonError) });
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    
    const { title, description, elements = [], isPublished = false } = body;

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
    while (counter < 100) {
      url = counter === 1 ? baseUrl : `${baseUrl}-${counter}`;
      counter++;
      break; // Пока не проверяем уникальность
    }

    // Создаем страницу в памяти (для демонстрации)
    const page = {
      id: `page-${Date.now()}`,
      title,
      description: description || '',
      url,
      isPublished,
      elements: (elements as PageElementInput[]).map((element: PageElementInput, index: number) => ({
        id: element.id || `element-${index}`,
        type: element.type,
        props: element.props || {},
        position: element.position || { x: 0, y: 0 },
        size: element.size || { width: 200, height: 100 },
        zIndex: element.zIndex || index + 1,
        parentId: element.parentId || null,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.debug('Created page', 'pages/simple-create', { pageId: page.id, title: page.title, elementsCount: page.elements.length });

    return NextResponse.json({
      success: true,
      page,
      message: 'Страница успешно создана'
    });

  } catch (error) {
    logger.error('Error creating page', 'pages/simple-create', error instanceof Error ? { error: error.message, stack: error.stack, title: body?.title } : { error: String(error), title: body?.title });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - получить все страницы
export async function GET() {
  try {
    // Возвращаем тестовые страницы
    const pages = [
      {
        id: 'test-page-1',
        title: 'Тестовая страница 1',
        description: 'Это тестовая страница для проверки API',
        url: 'test-page-1',
        isPublished: true,
        elementsCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-page-2',
        title: 'Тестовая страница 2',
        description: 'Еще одна тестовая страница',
        url: 'test-page-2',
        isPublished: false,
        elementsCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      pages
    });

  } catch (error) {
    logger.error('Error fetching pages', 'pages/simple-create', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

