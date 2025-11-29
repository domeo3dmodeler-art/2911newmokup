'use client';

import React, { useState } from 'react';
import { Card, Button } from '../ui';

interface ExportModuleProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onExportCSV: () => void;
  onCreateQuote: () => void;
  onCreateInvoice: () => void;
  onCreateFactoryOrder: () => void;
  cartItems: any[];
  selectedClient?: string;
}

export default function ExportModule({
  onExportPDF,
  onExportExcel,
  onExportCSV,
  onCreateQuote,
  onCreateInvoice,
  onCreateFactoryOrder,
  cartItems,
  selectedClient
}: ExportModuleProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');

  const handleExport = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (cartItems.length === 0) {
      alert('Нет товаров для экспорта');
      return;
    }

    setExportFormat(format);
    
    switch (format) {
      case 'pdf':
        onExportPDF();
        break;
      case 'xlsx':
        onExportExcel();
        break;
      case 'csv':
        onExportCSV();
        break;
    }
  };

  const handleCreateDocument = (type: 'quote' | 'invoice' | 'factory') => {
    if (cartItems.length === 0) {
      alert('Нет товаров для создания документа');
      return;
    }

    if (!selectedClient && type !== 'factory') {
      alert('Выберите клиента для создания документа');
      return;
    }

    switch (type) {
      case 'quote':
        onCreateQuote();
        break;
      case 'invoice':
        onCreateInvoice();
        break;
      case 'factory':
        onCreateFactoryOrder();
        break;
    }
  };

  return (
    <Card variant="base">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-black">📤 Экспорт документов</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Скрыть превью' : 'Показать превью'}
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-black">{cartItems.length}</div>
            <div className="text-sm text-gray-600">Товаров</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-black">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </div>
            <div className="text-sm text-gray-600">Штук</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded">
            <div className="text-2xl font-bold text-black">
              {cartItems.reduce((sum, item) => sum + item.total, 0).toLocaleString()} ₽
            </div>
            <div className="text-sm text-gray-600">Сумма</div>
          </div>
        </div>

        {/* Превью документа */}
        {showPreview && (
          <div className="mb-6 p-4 bg-gray-50 rounded border">
            <h4 className="font-medium text-black mb-3">Превью документа:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Клиент:</span>
                <span>{selectedClient || 'Не выбран'}</span>
              </div>
              <div className="flex justify-between">
                <span>Дата:</span>
                <span>{new Date().toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between">
                <span>Формат:</span>
                <span className="uppercase">{exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span>Товаров:</span>
                <span>{cartItems.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Форматы экспорта */}
        <div className="mb-6">
          <h4 className="font-medium text-black mb-3">Форматы экспорта:</h4>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant={exportFormat === 'pdf' ? 'primary' : 'secondary'}
              onClick={() => handleExport('pdf')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm font-medium">PDF</div>
              <div className="text-xs text-gray-600">Для печати</div>
            </Button>
            <Button
              variant={exportFormat === 'xlsx' ? 'primary' : 'secondary'}
              onClick={() => handleExport('xlsx')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium">Excel</div>
              <div className="text-xs text-gray-600">Таблицы</div>
            </Button>
            <Button
              variant={exportFormat === 'csv' ? 'primary' : 'secondary'}
              onClick={() => handleExport('csv')}
              className="flex flex-col items-center p-4 h-auto"
            >
              <div className="text-2xl mb-2">📋</div>
              <div className="text-sm font-medium">CSV</div>
              <div className="text-xs text-gray-600">Данные</div>
            </Button>
          </div>
        </div>

        {/* Создание документов */}
        <div>
          <h4 className="font-medium text-black mb-3">Создание документов:</h4>
          <div className="grid grid-cols-1 gap-3">
            <Button
              variant="primary"
              onClick={() => handleCreateDocument('quote')}
              disabled={!selectedClient}
              className="flex items-center justify-center p-3"
            >
              <span className="mr-2">📄</span>
              Создать коммерческое предложение
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleCreateDocument('invoice')}
              disabled={!selectedClient}
              className="flex items-center justify-center p-3"
            >
              <span className="mr-2">💰</span>
              Создать счет
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleCreateDocument('factory')}
              className="flex items-center justify-center p-3"
            >
              <span className="mr-2">🏭</span>
              Создать заказ на фабрику
            </Button>
          </div>
        </div>

        {/* Информация о клиенте */}
        {!selectedClient && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              ⚠️ Для создания КП и счета необходимо выбрать клиента
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
