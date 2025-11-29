import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';
import * as XLSX from 'xlsx';
import { catalogService } from './catalog.service';
import { CatalogImportResult } from '../types/catalog';


export interface ExcelRow {
  [key: string]: any;
}

export class CatalogImportService {
  /**
   * Импорт каталога из Excel файла
   */
  async importFromExcel(file: Buffer, filename: string): Promise<CatalogImportResult> {
    try {
      logger.info('Начало импорта каталога', 'catalog-import-service', { filename, fileSize: file.length });
      
      // Читаем Excel файл
      logger.debug('Чтение Excel файла', 'catalog-import-service', { filename });
      const workbook = XLSX.read(file, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      logger.debug('Имя листа', 'catalog-import-service', { filename, sheetName });
      const worksheet = workbook.Sheets[sheetName];
      
      // Конвертируем в JSON
      logger.debug('Конвертация в массив', 'catalog-import-service', { filename });
      const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      logger.debug('Данные из Excel', 'catalog-import-service', { filename, totalRows: data.length, firstRows: data.slice(0, 5) });
      
      // Пропускаем заголовок (первую строку) - данные начинаются со второй строки
      const rows = data.slice(1).filter(row => row.length > 0);
      logger.debug('Строки после фильтрации', 'catalog-import-service', { filename, filteredRows: rows.length, firstRows: rows.slice(0, 3) });
      
      if (rows.length === 0) {
        logger.warn('Файл не содержит данных', 'catalog-import-service', { filename });
        return {
          success: false,
          message: 'Файл не содержит данных',
          imported: 0,
          errors: ['Файл пуст или не содержит данных'],
          warnings: [],
          categories: []
        };
      }

      // Анализируем структуру файла
      logger.debug('Анализ структуры файла', 'catalog-import-service', { filename });
      const analysis = this.analyzeFileStructure(rows);
      logger.debug('Анализ структуры', 'catalog-import-service', { filename, analysis });
      
      if (!analysis.isValid) {
        logger.warn('Структура файла неверная', 'catalog-import-service', { filename, errors: analysis.errors });
        return {
          success: false,
          message: 'Неверная структура файла',
          imported: 0,
          errors: analysis.errors,
          warnings: analysis.warnings,
          categories: []
        };
      }

      // Парсим категории
      logger.debug('Парсинг категорий', 'catalog-import-service', { filename });
      const categories = this.parseCategories(rows, analysis);
      logger.debug('Распарсенные категории', 'catalog-import-service', { filename, categoriesCount: categories.length });
      
      // Валидируем данные
      logger.debug('Валидация категорий', 'catalog-import-service', { filename });
      const validation = this.validateCategories(categories);
      logger.debug('Валидация', 'catalog-import-service', { filename, isValid: validation.isValid, errorsCount: validation.errors.length, warningsCount: validation.warnings.length });
      
      if (!validation.isValid) {
        logger.warn('Валидация не пройдена', 'catalog-import-service', { filename, errors: validation.errors });
        return {
          success: false,
          message: 'Ошибки валидации данных',
          imported: 0,
          errors: validation.errors,
          warnings: validation.warnings,
          categories: []
        };
      }

      // Импортируем в базу данных
      logger.info('Импорт в базу данных', 'catalog-import-service', { filename, categoriesCount: categories.length });
      const importResult = await this.importToDatabase(categories);
      logger.info('Результат импорта в БД', 'catalog-import-service', { filename, imported: importResult.imported, errorsCount: importResult.errors.length, warningsCount: importResult.warnings.length });
      
      return {
        success: true,
        message: `Успешно импортировано ${importResult.imported} категорий`,
        imported: importResult.imported,
        errors: importResult.errors,
        warnings: [...analysis.warnings, ...validation.warnings, ...importResult.warnings],
        categories: categories.map(cat => ({
          name: cat.name,
          level: cat.level,
          path: cat.path,
          parent: cat.parent,
          fullPath: cat.fullPath
        }))
      };

    } catch (error) {
      logger.error('Error importing catalog', 'catalog-import-service', error instanceof Error ? { error: error.message, stack: error.stack, filename } : { error: String(error), filename });
      return {
        success: false,
        message: 'Ошибка при импорте файла',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Неизвестная ошибка'],
        warnings: [],
        categories: []
      };
    }
  }

  /**
   * Анализ структуры файла
   */
  private analyzeFileStructure(rows: ExcelRow[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    maxLevel: number;
    columns: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (rows.length === 0) {
      errors.push('Файл не содержит данных');
      return { isValid: false, errors, warnings, maxLevel: 0, columns: [] };
    }

    // Определяем максимальное количество колонок
    const maxColumns = Math.max(...rows.map(row => Array.isArray(row) ? row.length : 0));
    
    if (maxColumns < 2) {
      errors.push('Файл должен содержать минимум 2 колонки (название и уровень)');
      return { isValid: false, errors, warnings, maxLevel: 0, columns: [] };
    }

    // Генерируем названия колонок
    const columns = Array.from({ length: maxColumns }, (_, i) => `Колонка ${i + 1}`);
    
    // Определяем максимальный уровень вложенности
    let maxLevel = 0;
    for (const row of rows) {
      if (Array.isArray(row)) {
        // Ищем первую непустую ячейку с названием
        for (let i = 0; i < row.length; i++) {
          if (row[i] && typeof row[i] === 'string' && row[i].trim()) {
            maxLevel = Math.max(maxLevel, i + 1);
            break;
          }
        }
      }
    }

    if (maxLevel === 0) {
      errors.push('Не найдено ни одной категории с названием');
      return { isValid: false, errors, warnings, maxLevel: 0, columns: [] };
    }

    if (maxLevel > 10) {
      warnings.push(`Обнаружено ${maxLevel} уровней вложенности. Рекомендуется не более 5-6 уровней.`);
    }

    return {
      isValid: true,
      errors,
      warnings,
      maxLevel,
      columns
    };
  }

  /**
   * Парсинг категорий из строк Excel
   */
  private parseCategories(rows: ExcelRow[], analysis: any): Array<{
    name: string;
    level: number;
    path: string;
    parent?: string;
    sortOrder: number;
    fullPath: string; // Полный путь для проверки дубликатов
  }> {
    const categories: Array<{
      name: string;
      level: number;
      path: string;
      parent?: string;
      sortOrder: number;
      fullPath: string;
    }> = [];

    // Карта для отслеживания созданных категорий по полному пути
    const categoryMap = new Map<string, string>(); // fullPath -> name
    const parentMap = new Map<string, string>(); // fullPath -> parentFullPath

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      
      if (!Array.isArray(row)) continue;

      logger.debug('Обработка строки', 'catalog-import-service', { rowIndex: rowIndex + 2, row });
      
      // Собираем все непустые ячейки в строке по порядку
      const filledValues: string[] = [];
      let categoryName = '';
      let level = 0;
      let hasGap = false; // Флаг для проверки пропусков в иерархии
      let firstEmptyIndex = -1; // Индекс первой пустой ячейки
      
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const cellValue = row[colIndex];
        
        if (cellValue && typeof cellValue === 'string' && cellValue.trim()) {
          filledValues.push(cellValue.trim());
          if (!categoryName) {
            categoryName = cellValue.trim();
            level = colIndex + 1;
            logger.debug('Название категории найдено', 'catalog-import-service', { rowIndex: rowIndex + 2, categoryName, level });
          }
        } else {
          if (firstEmptyIndex === -1) {
            firstEmptyIndex = colIndex;
          }
        }
      }

      logger.debug('Заполненные значения', 'catalog-import-service', { rowIndex: rowIndex + 2, filledValues, categoryName, level });

      if (!categoryName) {
        logger.debug('Строка без названия категории, пропускаем', 'catalog-import-service', { rowIndex: rowIndex + 2 });
        continue;
      }

      // Проверяем на пропуски в иерархии (ошибка)
      // Ошибка: если есть пустая ячейка в середине последовательности заполненных ячеек
      logger.debug('Проверка на пропуски в иерархии', 'catalog-import-service', { rowIndex: rowIndex + 2 });
      
      // Находим все заполненные ячейки по их позициям в исходной строке
      const filledIndices: number[] = [];
      for (let i = 0; i < row.length; i++) {
        const cellValue = row[i];
        if (cellValue && typeof cellValue === 'string' && cellValue.trim()) {
          filledIndices.push(i);
        }
      }
      
      logger.debug('Заполненные ячейки', 'catalog-import-service', { rowIndex: rowIndex + 2, filledIndices });
      
      // Проверяем, что заполненные ячейки идут подряд без пропусков
      if (filledIndices.length > 1) {
        for (let i = 0; i < filledIndices.length - 1; i++) {
          const currentIndex = filledIndices[i];
          const nextIndex = filledIndices[i + 1];
          
          // Если между текущей и следующей заполненной ячейкой есть пропуск
          if (nextIndex - currentIndex > 1) {
            logger.error('Пропуск между ячейками', 'catalog-import-service', { rowIndex: rowIndex + 2, currentIndex, nextIndex });
            hasGap = true;
            break;
          }
        }
      }

      if (hasGap) {
        logger.error('Пропуск в иерархии', 'catalog-import-service', { rowIndex: rowIndex + 2 });
        throw new Error(`Строка ${rowIndex + 2}: пропуск в иерархии - промежуточные категории не должны быть пустыми`);
      }
      
      logger.debug('Проверка на пропуски пройдена успешно', 'catalog-import-service', { rowIndex: rowIndex + 2 });

      // Строим полный путь для этой строки
      // Используем специальный разделитель для путей, чтобы не конфликтовать с / в названиях
      const fullPath = filledValues.join('|');
      logger.debug('Полный путь', 'catalog-import-service', { rowIndex: rowIndex + 2, fullPath });
      
      // Определяем родительский путь
      let parentFullPath = '';
      let parentName = '';
      
      if (level > 1) {
        // Создаем родительский путь, убирая последний элемент
        parentFullPath = filledValues.slice(0, -1).join('|');
        logger.debug('Родительский путь', 'catalog-import-service', { rowIndex: rowIndex + 2, parentFullPath });
        
        // Проверяем, что родитель существует
        if (!categoryMap.has(parentFullPath)) {
          logger.error('Родительская категория не найдена', 'catalog-import-service', { rowIndex: rowIndex + 2, parentFullPath, categoryName });
          throw new Error(`Строка ${rowIndex + 2}: родительская категория не найдена для "${categoryName}"`);
        }
        
        parentName = categoryMap.get(parentFullPath) || '';
      }

      // Проверяем на дубликаты полного пути только для конечной категории
      // Дубликат возможен только если это конечная категория (не промежуточная)
      const isLeafCategory = filledValues.length === level; // Конечная категория в строке
      
      if (isLeafCategory && categoryMap.has(fullPath)) {
        logger.error('Дубликат полного пути', 'catalog-import-service', { rowIndex: rowIndex + 2, fullPath });
        throw new Error(`Строка ${rowIndex + 2}: дубликат полного пути "${fullPath}"`);
      }

      // Создаем все промежуточные категории в иерархии
      logger.debug('Заполненные значения для создания иерархии', 'catalog-import-service', { rowIndex: rowIndex + 2, filledValues });
      
      for (let i = 0; i < filledValues.length; i++) {
        const currentPath = filledValues.slice(0, i + 1).join('|');
        const currentName = filledValues[i];
        const currentLevel = i + 1;
        const currentParentPath = i > 0 ? filledValues.slice(0, i).join('|') : '';
        const currentParentName = i > 0 ? filledValues[i - 1] : '';
        
        logger.debug('Проверяем категорию уровня', 'catalog-import-service', { rowIndex: rowIndex + 2, currentLevel, currentName, currentPath });
        
        // Если категория еще не создана, создаем ее
        if (!categoryMap.has(currentPath)) {
          logger.debug('Создаем новую категорию', 'catalog-import-service', { rowIndex: rowIndex + 2, currentName });
          
          categoryMap.set(currentPath, currentName);
          if (currentParentPath) {
            parentMap.set(currentPath, currentParentPath);
          }
          
          // Строим путь для отображения (только имена родителей)
          const pathParts = currentParentPath ? currentParentPath.split('|') : [];
          const displayPath = pathParts.join('/');
          
          categories.push({
            name: currentName,
            level: currentLevel,
            path: displayPath,
            parent: currentParentPath, // Используем полный путь родителя вместо имени
            sortOrder: rowIndex + 1,
            fullPath: currentPath
          });
          
          logger.debug('Добавлена категория', 'catalog-import-service', { rowIndex: rowIndex + 2, currentName, currentLevel });
        } else {
          logger.debug('Категория уже существует', 'catalog-import-service', { rowIndex: rowIndex + 2, currentName });
        }
      }
    }

    return categories;
  }

