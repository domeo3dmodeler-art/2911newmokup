// Скрипт экспорта структуры категорий из YML файла в Excel
// Использование: npm run export:yml-categories-hierarchy

import * as fs from 'fs';
import * as path from 'path';
import ExcelJS from 'exceljs';

const YML_FILE = path.join(process.cwd(), 'app', 'light', 'all.yml');
const OUTPUT_FILE = path.join(process.cwd(), 'docs', 'YML_CATEGORIES_HIERARCHY.xlsx');

interface YMLCategory {
  id: string;
  name: string;
  parent_id: string | null;
  level: number;
  products_count: number;
  sort_order: number;
}

// Функция для парсинга категорий из YML (XML) файла
function parseYMLCategories(filePath: string): Array<{ id: string; name: string }> {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const categories: Array<{ id: string; name: string }> = [];
  
  // Ищем все теги <category id="...">...</category>
  const categoryRegex = /<category\s+id="([^"]+)">([^<]+)<\/category>/g;
  let match;
  
  while ((match = categoryRegex.exec(xmlContent)) !== null) {
    categories.push({
      id: match[1],
      name: match[2].trim()
    });
  }
  
  return categories;
}

// Функция для подсчета товаров по категориям
function countProductsByCategory(filePath: string): Map<string, number> {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const productCounts = new Map<string, number>();
  
  // Ищем все теги <offer> с <categoryId>
  const offerRegex = /<offer[^>]*>[\s\S]*?<categoryId>([^<]+)<\/categoryId>[\s\S]*?<\/offer>/g;
  let match;
  
  while ((match = offerRegex.exec(xmlContent)) !== null) {
    const categoryId = match[1].trim();
    const currentCount = productCounts.get(categoryId) || 0;
    productCounts.set(categoryId, currentCount + 1);
  }
  
  return productCounts;
}

// Функция для построения иерархии категорий на основе логики именования
function buildCategoryHierarchy(categories: Array<{ id: string; name: string }>, productCounts: Map<string, number>): YMLCategory[] {
  const categoryMap = new Map<string, YMLCategory>();
  const rootCategories: YMLCategory[] = [];
  
  // Создаем объекты категорий
  categories.forEach((cat, index) => {
    const category: YMLCategory = {
      id: cat.id,
      name: cat.name,
      parent_id: null,
      level: 0,
      products_count: productCounts.get(cat.id) || 0,
      sort_order: index + 1
    };
    categoryMap.set(cat.id, category);
  });
  
  // Пытаемся определить иерархию на основе логики именования
  categories.forEach(cat => {
    const category = categoryMap.get(cat.id)!;
    
    // Простая логика: если название содержит "комплектующие для", пытаемся найти родительскую категорию
    if (cat.name.toLowerCase().includes('комплектующие')) {
      // Ищем потенциального родителя по ключевым словам
      const parentKeyword = cat.name
        .toLowerCase()
        .replace('комплектующие для', '')
        .replace('комплектующие к', '')
        .trim()
        .split(' ')[0];
      
      // Пытаемся найти категорию-родителя
      for (const [id, otherCat] of categoryMap.entries()) {
        if (id !== cat.id && otherCat.name.toLowerCase().includes(parentKeyword)) {
          category.parent_id = id;
          category.level = 1;
          const parent = categoryMap.get(id);
          if (parent) {
            category.level = parent.level + 1;
          }
          break;
        }
      }
    }
    
    // Если родитель не найден, это корневая категория
    if (!category.parent_id) {
      rootCategories.push(category);
    }
  });
  
  // Сортируем категории
  const allCategories = Array.from(categoryMap.values());
  allCategories.sort((a, b) => {
    // Сначала по уровню
    if (a.level !== b.level) {
      return a.level - b.level;
    }
    // Затем по порядку
    return a.sort_order - b.sort_order;
  });
  
  return allCategories;
}

