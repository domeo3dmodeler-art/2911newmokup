// lib/auth/request-helpers.ts
// Helper функции для работы с аутентификацией в API routes

import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { UnauthorizedError } from '@/lib/api/errors';
import { logger } from '@/lib/logging/logger';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  email?: string;
}

/**
 * Получает токен из запроса (из cookies или Authorization header)
 */
export function getAuthToken(req: NextRequest): string | null {
  // Сначала проверяем Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Затем проверяем x-auth-token header
  const xAuthToken = req.headers.get('x-auth-token');
  if (xAuthToken) {
    return xAuthToken;
  }

  // Затем проверяем cookies
  const token = req.cookies.get('auth-token')?.value;
  return token || null;
}

/**
 * Получает аутентифицированного пользователя из запроса
 * @throws UnauthorizedError если токен отсутствует или недействителен
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser> {
  const token = getAuthToken(req);
  
  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production-min-32-chars";
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    const { payload } = await jwtVerify(token, secret);
    
    const decoded = payload as { userId: string; role: string; email?: string };

    return {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
  } catch (error) {
    logger.warn('Invalid token', 'AUTH_HELPER', { error });
    throw new UnauthorizedError('Недействительный токен');
  }
}

/**
 * Получает аутентифицированного пользователя из запроса (без исключения)
 * Возвращает null если токен отсутствует или недействителен
 */
export async function getAuthenticatedUserOptional(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    return await getAuthenticatedUser(req);
  } catch (error) {
    return null;
  }
}

/**
 * Проверяет, аутентифицирован ли пользователь
 */
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  return (await getAuthenticatedUserOptional(req)) !== null;
}

