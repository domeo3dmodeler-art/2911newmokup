// lib/utils/status-labels.ts

import { getStatusLabel as getStatusLabelFromDocumentStatuses } from './document-statuses';

/**
 * Получает русские названия статусов для всех типов документов
 * Использует единый источник истины из document-statuses.ts
 */
export function getStatusLabel(status: string, documentType: 'invoice' | 'quote' | 'order' | 'supplier_order'): string {
  // Используем функцию из document-statuses.ts для консистентности
  if (documentType === 'order') {
    // Для order проверяем оба набора статусов (complectator и executor)
    return getStatusLabelFromDocumentStatuses(status, 'order');
  }
  
  // Для остальных типов документов используем соответствующий тип
  const documentTypeMap: Record<string, 'invoice' | 'quote' | 'order' | 'order_complectator' | 'order_executor'> = {
    'invoice': 'invoice',
    'quote': 'quote',
    'supplier_order': 'order' // SupplierOrder использует те же статусы что и Order
  };
  
  const mappedType = documentTypeMap[documentType] || documentType;
  return getStatusLabelFromDocumentStatuses(status, mappedType as any);
}

/**
 * Получает английские статусы из русских названий
 * Использует единый источник истины из document-statuses.ts
 */
export function getEnglishStatus(russianStatus: string, documentType: 'invoice' | 'quote' | 'order' | 'supplier_order'): string {
  // Используем функцию из document-statuses.ts
  const documentTypeMap: Record<string, 'invoice' | 'quote' | 'order_complectator' | 'order_executor'> = {
    'invoice': 'invoice',
    'quote': 'quote',
    'order': 'order_complectator',
    'supplier_order': 'order_complectator'
  };
  
  const mappedType = documentTypeMap[documentType];
  if (mappedType) {
    const { getStatusApiValue } = require('./document-statuses');
    return getStatusApiValue(russianStatus, mappedType as any) || russianStatus;
  }
  
  return russianStatus;
}

/**
 * Проверяет, заблокирован ли статус для ручного изменения
 */
export function isStatusBlockedForManualChange(status: string): boolean {
  const blockedStatuses = ['ORDERED', 'RECEIVED_FROM_SUPPLIER', 'COMPLETED'];
  return blockedStatuses.includes(status);
}
