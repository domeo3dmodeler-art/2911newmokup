// components/QuoteDetail.tsx
// Компонент для детального просмотра и редактирования КП

"use client";

import { useState, useEffect, useCallback } from 'react';

type Quote = {
  id: string;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  items: any[];
  total: number;
  currency: string;
  clientInfo?: any;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
};

type Props = {
  quoteId: string;
  onQuoteUpdated?: (quote: Quote) => void;
  onClose?: () => void;
};

const STATUS_LABELS = {
  draft: 'Черновик',
  sent: 'Отправлен',
  accepted: 'Принят',
  rejected: 'Отклонен'
};

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function QuoteDetail({ quoteId, onQuoteUpdated, onClose }: Props) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Quote>>({});

  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/quotes/${quoteId}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке КП');
      }

      const data = await response.json();
      setQuote(data);
      setEditData({
        title: data.title,
        clientInfo: data.clientInfo || {},
        notes: data.notes || ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSave = async () => {
    if (!quote) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при сохранении КП');
      }

      const updatedQuote = await response.json();
      setQuote(updatedQuote.quote);
      setEditing(false);
      
      if (onQuoteUpdated) {
        onQuoteUpdated(updatedQuote.quote);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!quote) return;

    try {
      const response = await fetch(`/api/quotes/${quote.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${document.cookie.split('; ').find(row => row.startsWith('auth-token='))?.split('=')[1]}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при изменении статуса');
      }

      const result = await response.json();
      setQuote(result.quote);
      
      if (onQuoteUpdated) {
        onQuoteUpdated(result.quote);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency === 'RUB' ? 'RUB' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Загрузка КП...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error || 'КП не найден'}</div>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Закрыть
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Заголовок */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {editing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              quote.title
            )}
          </h1>
          <div className="flex items-center space-x-4">
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[quote.status]}`}>
              {STATUS_LABELS[quote.status]}
            </span>
            <span className="text-sm text-gray-500">
              ID: {quote.id}
            </span>
            <span className="text-sm text-gray-500">
              Создан: {formatDate(quote.createdAt)}
            </span>
            {quote.acceptedAt && (
              <span className="text-sm text-gray-500">
                Принят: {formatDate(quote.acceptedAt)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Закрыть
            </button>
          )}
          
          {quote.status === 'draft' && (
            <>
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Редактировать
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ошибка */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основная информация */}
        <div className="lg:col-span-2 space-y-6">
          {/* Информация о клиенте */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация о клиенте</h3>
            
            {editing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Компания</label>
                  <input
                    type="text"
                    value={editData.clientInfo?.company || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, company: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Контактное лицо</label>
                  <input
                    type="text"
                    value={editData.clientInfo?.contact || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, contact: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editData.clientInfo?.email || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, email: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                  <input
                    type="tel"
                    value={editData.clientInfo?.phone || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, phone: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
                  <input
                    type="text"
                    value={editData.clientInfo?.address || ''}
                    onChange={(e) => setEditData(prev => ({
                      ...prev,
                      clientInfo: { ...prev.clientInfo, address: e.target.value }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quote.clientInfo?.company && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Компания:</span>
                    <div className="text-gray-900">{quote.clientInfo.company}</div>
                  </div>
                )}
                {quote.clientInfo?.contact && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Контактное лицо:</span>
                    <div className="text-gray-900">{quote.clientInfo.contact}</div>
                  </div>
                )}
                {quote.clientInfo?.email && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <div className="text-gray-900">{quote.clientInfo.email}</div>
                  </div>
                )}
                {quote.clientInfo?.phone && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Телефон:</span>
                    <div className="text-gray-900">{quote.clientInfo.phone}</div>
                  </div>
                )}
                {quote.clientInfo?.address && (
                  <div className="md:col-span-2">
                    <span className="text-sm font-medium text-gray-700">Адрес:</span>
                    <div className="text-gray-900">{quote.clientInfo.address}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Примечания */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Примечания</h3>
            
            {editing ? (
              <textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Дополнительная информация..."
              />
            ) : (
              <div className="text-gray-900">
                {quote.notes || 'Примечания отсутствуют'}
              </div>
            )}
          </div>

          {/* Позиции КП */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Позиции КП</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Размер
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Опции
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Кол-во
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quote.items.map((item: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.model}</div>
                          <div className="text-sm text-gray-500">{item.sku}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.width}×{item.height}мм
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          {item.hardware_kit && (
                            <div>Комплект: {item.hardware_kit.name}</div>
                          )}
                          {item.handle && (
                            <div>Ручка: {item.handle.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.qty}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(item.rrc_price, item.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(item.rrc_price * item.qty, item.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Боковая панель */}
        <div className="space-y-6">
          {/* Итого */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Итого</h3>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(quote.total, quote.currency)}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {quote.items.length} позиций
            </div>
          </div>

          {/* Действия со статусом */}
          {quote.status !== 'accepted' && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Действия</h3>
              
              <div className="space-y-2">
                {quote.status === 'draft' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('sent')}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Отправить клиенту
                    </button>
                    <button
                      onClick={() => handleStatusChange('accepted')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Принять
                    </button>
                  </>
                )}
                
                {quote.status === 'sent' && (
                  <>
                    <button
                      onClick={() => handleStatusChange('accepted')}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Принять
                    </button>
                    <button
                      onClick={() => handleStatusChange('rejected')}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      Отклонить
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Экспорт */}
          {quote.status === 'accepted' && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Экспорт</h3>
              <p className="text-sm text-gray-600 mb-4">
                КП принят и готов к экспорту заказа на фабрику
              </p>
              <button
                onClick={() => {
                  // Здесь можно добавить логику экспорта
                  alert('Функция экспорта будет реализована в следующем шаге');
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Экспорт на фабрику
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
