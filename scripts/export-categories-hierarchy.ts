// Скрипт экспорта иерархии категорий в Excel
// Использование: npm run export:categories-hierarchy

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import ExcelJS from 'exceljs';

// Загружаем переменные окружения
config({ path: '.env.local' });
config();

// URL API для получения категорий
const API_URL = process.env.API_URL || 'http://130.193.40.35:3001/api/catalog/categories/tree';

// Пробуем создать Prisma Client
const prisma = new PrismaClient();

// Функция для проверки подключения к БД
async function checkPrismaConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

const OUTPUT_FILE = path.join(process.cwd(), 'docs', 'CATEGORIES_HIERARCHY.xlsx');

interface CategoryRow {
  level: number;
  indent: string;
  id: string;
  name: string;
  parent_id: string | null;
  path: string;
  products_count: number;
  sort_order: number;
  is_active: boolean;
}

// Функция для построения плоского списка категорий с учетом иерархии
function buildCategoryHierarchy(
  categories: any[],
  parent: any = null,
  level: number = 0,
  result: CategoryRow[] = []
): CategoryRow[] {
  categories.forEach((category) => {
    const indent = '  '.repeat(level);
    
    result.push({
      level: level,
      indent: indent,
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      path: category.path,
      products_count: category.products_count || 0,
      sort_order: category.sort_order || 0,
      is_active: category.is_active !== false,
    });

    // Рекурсивно обрабатываем дочерние категории
    if (category.children && category.children.length > 0) {
      buildCategoryHierarchy(category.children, category, level + 1, result);
    }
  });

  return result;
}

