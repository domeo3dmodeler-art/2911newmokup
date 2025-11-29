// lib/validation/validator.ts
// Система валидации данных

import React from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
}

export class Validator {
  private rules: Record<string, ValidationRule> = {};

  // Добавление правила валидации для поля
  rule(field: string, rule: ValidationRule): Validator {
    this.rules[field] = rule;
    return this;
  }

  // Валидация объекта данных
  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string[]> = {};

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Проверка обязательности
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push('Поле обязательно для заполнения');
      }

      // Если поле не обязательное и пустое, пропускаем остальные проверки
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Проверка типа и значения
      if (value !== undefined && value !== null && value !== '') {
        // Проверка длины строки
        if (typeof value === 'string') {
          if (rule.minLength && value.length < rule.minLength) {
            fieldErrors.push(`Минимальная длина: ${rule.minLength} символов`);
          }
          if (rule.maxLength && value.length > rule.maxLength) {
            fieldErrors.push(`Максимальная длина: ${rule.maxLength} символов`);
          }
          if (rule.pattern && !rule.pattern.test(value)) {
            fieldErrors.push('Неверный формат');
          }
          if (rule.email && !this.isValidEmail(value)) {
            fieldErrors.push('Неверный формат email');
          }
          if (rule.url && !this.isValidUrl(value)) {
            fieldErrors.push('Неверный формат URL');
          }
        }

        // Проверка числовых значений
        if (typeof value === 'number') {
          if (rule.min !== undefined && value < rule.min) {
            fieldErrors.push(`Минимальное значение: ${rule.min}`);
          }
          if (rule.max !== undefined && value > rule.max) {
            fieldErrors.push(`Максимальное значение: ${rule.max}`);
          }
        }

        // Пользовательская валидация
        if (rule.custom) {
          const customResult = rule.custom(value);
          if (customResult !== true) {
            fieldErrors.push(typeof customResult === 'string' ? customResult : 'Неверное значение');
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  // Валидация email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Валидация URL
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Статические методы для быстрой валидации
  static email(email: string): boolean {
    const validator = new Validator();
    return validator.isValidEmail(email);
  }

  static url(url: string): boolean {
    const validator = new Validator();
    return validator.isValidUrl(url);
  }

  static required(value: any): boolean {
    return value !== undefined && value !== null && value !== '';
  }

  static minLength(value: string, min: number): boolean {
    return value.length >= min;
  }

  static maxLength(value: string, max: number): boolean {
    return value.length <= max;
  }

  static min(value: number, min: number): boolean {
    return value >= min;
  }

  static max(value: number, max: number): boolean {
    return value <= max;
  }
}

// Предустановленные валидаторы для часто используемых случаев
export const validators = {
  // Валидатор для пользователя
  user: new Validator()
    .rule('email', { required: true, email: true })
    .rule('password', { required: true, minLength: 6 })
    .rule('firstName', { required: true, minLength: 1, maxLength: 50 })
    .rule('lastName', { required: true, minLength: 1, maxLength: 50 })
    .rule('role', { required: true, custom: (value) => ['admin', 'complectator', 'executor'].includes(value) }),

  // Валидатор для категории
  category: new Validator()
    .rule('name', { required: true, minLength: 1, maxLength: 100 })
    .rule('slug', { required: true, pattern: /^[a-z0-9-]+$/ })
    .rule('description', { maxLength: 500 }),

  // Валидатор для товара
  product: new Validator()
    .rule('name', { required: true, minLength: 1, maxLength: 200 })
    .rule('sku', { required: true, minLength: 1, maxLength: 50 })
    .rule('price', { required: true, min: 0 })
    .rule('quantity', { min: 0 }),

  // Валидатор для документа
  document: new Validator()
    .rule('documentNumber', { required: true, minLength: 1, maxLength: 50 })
    .rule('clientName', { required: true, minLength: 1, maxLength: 200 })
    .rule('total', { required: true, min: 0 })
    .rule('items', { 
      required: true, 
      custom: (value) => Array.isArray(value) && value.length > 0 ? true : 'Должен быть хотя бы один товар'
    })
};

// Хук для валидации форм в React
export function useFormValidation<T extends Record<string, any>>(
  initialData: T,
  validator: Validator
) {
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const validate = React.useCallback(() => {
    const result = validator.validate(data);
    setErrors(result.errors);
    return result.isValid;
  }, [data, validator]);

  const setFieldValue = React.useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Валидируем поле при изменении
    const fieldValidator = new Validator();
    const fieldRule = (validator as any).rules[field as string];
    if (fieldRule) {
      fieldValidator.rule(field as string, fieldRule);
      const result = fieldValidator.validate({ [field]: value });
      setErrors(prev => ({
        ...prev,
        [field]: result.errors[field as string] || []
      }));
    }
  }, [validator]);

  const setFieldTouched = React.useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const reset = React.useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const hasErrors = Object.keys(errors).length > 0;
  const hasFieldError = (field: keyof T) => touched[field] && errors[field as string]?.length > 0;

  return {
    data,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validate,
    reset,
    hasErrors,
    hasFieldError,
    isValid: !hasErrors
  };
}
