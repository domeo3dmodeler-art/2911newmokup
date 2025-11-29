import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

export async function POST(req: NextRequest) {
  try {
    const { name, description, config } = await req.json();

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Не указано название или конфигурация' },
        { status: 400 }
      );
    }

    // Сохраняем конфигурацию в базе данных
    const constructorConfig = await prisma.constructorConfig.create({
      data: {
        name,
        description: description || '',
        config: JSON.stringify(config),
        is_active: true
      }
    });

    return NextResponse.json({
      success: true,
      config: {
        id: constructorConfig.id,
        name: constructorConfig.name,
        description: constructorConfig.description,
        config: JSON.parse(constructorConfig.config),
        isActive: constructorConfig.is_active,
        createdAt: constructorConfig.created_at,
        updatedAt: constructorConfig.updated_at
      },
      message: 'Конфигурация конструктора сохранена'
    });

  } catch (error) {
    logger.error('Constructor config creation error', 'admin/constructor-configs', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Ошибка при сохранении конфигурации конструктора' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Получаем конкретную конфигурацию
      const config = await prisma.constructorConfig.findUnique({
        where: { id }
      });

      if (!config) {
        return NextResponse.json(
          { error: 'Конфигурация не найдена' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        config: {
          id: config.id,
          name: config.name,
          description: config.description,
          config: JSON.parse(config.config),
          isActive: config.is_active,
          createdAt: config.created_at,
          updatedAt: config.updated_at
        }
      });
    } else {
      // Получаем все конфигурации
      const configs = await prisma.constructorConfig.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' }
      });

      return NextResponse.json({
        success: true,
        configs: configs.map(config => ({
          id: config.id,
          name: config.name,
          description: config.description,
          config: JSON.parse(config.config),
          isActive: config.is_active,
          createdAt: config.created_at,
          updatedAt: config.updated_at
        }))
      });
    }

  } catch (error) {
    logger.error('Constructor config retrieval error', 'admin/constructor-configs', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Ошибка при получении конфигураций конструктора' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, name, description, config } = await req.json();

    if (!id || !name || !config) {
      return NextResponse.json(
        { error: 'Не указан ID, название или конфигурация' },
        { status: 400 }
      );
    }

    // Обновляем конфигурацию
    const updatedConfig = await prisma.constructorConfig.update({
      where: { id },
      data: {
        name,
        description: description || '',
        config: JSON.stringify(config),
        updated_at: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      config: {
        id: updatedConfig.id,
        name: updatedConfig.name,
        description: updatedConfig.description,
        config: JSON.parse(updatedConfig.config),
        isActive: updatedConfig.is_active,
        createdAt: updatedConfig.created_at,
        updatedAt: updatedConfig.updated_at
      },
      message: 'Конфигурация конструктора обновлена'
    });

  } catch (error) {
    logger.error('Constructor config update error', 'admin/constructor-configs', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Ошибка при обновлении конфигурации конструктора' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Не указан ID конфигурации' },
        { status: 400 }
      );
    }

    // Мягкое удаление - помечаем как неактивную
    await prisma.constructorConfig.update({
      where: { id },
      data: { is_active: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Конфигурация конструктора удалена'
    });

  } catch (error) {
    logger.error('Constructor config deletion error', 'admin/constructor-configs', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: 'Ошибка при удалении конфигурации конструктора' },
      { status: 500 }
    );
  }
}

