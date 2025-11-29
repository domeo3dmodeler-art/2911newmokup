import { PrismaClient } from '@prisma/client'

// Глобальный singleton Prisma (чтобы в dev не плодились соединения)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Проверяем что Prisma Client доступен
if (!PrismaClient) {
  throw new Error(
    '@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.'
  )
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // при желании: log: ['query','error','warn']
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
