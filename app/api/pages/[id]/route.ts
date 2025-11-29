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

// GET - получить страницу по ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: params.id },
      include: {
        elements: {
          orderBy: { zIndex: 'asc' }
        }
      }
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

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
    logger.error('Error fetching page', 'pages/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

// PUT - обновить страницу
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, elements, isPublished, url } = body;

    // Проверяем существование страницы
    const existingPage = await prisma.page.findUnique({
      where: { id: params.id }
    });

    if (!existingPage) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    // Обновляем страницу
    const page = await prisma.page.update({
      where: { id: params.id },
      data: {
        title: title || existingPage.title,
        description: description !== undefined ? description : existingPage.description,
        isPublished: isPublished !== undefined ? isPublished : existingPage.isPublished,
        url: url !== undefined ? url : existingPage.url,
        elements: elements ? {
          deleteMany: {}, // Удаляем все существующие элементы
          create: (elements as PageElementInput[]).map((element: PageElementInput, index: number) => ({
            type: element.type,
            props: JSON.stringify(element.props || {}),
            position: JSON.stringify(element.position || { x: 0, y: 0 }),
            size: JSON.stringify(element.size || { width: 300, height: 200 }),
            zIndex: element.zIndex || index,
            parentId: element.parentId || null
          }))
        } : undefined
      },
      include: {
        elements: {
          orderBy: { zIndex: 'asc' }
        }
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
        updatedAt: page.updatedAt
      }
    });
  } catch (error) {
    logger.error('Error updating page', 'pages/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}

// DELETE - удалить страницу
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.page.findUnique({
      where: { id: params.id }
    });

    if (!page) {
      return NextResponse.json(
        { success: false, error: 'Page not found' },
        { status: 404 }
      );
    }

    await prisma.page.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Page deleted successfully' 
    });
  } catch (error) {
    logger.error('Error deleting page', 'pages/[id]', error instanceof Error ? { error: error.message, stack: error.stack, id: params.id } : { error: String(error), id: params.id });
    return NextResponse.json(
      { success: false, error: 'Failed to delete page' },
      { status: 500 }
    );
  }
}
