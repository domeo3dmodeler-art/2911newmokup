// lib/types/pagination.ts
// Типы для пагинации и фильтрации
// Оптимизированы для работы с большими объемами данных

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

export interface SearchParams {
  query?: string;
  filters?: FilterParams;
  sort?: SortParams[];
  pagination?: PaginationParams;
}

// Утилиты для пагинации
export class PaginationUtils {
  /**
   * Вычисляет offset для пагинации
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Вычисляет общее количество страниц
   */
  static calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  /**
   * Проверяет валидность параметров пагинации
   */
  static validatePagination(params: PaginationParams): PaginationParams {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    
    return {
      page,
      limit,
      offset: this.calculateOffset(page, limit),
    };
  }

  /**
   * Создает объект результата пагинации
   */
  static createPaginationResult<T>(
    data: T[],
    total: number,
    pagination: PaginationParams
  ): PaginationResult<T> {
    const totalPages = this.calculateTotalPages(total, pagination.limit);
    
    return {
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    };
  }

  /**
   * Создает параметры для SQL запроса
   */
  static createSqlParams(pagination: PaginationParams): {
    limit: number;
    offset: number;
  } {
    return {
      limit: pagination.limit,
      offset: pagination.offset || this.calculateOffset(pagination.page, pagination.limit),
    };
  }
}

// Утилиты для сортировки
export class SortUtils {
  /**
   * Валидирует параметры сортировки
   */
  static validateSort(sort: SortParams[]): SortParams[] {
    return sort.filter(s => 
      s.field && 
      (s.direction === 'asc' || s.direction === 'desc')
    );
  }

  /**
   * Создает ORDER BY clause для SQL
   */
  static createOrderByClause(sort: SortParams[]): string {
    if (!sort || sort.length === 0) {
      return 'ORDER BY created_at DESC';
    }

    const validSort = this.validateSort(sort);
    if (validSort.length === 0) {
      return 'ORDER BY created_at DESC';
    }

    const orderClauses = validSort.map(s => 
      `${s.field} ${s.direction.toUpperCase()}`
    );

    return `ORDER BY ${orderClauses.join(', ')}`;
  }
}

// Утилиты для фильтрации
export class FilterUtils {
  /**
   * Создает WHERE clause для SQL
   */
  static createWhereClause(filters: FilterParams): {
    whereClause: string;
    params: any[];
  } {
    if (!filters || Object.keys(filters).length === 0) {
      return { whereClause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          const placeholders = value.map(() => `$${paramIndex++}`).join(', ');
          conditions.push(`${key} IN (${placeholders})`);
          params.push(...value);
        }
      } else if (typeof value === 'string' && value.includes('*')) {
        // Поддержка wildcard поиска
        const searchValue = value.replace(/\*/g, '%');
        conditions.push(`${key} ILIKE $${paramIndex++}`);
        params.push(searchValue);
      } else if (typeof value === 'object' && value.operator) {
        // Поддержка операторов сравнения
        switch (value.operator) {
          case 'gt':
            conditions.push(`${key} > $${paramIndex++}`);
            params.push(value.value);
            break;
          case 'gte':
            conditions.push(`${key} >= $${paramIndex++}`);
            params.push(value.value);
            break;
          case 'lt':
            conditions.push(`${key} < $${paramIndex++}`);
            params.push(value.value);
            break;
          case 'lte':
            conditions.push(`${key} <= $${paramIndex++}`);
            params.push(value.value);
            break;
          case 'between':
            conditions.push(`${key} BETWEEN $${paramIndex++} AND $${paramIndex++}`);
            params.push(value.value[0], value.value[1]);
            break;
          default:
            conditions.push(`${key} = $${paramIndex++}`);
            params.push(value.value);
        }
      } else {
        conditions.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    return { whereClause, params };
  }

  /**
   * Создает параметры для полнотекстового поиска
   */
  static createSearchParams(query: string, searchFields: string[]): {
    searchClause: string;
    params: any[];
  } {
    if (!query || !searchFields.length) {
      return { searchClause: '', params: [] };
    }

    const searchTerms = query.split(' ').filter(term => term.length > 0);
    if (searchTerms.length === 0) {
      return { searchClause: '', params: [] };
    }

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    for (const term of searchTerms) {
      const fieldConditions: string[] = [];
      
      for (const field of searchFields) {
        fieldConditions.push(`${field} ILIKE $${paramIndex}`);
      }
      
      conditions.push(`(${fieldConditions.join(' OR ')})`);
      params.push(`%${term}%`);
      paramIndex++;
    }

    const searchClause = `AND (${conditions.join(' AND ')})`;
    return { searchClause, params };
  }
}
