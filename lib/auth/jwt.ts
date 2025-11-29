/**
 * JWT токены для аутентификации
 */

import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

// Секретный ключ для подписи JWT (в продакшене должен быть в переменных окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
}

/**
 * Создание JWT токена
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'domeo-platform',
    audience: 'domeo-users'
  });
}

/**
 * Проверка и декодирование JWT токена
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'domeo-platform',
      audience: 'domeo-users'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    logger.error('JWT verification failed', 'lib/auth/jwt', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return null;
  }
}

/**
 * Получение пользователя по токену
 */
export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        is_active: true
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true
      }
    });

    return user;
  } catch (error) {
    logger.error('Error getting user from token', 'lib/auth/jwt', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return null;
  }
}

/**
 * Обновление токена (refresh token)
 */
export async function refreshToken(oldToken: string): Promise<string | null> {
  try {
    const payload = verifyToken(oldToken);
    if (!payload) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
        is_active: true
      }
    });

    if (!user) {
      return null;
    }

    // Создаем новый токен
    return createToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error('Error refreshing token', 'lib/auth/jwt', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return null;
  }
}

/**
 * Проверка срока действия токена
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = verifyToken(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    return true;
  }
}

/**
 * Извлечение токена из заголовка Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Утилиты для работы с токенами
 */
export const tokenUtils = {
  create: createToken,
  verify: verifyToken,
  getUser: getUserFromToken,
  refresh: refreshToken,
  isExpired: isTokenExpired,
  extract: extractTokenFromHeader
};

/**
 * Middleware для проверки JWT токена
 */
export async function validateJWTToken(token: string): Promise<AuthUser | null> {
  return await getUserFromToken(token);
}

/**
 * Создание токена для пользователя
 */
export async function createUserToken(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        is_active: true
      }
    });

    if (!user) {
      return null;
    }

    return createToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    logger.error('Error creating user token', 'lib/auth/jwt', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return null;
  }
}

/**
 * Проверка прав доступа пользователя
 */
export async function checkUserPermissions(
  userId: string, 
  requiredPermission: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, is_active: true }
    });

    if (!user || !user.is_active) {
      return false;
    }

    // Здесь должна быть логика проверки разрешений
    // Пока возвращаем true для активных пользователей
    return true;
  } catch (error) {
    logger.error('Error checking user permissions', 'lib/auth/jwt', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
    return false;
  }
}

/**
 * Логирование попыток аутентификации
 */
export async function logAuthAttempt(
  userId: string | null,
  success: boolean,
  ip?: string,
  userAgent?: string
): Promise<void> {
  try {
    // Здесь можно добавить логирование в базу данных
    logger.info('Auth attempt', 'lib/auth/jwt', {
      userId,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error logging auth attempt', 'lib/auth/jwt', error instanceof Error ? { error: error.message, stack: error.stack } : { error: String(error) });
  }
}
