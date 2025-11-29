// lib/validation/status.schemas.ts
// Схемы валидации для изменения статусов документов

import { z } from 'zod';

// Схема для изменения статуса документа
export const changeStatusSchema = z.object({
  status: z.string().min(1, 'Статус обязателен'),
  notes: z.string().optional(),
  require_measurement: z.boolean().optional()
});

// Типы на основе схем
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

