// lib/api/errors.ts
// Кастомные классы ошибок для API

import { ApiErrorCode } from './response';

/**
 * Базовый класс для API ошибок
 */
export class ApiException extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiException';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибка валидации
 */
export class ValidationError extends ApiException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCode.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * Ошибка аутентификации
 */
export class UnauthorizedError extends ApiException {
  constructor(message: string = 'Необходима аутентификация') {
    super(ApiErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Ошибка авторизации
 */
export class ForbiddenError extends ApiException {
  constructor(message: string = 'Недостаточно прав для выполнения операции') {
    super(ApiErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Ошибка "не найдено"
 */
export class NotFoundError extends ApiException {
  constructor(resource: string = 'Ресурс', id?: string) {
    const message = id 
      ? `${resource} с ID ${id} не найден`
      : `${resource} не найден`;
    super(ApiErrorCode.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Ошибка конфликта
 */
export class ConflictError extends ApiException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCode.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * Ошибка бизнес-логики
 */
export class BusinessRuleError extends ApiException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCode.BUSINESS_RULE_VIOLATION, message, 422, details);
    this.name = 'BusinessRuleError';
  }
}

/**
 * Ошибка недопустимого состояния
 */
export class InvalidStateError extends ApiException {
  constructor(message: string, details?: unknown) {
    super(ApiErrorCode.INVALID_STATE, message, 422, details);
    this.name = 'InvalidStateError';
  }
}