  /**
   * Валидация категорий
   */
  private validateCategories(categories: Array<{
    name: string;
    level: number;
    path: string;
    parent?: string;
    sortOrder: number;
    fullPath: string;
  }>): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const fullPathSet = new Set<string>(); // Для проверки полных дубликатов
    const nameSet = new Set<string>(); // Для статистики уникальных названий

    for (const category of categories) {
      // Проверка на пустое название
      if (!category.name || category.name.trim().length === 0) {
        errors.push(`Строка ${category.sortOrder}: пустое название категории`);
        continue;
      }

      // Проверка на полные дубликаты (одинаковые полные пути)
      if (fullPathSet.has(category.fullPath)) {
        errors.push(`Строка ${category.sortOrder}: полный дубликат пути "${category.fullPath}"`);
      } else {
        fullPathSet.add(category.fullPath);
      }

      // Добавляем в статистику названий (для информации)
      nameSet.add(category.name);

      // Проверка длины названия (максимум 255 символов)
      if (category.name.length > 255) {
        errors.push(`Строка ${category.sortOrder}: название слишком длинное (${category.name.length} символов, максимум 255)`);
      }

      // Проверка на специальные символы
      if (/[<>:"/\\|?*]/.test(category.name)) {
        warnings.push(`Строка ${category.sortOrder}: название содержит специальные символы: "${category.name}"`);
      }

      // Проверка на циклические зависимости
      if (category.parent) {
        const parentPath = category.fullPath.split('/').slice(0, -1).join('/');
        if (parentPath === category.fullPath) {
          errors.push(`Строка ${category.sortOrder}: циклическая зависимость в пути "${category.fullPath}"`);
        }
      }
    }

    // Информационное сообщение о статистике
    const totalCategories = categories.length;
    const uniqueNames = nameSet.size;
    logger.info('Валидация завершена', 'catalog-import-service', { totalCategories, uniqueNames });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Импорт в базу данных
   */
  private async importToDatabase(categories: Array<{
    name: string;
    level: number;
    path: string;
    parent?: string;
    sortOrder: number;
    fullPath: string;
  }>): Promise<{
    imported: number;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let imported = 0;

    try {
      // Начинаем транзакцию
      await prisma.$transaction(async (tx) => {
        // Получаем существующие категории для проверки дубликатов
        const existingCategories = await tx.catalogCategory.findMany({
          select: { id: true, name: true, path: true, level: true }
        });

        // Создаем карту существующих категорий по полному пути
        const existingMap = new Map<string, string>(); // fullPath -> id
        for (const cat of existingCategories) {
          const fullPath = this.buildFullPath(cat, existingCategories);
          existingMap.set(fullPath, cat.id);
        }

        const categoryMap = new Map<string, string>(); // fullPath -> id

        for (const categoryData of categories) {
          try {
            // Проверяем на дубликаты с существующими категориями
            if (existingMap.has(categoryData.fullPath)) {
              warnings.push(`Категория "${categoryData.name}" (путь: ${categoryData.fullPath}) уже существует в базе данных`);
              continue;
            }

            // Определяем parent_id по полному пути родителя
            let parentId: string | undefined;
            if (categoryData.parent) {
              // Используем parent как полный путь родителя
              parentId = categoryMap.get(categoryData.parent) || existingMap.get(categoryData.parent);
              if (!parentId) {
                errors.push(`Не найден родитель для категории "${categoryData.name}" (путь: ${categoryData.fullPath})`);
                continue;
              }
            }

            // Создаем категорию
            const category = await tx.catalogCategory.create({
              data: {
                name: categoryData.name,
                parent_id: parentId,
                level: categoryData.level,
                path: parentId || '', // Сохраняем ID родителя, а не путь
                sort_order: categoryData.sortOrder,
                is_active: true
              }
            });

            // Сохраняем связь fullPath -> id
            categoryMap.set(categoryData.fullPath, category.id);
            imported++;

          } catch (error) {
            const errorMsg = `Ошибка создания категории "${categoryData.name}": ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
            errors.push(errorMsg);
            logger.error('Ошибка создания категории', 'catalog-import-service', error instanceof Error ? { error: error.message, stack: error.stack, categoryName: categoryData.name } : { error: String(error), categoryName: categoryData.name });
          }
        }
      });

    } catch (error) {
      const errorMsg = `Ошибка транзакции: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      errors.push(errorMsg);
      logger.error('Ошибка транзакции', 'catalog-import-service', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    }

    return {
      imported,
      errors,
      warnings
    };
  }

  /**
   * Построение полного пути для существующей категории
   */
  private buildFullPath(category: { id: string; name: string; path: string; level: number }, allCategories: Array<{ id: string; name: string; path: string; level: number }>): string {
    if (category.level === 1) {
      return category.name;
    }

    // Строим путь рекурсивно, начиная с корня
    const buildPathRecursive = (catId: string, visited: Set<string> = new Set()): string[] => {
      if (visited.has(catId)) {
        return []; // Предотвращаем циклические зависимости
      }
      visited.add(catId);

      const cat = allCategories.find(c => c.id === catId);
      if (!cat) {
        return [];
      }

      if (cat.level === 1) {
        return [cat.name];
      }

      // Находим родительскую категорию
      const parent = allCategories.find(c => c.id === cat.path);
      if (!parent) {
        return [cat.name];
      }

      const parentPath = buildPathRecursive(parent.id, visited);
      return [...parentPath, cat.name];
    };

    const pathParts = buildPathRecursive(category.id);
    return pathParts.join('|');
  }


  /**
   * Получение истории импортов
   */
  async getImportHistory(): Promise<Array<{
    id: string;
    filename: string;
    imported_count: number;
    error_count: number;
    status: string;
    created_at: Date;
  }>> {
    try {
      // Получаем историю импортов товаров из таблицы import_history
      const importHistory = await prisma.importHistory.findMany({
        orderBy: { created_at: 'desc' },
        take: 50
      });

      // Получаем историю импортов фотографий из логов (если есть)
      // Пока что возвращаем только историю импортов товаров
      return importHistory.map(item => ({
        id: item.id,
        filename: item.filename || 'Неизвестный файл',
        imported_count: item.imported_count || 0,
        error_count: item.error_count || 0,
        status: item.status || 'completed',
        created_at: item.created_at
      }));
    } catch (error) {
      logger.error('Error getting import history', 'catalog-import-service', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
      return [];
    }
  }
}

export const catalogImportService = new CatalogImportService();