// Функция для получения категорий через API
async function fetchCategoriesFromAPI(): Promise<any[]> {
  try {
    console.log(`📡 Получение категорий через API: ${API_URL}\n`);
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      throw new Error(`API вернул статус ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.categories) {
      return data.categories;
    } else if (Array.isArray(data)) {
      return data;
    } else {
      throw new Error('Неожиданный формат ответа от API');
    }
  } catch (error) {
    console.error('❌ Ошибка при получении категорий через API:', error);
    throw error;
  }
}

// Функция для получения всех категорий в плоском виде из дерева
function flattenTree(categories: any[], result: any[] = []): any[] {
  categories.forEach(cat => {
    result.push(cat);
    if (cat.children && cat.children.length > 0) {
      flattenTree(cat.children, result);
    }
  });
  return result;
}

async function exportCategoriesHierarchy() {
  console.log('\n📊 Экспорт иерархии категорий в Excel...\n');
  console.log('='.repeat(80));

  try {
    let categories: any[];
    let usePrisma = false;
    
    // Проверяем подключение к БД
    console.log('🔌 Проверка подключения к базе данных...\n');
    usePrisma = await checkPrismaConnection();
    
    if (usePrisma) {
      // Получаем все категории с товарами через Prisma
      console.log('📊 Получение категорий через Prisma...\n');
      categories = await prisma.catalogCategory.findMany({
        include: {
          _count: {
            select: {
              products: {
                where: {
                  is_active: true
                }
              }
            }
          }
        },
        orderBy: [
          { level: 'asc' },
          { sort_order: 'asc' },
          { name: 'asc' }
        ]
      });
      
      console.log(`📋 Найдено категорий: ${categories.length}\n`);
    } else {
      console.log('⚠️  Прямое подключение к БД недоступно, используем API\n');
      // Получаем категории через API
      const treeCategories = await fetchCategoriesFromAPI();
      
      // Преобразуем дерево в плоский список
      const flatCategories = flattenTree(treeCategories);
      
      console.log(`📋 Найдено категорий: ${flatCategories.length}\n`);
      
      // Преобразуем формат из API в формат Prisma
      categories = flatCategories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        parent_id: cat.parent_id,
        level: cat.level || 0,
        path: cat.path || '',
        sort_order: cat.sort_order || 0,
        is_active: cat.is_active !== false,
        _count: {
          products: cat.products_count || 0
        }
      }));
    }

    // Преобразуем в нужный формат с количеством товаров
    const categoriesWithCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      parent_id: category.parent_id,
      level: category.level,
      path: category.path,
      sort_order: category.sort_order,
      is_active: category.is_active,
      products_count: category._count.products,
      children: [] as any[]
    }));

    // Строим дерево
    const categoryMap = new Map();
    const rootCategories: any[] = [];

    // Создаем карту категорий
    categoriesWithCounts.forEach(category => {
      categoryMap.set(category.id, category);
    });

    // Строим иерархию
    categoriesWithCounts.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(category);
          // Сортируем дочерние категории
          parent.children.sort((a: any, b: any) => {
            if (a.sort_order !== b.sort_order) {
              return a.sort_order - b.sort_order;
            }
            return a.name.localeCompare(b.name, 'ru');
          });
        }
      } else {
        rootCategories.push(category);
      }
    });

    // Сортируем корневые категории
    rootCategories.sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }
      return a.name.localeCompare(b.name, 'ru');
    });

    console.log(`🌳 Корневых категорий: ${rootCategories.length}\n`);

    // Строим плоский список с иерархией
    const hierarchyRows = buildCategoryHierarchy(rootCategories);

    console.log(`📝 Строк в иерархии: ${hierarchyRows.length}\n`);

    // Создаем Excel файл
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Иерархия категорий');

    // Устанавливаем заголовки
    worksheet.columns = [
      { header: 'Уровень', key: 'level', width: 8 },
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Название', key: 'name', width: 50 },
      { header: 'Родитель ID', key: 'parent_id', width: 30 },
      { header: 'Путь', key: 'path', width: 60 },
      { header: 'Товаров', key: 'products_count', width: 12 },
      { header: 'Порядок', key: 'sort_order', width: 10 },
      { header: 'Активна', key: 'is_active', width: 10 },
    ];

    // Стили для заголовков
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Добавляем данные
    hierarchyRows.forEach((row, index) => {
      const excelRow = worksheet.addRow({
        level: row.level,
        id: row.id,
        name: `${row.indent}${row.name}`,
        parent_id: row.parent_id || '',
        path: row.path,
        products_count: row.products_count,
        sort_order: row.sort_order,
        is_active: row.is_active ? 'Да' : 'Нет',
      });

      // Стили для строк
      if (row.level === 0) {
        // Корневые категории - жирный шрифт
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' }
        };
      } else if (row.level === 1) {
        // Первый уровень - светлый фон
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }

      // Выравнивание
      excelRow.getCell('level').alignment = { vertical: 'middle', horizontal: 'center' };
      excelRow.getCell('products_count').alignment = { vertical: 'middle', horizontal: 'center' };
      excelRow.getCell('sort_order').alignment = { vertical: 'middle', horizontal: 'center' };
      excelRow.getCell('is_active').alignment = { vertical: 'middle', horizontal: 'center' };

      // Цвет для неактивных категорий
      if (!row.is_active) {
        excelRow.font = { italic: true, color: { argb: 'FF808080' } };
      }
    });

    // Фиксируем первую строку (заголовки)
    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 1
      }
    ];

    // Автоподбор ширины колонок
    worksheet.columns.forEach((column) => {
      if (column.header) {
        column.width = Math.max(column.width || 10, column.header.toString().length + 2);
      }
    });

    // Сохраняем файл
    await workbook.xlsx.writeFile(OUTPUT_FILE);

    console.log('='.repeat(80));
    console.log(`\n✅ Файл успешно создан: ${OUTPUT_FILE}\n`);
    console.log(`📊 Статистика:`);
    console.log(`   Всего категорий: ${hierarchyRows.length}`);
    console.log(`   Корневых категорий: ${rootCategories.length}`);
    console.log(`   Максимальный уровень: ${Math.max(...hierarchyRows.map(r => r.level))}`);
    console.log(`   Категорий с товарами: ${hierarchyRows.filter(r => r.products_count > 0).length}`);
    console.log(`   Неактивных категорий: ${hierarchyRows.filter(r => !r.is_active).length}\n`);

  } catch (error) {
    console.error('\n❌ Ошибка при экспорте категорий:');
    console.error(error);
    if (error instanceof Error) {
      console.error(`   Сообщение: ${error.message}`);
    }
    process.exit(1);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

// Запускаем экспорт
exportCategoriesHierarchy()
  .then(() => {
    console.log('✅ Экспорт завершен успешно\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });

