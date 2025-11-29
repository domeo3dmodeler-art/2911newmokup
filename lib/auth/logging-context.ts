// lib/auth/logging-context.ts
// Контекст для логирования с userId и sessionId

import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { v4 } from '@/lib/utils/uuid';

/**
 * Извлекает userId из JWT токена в запросе
 */
export function extractUserIdFromRequest(req: NextRequest): string | null {
  try {
    // Получаем токен из заголовков или cookie
    let token: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    if (!token) {
      const cookies = req.cookies;
      token = cookies.get('auth-token')?.value || cookies.get('domeo-auth-token')?.value || null;
    }

    if (!token) {
      return null;
    }

    // Декодируем токен
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production-min-32-chars"
    ) as any;

    return decoded.userId || null;
  } catch (error) {
    return null;
  }
}

/**
 * Генерирует или извлекает sessionId из запроса
 */
export function extractSessionIdFromRequest(req: NextRequest): string {
  // Пытаемся получить sessionId из cookie или заголовка
  const sessionId = 
    req.cookies.get('session-id')?.value ||
    req.headers.get('x-session-id') ||
    null;

  if (sessionId) {
    return sessionId;
  }

  // Генерируем новый sessionId (можно использовать для отслеживания запросов)
  return `session-${Date.now()}-${v4().substring(0, 8)}`;
}

/**
 * Контекст логирования из запроса
 */
export interface LoggingContext {
  userId?: string | null;
  sessionId?: string;
  requestId?: string;
}

/**
 * Извлекает контекст логирования из запроса
 */
export function getLoggingContextFromRequest(req: NextRequest): LoggingContext {
  return {
    userId: extractUserIdFromRequest(req),
    sessionId: extractSessionIdFromRequest(req),
    requestId: req.headers.get('x-request-id') || undefined
  };
}

