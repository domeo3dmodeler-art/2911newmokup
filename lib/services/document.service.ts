// lib/services/document.service.ts
// Сервис для управления документами (Order, Invoice, Quote, SupplierOrder)

import { logger } from '@/lib/logging/logger';
import { generateCartSessionId } from '@/lib/utils/cart-session';
import { 
  findExistingDocument, 
  findExistingOrder 
} from '@/lib/documents/deduplication';
import { documentRepository } from '@/lib/repositories/document.repository';
import { clientRepository } from '@/lib/repositories/client.repository';
import type {
  DocumentType,
  CreateDocumentRequest,
  CreateDocumentResponse,
  DocumentItem
} from '@/lib/types/documents';
import { createDocumentRequestSchema, type CreateDocumentRequestInput } from '@/lib/validation/document.schemas';

export class DocumentService {
  /**
   * Создает документ с дедубликацией
   */
  async createDocument(request: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    // Валидация через Zod
    const validation = createDocumentRequestSchema.safeParse(request);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Ошибка валидации: ${errors}`);
    }

    const validatedRequest = validation.data;
    const {
      type,
      parent_document_id,
      cart_session_id,
      client_id,
      items,
      total_amount,
      subtotal = 0,
      tax_amount = 0,
      notes,
      prevent_duplicates = true,
      created_by = 'system'
    } = validatedRequest;

    logger.info(`Создание документа типа ${type}`, 'DOCUMENT_SERVICE', {
      type,
      parentDocumentId: parent_document_id || 'нет',
      clientId: client_id,
      itemsCount: items.length
    });

    // Унифицируем cart_session_id
    const finalCartSessionId = cart_session_id || generateCartSessionId();

    // Проверяем существующий документ (дедупликация)
    let existingDocument = null;
    if (prevent_duplicates) {
      existingDocument = await this.findExistingDocument(
        type,
        parent_document_id || null,
        finalCartSessionId,
        client_id,
        items,
        total_amount
      );
    }

    let documentNumber: string;
    let documentId: string | null = null;
    let isNew = false;

    if (existingDocument) {
      documentNumber = existingDocument.number;
      documentId = existingDocument.id;
      logger.info('Используем существующий документ', 'DOCUMENT_SERVICE', {
        documentNumber,
        documentId,
        type
      });
    } else {
      documentNumber = this.generateDocumentNumber(type);
      isNew = true;
      logger.info('Создаем новый документ', 'DOCUMENT_SERVICE', { 
        documentNumber,
        type 
      });
    }

    // Валидация связей документов
    if (parent_document_id && isNew) {
      await this.validateDocumentRelations(type, parent_document_id);
    }

    // Создаем документ в БД если новый
    if (isNew) {
      const created = await this.createDocumentRecord(
        type,
        {
          number: documentNumber,
          parent_document_id: parent_document_id || null,
          cart_session_id: finalCartSessionId,
          client_id,
          items,
          total_amount,
          subtotal,
          tax_amount,
          notes,
          created_by
        }
      );
      documentId = created.id;
    }

    return {
      id: documentId!,
      type,
      number: documentNumber,
      parent_document_id: parent_document_id || null,
      cart_session_id: finalCartSessionId,
      client_id,
      total_amount,
      created_at: existingDocument?.created_at || new Date(),
      isNew
    };
  }

  /**
   * Валидация запроса на создание документа (deprecated - используйте Zod схемы)
   * @deprecated Используйте createDocumentRequestSchema для валидации
   */
  private validateCreateRequest(request: CreateDocumentRequest): void {
    // Эта функция больше не используется, валидация через Zod
    // Оставлена для обратной совместимости
  }

  /**
   * Поиск существующего документа
   */
  private async findExistingDocument(
    type: DocumentType,
    parentDocumentId: string | null,
    cartSessionId: string | null,
    clientId: string,
    items: DocumentItem[],
    totalAmount: number
  ) {
    if (type === 'order') {
      return await findExistingOrder(
        null, // Order - основной документ, parent_document_id всегда null
        cartSessionId,
        clientId,
        items,
        totalAmount
      );
    } else {
      return await findExistingDocument(
        type as 'quote' | 'invoice' | 'supplier_order',
        parentDocumentId,
        cartSessionId,
        clientId,
        items,
        totalAmount
      );
    }
  }

  /**
   * Генерация номера документа
   */
  private generateDocumentNumber(type: DocumentType): string {
    const prefixMap: Record<DocumentType, string> = {
      quote: 'КП',
      invoice: 'Счет',
      order: 'Заказ',
      supplier_order: 'ЗаказПоставщика'
    };
    const prefix = prefixMap[type];
    return `${prefix}-${Date.now()}`;
  }

  /**
   * Валидация связей документов
   */
  private async validateDocumentRelations(
    type: DocumentType,
    parentDocumentId: string
  ): Promise<void> {
    if (type === 'invoice') {
      // Invoice должен быть связан с Order
      const parentOrder = await documentRepository.findOrderWithInvoiceCheck(parentDocumentId);

      if (!parentOrder) {
        throw new Error(`Заказ ${parentDocumentId} не найден. Invoice должен создаваться на основе Order.`);
      }

      if (parentOrder.invoice_id) {
        throw new Error(`У заказа ${parentDocumentId} уже есть счет. Один Order может иметь только один Invoice.`);
      }
    } else if (type === 'quote') {
      // Quote должен быть связан с Order
      const parentOrder = await documentRepository.findOrderById(parentDocumentId);

      if (!parentOrder) {
        throw new Error(`Заказ ${parentDocumentId} не найден. Quote должен создаваться на основе Order.`);
      }
    }
  }

  /**
   * Создание записи документа в БД
   */
  private async createDocumentRecord(
    type: DocumentType,
    data: {
      number: string;
      parent_document_id: string | null;
      cart_session_id: string | null;
      client_id: string;
      items: DocumentItem[];
      total_amount: number;
      subtotal: number;
      tax_amount: number;
      notes?: string;
      created_by: string;
    }
  ) {
    // Проверяем существование клиента
    const client = await clientRepository.findById(data.client_id);
    if (!client) {
      throw new Error(`Клиент ${data.client_id} не найден`);
    }

    // Используем репозиторий для создания документа
    switch (type) {
      case 'quote':
        return await documentRepository.createQuote(data);
      case 'invoice':
        return await documentRepository.createInvoice(data);
      case 'order':
        return await documentRepository.createOrder(data);
      case 'supplier_order':
        return await documentRepository.createSupplierOrder(data);
      default:
        throw new Error(`Неподдерживаемый тип документа: ${type}`);
    }
  }
}

// Экспортируем singleton instance
export const documentService = new DocumentService();

