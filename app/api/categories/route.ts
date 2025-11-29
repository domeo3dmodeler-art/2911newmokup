import { NextRequest, NextResponse } from "next/server";
import { logger } from '@/lib/logging/logger';

// Универсальная система для управления категориями товаров
export async function GET(req: NextRequest) {
  try {
    // Временно возвращаем демо данные для работы с товарами и подкатегориями
    const categories = [
      {
        id: "doors",
        name: "Двери",
        description: "Межкомнатные и входные двери",
        icon: "🚪",
        is_main: true,
        parent_id: null,
        properties: [], // Схема создается динамически при импорте прайса
        import_mapping: {}, // Создается динамически при импорте прайса
        subcategories: [
          {
            id: "door-handles",
            name: "Ручки",
            description: "Ручки для межкомнатных дверей",
            icon: "🔘",
            is_main: false,
            parent_id: "doors",
            properties: [
              { key: "name", name: "Название", type: "text", required: true },
              { key: "supplier_name", name: "Поставщик", type: "text", required: true },
              { key: "supplier_sku", name: "Артикул поставщика", type: "text", required: true },
              { key: "price_opt", name: "Цена оптовая", type: "number", required: true },
              { key: "price_group_multiplier", name: "Множитель группы", type: "number", required: true }
            ],
            import_mapping: {
              "name": "name",
              "supplier_name": "supplier_name",
              "supplier_sku": "supplier_sku", 
              "price_opt": "price_opt",
              "price_group_multiplier": "price_group_multiplier"
            }
          },
          {
            id: "door-kits",
            name: "Комплекты фурнитуры",
            description: "Комплекты фурнитуры для дверей",
            icon: "🔧",
            is_main: false,
            parent_id: "doors",
            properties: [
              { key: "name", name: "Название", type: "text", required: true },
              { key: "group", name: "Группа", type: "number", required: false },
              { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
            ],
            import_mapping: {
              "name": "name",
              "group": "group",
              "price_rrc": "price_rrc"
            }
          }
        ],
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z"
      },
      {
        id: "flooring",
        name: "Напольные покрытия",
        description: "Ламинат, паркет, линолеум",
        icon: "🏠",
        is_main: true,
        parent_id: null,
        properties: [
          { key: "model", name: "Модель", type: "text", required: true },
          { key: "material", name: "Материал", type: "text", required: true },
          { key: "color", name: "Цвет", type: "text", required: true },
          { key: "thickness", name: "Толщина (мм)", type: "number", required: true },
          { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
        ],
        import_mapping: {
          "model": "model",
          "material": "material",
          "color": "color", 
          "thickness": "thickness",
          "price_rrc": "price_rrc"
        },
        subcategories: [
          {
            id: "flooring-accessories",
            name: "Аксессуары",
            description: "Плинтусы, пороги, подложки",
            icon: "📏",
            is_main: false,
            parent_id: "flooring",
            properties: [
              { key: "name", name: "Название", type: "text", required: true },
              { key: "type", name: "Тип", type: "text", required: true },
              { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
            ],
            import_mapping: {
              "name": "name",
              "type": "type",
              "price_rrc": "price_rrc"
            }
          }
        ],
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z"
      },
      {
        id: "kitchens",
        name: "Кухни",
        description: "Кухонные гарнитуры и комплектующие",
        icon: "🍳",
        is_main: true,
        parent_id: null,
        properties: [
          { key: "model", name: "Модель", type: "text", required: true },
          { key: "material", name: "Материал", type: "text", required: true },
          { key: "color", name: "Цвет", type: "text", required: true },
          { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
        ],
        import_mapping: {
          "model": "model",
          "material": "material",
          "color": "color",
          "price_rrc": "price_rrc"
        },
        subcategories: [
          {
            id: "kitchen-hardware",
            name: "Фурнитура",
            description: "Ручки, петли, направляющие для кухонь",
            icon: "🔩",
            is_main: false,
            parent_id: "kitchens",
            properties: [
              { key: "name", name: "Название", type: "text", required: true },
              { key: "type", name: "Тип", type: "text", required: true },
              { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
            ],
            import_mapping: {
              "name": "name",
              "type": "type",
              "price_rrc": "price_rrc"
            }
          }
        ],
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z"
      },
      {
        id: "tiles",
        name: "Плитка",
        description: "Керамическая плитка для стен и пола",
        icon: "🧱",
        is_main: true,
        parent_id: null,
        properties: [
          { key: "model", name: "Модель", type: "text", required: true },
          { key: "material", name: "Материал", type: "text", required: true },
          { key: "color", name: "Цвет", type: "text", required: true },
          { key: "size", name: "Размер", type: "text", required: true },
          { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
        ],
        import_mapping: {
          "model": "model",
          "material": "material",
          "color": "color",
          "size": "size",
          "price_rrc": "price_rrc"
        },
        subcategories: [
          {
            id: "tile-accessories",
            name: "Аксессуары",
            description: "Затирки, клей, крестики для плитки",
            icon: "🧴",
            is_main: false,
            parent_id: "tiles",
            properties: [
              { key: "name", name: "Название", type: "text", required: true },
              { key: "type", name: "Тип", type: "text", required: true },
              { key: "price_rrc", name: "Цена РРЦ", type: "number", required: true }
            ],
            import_mapping: {
              "name": "name",
              "type": "type",
              "price_rrc": "price_rrc"
            }
          }
        ],
        created_at: "2025-01-15T10:00:00Z",
        updated_at: "2025-01-15T10:00:00Z"
      }
    ];

    return NextResponse.json({
      categories,
      total: categories.length,
      message: "Универсальная система категорий товаров (демо-режим)"
    });
  } catch (error) {
    logger.error('Ошибка получения категорий', 'categories', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: "Ошибка получения категорий" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, icon, properties, import_mapping } = body;

    // Валидация обязательных полей
    if (!name || !properties || !Array.isArray(properties)) {
      return NextResponse.json(
        { error: "Название и свойства обязательны" },
        { status: 400 }
      );
    }

    // Генерируем ID на основе названия
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    // В демо-режиме просто возвращаем созданную категорию
    const newCategory = {
      id,
      name,
      description: description || "",
      icon: icon || "📦",
      properties,
      import_mapping: import_mapping || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return NextResponse.json({
      message: "Категория создана успешно (демо-режим)",
      category: newCategory
    }, { status: 201 });
  } catch (error) {
    logger.error('Ошибка создания категории', 'categories', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return NextResponse.json(
      { error: "Ошибка создания категории" },
      { status: 500 }
    );
  }
}
