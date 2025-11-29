'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Alert, LoadingSpinner } from '@/components/ui';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatInternationalPhone } from '@/lib/utils/phone';
import AdminLayout from '@/components/layout/AdminLayout';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  address: string;
  objectId: string;
  customFields: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  quotes: any[];
  invoices: any[];
  orders: any[];
  documents: any[];
}

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'quotes' | 'invoices' | 'orders'>('documents');
  const [isEditingStatus, setIsEditingStatus] = useState(false);

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/clients/${clientId}`, {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        setAlert({ type: 'error', message: 'Ошибка загрузки заказчика' });
        return;
      }

      const data = await response.json();
      // apiSuccess возвращает { success: true, data: { client: ... } }
      const responseData = data && typeof data === 'object' && 'data' in data
        ? (data as { data: { client?: Client } }).data
        : null;
      const client = responseData && 'client' in responseData
        ? responseData.client
        : (data.client || null);

      if (data.success && client) {
        setClient(client);
      } else {
        setAlert({ type: 'error', message: 'Ошибка загрузки заказчика' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Ошибка загрузки заказчика' });
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId, fetchClient]);

  const handleStatusChange = async (newStatus: boolean) => {
    if (!client) return;
    
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          isActive: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setAlert({ type: 'error', message: errorData.error || 'Ошибка обновления статуса' });
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setClient({ ...client, isActive: newStatus });
        setAlert({ type: 'success', message: 'Статус клиента обновлен' });
        setIsEditingStatus(false);
      } else {
        setAlert({ type: 'error', message: data.error || 'Ошибка обновления статуса' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Ошибка обновления статуса' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="black" text="Загрузка заказчика..." />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Заказчик не найден</h1>
          <Link href="/admin/clients" className="text-blue-600 hover:text-blue-800">
            ← Вернуться к списку заказчиков
          </Link>
        </div>
      </div>
    );
  }

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'quote': return 'КП';
      case 'invoice': return 'Счет';
      case 'order': return 'Заказ';
      default: return type;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'paid': return 'Оплачен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout
      title={`${client.lastName} ${client.firstName} ${client.middleName}`}
      subtitle="Информация о заказчике и его документах"
      showBackButton={true}
      backHref="/admin/clients"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert */}
        {alert && (
          <Alert
            variant={alert.type === 'error' ? 'error' : 'success'}
            onClose={() => setAlert(null)}
            className="mb-6"
          >
            {alert.message}
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Client Info */}
          <div className="lg:col-span-1">
            <Card variant="base" padding="sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Информация о заказчике</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Телефон</label>
                  <p className="text-sm text-gray-900">{formatInternationalPhone(client.phone)}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Адрес объекта</label>
                  <p className="text-sm text-gray-900">{client.address}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ID объекта</label>
                  <p className="text-sm text-gray-900">{client.objectId}</p>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Статус</label>
                  {isEditingStatus ? (
                    <div className="flex items-center space-x-2">
                      <select
                        value={client.isActive ? 'active' : 'inactive'}
                        onChange={(e) => handleStatusChange(e.target.value === 'active')}
                        className="text-xs px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="active">Активен</option>
                        <option value="inactive">Неактивен</option>
                      </select>
                      <button
                        onClick={() => setIsEditingStatus(false)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        client.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                      <button
                        onClick={() => setIsEditingStatus(true)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Дата создания</label>
                  <p className="text-sm text-gray-900">
                    {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Documents */}
          <div className="lg:col-span-3">
            {/* Tabs */}
            <div className="flex space-x-1 mb-4">
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'documents'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все документы
              </button>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'quotes'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                КП ({client.quotes?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'invoices'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Счета ({client.invoices?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Заказы ({client.orders?.length || 0})
              </button>
            </div>

            {/* Documents List */}
            <div className="space-y-4">
              {(() => {
                let documents = client.documents || [];
                
                switch (activeTab) {
                  case 'quotes':
                    documents = (client.quotes || []).map(quote => ({ ...quote, type: 'quote' }));
                    break;
                  case 'invoices':
                    documents = (client.invoices || []).map(invoice => ({ ...invoice, type: 'invoice' }));
                    break;
                  case 'orders':
                    documents = (client.orders || []).map(order => ({ ...order, type: 'order' }));
                    break;
                  default:
                    // Объединяем все документы
                    documents = [
                      ...(client.quotes || []).map(quote => ({ ...quote, type: 'quote' })),
                      ...(client.invoices || []).map(invoice => ({ ...invoice, type: 'invoice' })),
                      ...(client.orders || []).map(order => ({ ...order, type: 'order' }))
                    ];
                }

                if (documents.length === 0) {
                  return (
                    <Card variant="base" padding="md">
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">📄</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Документы не найдены
                        </h3>
                        <p className="text-gray-600">
                          {activeTab === 'documents' 
                            ? 'У этого заказчика пока нет документов'
                            : `У этого заказчика пока нет документов типа "${getDocumentTypeLabel(activeTab as 'quote' | 'invoice' | 'order')}"`
                          }
                        </p>
                      </div>
                    </Card>
                  );
                }

                return documents.map((document) => (
                  <Card key={document.id} variant="base" padding="md">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {getDocumentTypeLabel(document.type)} #{document.id.slice(-8)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Создан: {new Date(document.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {getStatusLabel(document.status)}
                        </span>
                        <Button variant="ghost" size="sm">
                          Открыть
                        </Button>
                      </div>
                    </div>
                  </Card>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

