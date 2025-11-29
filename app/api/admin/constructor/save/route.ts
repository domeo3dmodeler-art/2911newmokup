import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function POST(request: NextRequest) {
  try {
    const { categoryId, configuration, name } = await request.json();

    if (!categoryId || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Сохраняем конфигурацию конструктора
    const savedConfig = await prisma.constructorConfiguration.create({
      data: {
        categoryId,
        name: name || 'Конфигурация конструктора',
        configuration: JSON.stringify(configuration),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      configuration: savedConfig
    });

  } catch (error) {
    logger.error('Error saving constructor configuration', 'admin/constructor/save', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    const configurations = await prisma.constructorConfiguration.findMany({
      where: { categoryId },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      configurations: configurations.map(config => ({
        ...config,
        configuration: JSON.parse(config.configuration)
      }))
    });

  } catch (error) {
    logger.error('Error fetching constructor configurations', 'admin/constructor/save', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

