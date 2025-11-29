// lib/export/types.ts
// Общие интерфейсы для системы экспорта

export type ExportFormat = 'xlsx' | 'csv' | 'json';

export type ExportPayload = {
  kpId: string;           // ID принятого КП
  format: ExportFormat;   // Формат экспорта
};

export type ExportRow = {
  // Основные поля DoorModel
  sku: string;
  series?: string | null;
  material?: string | null;
  finish?: string | null;
  width_mm?: number | null;
  height_mm?: number | null;
  color?: string | null;
  
  // Выбранные опции
  hardware_set?: string | null;
  handle?: string | null;
  
  // Количество и цены
  quantity: number;
  base_price: number;
  markup_price?: number | null;
  discount_price?: number | null;
  vat_price?: number | null;
  total_price: number;
  
  // Метаданные
  currency: string;
  created_at: string; // ISO date
};

export type ExportResponse = {
  success: boolean;
  data?: Buffer;        // Файл для скачивания
  filename?: string;    // Имя файла
  mimeType?: string;   // MIME тип
  error?: string;       // Сообщение об ошибке
  details?: any;        // Дополнительные детали ошибки
};

export type ExportError = {
  code: string;
  message: string;
  field?: string;
  value?: any;
};

