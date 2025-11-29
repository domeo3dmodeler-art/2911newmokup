'use client';

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import CartModule from './CartModule';
import ExportModule from './ExportModule';

interface PreviewModuleProps {
  modules: any[];
  cartItems: any[];
  onAddToCart: (item: any) => void;
  onUpdateCartQuantity: (id: string, quantity: number) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onExport: (format: 'pdf' | 'xlsx' | 'csv') => void;
  onCreateQuote: () => void;
  onCreateInvoice: () => void;
  onCreateFactoryOrder: () => void;
}

export default function PreviewModule({
  modules,
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  onClearCart,
  onExport,
  onCreateQuote,
  onCreateInvoice,
  onCreateFactoryOrder
}: PreviewModuleProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Демо-данные для предпросмотра
  const demoProducts = [
    {
      id: '1',
      name: 'Дверь межкомнатная "Классик"',
      sku: 'DOOR-001',
      price: 15000,
      image: '/api/placeholder/200/200',
      specifications: {
        'Размер': '2000x800',
        'Цвет': 'Белый',
        'Материал': 'МДФ',
        'Фурнитура': 'Золотая'
      }
    },
    {
      id: '2',
      name: 'Дверь входная "Премиум"',
      sku: 'DOOR-002',
      price: 25000,
      image: '/api/placeholder/200/200',
      specifications: {
        'Размер': '2100x900',
        'Цвет': 'Коричневый',
        'Материал': 'Металл',
        'Утепление': 'Да'
      }
    }
  ];

  const handleAddToCart = (product: any) => {
    const cartItem = {
      ...product,
      quantity: 1,
      total: product.price
    };
    onAddToCart(cartItem);
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80';
      case 'tablet': return 'w-96';
      case 'desktop': return 'w-full';
      default: return 'w-full';
    }
  };

  return (
    <div className="space-y-6">
      {/* Панель управления предпросмотром */}
      <Card variant="base">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-black">👁️ Предпросмотр конфигуратора</h3>
            <div className="flex space-x-2">
              <Button
                variant={previewMode === 'desktop' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                🖥️ Desktop
              </Button>
              <Button
                variant={previewMode === 'tablet' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('tablet')}
              >
                📱 Tablet
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                📱 Mobile
              </Button>
            </div>
          </div>

          {/* Выбор клиента */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Клиент для тестирования:
            </label>
            <select
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(e.target.value || null)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Выберите клиента</option>
              <option value="client-1">Иванов Иван Иванович</option>
              <option value="client-2">Петров Петр Петрович</option>
              <option value="client-3">Сидорова Анна Сергеевна</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Предпросмотр конфигуратора */}
      <div className="flex justify-center">
        <div className={`${getPreviewWidth()} border border-gray-300 rounded-lg overflow-hidden bg-white`}>
          <div className="p-6">
            <h1 className="text-2xl font-bold text-black mb-6">Конфигуратор дверей</h1>
            
            {/* Модули конфигуратора */}
            <div className="space-y-6">
              {/* Фильтры */}
              <Card variant="base">
                <div className="p-4">
                  <h3 className="font-medium text-black mb-3">🔍 Фильтры</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Размер</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                        <option>2000x800</option>
                        <option>2100x900</option>
                        <option>2200x1000</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Цвет</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                        <option>Белый</option>
                        <option>Коричневый</option>
                        <option>Серый</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Селектор товаров */}
              <Card variant="base">
                <div className="p-4">
                  <h3 className="font-medium text-black mb-3">📋 Выбор товара</h3>
                  <div className="space-y-3">
                    {demoProducts.map((product) => (
                      <div key={product.id} className="flex items-center space-x-4 p-3 border border-gray-200 rounded">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-black">{product.name}</h4>
                          <p className="text-sm text-gray-600">Артикул: {product.sku}</p>
                          <div className="text-sm text-gray-500">
                            {Object.entries(product.specifications).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-black">
                            {product.price.toLocaleString()} ₽
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            className="mt-2"
                          >
                            В корзину
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Корзина */}
              <CartModule
                items={cartItems}
                onUpdateQuantity={onUpdateCartQuantity}
                onRemoveItem={onRemoveFromCart}
                onClearCart={onClearCart}
                onExport={onExport}
                onCreateQuote={onCreateQuote}
                onCreateInvoice={onCreateInvoice}
                onCreateFactoryOrder={onCreateFactoryOrder}
              />

              {/* Экспорт */}
              <ExportModule
                onExportPDF={() => onExport('pdf')}
                onExportExcel={() => onExport('xlsx')}
                onExportCSV={() => onExport('csv')}
                onCreateQuote={onCreateQuote}
                onCreateInvoice={onCreateInvoice}
                onCreateFactoryOrder={onCreateFactoryOrder}
                cartItems={cartItems}
                selectedClient={selectedClient || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
