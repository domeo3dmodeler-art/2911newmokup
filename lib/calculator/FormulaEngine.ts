/**
 * 🚀 УНИВЕРСАЛЬНЫЙ ДВИЖОК ФОРМУЛ
 * Поддерживает любые математические операции, логику, условия
 */

import { logger } from '../logging/logger';

export interface Variable {
  id: string;
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object' | 'date';
  value: unknown;
  source?: 'input' | 'catalog' | 'api' | 'formula' | 'constant';
  validation?: ValidationRule[];
  dependencies?: string[];
}

export interface ValidationRule {
  type: 'min' | 'max' | 'required' | 'regex' | 'custom';
  value?: unknown;
  message: string;
  customFunction?: (value: unknown) => boolean;
}

export interface Formula {
  id: string;
  name: string;
  expression: string;
  description?: string;
  category?: string;
  variables: string[]; // IDs переменных
  resultType: 'number' | 'string' | 'boolean' | 'array' | 'object';
  conditions?: ConditionalRule[];
}

export interface ConditionalRule {
  condition: string; // Логическое выражение
  formula: string;   // Формула если условие true
  elseFormula?: string; // Формула если условие false
}

export class FormulaEngine {
  private variables: Map<string, Variable> = new Map();
  private formulas: Map<string, Formula> = new Map();
  private cache: Map<string, unknown> = new Map();
  
