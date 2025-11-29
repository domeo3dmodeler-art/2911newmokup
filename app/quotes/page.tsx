'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, Button } from '../../components/ui';
import { clientLogger } from '@/lib/logging/client-logger';

interface Quote {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  createdAt: string;
  validUntil: string;
  total: number;
  currency: string;
  discount: number;
  items: any[];
  notes?: string;
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'accepted' | 'rejected'>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeData, setMergeData] = useState({
    clientId: '',
    clientName: '',
    quotes: [] as Quote[]
  });

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      } else {
        clientLogger.error('Failed to load quotes');
        setQuotes([]);
      }
    } catch (error) {
      clientLogger.error('Error loading quotes:', error);
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotes = filter === 'all' 
    ? quotes 
    : quotes.filter(quote => quote.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'accepted': return 'Принят';
      case 'rejected': return 'Отклонен';
      default: return status;
    }
  };

  const handleQuoteSelect = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId)
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleMergeQuotes = () => {
    if (selectedQuotes.length < 2) return;
    
    const quotesToMerge = quotes.filter(q => selectedQuotes.includes(q.id));
    const clientId = quotesToMerge[0].clientId;
    const clientName = quotesToMerge[0].clientName;
    
    // Проверяем, что все КП принадлежат одному клиенту
    const allSameClient = quotesToMerge.every(q => q.clientId === clientId);
    
    if (!allSameClient) {
      alert('Нельзя объединять КП разных клиентов');
      return;
    }
    
    setMergeData({
      clientId,
      clientName,
      quotes: quotesToMerge
    });
    setShowMergeModal(true);
  };

  const executeMerge = () => {
    if (mergeData.quotes.length < 2) return;
    
    // Создаем объединенный КП
    const mergedQuote: Quote = {
      id: Date.now().toString(),
      number: `KP-MERGED-${String(quotes.length + 1).padStart(3, '0')}`,
      clientId: mergeData.clientId,
      clientName: mergeData.clientName,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total: mergeData.quotes.reduce((sum, q) => sum + q.total, 0),
      currency: 'RUB',
      discount: 0,
      items: mergeData.quotes.flatMap(q => q.items),
      notes: `Объединенный КП из: ${mergeData.quotes.map(q => q.number).join(', ')}`
    };
    
    setQuotes([mergedQuote, ...quotes]);
    setSelectedQuotes([]);
    setShowMergeModal(false);
    setMergeData({
      clientId: '',
      clientName: '',
      quotes: []
    });
  };

  const updateQuoteStatus = (quoteId: string, newStatus: Quote['status']) => {
    setQuotes(quotes.map(quote => 
      quote.id === quoteId 
        ? { ...quote, status: newStatus }
        : quote
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка КП...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Коммерческие предложения"
      subtitle="Создание и управление КП для клиентов"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего КП</p>
                  <p className="text-2xl font-bold text-black mt-1">{quotes.length}</p>
                </div>
                <div className="text-2xl">📄</div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Черновики</p>
                  <p className="text-2xl font-bold text-black mt-1">{quotes.filter(q => q.status === 'draft').length}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Отправленные</p>
                  <p className="text-2xl font-bold text-black mt-1">{quotes.filter(q => q.status === 'sent').length}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Принятые</p>
                  <p className="text-2xl font-bold text-black mt-1">{quotes.filter(q => q.status === 'accepted').length}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="base">
          <div className="p-6">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Все КП' },
                { key: 'draft', label: 'Черновики' },
                { key: 'sent', label: 'Отправленные' },
                { key: 'accepted', label: 'Принятые' },
                { key: 'rejected', label: 'Отклоненные' }
              ].map((filterOption) => (
                <Button
                  key={filterOption.key}
                  variant={filter === filterOption.key ? 'primary' : 'secondary'}
                  onClick={() => setFilter(filterOption.key as any)}
                  size="sm"
                >
                  {filterOption.label}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">КП</h2>
          <div className="flex space-x-2">
            {selectedQuotes.length >= 2 && (
              <Button
                variant="secondary"
                onClick={handleMergeQuotes}
              >
                Объединить КП ({selectedQuotes.length})
              </Button>
            )}
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Создать КП
            </Button>
          </div>
        </div>

        {/* Quotes Table */}
        <Card variant="base">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuotes(filteredQuotes.map(q => q.id));
                        } else {
                          setSelectedQuotes([]);
                        }
                      }}
                      className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">КП</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Скидка</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действителен до</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedQuotes.includes(quote.id)}
                        onChange={() => handleQuoteSelect(quote.id)}
                        className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{quote.number}</div>
                        <div className="text-sm text-gray-500">{quote.items.length} позиций</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                        {getStatusText(quote.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: quote.currency,
                          minimumFractionDigits: 0
                        }).format(quote.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote.discount}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(quote.validUntil).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          Подробнее
                        </button>
                        {quote.status === 'draft' && (
                          <button
                            onClick={() => updateQuoteStatus(quote.id, 'sent')}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            Отправить
                          </button>
                        )}
                        {quote.status === 'sent' && (
                          <button
                            onClick={() => updateQuoteStatus(quote.id, 'accepted')}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            Принять
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Quote Detail Modal */}
        {selectedQuote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">КП {selectedQuote.number}</h3>
                <button
                  onClick={() => setSelectedQuote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Клиент</label>
                    <p className="text-sm text-gray-900">{selectedQuote.clientName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Статус</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedQuote.status)}`}>
                      {getStatusText(selectedQuote.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Сумма</label>
                    <p className="text-sm text-gray-900">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: selectedQuote.currency,
                        minimumFractionDigits: 0
                      }).format(selectedQuote.total)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Скидка</label>
                    <p className="text-sm text-gray-900">{selectedQuote.discount}%</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Позиции КП</label>
                  <div className="mt-2 space-y-2">
                    {selectedQuote.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-600">
                          {item.quantity} × {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: selectedQuote.currency,
                            minimumFractionDigits: 0
                          }).format(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedQuote.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Примечания</label>
                    <p className="text-sm text-gray-900">{selectedQuote.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Merge Modal */}
        {showMergeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-md mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">Объединить КП</h3>
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Клиент</label>
                  <p className="text-sm text-gray-900">{mergeData.clientName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">КП для объединения</label>
                  <div className="mt-2 space-y-2">
                    {mergeData.quotes.map((quote) => (
                      <div key={quote.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">{quote.number}</span>
                        <span className="text-sm text-gray-600">
                          {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: quote.currency,
                            minimumFractionDigits: 0
                          }).format(quote.total)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={executeMerge}
                    className="flex-1 px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium"
                  >
                    Объединить
                  </button>
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}