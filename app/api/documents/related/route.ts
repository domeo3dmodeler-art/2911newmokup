import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logging/logger';

interface DocumentNode {
  id: string;
  number: string;
  type: string;
  status: string;
  total: number | null;
  date: Date;
  children: DocumentNode[];
  supplier?: string;
}

interface ClientDocuments {
  quotes: Array<{
    id: string;
    number: string;
    status: string;
    total_amount: number | null;
    created_at: Date;
    orders: Array<{
      id: string;
      number: string;
      status: string;
      total_amount: number | null;
      created_at: Date;
      invoices: Array<{
        id: string;
        number: string;
        status: string;
        total_amount: number | null;
        created_at: Date;
      }>;
      supplier_orders: Array<{
        id: string;
        status: string;
        supplier_name: string | null;
        created_at: Date;
      }>;
    }>;
    invoices: Array<{
      id: string;
      number: string;
      status: string;
      total_amount: number | null;
      created_at: Date;
    }>;
  }>;
  orders: Array<{
    id: string;
    number: string;
    status: string;
    total_amount: number | null;
    created_at: Date;
  }>;
  invoices: Array<{
    id: string;
    number: string;
    status: string;
    total_amount: number | null;
    created_at: Date;
  }>;
}

// API для получения связанных документов
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentType = searchParams.get('documentType');
    const documentId = searchParams.get('documentId');
    
    if (!documentType || !documentId) {
      return NextResponse.json({ error: 'documentType и documentId обязательны' }, { status: 400 });
    }

    let relatedDocuments = {};

    switch (documentType) {
      case 'quote':
        const quote = await prisma.quote.findUnique({
          where: { id: documentId },
          include: {
            orders: {
              include: {
                invoices: true,
                supplier_orders: true
              }
            },
            invoices: true
          }
        });
        
        relatedDocuments = {
          quote,
          orders: quote?.orders || [],
          invoices: quote?.invoices || [],
          supplierOrders: quote?.orders?.flatMap(order => order.supplier_orders) || []
        };
        break;

      case 'order':
        const order = await prisma.order.findUnique({
          where: { id: documentId },
          include: {
            quote: true,
            invoices: true,
            supplier_orders: true
          }
        });
        
        relatedDocuments = {
          order,
          quote: order?.quote,
          invoices: order?.invoices || [],
          supplierOrders: order?.supplier_orders || []
        };
        break;

      case 'invoice':
        const invoice = await prisma.invoice.findUnique({
          where: { id: documentId },
          include: {
            quote: true,
            order: {
              include: {
                supplier_orders: true
              }
            }
          }
        });
        
        relatedDocuments = {
          invoice,
          quote: invoice?.quote,
          order: invoice?.order,
          supplierOrders: invoice?.order?.supplier_orders || []
        };
        break;

      case 'supplier_order':
        const supplierOrder = await prisma.supplierOrder.findUnique({
          where: { id: documentId },
          include: {
            order: {
              include: {
                quote: true,
                invoices: true
              }
            }
          }
        });
        
        relatedDocuments = {
          supplierOrder,
          order: supplierOrder?.order,
          quote: supplierOrder?.order?.quote,
          invoices: supplierOrder?.order?.invoices || []
        };
        break;

      default:
        return NextResponse.json({ error: 'Неподдерживаемый тип документа' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      relatedDocuments
    });

  } catch (error) {
    logger.error('Error fetching related documents', 'documents/related', error instanceof Error ? { error: error.message, stack: error.stack, documentType, documentId } : { error: String(error), documentType, documentId });
    return NextResponse.json({ error: 'Ошибка при получении связанных документов' }, { status: 500 });
  }
}

// API для получения полной цепочки документов клиента
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId } = body;
    
    if (!clientId) {
      return NextResponse.json({ error: 'clientId обязателен' }, { status: 400 });
    }

    // Получаем все документы клиента с полными связями
    const clientDocuments = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        quotes: {
          include: {
            quote_items: true,
            orders: {
              include: {
                order_items: true,
                invoices: {
                  include: { invoice_items: true }
                },
                supplier_orders: true
              }
            },
            invoices: {
              include: { invoice_items: true }
            }
          },
          orderBy: { created_at: 'desc' }
        },
        orders: {
          include: {
            order_items: true,
            quote: true,
            invoices: {
              include: { invoice_items: true }
            },
            supplier_orders: true
          },
          orderBy: { created_at: 'desc' }
        },
        invoices: {
          include: {
            invoice_items: true,
            quote: true,
            order: {
              include: {
                supplier_orders: true
              }
            }
          },
          orderBy: { created_at: 'desc' }
        }
      }
    });

    // Строим дерево документов
    const documentTree = buildDocumentTree(clientDocuments);

    return NextResponse.json({
      success: true,
      clientDocuments,
      documentTree
    });

  } catch (error) {
    logger.error('Error fetching client document tree', 'documents/related', error instanceof Error ? { error: error.message, stack: error.stack, clientId } : { error: String(error), clientId });
    return NextResponse.json({ error: 'Ошибка при получении дерева документов клиента' }, { status: 500 });
  }
}

// Функция для построения дерева документов
function buildDocumentTree(clientDocuments: ClientDocuments) {
  const tree: {
    quotes: DocumentNode[];
    orders: DocumentNode[];
    invoices: DocumentNode[];
    supplierOrders: DocumentNode[];
  } = {
    quotes: [],
    orders: [],
    invoices: [],
    supplierOrders: []
  };

  // Обрабатываем КП
  clientDocuments.quotes.forEach((quote) => {
    const quoteNode = {
      id: quote.id,
      number: quote.number,
      type: 'quote',
      status: quote.status,
      total: quote.total_amount,
      date: quote.created_at,
      children: []
    };

    // Добавляем связанные заказы
    quote.orders.forEach((order) => {
      const orderNode = {
        id: order.id,
        number: order.number,
        type: 'order',
        status: order.status,
        total: order.total_amount,
        date: order.created_at,
        children: []
      };

      // Добавляем связанные счета
      order.invoices.forEach((invoice) => {
        orderNode.children.push({
          id: invoice.id,
          number: invoice.number,
          type: 'invoice',
          status: invoice.status,
          total: invoice.total_amount,
          date: invoice.created_at,
          children: []
        });
      });

      // Добавляем заказы у поставщика
      order.supplier_orders.forEach((supplierOrder) => {
        orderNode.children.push({
          id: supplierOrder.id,
          number: supplierOrder.id.slice(-6),
          type: 'supplier_order',
          status: supplierOrder.status,
          supplier: supplierOrder.supplier_name,
          date: supplierOrder.created_at,
          children: []
        });
      });

      quoteNode.children.push(orderNode);
    });

    // Добавляем прямые счета из КП
    quote.invoices.forEach((invoice) => {
      quoteNode.children.push({
        id: invoice.id,
        number: invoice.number,
        type: 'invoice',
        status: invoice.status,
        total: invoice.total_amount,
        date: invoice.created_at,
        children: []
      });
    });

    tree.quotes.push(quoteNode);
  });

  return tree;
}
