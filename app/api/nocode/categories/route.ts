import { NextRequest, NextResponse } from 'next/server';

// ===================== API для категорий с шаблонами =====================

// GET /api/nocode/categories - Получить все категории с их шаблонами
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeTemplates = searchParams.get('includeTemplates') === 'true';
    
    const categories = [
      {
        id: 'doors',
        name: 'Двери',
        description: 'Межкомнатные и входные двери',
        icon: '🚪',
        active_template: 'doors-template',
        properties: [
          { key: 'style', name: 'Стиль', type: 'select', required: true, options: ['Скрытая', 'Современная', 'Неоклассика', 'Классика'] },
          { key: 'model', name: 'Модель', type: 'select', required: true },
          { key: 'finish', name: 'Покрытие', type: 'select', required: true },
          { key: 'color', name: 'Цвет', type: 'select', required: true },
          { key: 'type', name: 'Тип', type: 'select', required: true },
          { key: 'width', name: 'Ширина', type: 'number', required: true },
          { key: 'height', name: 'Высота', type: 'number', required: true },
          { key: 'edge', name: 'Кромка', type: 'select', required: false, options: ['да', 'нет'] }
        ],
        subcategories: [
          {
            id: 'door-handles',
            name: 'Ручки',
            description: 'Ручки для межкомнатных дверей',
            properties: [
              { key: 'name', name: 'Название', type: 'text', required: true },
              { key: 'supplier_name', name: 'Поставщик', type: 'text', required: true },
              { key: 'price_opt', name: 'Цена оптовая', type: 'number', required: true }
            ]
          },
          {
            id: 'door-kits',
            name: 'Комплекты фурнитуры',
            description: 'Комплекты фурнитуры для дверей',
            properties: [
              { key: 'name', name: 'Название', type: 'text', required: true },
              { key: 'group', name: 'Группа', type: 'number', required: false },
              { key: 'price_rrc', name: 'Цена РРЦ', type: 'number', required: true }
            ]
          }
        ],
        templates: includeTemplates ? [
          {
            id: 'doors-template',
            name: 'Шаблон для дверей',
            description: 'Полнофункциональный конфигуратор дверей',
            layout: { type: 'grid', columns: 3, gap: 8, responsive: true },
            components: [
              {
                id: 'style-selector',
                type: 'selector',
                position: { row: 1, col: 1 },
                config: {
                  title: 'Полотно',
                  type: 'style-tiles',
                  options: ['Скрытая', 'Современная', 'Неоклассика', 'Классика']
                },
                title: 'Выбор стиля',
                visible: true
              },
              {
                id: 'model-selector',
                type: 'selector',
                position: { row: 2, col: 1 },
                config: {
                  title: 'Модели',
                  type: 'model-cards',
                  dependsOn: 'style'
                },
                title: 'Выбор модели',
                visible: true
              },
              {
                id: 'preview-panel',
                type: 'preview',
                position: { row: 1, col: 2 },
                config: { showPrice: true },
                title: 'Предпросмотр',
                visible: true
              },
              {
                id: 'cart-panel',
                type: 'cart',
                position: { row: 1, col: 3 },
                config: { exportOptions: ['kp', 'invoice', 'factory'] },
                title: 'Корзина',
                visible: true
              }
            ]
          }
        ] : []
      },
      {
        id: 'flooring',
        name: 'Напольные покрытия',
        description: 'Ламинат, паркет, линолеум',
        icon: '🏠',
        active_template: 'flooring-template',
        properties: [
          { key: 'material', name: 'Материал', type: 'select', required: true, options: ['Ламинат', 'Паркет', 'Линолеум', 'Плитка'] },
          { key: 'collection', name: 'Коллекция', type: 'select', required: true },
          { key: 'color', name: 'Цвет', type: 'select', required: true },
          { key: 'pattern', name: 'Рисунок', type: 'select', required: false },
          { key: 'width', name: 'Ширина', type: 'number', required: true },
          { key: 'length', name: 'Длина', type: 'number', required: true },
          { key: 'thickness', name: 'Толщина', type: 'select', required: true }
        ],
        subcategories: [],
        templates: includeTemplates ? [
          {
            id: 'flooring-template',
            name: 'Шаблон для напольных покрытий',
            description: 'Конфигуратор напольных покрытий',
            layout: { type: 'grid', columns: 2, gap: 6, responsive: true },
            components: [
              {
                id: 'material-selector',
                type: 'selector',
                position: { row: 1, col: 1 },
                config: {
                  title: 'Материал',
                  type: 'material-cards',
                  options: ['Ламинат', 'Паркет', 'Линолеум', 'Плитка']
                },
                title: 'Выбор материала',
                visible: true
              },
              {
                id: 'preview-panel',
                type: 'preview',
                position: { row: 1, col: 2 },
                config: { showPrice: true },
                title: 'Предпросмотр',
                visible: true
              }
            ]
          }
        ] : []
      },
      {
        id: 'kitchens',
        name: 'Кухни',
        description: 'Кухонные гарнитуры на заказ',
        icon: '🍳',
        active_template: 'kitchens-template',
        properties: [
          { key: 'style', name: 'Стиль', type: 'select', required: true, options: ['Современная', 'Классическая', 'Скандинавская', 'Лофт'] },
          { key: 'layout', name: 'Планировка', type: 'select', required: true },
          { key: 'facade', name: 'Фасад', type: 'select', required: true },
          { key: 'color', name: 'Цвет', type: 'select', required: true },
          { key: 'width', name: 'Ширина', type: 'number', required: true },
          { key: 'height', name: 'Высота', type: 'number', required: true }
        ],
        subcategories: [],
        templates: includeTemplates ? [
          {
            id: 'kitchens-template',
            name: 'Шаблон для кухонь',
            description: 'Конфигуратор кухонных гарнитуров',
            layout: { type: 'grid', columns: 3, gap: 8, responsive: true },
            components: [
              {
                id: 'style-selector',
                type: 'selector',
                position: { row: 1, col: 1 },
                config: {
                  title: 'Стиль кухни',
                  type: 'style-showcase',
                  options: ['Современная', 'Классическая', 'Скандинавская', 'Лофт']
                },
                title: 'Выбор стиля',
                visible: true
              },
              {
                id: 'preview-panel',
                type: 'preview',
                position: { row: 1, col: 2 },
                config: { showPrice: true },
                title: '3D Предпросмотр',
                visible: true
              },
              {
                id: 'cart-panel',
                type: 'cart',
                position: { row: 1, col: 3 },
                config: { exportOptions: ['kp', 'invoice', 'factory'] },
                title: 'Корзина',
                visible: true
              }
            ]
          }
        ] : []
      },
      {
        id: 'tiles',
        name: 'Плитка',
        description: 'Керамическая плитка и мозаика',
        icon: '🔲',
        active_template: 'tiles-template',
        properties: [
          { key: 'collection', name: 'Коллекция', type: 'select', required: true, options: ['Классика', 'Модерн', 'Мрамор', 'Дерево'] },
          { key: 'color', name: 'Цвет', type: 'select', required: true },
          { key: 'size', name: 'Размер', type: 'select', required: true },
          { key: 'finish', name: 'Поверхность', type: 'select', required: true },
          { key: 'thickness', name: 'Толщина', type: 'select', required: true },
          { key: 'area', name: 'Площадь', type: 'number', required: true }
        ],
        subcategories: [],
        templates: includeTemplates ? [
          {
            id: 'tiles-template',
            name: 'Шаблон для плитки',
            description: 'Конфигуратор керамической плитки',
            layout: { type: 'grid', columns: 2, gap: 6, responsive: true },
            components: [
              {
                id: 'collection-selector',
                type: 'selector',
                position: { row: 1, col: 1 },
                config: {
                  title: 'Коллекция плитки',
                  type: 'collection-mosaic',
                  options: ['Классика', 'Модерн', 'Мрамор', 'Дерево']
                },
                title: 'Выбор коллекции',
                visible: true
              },
              {
                id: 'preview-panel',
                type: 'preview',
                position: { row: 1, col: 2 },
                config: { showPrice: true },
                title: 'Предпросмотр',
                visible: true
              }
            ]
          }
        ] : []
      }
    ];
    
    return NextResponse.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/nocode/categories - Создать новую категорию
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const newCategory = {
      id: `category-${Date.now()}`,
      name: body.name || 'Новая категория',
      description: body.description || '',
      icon: body.icon || '📦',
      active_template: body.active_template || null,
      properties: body.properties || [],
      subcategories: body.subcategories || [],
      templates: body.templates || []
    };
    
    return NextResponse.json({
      success: true,
      data: newCategory
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

// PUT /api/nocode/categories/[id] - Обновить категорию
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('id');
    
    if (!categoryId) {
      return NextResponse.json(
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    
    // Здесь будет обновление категории в базе данных
    const updatedCategory = {
      id: categoryId,
      ...body,
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: updatedCategory
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update category' },
      { status: 500 }
    );
  }
}
