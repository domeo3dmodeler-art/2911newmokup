'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../components/ui';
import { 
  FileText, 
  ShoppingCart, 
  Receipt, 
  Factory,
  Plus,
  Eye,
  Download,
  ArrowRight,
  Link
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

interface SimpleDocument {
  id: string;
  number: string;
  type: 'quote' | 'order' | 'invoice' | 'supplier_order';
  status: string;
  total?: number;
  supplier?: string;
  date: string;
  parentId?: string;
  parentType?: string;
  parentNumber?: string;
}

interface SimpleDocumentListProps {
  clientId: string;
  onDocumentSelect?: (document: SimpleDocument) => void;
  onCreateDocument?: (sourceType: string, sourceId: string, targetType: string) => void;
}

export default function SimpleDocumentList({ clientId, onDocumentSelect, onCreateDocument }: SimpleDocumentListProps) {
  const [documents, setDocuments] = useState<SimpleDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка документов клиента
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Объединяем все документы в один список
        const allDocuments: SimpleDocument[] = [];
        
        // КП
        if (data.client.quotes) {
          data.client.quotes.forEach((quote: any) => {
            allDocuments.push({
              id: quote.id,
              number: `КП-${quote.id.slice(-6)}`,
              type: 'quote',
              status: mapStatus(quote.status),
              total: quote.total_amount,
              date: quote.created_at,
            });
          });
        }
        
        // Заказы
        if (data.client.orders) {
          data.client.orders.forEach((order: any) => {
            allDocuments.push({
              id: order.id,
              number: `Заказ-${order.id.slice(-6)}`,
              type: 'order',
              status: mapStatus(order.status),
              total: order.total_amount,
              date: order.created_at,
              parentId: order.quote_id,
              parentType: 'quote',
              parentNumber: order.quote_id ? `КП-${order.quote_id.slice(-6)}` : undefined,
            });
          });
        }
        
        // Счета
        if (data.client.invoices) {
          data.client.invoices.forEach((invoice: any) => {
            allDocuments.push({
              id: invoice.id,
              number: `СЧ-${invoice.id.slice(-6)}`,
              type: 'invoice',
              status: mapStatus(invoice.status),
              total: invoice.total_amount,
              date: invoice.created_at,
              parentId: invoice.order_id || invoice.quote_id,
              parentType: invoice.order_id ? 'order' : 'quote',
              parentNumber: invoice.order_id 
                ? `Заказ-${invoice.order_id.slice(-6)}` 
                : invoice.quote_id 
                  ? `КП-${invoice.quote_id.slice(-6)}` 
                  : undefined,
            });
          });
        }
        
        // Сортируем по дате (новые сверху)
        allDocuments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        setDocuments(allDocuments);
      }
    } catch (error) {
      clientLogger.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchDocuments();
    }
  }, [clientId, fetchDocuments]);

  const mapStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Черновик',
      'SENT': 'Отправлено',
      'ACCEPTED': 'Согласовано',
      'REJECTED': 'Отказ',
      'PENDING': 'В ожидании',
      'ORDERED': 'Заказано',
      'IN_PRODUCTION': 'В производстве',
      'READY': 'Готово',
      'CANCELLED': 'Отменено',
      'PAID': 'Оплачено'
    };
    return statusMap[status] || status;
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'quote': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'order': return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'invoice': return <Receipt className="h-4 w-4 text-purple-500" />;
      case 'supplier_order': return <Factory className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Черновик': return 'bg-gray-100 text-gray-800';
      case 'Отправлено': return 'bg-blue-100 text-blue-800';
      case 'Согласовано': return 'bg-green-100 text-green-800';
      case 'Отказ': return 'bg-red-100 text-red-800';
      case 'В ожидании': return 'bg-yellow-100 text-yellow-800';
      case 'Заказано': return 'bg-blue-100 text-blue-800';
      case 'В производстве': return 'bg-orange-100 text-orange-800';
      case 'Готово': return 'bg-green-100 text-green-800';
      case 'Оплачено': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreateOptions = (docType: string) => {
    switch (docType) {
      case 'quote':
        return [
          { type: 'order', label: 'Заказ', icon: <ShoppingCart className="h-3 w-3" /> },
          { type: 'invoice', label: 'Счет', icon: <Receipt className="h-3 w-3" /> }
        ];
      case 'order':
        return [
          { type: 'invoice', label: 'Счет', icon: <Receipt className="h-3 w-3" /> },
          { type: 'supplier_order', label: 'Заказ у поставщика', icon: <Factory className="h-3 w-3" /> }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">Загрузка документов...</div>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>Документов пока нет</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-900">Документы клиента</h3>
      </div>
      
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="group border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getDocumentIcon(doc.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {doc.number}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <span>{new Date(doc.date).toLocaleDateString('ru-RU')}</span>
                    {doc.total && <span>• {doc.total.toLocaleString('ru-RU')} ₽</span>}
                    {doc.supplier && <span>• {doc.supplier}</span>}
                  </div>
                  
                  {/* Связь с родительским документом */}
                  {doc.parentNumber && (
                    <div className="flex items-center space-x-1 text-xs text-gray-400 mt-1">
                      <Link className="h-3 w-3" />
                      <span>на основе {doc.parentNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Действия */}
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onDocumentSelect?.(doc)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Просмотр"
                >
                  <Eye className="h-4 w-4 text-gray-500" />
                </button>
                
                <button
                  onClick={() => {
                    clientLogger.debug('Download document clicked');
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Скачать"
                >
                  <Download className="h-4 w-4 text-gray-500" />
                </button>

                {/* Кнопки создания связанных документов */}
                {getCreateOptions(doc.type).map((option) => (
                  <button
                    key={option.type}
                    onClick={() => onCreateDocument?.(doc.type, doc.id, option.type)}
                    className="p-1 hover:bg-gray-200 rounded"
                    title={`Создать ${option.label}`}
                  >
                    <Plus className="h-4 w-4 text-green-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
