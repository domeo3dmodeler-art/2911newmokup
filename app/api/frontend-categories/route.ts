import { NextRequest, NextResponse } from 'next/server';
import { catalogService } from '@/lib/services/catalog.service';
import { CreateFrontendCategoryDto } from '@/lib/types/catalog';
import { logger } from '@/lib/logging/logger';

// GET /api/frontend-categories - Получить категории фронта
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    if (slug) {
      // Поиск по slug
      const category = await catalogService.getFrontendCategoryBySlug(slug);
      return NextResponse.json({
        success: true,
        categories: category ? [category] : []
      });
    } else {
      // Получить все категории
      const categories = await catalogService.getFrontendCategories();
      return NextResponse.json(categories);
    }
  } catch (error) {
    logger.error('Error fetching frontend categories', 'frontend-categories', error instanceof Error ? { error: error.message, stack: error.stack, slug } : { error: String(error), slug });
    return NextResponse.json(
      { error: 'Failed to fetch frontend categories' },
      { status: 500 }
    );
  }
}

// POST /api/frontend-categories - Создать новую категорию фронта
export async function POST(request: NextRequest) {
  try {
    const data: CreateFrontendCategoryDto = await request.json();

    // Валидация
    if (!data.name || data.name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!data.slug || data.slug.trim().length === 0) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!data.catalog_category_ids || data.catalog_category_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one catalog category must be selected' },
        { status: 400 }
      );
    }

    // Проверяем уникальность slug
    const existingCategory = await catalogService.getFrontendCategoryBySlug(data.slug);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Category with this slug already exists' },
        { status: 400 }
      );
    }

    const category = await catalogService.createFrontendCategory(data);
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    logger.error('Error creating frontend category', 'frontend-categories', error instanceof Error ? { error: error.message, stack: error.stack, slug: data.slug } : { error: String(error), slug: data.slug });
    return NextResponse.json(
      { error: 'Failed to create frontend category' },
      { status: 500 }
    );
  }
}