// Функция для группировки категорий
function groupCategories(categories: Array<{ id: string; name: string }>): {
  basicLighting: Array<{ id: string; name: string }>;
  specialized: Array<{ id: string; name: string }>;
  lamps: Array<{ id: string; name: string }>;
  accessories: Array<{ id: string; name: string }>;
  control: Array<{ id: string; name: string }>;
  tracks: Array<{ id: string; name: string }>;
  led: Array<{ id: string; name: string }>;
  lighting: Array<{ id: string; name: string }>;
  other: Array<{ id: string; name: string }>;
} {
  const basicLighting = categories.filter(cat => {
    const name = cat.name || '';
    return ['Люстра', 'Подвесной', 'Потолочный', 'Напольный', 'Настольный', 'Настенный', 'Встраиваемый'].some(
      keyword => name.includes(keyword)
    );
  });

  const specialized = categories.filter(cat => {
    const name = cat.name || '';
    return ['Спот', 'Трековый', 'Прожектор', 'Ландшафтный', 'Садово-парковый', 'Парковый'].some(
      keyword => name.includes(keyword)
    );
  });

  const lamps = categories.filter(cat => {
    const name = cat.name || '';
    return name.includes('Лампочка') || name.includes('Лампа');
  });

  const accessories = categories.filter(cat => {
    const name = cat.name || '';
    return ['Аксессуар', 'Плафон', 'Комплектующие', 'Крепление'].some(
      keyword => name.includes(keyword)
    );
  });

  const control = categories.filter(cat => {
    const name = cat.name || '';
    return ['Диммер', 'Выключатель', 'Контроллер', 'Панель управления', 'Пульт'].some(
      keyword => name.includes(keyword)
    );
  });

  const tracks = categories.filter(cat => {
    const name = cat.name || '';
    return name.includes('Шинопровод');
  });

  const led = categories.filter(cat => {
    const name = cat.name || '';
    return name.includes('Светодиодная') || name.includes('Led') || name.includes('LED');
  });

  const lighting = categories.filter(cat => {
    const name = cat.name || '';
    return name.includes('Подсветка') || name.includes('Подсвет');
  });

  const other = categories.filter(cat => {
    const name = cat.name || '';
    return !basicLighting.includes(cat) &&
           !specialized.includes(cat) &&
           !accessories.includes(cat) &&
           !control.includes(cat) &&
           !tracks.includes(cat) &&
           !lamps.includes(cat) &&
           !led.includes(cat) &&
           !lighting.includes(cat);
  });

  return {
    basicLighting,
    specialized,
    lamps,
    accessories,
    control,
    tracks,
    led,
    lighting,
    other
  };
}

