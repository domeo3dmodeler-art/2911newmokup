import { NextRequest, NextResponse } from 'next/server';

// ===================== Типы для API =====================

interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  layout: {
    type: 'grid' | 'flex' | 'custom';
    columns: number;
    gap: number;
    responsive: boolean;
  };
  components: ComponentConfig[];
  created_at: string;
  updated_at: string;
}

interface ComponentConfig {
  id: string;
  type: 'selector' | 'preview' | 'cart' | 'parameters' | 'custom';
  position: { row: number; col: number; span?: number };
  config: any;
  title?: string;
  visible: boolean;
}

interface CategoryConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  properties: PropertyConfig[];
  subcategories: SubcategoryConfig[];
  active_template?: string;
}

interface PropertyConfig {
  key: string;
  name: string;
  type: 'select' | 'text' | 'number' | 'boolean' | 'multiselect';
  required: boolean;
  options?: string[];
  validation?: any;
}

interface SubcategoryConfig {
  id: string;
  name: string;
  description: string;
  properties: PropertyConfig[];
}

// ===================== Mock данные =====================

const mockTemplates: PageTemplate[] = [
  {
    id: 'doors-template',
    name: 'Шаблон для дверей',
    description: 'Полнофункциональный конфигуратор дверей с выбором стиля, модели, покрытия и фурнитуры',
    category: 'doors',
    layout: { type: 'grid', columns: 3, gap: 8, responsive: true },
    components: [
      {
        id: 'style-selector',
        type: 'selector',
        position: { row: 1, col: 1, span: 1 },
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
        position: { row: 2, col: 1, span: 1 },
        config: {
          title: 'Покрытие и цвет — Модели',
          type: 'model-cards',
          dependsOn: 'style'
        },
        title: 'Выбор модели',
        visible: true
      },
      {
        id: 'parameters-form',
        type: 'parameters',
        position: { row: 3, col: 1, span: 1 },
        config: {
          fields: [
            { key: 'finish', label: 'Покрытие', type: 'select' },
            { key: 'color', label: 'Цвет', type: 'select' },
            { key: 'type', label: 'Тип', type: 'select' },
            { key: 'width', label: 'Ширина', type: 'select' },
            { key: 'height', label: 'Высота', type: 'select' },
            { key: 'edge', label: 'Кромка', type: 'select', options: ['да', 'нет'] }
          ]
        },
        title: 'Параметры',
        visible: true
      },
      {
        id: 'preview-panel',
        type: 'preview',
        position: { row: 1, col: 2, span: 1 },
        config: {
          showImage: true,
          showPrice: true,
          showSku: true
        },
        title: 'Предпросмотр',
        visible: true
      },
      {
        id: 'cart-panel',
        type: 'cart',
        position: { row: 1, col: 3, span: 1 },
        config: {
          showTotal: true,
          allowEdit: true,
          exportOptions: ['kp', 'invoice', 'factory']
        },
        title: 'Корзина',
        visible: true
      }
    ],
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 'flooring-template',
    name: 'Шаблон для напольных покрытий',
    description: 'Конфигуратор напольных покрытий с выбором материала, цвета и размеров',
    category: 'flooring',
    layout: { type: 'grid', columns: 2, gap: 6, responsive: true },
    components: [
      {
        id: 'material-selector',
        type: 'selector',
        position: { row: 1, col: 1, span: 1 },
        config: {
          title: 'Материал',
          type: 'material-cards',
          options: ['Ламинат', 'Паркет', 'Линолеум', 'Плитка']
        },
        title: 'Выбор материала',
        visible: true
      },
      {
        id: 'collection-selector',
        type: 'selector',
        position: { row: 2, col: 1, span: 1 },
        config: {
          title: 'Коллекция',
          type: 'collection-grid',
          dependsOn: 'material'
        },
        title: 'Выбор коллекции',
        visible: true
      },
      {
        id: 'parameters-form',
        type: 'parameters',
        position: { row: 3, col: 1, span: 1 },
        config: {
          fields: [
            { key: 'color', label: 'Цвет', type: 'select' },
            { key: 'pattern', label: 'Рисунок', type: 'select' },
            { key: 'width', label: 'Ширина', type: 'number' },
            { key: 'length', label: 'Длина', type: 'number' },
            { key: 'thickness', label: 'Толщина', type: 'select' }
          ]
        },
        title: 'Параметры',
        visible: true
      },
      {
        id: 'preview-panel',
        type: 'preview',
        position: { row: 1, col: 2, span: 1 },
        config: {
          showImage: true,
          showPrice: true,
          showSpecs: true
        },
        title: 'Предпросмотр',
        visible: true
      },
      {
        id: 'cart-panel',
        type: 'cart',
        position: { row: 2, col: 2, span: 1 },
        config: {
          showTotal: true,
          allowEdit: true,
          exportOptions: ['kp', 'invoice']
        },
        title: 'Корзина',
        visible: true
      }
    ],
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z'
  }
];

const mockCategories: CategoryConfig[] = [
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
    ]
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
    subcategories: []
  }
];

// ===================== API Routes =====================

// GET /api/nocode/templates - Получить все шаблоны
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    let templates = mockTemplates;
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    
    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/nocode/templates - Создать новый шаблон
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const newTemplate: PageTemplate = {
      id: `template-${Date.now()}`,
      name: body.name || 'Новый шаблон',
      description: body.description || '',
      category: body.category || 'doors',
      layout: body.layout || { type: 'grid', columns: 2, gap: 6, responsive: true },
      components: body.components || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockTemplates.push(newTemplate);
    
    return NextResponse.json({
      success: true,
      data: newTemplate
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

// PUT /api/nocode/templates/[id] - Обновить шаблон
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const body = await req.json();
    const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    mockTemplates[templateIndex] = {
      ...mockTemplates[templateIndex],
      ...body,
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: mockTemplates[templateIndex]
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    );
  }
}

// DELETE /api/nocode/templates/[id] - Удалить шаблон
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const templateId = searchParams.get('id');
    
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const templateIndex = mockTemplates.findIndex(t => t.id === templateId);
    
    if (templateIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }
    
    mockTemplates.splice(templateIndex, 1);
    
    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