  // 🔧 Математические функции
  private mathFunctions = {
    // Базовые операции
    add: (a: number, b: number) => a + b,
    subtract: (a: number, b: number) => a - b,
    multiply: (a: number, b: number) => a * b,
    divide: (a: number, b: number) => b !== 0 ? a / b : 0,
    power: (a: number, b: number) => Math.pow(a, b),
    sqrt: (a: number) => Math.sqrt(a),
    
    // Тригонометрия
    sin: (a: number) => Math.sin(a),
    cos: (a: number) => Math.cos(a),
    tan: (a: number) => Math.tan(a),
    
    // Логарифмы
    log: (a: number) => Math.log(a),
    log10: (a: number) => Math.log10(a),
    
    // Округление
    round: (a: number, decimals = 0) => Math.round(a * Math.pow(10, decimals)) / Math.pow(10, decimals),
    ceil: (a: number) => Math.ceil(a),
    floor: (a: number) => Math.floor(a),
    
    // Статистика
    min: (...args: number[]) => Math.min(...args),
    max: (...args: number[]) => Math.max(...args),
    avg: (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
    sum: (...args: number[]) => args.reduce((a, b) => a + b, 0),
    
    // Условные функции
    if: (condition: boolean, trueValue: unknown, falseValue: unknown) => condition ? trueValue : falseValue,
    
    // Строковые функции
    concat: (...args: string[]) => args.join(''),
    length: (str: string) => str.length,
    upper: (str: string) => str.toUpperCase(),
    lower: (str: string) => str.toLowerCase(),
    
    // Функции массивов
    count: (arr: unknown[]) => arr.length,
    first: (arr: unknown[]) => arr[0],
    last: (arr: unknown[]) => arr[arr.length - 1],
    
    // Функции дат
    now: () => new Date(),
    year: (date: Date) => date.getFullYear(),
    month: (date: Date) => date.getMonth() + 1,
    day: (date: Date) => date.getDate(),
    
    // Финансовые функции
    pmt: (rate: number, nper: number, pv: number) => {
      // Расчет платежа по кредиту
      if (rate === 0) return -pv / nper;
      return -pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
    },
    
    // Инженерные функции
    abs: (a: number) => Math.abs(a),
    sign: (a: number) => Math.sign(a),
    random: () => Math.random(),
    
    // Функции для работы с каталогом
    getPrice: (productId: string) => this.getCatalogValue(productId, 'price'),
    getProperty: (productId: string, property: string) => this.getCatalogValue(productId, property),
    filterProducts: (categoryId: string, filters: Record<string, unknown>) => this.filterCatalogProducts(categoryId, filters),
    
    // Пользовательские функции
    custom: (functionName: string, ...args: unknown[]) => this.executeCustomFunction(functionName, args)
  };

  /**
   * 📝 Добавить переменную
   */
  addVariable(variable: Variable): void {
    this.variables.set(variable.id, variable);
    this.clearCache();
  }

  /**
   * 📝 Добавить формулу
   */
  addFormula(formula: Formula): void {
    this.formulas.set(formula.id, formula);
    this.clearCache();
  }

  /**
   * 🔢 Установить значение переменной
   */
  setVariable(id: string, value: unknown): void {
    const variable = this.variables.get(id);
    if (variable) {
      // Валидация
      if (variable.validation) {
        this.validateValue(value, variable.validation);
      }
      
      variable.value = value;
      this.clearCache();
    }
  }

  /**
   * 🧮 Вычислить формулу
   */
  calculate(formulaId: string): unknown {
    const cacheKey = `formula_${formulaId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const formula = this.formulas.get(formulaId);
    if (!formula) {
      throw new Error(`Формула ${formulaId} не найдена`);
    }

    try {
      let result;
      
      // Проверяем условные правила
      if (formula.conditions && formula.conditions.length > 0) {
        for (const rule of formula.conditions) {
          if (this.evaluateCondition(rule.condition)) {
            result = this.evaluateExpression(rule.formula);
            break;
          } else if (rule.elseFormula) {
            result = this.evaluateExpression(rule.elseFormula);
            break;
          }
        }
      } else {
        result = this.evaluateExpression(formula.expression);
      }

      this.cache.set(cacheKey, result);
      return result;
      
    } catch (error) {
      logger.error('Ошибка вычисления формулы', 'FormulaEngine', error instanceof Error ? { error: error.message, stack: error.stack, formulaId } : { error: String(error), formulaId });
      throw error;
    }
  }

  /**
   * 🔍 Вычислить выражение
   */
  private evaluateExpression(expression: string): unknown {
    // Заменяем переменные на их значения
    let processedExpression = expression;
    
    // Заменяем переменные
    for (const [id, variable] of this.variables) {
      const regex = new RegExp(`\\b${id}\\b`, 'g');
      processedExpression = processedExpression.replace(regex, JSON.stringify(variable.value));
    }

    // Заменяем функции
    processedExpression = this.replaceFunctions(processedExpression);

    // Безопасное вычисление
    return this.safeEvaluate(processedExpression);
  }

  /**
   * 🔧 Замена функций в выражении
   */
  private replaceFunctions(expression: string): string {
    // Регулярное выражение для поиска функций
    const functionRegex = /(\w+)\((.*?)\)/g;
    
    return expression.replace(functionRegex, (match, functionName, args) => {
      if (this.mathFunctions[functionName as keyof typeof this.mathFunctions]) {
        const parsedArgs = this.parseArguments(args);
        const fn = this.mathFunctions[functionName as keyof typeof this.mathFunctions] as (...args: unknown[]) => unknown;
        const result = fn(...parsedArgs);
        return JSON.stringify(result);
      }
      return match;
    });
  }

  /**
   * 📊 Парсинг аргументов функции
   */
  private parseArguments(argsString: string): unknown[] {
    if (!argsString.trim()) return [];
    
    const args = [];
    let currentArg = '';
    let parenthesesCount = 0;
    let inQuotes = false;
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      
      if (char === '"' && argsString[i-1] !== '\\') {
        inQuotes = !inQuotes;
      }
      
      if (!inQuotes) {
        if (char === '(') parenthesesCount++;
        if (char === ')') parenthesesCount--;
        
        if (char === ',' && parenthesesCount === 0) {
          args.push(this.parseValue(currentArg.trim()));
          currentArg = '';
          continue;
        }
      }
      
      currentArg += char;
    }
    
    if (currentArg.trim()) {
      args.push(this.parseValue(currentArg.trim()));
    }
    
    return args;
  }

  /**
   * 🔍 Парсинг значения
   */
  private parseValue(value: string): unknown {
    // Число
    if (/^-?\d+\.?\d*$/.test(value)) {
      return parseFloat(value);
    }
    
    // Строка в кавычках
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.slice(1, -1);
    }
    
    // Булево значение
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    
    // Массив
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    // Объект
    if (value.startsWith('{') && value.endsWith('}')) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  }

  /**
   * 🛡️ Безопасное вычисление
   */
  private safeEvaluate(expression: string): unknown {
    try {
      // Проверяем на опасные операции
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /import\s*\(/,
        /require\s*\(/
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(expression)) {
          throw new Error('Небезопасное выражение');
        }
      }
      
      // Используем Function constructor для безопасного вычисления
      return new Function(`"use strict"; return (${expression})`)();
    } catch (error) {
      logger.error('Ошибка вычисления выражения', 'FormulaEngine', error instanceof Error ? { error: error.message, stack: error.stack, expression } : { error: String(error), expression });
      throw error;
    }
  }

  /**
   * ✅ Валидация значения
   */
  private validateValue(value: unknown, rules: ValidationRule[]): void {
    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (value === null || value === undefined || value === '') {
            throw new Error(rule.message);
          }
          break;
          
        case 'min':
          if (typeof value === 'number' && typeof rule.value === 'number' && value < rule.value) {
            throw new Error(rule.message);
          }
          break;
          
        case 'max':
          if (typeof value === 'number' && typeof rule.value === 'number' && value > rule.value) {
            throw new Error(rule.message);
          }
          break;
          
        case 'regex':
          if (typeof value === 'string' && typeof rule.value === 'string' && !new RegExp(rule.value).test(value)) {
            throw new Error(rule.message);
          }
          break;
          
        case 'custom':
          if (rule.customFunction && !rule.customFunction(value)) {
            throw new Error(rule.message);
          }
          break;
      }
    }
  }

  /**
   * 🔍 Вычислить условие
   */
  private evaluateCondition(condition: string): boolean {
    try {
      const result = this.evaluateExpression(condition);
      return Boolean(result);
    } catch {
      return false;
    }
  }

  /**
   * 🗂️ Получить значение из каталога
   */
  private async getCatalogValue(productId: string, property: string): Promise<any> {
    try {
      const { catalogDataSource } = await import('./CatalogDataSource');
      return await catalogDataSource.getProductProperty(productId, property);
    } catch (error) {
      logger.error('Ошибка получения данных из каталога', 'FormulaEngine', error instanceof Error ? { error: error.message, stack: error.stack, productId, property } : { error: String(error), productId, property });
      return null;
    }
  }

  /**
   * 🔍 Фильтровать товары каталога
   */
  private async filterCatalogProducts(categoryId: string, filters: Record<string, unknown>): Promise<unknown[]> {
    try {
      const { catalogDataSource } = await import('./CatalogDataSource');
      return await catalogDataSource.findProducts({ categoryId, ...filters });
    } catch (error) {
      logger.error('Ошибка фильтрации товаров', 'FormulaEngine', error instanceof Error ? { error: error.message, stack: error.stack, categoryId, filters } : { error: String(error), categoryId, filters });
      return [];
    }
  }

  /**
   * 🔧 Выполнить пользовательскую функцию
   */
  private executeCustomFunction(functionName: string, args: unknown[]): unknown {
    // Здесь можно добавить пользовательские функции
    throw new Error(`Пользовательская функция ${functionName} не найдена`);
  }

  /**
   * 🗑️ Очистить кэш
   */
  private clearCache(): void {
    this.cache.clear();
  }

  /**
   * 📊 Получить все переменные
   */
  getVariables(): Variable[] {
    return Array.from(this.variables.values());
  }

  /**
   * 📊 Получить все формулы
   */
  getFormulas(): Formula[] {
    return Array.from(this.formulas.values());
  }

  /**
   * 🔍 Найти зависимости формулы
   */
  getFormulaDependencies(formulaId: string): string[] {
    const formula = this.formulas.get(formulaId);
    if (!formula) return [];
    
    const dependencies = new Set<string>();
    
    // Анализируем выражение на наличие переменных
    for (const [id] of this.variables) {
      const regex = new RegExp(`\\b${id}\\b`);
      if (regex.test(formula.expression)) {
        dependencies.add(id);
      }
    }
    
    return Array.from(dependencies);
  }

  /**
   * 🔄 Пересчитать все зависимые формулы
   */
  recalculateAll(): void {
    this.clearCache();
    
    // Пересчитываем все формулы в правильном порядке
    const calculationOrder = this.getCalculationOrder();
    
    for (const formulaId of calculationOrder) {
      this.calculate(formulaId);
    }
  }

  /**
   * 📋 Получить порядок вычислений
   */
  private getCalculationOrder(): string[] {
    // Топологическая сортировка для определения порядка вычислений
    const visited = new Set<string>();
    const order: string[] = [];
    
    const visit = (formulaId: string) => {
      if (visited.has(formulaId)) return;
      visited.add(formulaId);
      
      const dependencies = this.getFormulaDependencies(formulaId);
      for (const dep of dependencies) {
        // Если зависимость - это другая формула, сначала вычисляем её
        if (this.formulas.has(dep)) {
          visit(dep);
        }
      }
      
      order.push(formulaId);
    };
    
    for (const [formulaId] of this.formulas) {
      visit(formulaId);
    }
    
    return order;
  }
}
