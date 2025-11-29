// Скрипт сравнения данных YML и CSV файлов
// Использование: npm run compare:yml-csv

import * as fs from 'fs';
import * as path from 'path';

const YML_FILE = path.join(process.cwd(), 'app', 'light', 'all.yml');
const CSV_FILE = path.join(process.cwd(), 'app', 'light', 'all (1).csv');

interface ProductInfo {
  id: string;
  name: string;
  price: string;
  categoryId: string;
}

function parseYMLProducts(filePath: string): Map<string, ProductInfo> {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  const products = new Map<string, ProductInfo>();
  
  // Парсим товары из YML
  const offerRegex = /<offer\s+id="([^"]+)"[^>]*>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<price>([^<]+)<\/price>[\s\S]*?<categoryId>([^<]+)<\/categoryId>[\s\S]*?<\/offer>/g;
  let match;
  
  while ((match = offerRegex.exec(xmlContent)) !== null) {
    const id = match[1];
    const name = match[2].trim();
    const price = match[3].trim();
    const categoryId = match[4].trim();
    
    products.set(id, {
      id,
      name,
      price,
      categoryId
    });
  }
  
  return products;
}

function parseCSVProducts(filePath: string): Map<string, ProductInfo> {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  const products = new Map<string, ProductInfo>();
  
  if (lines.length === 0) return products;
  
  // Парсим заголовки (ищем английские названия, так как кириллица может быть повреждена)
  const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
  
  // Ищем индексы колонок (пробуем разные варианты)
  let idIndex = headers.findIndex(h => h === 'id' || h.includes('id'));
  let nameIndex = headers.findIndex(h => h === 'name' || h.includes('название') || h.includes('name'));
  let priceIndex = headers.findIndex(h => h === 'price' || h.includes('цена') || h.includes('price'));
  let categoryIdIndex = headers.findIndex(h => h === 'categoryid' || h.includes('category') || h.includes('категория'));
  
  // Если не нашли по названиям, пробуем по позициям (обычно первые колонки)
  if (idIndex === -1) idIndex = 0;
  if (nameIndex === -1) nameIndex = headers.findIndex((h, i) => i > 0 && h.length > 0) || 2;
  if (priceIndex === -1) priceIndex = headers.findIndex((h, i) => i > 5 && h.match(/^\d+$/)) || 6;
  if (categoryIdIndex === -1) categoryIdIndex = headers.findIndex((h, i) => i > 8 && h.match(/^\d{3}$/)) || 8;
  
  console.log(`   Индексы колонок: id=${idIndex}, name=${nameIndex}, price=${priceIndex}, categoryId=${categoryIdIndex}`);
  
  // Парсим данные
  let parsedCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    if (values.length < Math.max(idIndex, nameIndex, priceIndex, categoryIdIndex) + 1) {
      continue;
    }
    
    const id = values[idIndex]?.trim();
    const name = values[nameIndex]?.trim();
    const price = values[priceIndex]?.trim();
    const categoryId = values[categoryIdIndex]?.trim();
    
    if (id && name && price && categoryId) {
      products.set(id, {
        id,
        name,
        price,
        categoryId
      });
      parsedCount++;
    }
  }
  
  console.log(`   Успешно распарсено товаров: ${parsedCount}`);
  
  return products;
}

