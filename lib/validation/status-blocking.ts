// lib/validation/status-blocking.ts
import { prisma } from '@/lib/prisma';
import { getStatusLabel } from '@/lib/utils/status-labels';
import { logger } from '../logging/logger';

// Статусы, которые блокируют ручное изменение
const BLOCKED_STATUSES = ['ORDERED', 'RECEIVED_FROM_SUPPLIER', 'COMPLETED'];

/**
 * Проверяет, заблокирован ли статус для ручного изменения
 * @param documentId ID документа
 * @param documentType Тип документа ('invoice' | 'quote')
 * @returns true если статус заблокирован, false если можно изменить
 */
export async function isStatusBlocked(documentId: string, documentType: 'invoice' | 'quote'): Promise<boolean> {
  try {
    // Получаем документ
    let document = null;
    if (documentType === 'invoice') {
      document = await prisma.invoice.findUnique({
        where: { id: documentId },
        select: { id: true, status: true, parent_document_id: true, cart_session_id: true }
      });
    } else if (documentType === 'quote') {
      document = await prisma.quote.findUnique({
        where: { id: documentId },
        select: { id: true, status: true, parent_document_id: true, cart_session_id: true }
      });
    }

    if (!document) {
      return false; // Документ не найден, разрешаем изменение
    }

    // Если статус не в списке заблокированных, разрешаем изменение
    if (!BLOCKED_STATUSES.includes(document.status)) {
      return false;
    }

    // Блокируем статусы из списка заблокированных
    // Статусы ORDERED, RECEIVED_FROM_SUPPLIER, COMPLETED блокируются автоматически
    logger.warn('Статус заблокирован для ручного изменения', 'status-blocking', { documentId, documentType, status: document.status });
    return true;

  } catch (error) {
    logger.error('Ошибка проверки блокировки статуса', 'status-blocking', error instanceof Error ? { error: error.message, stack: error.stack, documentId, documentType } : { error: String(error), documentId, documentType });
    return false; // В случае ошибки разрешаем изменение
  }
}

/**
 * Проверяет наличие связанных заказов поставщику
 */
async function checkSupplierOrders(document: any, documentType: 'invoice' | 'quote'): Promise<boolean> {
  try {
    // Ищем заказы, связанные с этим документом
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { parent_document_id: document.id },
          { cart_session_id: document.cart_session_id }
        ]
      },
      select: { id: true }
    });

    if (orders.length === 0) {
      return false;
    }

    // Проверяем, есть ли заказы поставщику для этих заказов
    const orderIds = orders.map(order => order.id);
    const supplierOrders = await prisma.supplierOrder.findMany({
      where: {
        parent_document_id: { in: orderIds }
      },
      select: { id: true, status: true }
    });

    return supplierOrders.length > 0;

  } catch (error) {
    logger.error('Ошибка проверки заказов поставщику', 'status-blocking', error instanceof Error ? { error: error.message, stack: error.stack, documentId: document.id, documentType } : { error: String(error), documentId: document.id, documentType });
    return false;
  }
}

