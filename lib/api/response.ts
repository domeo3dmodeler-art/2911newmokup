// lib/api/response.ts
// Стандартизированные форматы API ответов

import { NextResponse, NextRequest } from 'next/server';
import { logger } from '@/lib/logging/logger';
import { ApiException } from './errors';

/**
 * Стандартный формат успешного ответа
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Стандартный формат ответа с ошибкой
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Тип для API ответа
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Коды ошибок API
 */
export enum ApiErrorCode {
  // Валидация
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Аутентификация и авторизация
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  
  // Ресурсы
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Бизнес-логика
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INVALID_STATE = 'INVALID_STATE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // База данных
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNIQUE_CONSTRAINT_VIOLATION = 'UNIQUE_CONSTRAINT_VIOLATION',
  FOREIGN_KEY_CONSTRAINT = 'FOREIGN_KEY_CONSTRAINT',
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  
  // Внешние сервисы
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Общие
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * Создает успешный ответ API
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status: number = 200,
  requestId?: string
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId })
      }
    },
    { status }
  );
}

/**
 * Создает ответ с ошибкой API
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number = 400,
  details?: unknown,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  // Логируем ошибку
  logger.error('API Error', 'API_RESPONSE', {
    code,
    message,
    status,
    details,
    requestId
  });

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(requestId && { requestId })
      }
    },
    { status }
  );
}

/**
 * Обрабатывает неизвестную ошибку и возвращает стандартизированный ответ
 */
export function handleApiError(
  error: unknown,
  context?: string,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  // Prisma ошибки
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: { target?: string[] } };
    
    switch (prismaError.code) {
      case 'P2002':
        const target = prismaError.meta?.target?.join(', ') || 'поле';
        return apiError(
          ApiErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
          `Запись с такими данными уже существует: ${target}`,
          409,
          { field: prismaError.meta?.target },
          requestId
        );
        
      case 'P2025':
        return apiError(
          ApiErrorCode.RECORD_NOT_FOUND,
          'Запрашиваемая запись не найдена',
          404,
          undefined,
          requestId
        );
        
      case 'P2003':
        return apiError(
          ApiErrorCode.FOREIGN_KEY_CONSTRAINT,
          'Связанная запись не найдена',
          400,
          undefined,
          requestId
        );
    }
  }

  // Zod ошибки валидации
  if (error && typeof error === 'object' && 'issues' in error) {
    return apiError(
      ApiErrorCode.VALIDATION_ERROR,
      'Ошибка валидации данных',
      400,
      error,
      requestId
    );
  }

  // Стандартные Error объекты
  if (error instanceof Error) {
    // Проверяем кастомные API ошибки
    if (error instanceof ApiException) {
      return apiError(
        error.code,
        error.message,
        error.statusCode,
        error.details,
        requestId
      );
    }
    
    // Проверяем известные типы ошибок по сообщению
    const message = error.message.toLowerCase();
    
    if (message.includes('не авторизован') || message.includes('unauthorized')) {
      return apiError(
        ApiErrorCode.UNAUTHORIZED,
        'Необходима аутентификация',
        401,
        undefined,
        requestId
      );
    }
    
    if (message.includes('недостаточно прав') || message.includes('forbidden')) {
      return apiError(
        ApiErrorCode.FORBIDDEN,
        'Недостаточно прав для выполнения операции',
        403,
        undefined,
        requestId
      );
    }
    
    if (message.includes('не найден') || message.includes('not found')) {
      return apiError(
        ApiErrorCode.NOT_FOUND,
        error.message,
        404,
        undefined,
        requestId
      );
    }
    
    if (message.includes('обязателен') || message.includes('required')) {
      return apiError(
        ApiErrorCode.MISSING_REQUIRED_FIELD,
        error.message,
        400,
        undefined,
        requestId
      );
    }
    
    // Общая ошибка
    return apiError(
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      process.env.NODE_ENV === 'production' 
        ? 'Внутренняя ошибка сервера' 
        : error.message,
      500,
      process.env.NODE_ENV === 'development' ? { stack: error.stack } : undefined,
      requestId
    );
  }

  // Неизвестные ошибки
  return apiError(
    ApiErrorCode.UNKNOWN_ERROR,
    'Произошла непредвиденная ошибка',
    500,
    undefined,
    requestId
  );
}

/**
 * Wrapper для API handlers с автоматической обработкой ошибок
 */
export function withErrorHandling(
  handler: (req: NextRequest) => Promise<NextResponse>,
  context?: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error) {
      const requestId = req.headers.get('x-request-id') || undefined;
      return handleApiError(error, context, requestId);
    }
  };
}

