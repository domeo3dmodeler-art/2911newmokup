// lib/validation/document-integrity.ts
// Валидация целостности связей между документами

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

/**
 * Проверяет целостность связи Order ↔ Invoice
 * @param orderId ID заказа
 * @param invoiceId ID счета
 * @returns true если связь корректна, false иначе
 */
export async function validateOrderInvoiceLink(
  orderId: string,
  invoiceId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Проверяем существование Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, invoice_id: true }
    });

    if (!order) {
      errors.push(`Order ${orderId} не найден`);
      return { valid: false, errors };
    }

    // Проверяем существование Invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, order_id: true }
    });

    if (!invoice) {
      errors.push(`Invoice ${invoiceId} не найден`);
      return { valid: false, errors };
    }

    // Проверяем двунаправленную связь
    if (order.invoice_id !== invoiceId) {
      errors.push(`Order.invoice_id (${order.invoice_id}) не соответствует Invoice.id (${invoiceId})`);
    }

    if (invoice.order_id !== orderId) {
      errors.push(`Invoice.order_id (${invoice.order_id}) не соответствует Order.id (${orderId})`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    logger.error('Ошибка валидации связи Order ↔ Invoice', 'document-integrity', { error, orderId, invoiceId });
    errors.push(`Ошибка при проверке связи: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors };
  }
}

/**
 * Проверяет целостность связи SupplierOrder ↔ Order
 * @param supplierOrderId ID заказа у поставщика
 * @param orderId ID заказа
 * @returns true если связь корректна, false иначе
 */
export async function validateSupplierOrderLink(
  supplierOrderId: string,
  orderId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Проверяем существование SupplierOrder
    const supplierOrder = await prisma.supplierOrder.findUnique({
      where: { id: supplierOrderId },
      select: { id: true, parent_document_id: true }
    });

    if (!supplierOrder) {
      errors.push(`SupplierOrder ${supplierOrderId} не найден`);
      return { valid: false, errors };
    }

    // Проверяем существование Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    });

    if (!order) {
      errors.push(`Order ${orderId} не найден`);
      return { valid: false, errors };
    }

    // Проверяем связь через parent_document_id
    if (supplierOrder.parent_document_id !== orderId) {
      errors.push(`SupplierOrder.parent_document_id (${supplierOrder.parent_document_id}) не соответствует Order.id (${orderId})`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    logger.error('Ошибка валидации связи SupplierOrder ↔ Order', 'document-integrity', { error, supplierOrderId, orderId });
    errors.push(`Ошибка при проверке связи: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors };
  }
}

/**
 * Проверяет целостность связи Quote ↔ Order
 * @param quoteId ID КП
 * @param orderId ID заказа
 * @returns true если связь корректна, false иначе
 */
export async function validateQuoteLink(
  quoteId: string,
  orderId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Проверяем существование Quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      select: { id: true, parent_document_id: true }
    });

    if (!quote) {
      errors.push(`Quote ${quoteId} не найден`);
      return { valid: false, errors };
    }

    // Проверяем существование Order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    });

    if (!order) {
      errors.push(`Order ${orderId} не найден`);
      return { valid: false, errors };
    }

    // Проверяем связь через parent_document_id
    if (quote.parent_document_id !== orderId) {
      errors.push(`Quote.parent_document_id (${quote.parent_document_id}) не соответствует Order.id (${orderId})`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    logger.error('Ошибка валидации связи Quote ↔ Order', 'document-integrity', { error, quoteId, orderId });
    errors.push(`Ошибка при проверке связи: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors };
  }
}

/**
 * Исправляет несогласованность связи Order ↔ Invoice
 * @param orderId ID заказа
 * @param invoiceId ID счета
 * @returns true если исправление успешно, false иначе
 */
export async function fixOrderInvoiceLink(
  orderId: string,
  invoiceId: string
): Promise<{ success: boolean; errors: string[] }> {
  const errors: string[] = [];

  try {
    // Обновляем Order.invoice_id
    await prisma.order.update({
      where: { id: orderId },
      data: { invoice_id: invoiceId }
    });

    // Обновляем Invoice.order_id
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { order_id: orderId }
    });

    logger.info('Связь Order ↔ Invoice исправлена', 'document-integrity', { orderId, invoiceId });

    return { success: true, errors: [] };
  } catch (error) {
    logger.error('Ошибка исправления связи Order ↔ Invoice', 'document-integrity', { error, orderId, invoiceId });
    errors.push(`Ошибка при исправлении связи: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { success: false, errors };
  }
}