function compareFiles() {
  console.log('\n📊 Сравнение YML и CSV файлов...\n');
  console.log('='.repeat(80));

  try {
    // Проверяем существование файлов
    if (!fs.existsSync(YML_FILE)) {
      throw new Error(`YML файл не найден: ${YML_FILE}`);
    }
    
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV файл не найден: ${CSV_FILE}`);
    }

    console.log(`📄 YML файл: ${YML_FILE}`);
    console.log(`📄 CSV файл: ${CSV_FILE}\n`);

    // Парсим товары
    console.log('🔍 Парсинг YML файла...');
    const ymlProducts = parseYMLProducts(YML_FILE);
    console.log(`   Найдено товаров в YML: ${ymlProducts.size}\n`);

    console.log('🔍 Парсинг CSV файла...');
    const csvProducts = parseCSVProducts(CSV_FILE);
    console.log(`   Найдено товаров в CSV: ${csvProducts.size}\n`);

    // Сравниваем
    console.log('='.repeat(80));
    console.log('📊 РЕЗУЛЬТАТЫ СРАВНЕНИЯ:\n');

    // Товары только в YML
    const onlyInYML = Array.from(ymlProducts.keys()).filter(id => !csvProducts.has(id));
    
    // Товары только в CSV
    const onlyInCSV = Array.from(csvProducts.keys()).filter(id => !ymlProducts.has(id));
    
    // Общие товары
    const commonIds = Array.from(ymlProducts.keys()).filter(id => csvProducts.has(id));
    
    // Различия в данных
    const differences: Array<{
      id: string;
      field: string;
      ymlValue: string;
      csvValue: string;
    }> = [];

    commonIds.forEach(id => {
      const yml = ymlProducts.get(id)!;
      const csv = csvProducts.get(id)!;
      
      if (yml.name !== csv.name) {
        differences.push({
          id,
          field: 'name',
          ymlValue: yml.name,
          csvValue: csv.name
        });
      }
      
      if (yml.price !== csv.price) {
        differences.push({
          id,
          field: 'price',
          ymlValue: yml.price,
          csvValue: csv.price
        });
      }
      
      if (yml.categoryId !== csv.categoryId) {
        differences.push({
          id,
          field: 'categoryId',
          ymlValue: yml.categoryId,
          csvValue: csv.categoryId
        });
      }
    });

    // Статистика
    console.log(`📈 Статистика:`);
    console.log(`   Всего товаров в YML: ${ymlProducts.size}`);
    console.log(`   Всего товаров в CSV: ${csvProducts.size}`);
    console.log(`   Общих товаров: ${commonIds.length}`);
    console.log(`   Только в YML: ${onlyInYML.length}`);
    console.log(`   Только в CSV: ${onlyInCSV.length}`);
    console.log(`   Отличий в данных: ${differences.length}\n`);

    // Детали
    if (onlyInYML.length > 0) {
      console.log(`⚠️  Товары только в YML (первые 10):`);
      onlyInYML.slice(0, 10).forEach(id => {
        const product = ymlProducts.get(id)!;
        console.log(`   - ${id}: ${product.name}`);
      });
      if (onlyInYML.length > 10) {
        console.log(`   ... и еще ${onlyInYML.length - 10} товаров`);
      }
      console.log('');
    }

    if (onlyInCSV.length > 0) {
      console.log(`⚠️  Товары только в CSV (первые 10):`);
      onlyInCSV.slice(0, 10).forEach(id => {
        const product = csvProducts.get(id)!;
        console.log(`   - ${id}: ${product.name}`);
      });
      if (onlyInCSV.length > 10) {
        console.log(`   ... и еще ${onlyInCSV.length - 10} товаров`);
      }
      console.log('');
    }

    if (differences.length > 0) {
      console.log(`⚠️  Отличия в данных (первые 10):`);
      differences.slice(0, 10).forEach(diff => {
        console.log(`   ID: ${diff.id}, Поле: ${diff.field}`);
        console.log(`     YML: ${diff.ymlValue}`);
        console.log(`     CSV: ${diff.csvValue}`);
      });
      if (differences.length > 10) {
        console.log(`   ... и еще ${differences.length - 10} отличий`);
      }
      console.log('');
    }

    // Выводы
    console.log('='.repeat(80));
    console.log('\n📝 ВЫВОДЫ:\n');
    
    if (ymlProducts.size === csvProducts.size && onlyInYML.length === 0 && onlyInCSV.length === 0 && differences.length === 0) {
      console.log('✅ Файлы полностью идентичны по количеству и основным данным товаров');
    } else {
      console.log('⚠️  Файлы имеют различия:');
      if (onlyInYML.length > 0 || onlyInCSV.length > 0) {
        console.log(`   - Разное количество товаров (разница: ${Math.abs(ymlProducts.size - csvProducts.size)})`);
      }
      if (differences.length > 0) {
        console.log(`   - Различия в данных у ${differences.length} товаров`);
      }
      
      console.log('\n💡 Формат данных:');
      console.log('   YML: XML формат с вложенной структурой, все параметры в тегах <param>');
      console.log('   CSV: Табличный формат, все параметры в отдельных колонках');
      console.log('   → CSV может содержать больше колонок с детализацией параметров');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Ошибка при сравнении файлов:');
    console.error(error);
    if (error instanceof Error) {
      console.error(`   Сообщение: ${error.message}`);
    }
    process.exit(1);
  }
}

// Запускаем сравнение
compareFiles();

