// lib/utils/status-mapping.ts
// Общий модуль для маппинга статусов документов
// Использует единый источник истины из document-statuses.ts

import { 
  getStatusLabel as getStatusLabelFromDocumentStatuses,
  INVOICE_STATUSES,
  QUOTE_STATUSES,
  ORDER_STATUSES_COMPLECTATOR,
  ORDER_STATUSES_EXECUTOR
} from './document-statuses';

/**
 * Маппинг статусов Invoice из API в русские названия
 */
export function mapInvoiceStatusToRussian(apiStatus: string): string {
  // Нормализуем статус к верхнему регистру
  const normalizedStatus = apiStatus.toUpperCase();
  
  // Используем единый источник истины
  const label = getStatusLabelFromDocumentStatuses(normalizedStatus, 'invoice');
  
  // Если статус не найден, пытаемся использовать старые маппинги для обратной совместимости
  if (label === normalizedStatus) {
    const legacyMap: Record<string, string> = {
      'DRAFT': 'Черновик',
      'SENT': 'Отправлен',
      'PAID': 'Оплачен/Заказ',
      'ORDERED': 'Заказ размещен',
      'CANCELLED': 'Отменен',
      'RECEIVED_FROM_SUPPLIER': 'Получен от поставщика',
      'COMPLETED': 'Исполнен',
      'IN_PRODUCTION': 'Заказ размещен',
      'RECEIVED': 'Получен от поставщика'
    };
    return legacyMap[normalizedStatus] || 'Черновик';
  }
  
  return label;
}

/**
 * Маппинг статусов SupplierOrder из API в русские названия
 */
export function mapSupplierOrderStatusToRussian(apiStatus: string): string {
  // Нормализуем статус к верхнему регистру
  const normalizedStatus = apiStatus.toUpperCase();
  
  // Маппинг для SupplierOrder
  const supplierOrderMap: Record<string, string> = {
    'PENDING': 'Черновик',
    'SENT': 'Отправлен',
    'ORDERED': 'Заказ размещен',
    'RECEIVED_FROM_SUPPLIER': 'Получен от поставщика',
    'COMPLETED': 'Исполнен',
    'CANCELLED': 'Отменен',
    // Старые варианты для обратной совместимости
    'IN_PRODUCTION': 'Заказ размещен',
    'RECEIVED': 'Получен от поставщика'
  };
  
  return supplierOrderMap[normalizedStatus] || 'Черновик';
}

/**
 * Маппинг статусов Quote из API в русские названия
 */
export function mapQuoteStatusToRussian(apiStatus: string): string {
  return getStatusLabelFromDocumentStatuses(apiStatus.toUpperCase(), 'quote');
}

/**
 * Маппинг статусов Order из API в русские названия (для комплектатора)
 */
export function mapOrderStatusToRussianForComplectator(apiStatus: string): string {
  // Сначала проверяем статусы комплектатора
  const complectatorLabel = getStatusLabelFromDocumentStatuses(apiStatus.toUpperCase(), 'order_complectator');
  if (complectatorLabel !== apiStatus.toUpperCase()) {
    return complectatorLabel;
  }
  
  // Если не найден, проверяем статусы исполнителя
  return getStatusLabelFromDocumentStatuses(apiStatus.toUpperCase(), 'order_executor');
}

/**
 * Определяет, является ли статус терминальным (финальным)
 */
export function isTerminalStatus(
  status: string,
  documentType: 'invoice' | 'quote' | 'supplier_order'
): boolean {
  switch (documentType) {
    case 'invoice':
      return status === 'COMPLETED' || status === 'CANCELLED' || 
             status === 'Исполнен' || status === 'Отменен';
    case 'quote':
      return status === 'ACCEPTED' || status === 'REJECTED' || 
             status === 'Согласовано' || status === 'Отказ';
    case 'supplier_order':
      return status === 'COMPLETED' || status === 'Исполнен';
    default:
      return false;
  }
}

/**
 * Получает список русских названий статусов для фильтра Invoice
 */
export function getInvoiceFilterStatuses(): Array<'Черновик' | 'Отправлен' | 'Оплачен/Заказ' | 'Заказ размещен' | 'Получен от поставщика' | 'Исполнен' | 'Отменен'> {
  return Object.values(INVOICE_STATUSES).map(s => s.label) as Array<'Черновик' | 'Отправлен' | 'Оплачен/Заказ' | 'Заказ размещен' | 'Получен от поставщика' | 'Исполнен' | 'Отменен'>;
}

export function getQuoteFilterStatuses(): Array<'Черновик' | 'Отправлен' | 'Согласовано' | 'Отказ' | 'Отменен'> {
  return Object.values(QUOTE_STATUSES).map(s => s.label) as Array<'Черновик' | 'Отправлен' | 'Согласовано' | 'Отказ' | 'Отменен'>;
}

export function getSupplierOrderFilterStatuses(): Array<'Черновик' | 'Отправлен' | 'Заказ размещен' | 'Получен от поставщика' | 'Исполнен'> {
  return ['Черновик', 'Отправлен', 'Заказ размещен', 'Получен от поставщика', 'Исполнен'];
}

