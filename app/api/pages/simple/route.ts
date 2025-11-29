import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging/logger';

// Простой API для тестирования без Prisma
export async function GET() {
  try {
    return NextResponse.json({ 
      success: true, 
      pages: [
        {
          id: 'simple-1',
          title: 'Простая страница 1',
          description: 'Тестовая страница',
          isPublished: true,
          url: 'simple-1',
          elementsCount: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]
    });
  } catch (error) {
    logger.error('Error in simple API', 'pages/simple', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    logger.debug('Received data', 'pages/simple', { hasTitle: !!body?.title, hasDescription: !!body?.description });
    
    const { title, description } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      );
    }

    const newPage = {
      id: `simple-${Date.now()}`,
      title,
      description: description || '',
      url: title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').substring(0, 50),
      isPublished: false,
      elements: body.elements || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    logger.debug('Created page', 'pages/simple', { pageId: newPage.id, title: newPage.title });

    return NextResponse.json({ 
      success: true, 
      page: newPage
    });
  } catch (error) {
    logger.error('Error creating simple page', 'pages/simple', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { success: false, error: 'Failed to create page' },
      { status: 500 }
    );
  }
}

