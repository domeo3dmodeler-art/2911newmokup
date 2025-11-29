// lib/utils/order-status-display.ts
// Унифицированная логика отображения статусов Order для всех ролей
// Один и тот же Order должен иметь одинаковый статус независимо от роли

import { 
  getStatusLabel as getStatusLabelFromDocumentStatuses,
  ORDER_STATUSES_COMPLECTATOR,
  ORDER_STATUSES_EXECUTOR,
  COMPLECTATOR_FILTER_STATUSES
} from './document-statuses';

/**
 * Получает русское название статуса Order для отображения
 * Для Исполнителя: PAID отображается как "Новый заказ" (NEW_PLANNED)
 */
export function getOrderDisplayStatus(orderStatus: string, userRole?: string): string {
  // Для Исполнителя: PAID отображается как "Новый заказ"
  if (userRole === 'executor' && orderStatus === 'PAID') {
    return ORDER_STATUSES_EXECUTOR.NEW_PLANNED.label;
  }
  
  // Сначала проверяем статусы исполнителя
  const executorLabel = getStatusLabelFromDocumentStatuses(orderStatus, 'order_executor');
  if (executorLabel !== orderStatus) {
    return executorLabel;
  }
  
  // Если не найден, проверяем статусы комплектатора
  const complectatorLabel = getStatusLabelFromDocumentStatuses(orderStatus, 'order_complectator');
  if (complectatorLabel !== orderStatus) {
    return complectatorLabel;
  }
  
  // Если не найден, возвращаем как есть
  return orderStatus;
}

/**
 * Получает статус для фильтрации/отображения в UI Исполнителя
 * PAID маппится в NEW_PLANNED для Исполнителя
 */
export function getExecutorOrderStatus(orderStatus: string): string {
  // Для Исполнителя: PAID отображается как NEW_PLANNED
  if (orderStatus === 'PAID') {
    return 'NEW_PLANNED';
  }
  return orderStatus;
}

/**
 * Получает статус для фильтрации комплектатора на основе статуса Order
 */
export function getOrderFilterStatusForComplectator(orderStatus: string): typeof COMPLECTATOR_FILTER_STATUSES[number] {
  // Статусы исполнителя попадают в соответствующие фильтры
  const executorStatusMap: Record<string, typeof COMPLECTATOR_FILTER_STATUSES[number]> = {
    'NEW_PLANNED': 'Счет оплачен (Заказываем)',
    'UNDER_REVIEW': 'На проверке',
    'AWAITING_MEASUREMENT': 'Ждет замер',
    'AWAITING_INVOICE': 'Ожидает опт. счет',
    'READY_FOR_PRODUCTION': 'Готов к запуску в производство',
    'COMPLETED': 'Выполнен',
    'RETURNED_TO_COMPLECTATION': 'Вернуть в комплектацию'
  };
  
  if (executorStatusMap[orderStatus]) {
    return executorStatusMap[orderStatus];
  }
  
  // Статусы комплектатора маппятся напрямую
  const complectatorStatusMap: Record<string, typeof COMPLECTATOR_FILTER_STATUSES[number]> = {
    'DRAFT': 'Новый заказ',
    'SENT': 'Счет выставлен',
    'NEW_PLANNED': 'Счет оплачен (Заказываем)',
    'CANCELLED': 'Отменен'
  };
  
  return complectatorStatusMap[orderStatus] || 'Новый заказ';
}

/**
 * Проверяет, является ли статус Order статусом исполнителя
 */
export function isExecutorOrderStatus(status: string): boolean {
  return ['NEW_PLANNED', 'UNDER_REVIEW', 'AWAITING_MEASUREMENT', 'AWAITING_INVOICE', 'READY_FOR_PRODUCTION', 'COMPLETED', 'RETURNED_TO_COMPLECTATION'].includes(status);
}

/**
 * Проверяет, является ли статус Order статусом комплектатора
 */
export function isComplectatorOrderStatus(status: string): boolean {
  return ['DRAFT', 'SENT', 'NEW_PLANNED', 'RETURNED_TO_COMPLECTATION', 'CANCELLED'].includes(status);
}

