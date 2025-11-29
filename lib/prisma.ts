// lib/prisma.ts
// Реэкспорт Prisma клиента для единообразных импортов
// Этот файл обеспечивает совместимость с импортами @/lib/prisma

export { prisma } from './db';
export { PrismaClient } from '@prisma/client';
export type { Prisma } from '@prisma/client';

