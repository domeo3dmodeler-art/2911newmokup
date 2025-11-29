// lib/utils/document-statuses.ts
// Единые статусы для всех документов в проекте

/**
 * Статусы Invoice (Счет)
 */
export const INVOICE_STATUSES = {
  DRAFT: { label: 'Черновик', apiValue: 'DRAFT' },
  SENT: { label: 'Отправлен', apiValue: 'SENT' },
  PAID: { label: 'Оплачен/Заказ', apiValue: 'PAID' },
  ORDERED: { label: 'Заказ размещен', apiValue: 'ORDERED' },
  RECEIVED_FROM_SUPPLIER: { label: 'Получен от поставщика', apiValue: 'RECEIVED_FROM_SUPPLIER' },
  COMPLETED: { label: 'Исполнен', apiValue: 'COMPLETED' },
  CANCELLED: { label: 'Отменен', apiValue: 'CANCELLED' }
} as const;

/**
 * Статусы Quote (КП)
 */
export const QUOTE_STATUSES = {
  DRAFT: { label: 'Черновик', apiValue: 'DRAFT' },
  SENT: { label: 'Отправлен', apiValue: 'SENT' },
  ACCEPTED: { label: 'Согласовано', apiValue: 'ACCEPTED' },
  REJECTED: { label: 'Отказ', apiValue: 'REJECTED' },
  CANCELLED: { label: 'Отменен', apiValue: 'CANCELLED' }
} as const;

/**
 * Статусы Order для Комплектатора
 * Комплектатор может управлять только: Новый заказ, Счет выставлен, Счет оплачен, Отменен
 * После перехода в "Счет оплачен" заказ переходит к Исполнителю и получает статус NEW_PLANNED
 */
export const ORDER_STATUSES_COMPLECTATOR = {
  DRAFT: { label: 'Новый заказ', apiValue: 'DRAFT' },
  SENT: { label: 'Счет выставлен', apiValue: 'SENT' },
  NEW_PLANNED: { label: 'Счет оплачен (Заказываем)', apiValue: 'NEW_PLANNED' },
  RETURNED_TO_COMPLECTATION: { label: 'Вернуть в комплектацию', apiValue: 'RETURNED_TO_COMPLECTATION' },
  CANCELLED: { label: 'Отменен', apiValue: 'CANCELLED' }
} as const;

/**
 * Статусы Order для Исполнителя
 * Эти статусы появляются после перехода комплектатора в статус "Оплачен/Заказ"
 * Комплектатор видит эти статусы, но не может их изменять
 */
export const ORDER_STATUSES_EXECUTOR = {
  NEW_PLANNED: { label: 'Счет оплачен (Заказываем)', apiValue: 'NEW_PLANNED' },
  UNDER_REVIEW: { label: 'На проверке', apiValue: 'UNDER_REVIEW' },
  AWAITING_MEASUREMENT: { label: 'Ждет замер', apiValue: 'AWAITING_MEASUREMENT' },
  AWAITING_INVOICE: { label: 'Ожидает опт. счет', apiValue: 'AWAITING_INVOICE' },
  READY_FOR_PRODUCTION: { label: 'Готов к запуску в производство', apiValue: 'READY_FOR_PRODUCTION' },
  COMPLETED: { label: 'Выполнен', apiValue: 'COMPLETED' },
  RETURNED_TO_COMPLECTATION: { label: 'Вернуть в комплектацию', apiValue: 'RETURNED_TO_COMPLECTATION' },
  CANCELLED: { label: 'Отменен', apiValue: 'CANCELLED' }
} as const;

/**
 * Все статусы для фильтров Комплектатора
 * Комплектатор может управлять только: Новый заказ, Счет выставлен, Счет оплачен, Отменен
 * Статусы исполнителя (Счет оплачен (Заказываем), На проверке, Ждет замер, Ожидает опт. счет, Готов к запуску в производство, Выполнен, Вернуть в комплектацию) 
 * комплектатор видит в списке заказов, но не может их изменять (кроме RETURNED_TO_COMPLECTATION)
 * Для фильтрации они попадают в категорию "Счет оплачен"
 */
export const COMPLECTATOR_FILTER_STATUSES = [
  'all',
  'Новый заказ',
  'Счет выставлен',
  'Счет оплачен (Заказываем)',
  'На проверке',
  'Ждет замер',
  'Ожидает опт. счет',
  'Готов к запуску в производство',
  'Выполнен',
  'Вернуть в комплектацию',
  'Отменен'
] as const;

/**
 * Получить русское название статуса по API значению
 */
export function getStatusLabel(
  apiStatus: string,
  documentType: 'invoice' | 'quote' | 'order' | 'order_complectator' | 'order_executor'
): string {
  switch (documentType) {
    case 'invoice':
      return Object.values(INVOICE_STATUSES).find(s => s.apiValue === apiStatus)?.label || apiStatus;
    case 'quote':
      return Object.values(QUOTE_STATUSES).find(s => s.apiValue === apiStatus)?.label || apiStatus;
    case 'order_complectator':
      return Object.values(ORDER_STATUSES_COMPLECTATOR).find(s => s.apiValue === apiStatus)?.label || apiStatus;
    case 'order_executor':
      return Object.values(ORDER_STATUSES_EXECUTOR).find(s => s.apiValue === apiStatus)?.label || apiStatus;
    case 'order':
      // Для общего случая Order проверяем оба набора статусов
      return Object.values(ORDER_STATUSES_COMPLECTATOR).find(s => s.apiValue === apiStatus)?.label ||
             Object.values(ORDER_STATUSES_EXECUTOR).find(s => s.apiValue === apiStatus)?.label ||
             apiStatus;
    default:
      return apiStatus;
  }
}

/**
 * Получить API значение по русскому названию статуса
 */
export function getStatusApiValue(
  russianLabel: string,
  documentType: 'invoice' | 'quote' | 'order_complectator' | 'order_executor'
): string | null {
  switch (documentType) {
    case 'invoice':
      return Object.values(INVOICE_STATUSES).find(s => s.label === russianLabel)?.apiValue || null;
    case 'quote':
      return Object.values(QUOTE_STATUSES).find(s => s.label === russianLabel)?.apiValue || null;
    case 'order_complectator':
      return Object.values(ORDER_STATUSES_COMPLECTATOR).find(s => s.label === russianLabel)?.apiValue || null;
    case 'order_executor':
      return Object.values(ORDER_STATUSES_EXECUTOR).find(s => s.label === russianLabel)?.apiValue || null;
    default:
      return null;
  }
}

