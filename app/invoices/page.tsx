'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientLogger } from '@/lib/logging/client-logger';

interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  createdAt: string;
  dueDate: string;
  total: number;
  currency: string;
  paymentMethod?: string;
  items: any[];
  notes?: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeData, setMergeData] = useState({
    clientId: '',
    clientName: '',
    invoices: [] as Invoice[]
  });

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        clientLogger.error('Failed to load invoices');
        setInvoices([]);
      }
    } catch (error) {
      clientLogger.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'paid': return 'Оплачен';
      case 'overdue': return 'Просрочен';
      default: return status;
    }
  };

  const handleInvoiceSelect = (invoiceId: string) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId) 
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };

  const handleMergeInvoices = () => {
    if (selectedInvoices.length < 2) return;
    
    const invoicesToMerge = invoices.filter(i => selectedInvoices.includes(i.id));
    const clientId = invoicesToMerge[0].clientId;
    const clientName = invoicesToMerge[0].clientName;
    
    // Проверяем, что все счета принадлежат одному клиенту
    const allSameClient = invoicesToMerge.every(i => i.clientId === clientId);
    
    if (!allSameClient) {
      alert('Нельзя объединять счета разных клиентов');
      return;
    }
    
    setMergeData({
      clientId,
      clientName,
      invoices: invoicesToMerge
    });
    setShowMergeModal(true);
  };

  const executeMerge = () => {
    if (mergeData.invoices.length < 2) return;
    
    // Создаем объединенный счет
    const mergedInvoice: Invoice = {
      id: Date.now().toString(),
      number: `INV-MERGED-${String(invoices.length + 1).padStart(3, '0')}`,
      clientId: mergeData.clientId,
      clientName: mergeData.clientName,
      status: 'draft',
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total: mergeData.invoices.reduce((sum, i) => sum + i.total, 0),
      currency: mergeData.invoices[0].currency,
      paymentMethod: mergeData.invoices[0].paymentMethod,
      items: mergeData.invoices.flatMap(i => i.items),
      notes: `Объединенный счет из: ${mergeData.invoices.map(i => i.number).join(', ')}`
    };
    
    // Удаляем исходные счета и добавляем объединенный
    setInvoices(prev => [
      ...prev.filter(i => !selectedInvoices.includes(i.id)),
      mergedInvoice
    ]);
    
    setSelectedInvoices([]);
    setShowMergeModal(false);
    setMergeData({
      clientId: '',
      clientName: '',
      invoices: []
    });
  };

  const updateInvoiceStatus = (invoiceId: string, newStatus: Invoice['status']) => {
    setInvoices(invoices.map(invoice => 
      invoice.id === invoiceId 
        ? { ...invoice, status: newStatus }
        : invoice
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка счетов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="text-2xl font-bold text-black">
                Domeo
              </Link>
              <span className="text-black text-lg font-bold">•</span>
              <span className="text-lg font-semibold text-black">Счета</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium"
              >
                Создать счет
              </button>
              {selectedInvoices.length >= 2 && (
                <button
                  onClick={handleMergeInvoices}
                  className="px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-500 transition-all duration-200 text-sm font-medium"
                >
                  Объединить счета ({selectedInvoices.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего счетов</p>
                <p className="text-2xl font-bold text-black mt-1">{invoices.length}</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Черновики</p>
                <p className="text-2xl font-bold text-black mt-1">{invoices.filter(i => i.status === 'draft').length}</p>
              </div>
              <div className="text-2xl">📝</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Отправленные</p>
                <p className="text-2xl font-bold text-black mt-1">{invoices.filter(i => i.status === 'sent').length}</p>
              </div>
              <div className="text-2xl">📤</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Оплаченные</p>
                <p className="text-2xl font-bold text-black mt-1">{invoices.filter(i => i.status === 'paid').length}</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Все' },
              { key: 'draft', label: 'Черновики' },
              { key: 'sent', label: 'Отправленные' },
              { key: 'paid', label: 'Оплаченные' },
              { key: 'overdue', label: 'Просроченные' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  filter === key
                    ? 'bg-black text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-black">Список счетов</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInvoices(filteredInvoices.map(i => i.id));
                        } else {
                          setSelectedInvoices([]);
                        }
                      }}
                      className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Счет</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Срок оплаты</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={() => handleInvoiceSelect(invoice.id)}
                        className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{invoice.number}</div>
                        <div className="text-sm text-gray-500">{invoice.createdAt}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">{invoice.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {getStatusText(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">
                        {invoice.total.toLocaleString()} {invoice.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-black">{invoice.dueDate}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="text-black hover:text-yellow-400 transition-colors duration-200"
                        >
                          Подробнее
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                          >
                            Отправить
                          </button>
                        )}
                        {invoice.status === 'sent' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            Отметить оплаченным
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Merge Invoices Modal */}
        {showMergeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">Объединить счета</h3>
                <button
                  onClick={() => setShowMergeModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium text-black mb-2">Клиент: {mergeData.clientName}</h4>
                  <p className="text-sm text-gray-600">Будет создан объединенный счет из {mergeData.invoices.length} документов</p>
                </div>

                <div>
                  <h4 className="font-medium text-black mb-2">Счета для объединения:</h4>
                  <div className="space-y-2">
                    {mergeData.invoices.map((invoice) => (
                      <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-black">{invoice.number}</p>
                          <p className="text-xs text-gray-500">{invoice.createdAt}</p>
                        </div>
                        <p className="text-sm text-black">{invoice.total.toLocaleString()} {invoice.currency}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Общая сумма</label>
                    <p className="text-lg font-semibold text-black">
                      {mergeData.invoices.reduce((sum, i) => sum + i.total, 0).toLocaleString()} {mergeData.invoices[0]?.currency}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Срок оплаты</label>
                    <p className="text-lg font-semibold text-black">
                      {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowMergeModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={executeMerge}
                    className="flex-1 px-4 py-2 bg-yellow-400 text-black hover:bg-yellow-500 transition-all duration-200 text-sm font-medium"
                  >
                    Объединить счета
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