async function exportYMLCategoriesHierarchy() {
  console.log('\n📊 Экспорт структуры категорий из YML файла в Excel...\n');
  console.log('='.repeat(80));

  try {
    // Проверяем существование файла
    if (!fs.existsSync(YML_FILE)) {
      throw new Error(`Файл не найден: ${YML_FILE}`);
    }

    console.log(`📄 Чтение YML файла: ${YML_FILE}\n`);

    // Парсим категории
    const categories = parseYMLCategories(YML_FILE);
    console.log(`📋 Найдено категорий: ${categories.length}\n`);

    // Подсчитываем товары по категориям
    console.log('🔍 Подсчет товаров по категориям...\n');
    const productCounts = countProductsByCategory(YML_FILE);
    
    const totalProducts = Array.from(productCounts.values()).reduce((sum, count) => sum + count, 0);
    console.log(`📦 Всего товаров: ${totalProducts}`);
    console.log(`📦 Категорий с товарами: ${productCounts.size}\n`);

    // Строим иерархию
    const hierarchy = buildCategoryHierarchy(categories, productCounts);

    // Группируем категории
    const grouped = groupCategories(categories);

    console.log('📊 Группировка категорий:');
    console.log(`   Основные светильники: ${grouped.basicLighting.length}`);
    console.log(`   Специализированные: ${grouped.specialized.length}`);
    console.log(`   Лампы: ${grouped.lamps.length}`);
    console.log(`   Комплектующие: ${grouped.accessories.length}`);
    console.log(`   Системы управления: ${grouped.control.length}`);
    console.log(`   Шинопроводы: ${grouped.tracks.length}`);
    console.log(`   Светодиодные: ${grouped.led.length}`);
    console.log(`   Подсветка: ${grouped.lighting.length}`);
    console.log(`   Прочее: ${grouped.other.length}\n`);

    // Проверяем дубликаты ID
    const duplicateIds: Map<string, string[]> = new Map();
    categories.forEach(cat => {
      if (!duplicateIds.has(cat.id)) {
        duplicateIds.set(cat.id, []);
      }
      duplicateIds.get(cat.id)!.push(cat.name);
    });

    const duplicates = Array.from(duplicateIds.entries()).filter(([id, names]) => names.length > 1);
    
    if (duplicates.length > 0) {
      console.log('⚠️  Обнаружены дубликаты ID:');
      duplicates.forEach(([id, names]) => {
        console.log(`   ID "${id}": ${names.length} категорий - ${names.join(', ')}`);
      });
      console.log('');
    }

    // Создаем Excel файл
    const workbook = new ExcelJS.Workbook();
    
    // Лист 1: Все категории
    const worksheet = workbook.addWorksheet('Все категории');
    
    // Устанавливаем заголовки
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Название', key: 'name', width: 60 },
      { header: 'Родитель ID', key: 'parent_id', width: 15 },
      { header: 'Уровень', key: 'level', width: 10 },
      { header: 'Товаров', key: 'products_count', width: 12 },
      { header: 'Порядок', key: 'sort_order', width: 10 },
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
    hierarchy.forEach(cat => {
      const indent = '  '.repeat(cat.level);
      const excelRow = worksheet.addRow({
        id: cat.id,
        name: `${indent}${cat.name}`,
        parent_id: cat.parent_id || '',
        level: cat.level,
        products_count: cat.products_count,
        sort_order: cat.sort_order,
      });

      // Стили для строк
      if (cat.level === 0) {
        excelRow.font = { bold: true };
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE7E6E6' }
        };
      } else if (cat.level === 1) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }

      // Выравнивание
      excelRow.getCell('id').alignment = { vertical: 'middle', horizontal: 'center' };
      excelRow.getCell('level').alignment = { vertical: 'middle', horizontal: 'center' };
      excelRow.getCell('products_count').alignment = { vertical: 'middle', horizontal: 'center' };
      excelRow.getCell('sort_order').alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Выделяем категории с товарами
      if (cat.products_count > 0) {
        excelRow.getCell('products_count').font = { bold: true, color: { argb: 'FF006100' } };
      }
      
      // Выделяем дубликаты ID
      if (duplicates.some(([id]) => id === cat.id)) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE699' }
        };
        excelRow.getCell('id').font = { bold: true, color: { argb: 'FFFF0000' } };
      }
    });

    // Лист 2: Группировка
    const groupWorksheet = workbook.addWorksheet('Группировка');
    
    groupWorksheet.columns = [
      { header: 'Группа', key: 'group', width: 30 },
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Название', key: 'name', width: 50 },
      { header: 'Товаров', key: 'products_count', width: 12 },
    ];

    const groupHeaderRow = groupWorksheet.getRow(1);
    groupHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    groupHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    groupHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
    groupHeaderRow.height = 25;

    // Добавляем группы
    const groups = [
      { name: 'Основные светильники', categories: grouped.basicLighting },
      { name: 'Специализированные', categories: grouped.specialized },
      { name: 'Лампы', categories: grouped.lamps },
      { name: 'Светодиодные', categories: grouped.led },
      { name: 'Подсветка', categories: grouped.lighting },
      { name: 'Шинопроводы', categories: grouped.tracks },
      { name: 'Комплектующие', categories: grouped.accessories },
      { name: 'Системы управления', categories: grouped.control },
      { name: 'Прочее', categories: grouped.other },
    ];

    groups.forEach(group => {
      if (group.categories.length > 0) {
        // Добавляем заголовок группы
        const groupRow = groupWorksheet.addRow({
          group: group.name,
          id: '',
          name: `(${group.categories.length} категорий)`,
          products_count: '',
        });
        groupRow.font = { bold: true, size: 12 };
        groupRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9E1F2' }
        };

        // Добавляем категории группы
        group.categories.forEach(cat => {
          const count = productCounts.get(cat.id) || 0;
          const catRow = groupWorksheet.addRow({
            group: '',
            id: cat.id,
            name: cat.name,
            products_count: count,
          });
          
          if (count > 0) {
            catRow.getCell('products_count').font = { bold: true, color: { argb: 'FF006100' } };
          }
        });
        
        // Пустая строка после группы
        groupWorksheet.addRow({});
      }
    });

    // Фиксируем первую строку
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    groupWorksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Сохраняем файл
    await workbook.xlsx.writeFile(OUTPUT_FILE);

    console.log('='.repeat(80));
    console.log(`\n✅ Файл успешно создан: ${OUTPUT_FILE}\n`);
    console.log(`📊 Статистика:`);
    console.log(`   Всего категорий: ${categories.length}`);
    console.log(`   Всего товаров: ${totalProducts}`);
    console.log(`   Категорий с товарами: ${productCounts.size}`);
    console.log(`   Дубликатов ID: ${duplicates.length}`);
    console.log(`   Максимальный уровень: ${Math.max(...hierarchy.map(h => h.level))}\n`);

  } catch (error) {
    console.error('\n❌ Ошибка при экспорте категорий:');
    console.error(error);
    if (error instanceof Error) {
      console.error(`   Сообщение: ${error.message}`);
    }
    process.exit(1);
  }
}

// Запускаем экспорт
exportYMLCategoriesHierarchy()
  .then(() => {
    console.log('✅ Экспорт завершен успешно\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
  });

