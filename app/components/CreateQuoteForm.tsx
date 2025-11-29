// components/CreateQuoteForm.tsx
// Компонент формы для создания нового КП

"use client";

import { useState } from 'react';

type CartItem = {
  sku: string;
  model: string;
  width?: number;
  height?: number;
  color?: string;
  finish?: string;
  series?: string;
  material?: string;
  rrc_price: number;
  qty: number;
  hardware_kit?: {
    name: string;
    price_rrc: number;
    group?: string;
  };
  handle?: {
    name: string;
    price_opt: number;
    price_group_multiplier: number;
  };
  price_opt?: number;
  currency?: string;
};

type Props = {
  cartItems: CartItem[];
  onQuoteCreated?: (quoteId: string) => void;
  onCancel?: () => void;
};

export default function CreateQuoteForm({ cartItems, onQuoteCreated, onCancel }: Props) {
  const [formData, setFormData] = useState({
    title: '',
    clientInfo: {
      company: '',
      contact: '',
      email: '',
      phone: '',
      address: ''
    },
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quotes/from-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart: { items: cartItems },
          quoteData: formData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании КП');
      }

      const result = await response.json();
      
      if (onQuoteCreated) {
        onQuoteCreated(result.quote.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.rrc_price * item.qty), 0);
  };

  const formatCurrency = (amount: number, currency: string = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Создание коммерческого предложения</h2>
        <p className="text-gray-600">
          Создайте КП из {cartItems.length} позиций в корзине
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Название КП *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Например: КП для офиса 'Солнечный'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Информация о клиенте */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о клиенте</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Компания
              </label>
              <input
                type="text"
                id="company"
                value={formData.clientInfo.company}
                onChange={(e) => handleInputChange('clientInfo.company', e.target.value)}
                placeholder="ООО Название компании"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                Контактное лицо
              </label>
              <input
                type="text"
                id="contact"
                value={formData.clientInfo.contact}
                onChange={(e) => handleInputChange('clientInfo.contact', e.target.value)}
                placeholder="Иванов Иван Иванович"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.clientInfo.email}
                onChange={(e) => handleInputChange('clientInfo.email', e.target.value)}
                placeholder="ivanov@company.ru"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.clientInfo.phone}
                onChange={(e) => handleInputChange('clientInfo.phone', e.target.value)}
                placeholder="+7 (495) 123-45-67"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Адрес
              </label>
              <input
                type="text"
                id="address"
                value={formData.clientInfo.address}
                onChange={(e) => handleInputChange('clientInfo.address', e.target.value)}
                placeholder="г. Москва, ул. Примерная, д. 1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Примечания */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Примечания</h3>
          
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Дополнительная информация
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Особые требования, сроки доставки, условия оплаты..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Сводка по корзине */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Сводка по корзине</h3>
          
          <div className="space-y-2">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-blue-200 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.model}</div>
                  <div className="text-sm text-gray-600">
                    {item.sku} • {item.width}×{item.height}мм • {item.color}
                  </div>
                  {item.hardware_kit && (
                    <div className="text-sm text-gray-500">
                      Комплект: {item.hardware_kit.name}
                    </div>
                  )}
                  {item.handle && (
                    <div className="text-sm text-gray-500">
                      Ручка: {item.handle.name}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatCurrency(item.rrc_price * item.qty, item.currency)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.qty} шт. × {formatCurrency(item.rrc_price, item.currency)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center text-lg font-semibold text-gray-900">
              <span>Итого:</span>
              <span>{formatCurrency(calculateTotal())}</span>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
            >
              Отмена
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создание КП...' : 'Создать КП'}
          </button>
        </div>
      </form>
    </div>
  );
}
