// lib/validation/middleware.ts
// Middleware для валидации запросов в API routes

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema } from 'zod';
import { logger } from '@/lib/logging/logger';

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Валидирует тело запроса по схеме Zod
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));

      return { success: false, errors };
    }

    throw error;
  }
}

/**
 * Middleware для валидации запроса
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const body = await req.json();
      const validation = validateRequest(schema, body);

      if (!validation.success) {
        logger.warn('Validation failed', 'VALIDATION_MIDDLEWARE', {
          errors: validation.errors
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Ошибка валидации',
            details: validation.errors
          },
          { status: 400 }
        );
      }

      return await handler(req, validation.data);
    } catch (error: any) {
      logger.error('Error in validation middleware', 'VALIDATION_MIDDLEWARE', {
        error: error.message
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Ошибка при обработке запроса',
          details: error.message
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Валидирует параметры запроса (query params)
 */
export function validateQueryParams<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  const params: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  return validateRequest(schema, params);
}

/**
 * Валидирует параметры пути (route params)
 */
export function validateRouteParams<T>(
  schema: ZodSchema<T>,
  params: Record<string, string | undefined>
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  return validateRequest(schema, params);
}

