'use client';

import { useState } from 'react';

interface DocumentHeaderProps {
  document: any;
}

export function DocumentHeader({ document }: DocumentHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'invoice':
        return 'Счет';
      case 'quote':
        return 'Коммерческое предложение';
      case 'order':
        return 'Заказ у поставщика';
      default:
        return 'Документ';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'invoice':
        return '📄';
      case 'quote':
        return '📋';
      case 'order':
        return '📦';
      default:
        return '📄';
    }
  };

  // Маппинг статусов из API в русские (как в существующих компонентах)
  const mapQuoteStatus = (apiStatus: string): string => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Черновик',
      'SENT': 'Отправлено',
      'ACCEPTED': 'Согласовано',
      'REJECTED': 'Отказ'
    };
    return statusMap[apiStatus] || 'Черновик';
  };

  const mapInvoiceStatus = (apiStatus: string): string => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Черновик',
      'SENT': 'Отправлен',
      'PAID': 'Оплачен/Заказ',
      'CANCELLED': 'Отменен',
      'IN_PRODUCTION': 'Заказ размещен',
      'RECEIVED_FROM_SUPPLIER': 'Получен от поставщика',
      'COMPLETED': 'Исполнен'
    };
    return statusMap[apiStatus] || 'Черновик';
  };

  const mapOrderStatus = (apiStatus: string): string => {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Черновик',
      'SENT': 'Отправлен',
      'ACCEPTED': 'Принят',
      'REJECTED': 'Отклонен',
      'IN_PRODUCTION': 'В производстве',
      'COMPLETED': 'Исполнен'
    };
    return statusMap[apiStatus] || 'Черновик';
  };

  const getStatusDisplayName = (status: string, type: string): string => {
    switch (type) {
      case 'quote':
        return mapQuoteStatus(status);
      case 'invoice':
        return mapInvoiceStatus(status);
      case 'order':
        return mapOrderStatus(status);
      default:
        return status;
    }
  };

  const getStatusColor = (status: string, type: string): string => {
    const statusColors: Record<string, string> = {
      'Черновик': 'bg-gray-100 text-gray-800',
      'Отправлен': 'bg-blue-100 text-blue-800',
      'Отправлено': 'bg-blue-100 text-blue-800',
      'Согласовано': 'bg-green-100 text-green-800',
      'Согласован': 'bg-green-100 text-green-800',
      'Оплачен/Заказ': 'bg-green-100 text-green-800',
      'Заказ размещен': 'bg-yellow-100 text-yellow-800',
      'В производстве': 'bg-yellow-100 text-yellow-800',
      'Получен от поставщика': 'bg-purple-100 text-purple-800',
      'Исполнен': 'bg-green-100 text-green-800',
      'Отказ': 'bg-red-100 text-red-800',
      'Отклонен': 'bg-red-100 text-red-800',
      'Отменен': 'bg-red-100 text-red-800'
    };
    return statusColors[getStatusDisplayName(status, type)] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {/* Иконка типа документа */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
              {getDocumentIcon(document.type)}
            </div>
          </div>

          {/* Основная информация */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {document.number}
              </h1>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status, document.type)}`}>
                {getStatusDisplayName(document.status, document.type)}
              </span>
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Тип:</span> {getDocumentTypeLabel(document.type)}
              </p>
              <p>
                <span className="font-medium">Дата создания:</span>{' '}
                {new Date(document.created_at || document.createdAt).toLocaleDateString('ru-RU')}
              </p>
              <p>
                <span className="font-medium">Клиент:</span>{' '}
                <a 
                  href={`/clients/${document.client?.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {document.client?.firstName} {document.client?.lastName} {document.client?.middleName}
                </a>
              </p>
              {document.client?.phone && (
                <p>
                  <span className="font-medium">Телефон:</span> {document.client.phone}
                </p>
              )}
              {document.client?.address && (
                <p>
                  <span className="font-medium">Адрес:</span> {document.client.address}
                </p>
              )}
              {/* Связанные документы */}
              {document.quote_id && (
                <p>
                  <span className="font-medium">На основе КП:</span>{' '}
                  <a 
                    href={`/documents/${document.quote_id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    КП #{document.quote_id}
                  </a>
                </p>
              )}
              {document.order_id && (
                <p>
                  <span className="font-medium">На основе заказа:</span>{' '}
                  <a 
                    href={`/documents/${document.order_id}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    Заказ #{document.order_id}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Сумма документа */}
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {document.totalAmount?.toLocaleString('ru-RU')} ₽
          </div>
          {document.subtotal && document.subtotal !== document.totalAmount && (
            <div className="text-sm text-gray-500 mt-1">
              Без НДС: {document.subtotal.toLocaleString('ru-RU')} ₽
            </div>
          )}
        </div>
      </div>

      {/* Дополнительная информация */}
      {document.notes && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Примечания:</h3>
          <p className="text-sm text-gray-600">{document.notes}</p>
        </div>
      )}

      {/* Действия */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>
            <span className="font-medium">Создан:</span>{' '}
            {new Date(document.created_at || document.createdAt).toLocaleString('ru-RU')}
          </span>
          {document.created_by && (
            <span>
              <span className="font-medium">Автор:</span> {document.created_by}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          >
            {isEditing ? 'Отменить' : 'Редактировать'}
          </button>
        </div>
      </div>
    </div>
  );
}
