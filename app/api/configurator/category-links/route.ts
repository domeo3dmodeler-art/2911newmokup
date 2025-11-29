import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const configuratorCategoryId = searchParams.get('configuratorCategoryId');

    if (!configuratorCategoryId) {
      return NextResponse.json(
        { error: 'configuratorCategoryId is required' },
        { status: 400 }
      );
    }

    const links = await prisma.categoryLink.findMany({
      where: { configurator_category_id: configuratorCategoryId },
      include: {
        catalog_category: {
          select: {
            id: true,
            name: true,
            level: true,
            path: true
          }
        }
      },
      orderBy: { display_order: 'asc' }
    });

    return NextResponse.json({
      success: true,
      links
    });

  } catch (error) {
    logger.error('Error fetching category links', 'configurator/category-links', error instanceof Error ? { error: error.message, stack: error.stack, configuratorCategoryId } : { error: String(error), configuratorCategoryId });
    return NextResponse.json(
      { error: 'Failed to fetch category links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const {
      configurator_category_id,
      catalog_category_id,
      link_type,
      display_order,
      is_required,
      pricing_type,
      formula,
      export_as_separate
    } = data;

    if (!configurator_category_id || !catalog_category_id || !link_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Проверяем, что связь не существует
    const existingLink = await prisma.categoryLink.findFirst({
      where: {
        configurator_category_id,
        catalog_category_id,
        link_type
      }
    });

    if (existingLink) {
      return NextResponse.json(
        { error: 'Link already exists' },
        { status: 400 }
      );
    }

    // Проверяем, что не более одной основной категории
    if (link_type === 'main') {
      const existingMainLink = await prisma.categoryLink.findFirst({
        where: {
          configurator_category_id,
          link_type: 'main'
        }
      });

      if (existingMainLink) {
        return NextResponse.json(
          { error: 'Only one main category is allowed per configurator' },
          { status: 400 }
        );
      }
    }

    const link = await prisma.categoryLink.create({
      data: {
        configurator_category_id,
        catalog_category_id,
        link_type,
        display_order: display_order || 0,
        is_required: is_required || false,
        pricing_type: pricing_type || 'separate',
        formula: formula || null,
        export_as_separate: export_as_separate !== undefined ? export_as_separate : true
      },
      include: {
        catalog_category: {
          select: {
            id: true,
            name: true,
            level: true,
            path: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      link
    });

  } catch (error) {
    logger.error('Error creating category link', 'configurator/category-links', error instanceof Error ? { error: error.message, stack: error.stack, configurator_category_id, catalog_category_id } : { error: String(error), configurator_category_id, catalog_category_id });
    return NextResponse.json(
      { error: 'Failed to create category link' },
      { status: 500 }
    );
  }
}

