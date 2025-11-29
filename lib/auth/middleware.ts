// lib/auth/middleware.ts
// Middleware для проверки прав доступа в API routes

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './request-helpers';
import { ForbiddenError } from '@/lib/api/errors';

/**
 * Тип функции проверки прав
 */
export type PermissionChecker = (userRole: string, ...args: any[]) => boolean;

/**
 * Проверка роли пользователя
 */
export function checkRole(userRole: string, requiredRole: string): boolean {
  // Приводим обе роли к нижнему регистру для сравнения
  return userRole?.toLowerCase() === requiredRole?.toLowerCase();
}

/**
 * Middleware для проверки аутентификации
 */
export function requireAuth(
  handler: (req: NextRequest, user: Awaited<ReturnType<typeof getAuthenticatedUser>>) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(req);
    return await handler(req, user);
  };
}

/**
 * Middleware для проверки прав доступа
 */
export function requirePermission(
  permissionChecker: PermissionChecker,
  handler: (req: NextRequest, user: Awaited<ReturnType<typeof getAuthenticatedUser>>) => Promise<NextResponse>,
  ...permissionArgs: any[]
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const user = await getAuthenticatedUser(req);
    
    if (!permissionChecker(user.role, ...permissionArgs)) {
      throw new ForbiddenError('Недостаточно прав для выполнения операции');
    }

    return await handler(req, user);
  };
}

/**
 * Комбинированный middleware для аутентификации и проверки прав
 */
export function requireAuthAndPermission(
  handler: (req: NextRequest, user: Awaited<ReturnType<typeof getAuthenticatedUser>>) => Promise<NextResponse>,
  requiredRole: string
) {
  return requirePermission(checkRole, handler, requiredRole);
}
