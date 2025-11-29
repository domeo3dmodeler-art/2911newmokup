// lib/types/prisma-documents.ts
// Типы для документов из Prisma с включенными связями

import { Prisma } from '@prisma/client';

// Базовые типы из Prisma
export type Quote = Prisma.QuoteGetPayload<{}>;
export type Invoice = Prisma.InvoiceGetPayload<{}>;
export type Order = Prisma.OrderGetPayload<{}>;
export type SupplierOrder = Prisma.SupplierOrderGetPayload<{}>;

// Типы с включенными связями
export type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    client: true;
    quote_items: true;
  }
}>;

export type InvoiceWithRelations = Prisma.InvoiceGetPayload<{
  include: {
    client: true;
    invoice_items: true;
    order: true;
  }
}>;

export type OrderWithRelations = Prisma.OrderGetPayload<{
  include: {
    client: true;
    invoice: true;
  }
}>;

export type SupplierOrderWithRelations = Prisma.SupplierOrderGetPayload<{
  include: {
    // Добавить связи если они есть
  }
}>;

// Тип для Order с проверкой invoice_id
export type OrderWithInvoiceCheck = {
  id: string;
  invoice_id: string | null;
};

