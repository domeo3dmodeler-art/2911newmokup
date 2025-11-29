import { z } from 'zod';

export class ApiValidator {
  // Схемы валидации для основных сущностей
  static readonly productSchema = z.object({
    sku: z.string().min(1).max(100),
    name: z.string().min(1).max(255),
    base_price: z.number().min(0),
    stock_quantity: z.number().int().min(0),
    catalog_category_id: z.string().min(1),
    brand: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    properties_data: z.record(z.any()).optional(),
    is_active: z.boolean().optional()
  });

  static readonly categorySchema = z.object({
    name: z.string().min(1).max(255),
    parent_id: z.string().optional(),
    level: z.number().int().min(0).max(10),
    sort_order: z.number().int().min(0).optional(),
    is_active: z.boolean().optional()
  });

  static readonly bulkEditSchema = z.object({
    updates: z.array(z.object({
      id: z.string().min(1),
      updates: z.record(z.any())
    })).min(1).max(1000)
  });

  static readonly templateSchema = z.object({
    catalog_category_id: z.string().min(1),
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    required_fields: z.array(z.string()).optional(),
    calculator_fields: z.array(z.string()).optional(),
    export_fields: z.array(z.string()).optional(),
    template_config: z.record(z.any()).optional(),
    is_active: z.boolean().optional()
  });

  // Методы валидации
  static validateProduct(data: any) {
    return this.productSchema.parse(data);
  }

  static validateCategory(data: any) {
    return this.categorySchema.parse(data);
  }

  static validateBulkEdit(data: any) {
    return this.bulkEditSchema.parse(data);
  }

  static validateTemplate(data: any) {
    return this.templateSchema.parse(data);
  }

  // Валидация параметров запроса
  static validateQueryParams(params: Record<string, any>, schema: Record<string, z.ZodTypeAny>) {
    const result: Record<string, any> = {};
    
    for (const [key, validator] of Object.entries(schema)) {
      if (params[key] !== undefined) {
        result[key] = validator.parse(params[key]);
      }
    }
    
    return result;
  }

  // Валидация ID
  static validateId(id: string, fieldName: string = 'id') {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error(`Параметр '${fieldName}' обязателен и должен быть строкой`);
    }
    return id.trim();
  }

  // Валидация пагинации
  static validatePagination(limit?: string, offset?: string) {
    const parsedLimit = limit ? parseInt(limit) : 100;
    const parsedOffset = offset ? parseInt(offset) : 0;

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
      throw new Error('Параметр limit должен быть числом от 1 до 1000');
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      throw new Error('Параметр offset должен быть неотрицательным числом');
    }

    return { limit: parsedLimit, offset: parsedOffset };
  }

  // Валидация периода
  static validatePeriod(period?: string) {
    const validPeriods = ['7d', '30d', '90d', '1y'];
    const defaultPeriod = '30d';

    if (!period || !validPeriods.includes(period)) {
      return defaultPeriod;
    }

    return period;
  }

  // Валидация файла
  static validateFile(file: File, maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = []) {
    if (file.size > maxSize) {
      throw new Error(`Размер файла не должен превышать ${maxSize / 1024 / 1024}MB`);
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      throw new Error(`Неподдерживаемый тип файла. Разрешены: ${allowedTypes.join(', ')}`);
    }

    return true;
  }

  // Валидация JSON
  static validateJSON(jsonString: string, fieldName: string = 'JSON') {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Некорректный ${fieldName}: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  }
}

export const apiValidator = ApiValidator;
