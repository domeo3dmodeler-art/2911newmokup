'use client';

// components/ui/FormValidation.tsx
// Система валидации форм

import React from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export interface ValidationErrors {
  [key: string]: string;
}

export class FormValidator {
  private rules: Record<string, ValidationRule> = {};
  private errors: ValidationErrors = {};

  addRule(field: string, rule: ValidationRule) {
    this.rules[field] = rule;
    return this;
  }

  validate(field: string, value: any): string | null {
    const rule = this.rules[field];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      return 'Это поле обязательно для заполнения';
    }

    // Skip other validations if value is empty and not required
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // Email validation
    if (rule.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Введите корректный email адрес';
      }
    }

    // Length validations
    if (rule.minLength && value.toString().length < rule.minLength) {
      return `Минимальная длина: ${rule.minLength} символов`;
    }

    if (rule.maxLength && value.toString().length > rule.maxLength) {
      return `Максимальная длина: ${rule.maxLength} символов`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return 'Неверный формат данных';
    }

    // Numeric validations
    if (rule.min !== undefined && Number(value) < rule.min) {
      return `Минимальное значение: ${rule.min}`;
    }

    if (rule.max !== undefined && Number(value) > rule.max) {
      return `Максимальное значение: ${rule.max}`;
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  }

  validateAll(data: Record<string, any>): ValidationErrors {
    const errors: ValidationErrors = {};
    
    for (const field in this.rules) {
      const error = this.validate(field, data[field]);
      if (error) {
        errors[field] = error;
      }
    }

    this.errors = errors;
    return errors;
  }

  getError(field: string): string | null {
    return this.errors[field] || null;
  }

  hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  clearErrors() {
    this.errors = {};
  }
}

// Hook для использования валидации в компонентах
export function useFormValidation(initialData: Record<string, any> = {}) {
  const [data, setData] = React.useState(initialData);
  const [errors, setErrors] = React.useState<ValidationErrors>({});
  const [validator] = React.useState(() => new FormValidator());

  const updateField = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateField = (field: string) => {
    const error = validator.validate(field, data[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    return !error;
  };

  const validateAll = () => {
    const validationErrors = validator.validateAll(data);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const clearErrors = () => {
    setErrors({});
    validator.clearErrors();
  };

  const reset = () => {
    setData(initialData);
    setErrors({});
    validator.clearErrors();
  };

  return {
    data,
    errors,
    validator,
    updateField,
    validateField,
    validateAll,
    clearErrors,
    reset
  };
}

// Компонент для отображения ошибок
export interface ErrorMessageProps {
  error?: string;
  className?: string;
}

export function ErrorMessage({ error, className = '' }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`text-sm text-red-600 mt-1 ${className}`}>
      {error}
    </div>
  );
}

export default FormValidator;
