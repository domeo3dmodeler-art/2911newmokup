'use client';

import React, { useState } from 'react';
import { Card, Button } from '../ui';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
  specifications: Record<string, any>;
}

interface CartModuleProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onExport: (format: 'pdf' | 'xlsx' | 'csv') => void;
  onCreateQuote: () => void;
  onCreateInvoice: () => void;
  onCreateFactoryOrder: () => void;
}

export default function CartModule({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onExport,
  onCreateQuote,
  onCreateInvoice,
  onCreateFactoryOrder
}: CartModuleProps) {
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleExport = (format: 'pdf' | 'xlsx' | 'csv') => {
    if (items.length === 0) {
      alert('Корзина пуста');
      return;
    }
    onExport(format);
    setShowExportOptions(false);
  };

  const handleCreateDocument = (type: 'quote' | 'invoice' | 'factory') => {
    if (items.length === 0) {
      alert('Корзина пуста');
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
          <h3 className="text-lg font-semibold text-black">🛒 Корзина</h3>
          <div className="flex space-x-2">
            <span className="text-sm text-gray-600">
              {totalItems} товаров на {totalAmount.toLocaleString()} ₽
            </span>
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearCart}
                className="text-red-600 hover:text-red-800"
              >
                Очистить
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🛒</div>
            <p>Корзина пуста</p>
            <p className="text-sm">Добавьте товары из конфигуратора</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Список товаров */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-black">{item.name}</h4>
                    <p className="text-sm text-gray-600">Артикул: {item.sku}</p>
                    <div className="text-sm text-gray-500">
                      {Object.entries(item.specifications).map(([key, value]) => (
                        <span key={key} className="mr-2">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-2">
                      <button
                        onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-sm font-medium text-black">
                      {item.total.toLocaleString()} ₽
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Итого */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-black">Итого:</span>
                <span className="text-xl font-bold text-black">
                  {totalAmount.toLocaleString()} ₽
                </span>
              </div>

              {/* Выбор клиента */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Клиент (для КП и счетов)
                </label>
                <select
                  value={selectedClient || ''}
                  onChange={(e) => setSelectedClient(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="">Выберите клиента</option>
                  <option value="client-1">Иванов Иван Иванович</option>
                  <option value="client-2">Петров Петр Петрович</option>
                  <option value="client-3">Сидорова Анна Сергеевна</option>
                </select>
              </div>

              {/* Действия */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  onClick={() => handleCreateDocument('quote')}
                  disabled={!selectedClient}
                >
                  📄 Создать КП
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleCreateDocument('invoice')}
                  disabled={!selectedClient}
                >
                  💰 Создать счет
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleCreateDocument('factory')}
                >
                  🏭 Заказ на фабрику
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowExportOptions(!showExportOptions)}
                >
                  📤 Экспорт
                </Button>
              </div>

              {/* Опции экспорта */}
              {showExportOptions && (
                <div className="mt-4 p-3 bg-gray-50 rounded border">
                  <h4 className="font-medium text-black mb-2">Формат экспорта:</h4>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('pdf')}
                    >
                      PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('xlsx')}
                    >
                      Excel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport('csv')}
                    >
                      CSV
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
