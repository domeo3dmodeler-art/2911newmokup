'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, Button } from '../../components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { clientLogger } from '@/lib/logging/client-logger';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  objectId?: string;
  notes?: string;
  createdAt: string;
  ordersCount: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    objectId: '',
    notes: ''
  });

  const loadClients = useCallback(async () => {
    try {
      setIsLoading(true);
      const { fetchWithAuth } = await import('@/lib/utils/fetch-with-auth');
      const { parseApiResponse } = await import('@/lib/utils/parse-api-response');
      const response = await fetchWithAuth('/api/clients');
      if (response.ok) {
        const responseData = await response.json();
        const data = parseApiResponse<{ clients: any[]; pagination?: any }>(responseData);
        setClients(data.clients || []);
      } else {
        clientLogger.error('Failed to load clients');
        setClients([]);
      }
    } catch (error) {
      clientLogger.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const clientData = {
        firstName: formData.name.split(' ')[1] || '',
        lastName: formData.name.split(' ')[0] || '',
        middleName: formData.name.split(' ')[2] || '',
        phone: formData.phone,
        address: formData.address,
        objectId: formData.objectId,
        customFields: {
          notes: formData.notes,
          email: formData.email
        }
      };

      const { fetchWithAuth } = await import('@/lib/utils/fetch-with-auth');
      const response = await fetchWithAuth('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientData)
      });

      if (response.ok) {
        const data = await response.json();
        if (editingClient) {
          setClients(clients.map(client => 
            client.id === editingClient.id ? data.client : client
          ));
        } else {
          setClients([data.client, ...clients]);
        }
        setShowForm(false);
        setEditingClient(null);
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          objectId: '',
          notes: ''
        });
      } else {
        clientLogger.error('Failed to save client');
      }
    } catch (error) {
      clientLogger.error('Error saving client:', error);
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      objectId: client.objectId || '',
      notes: client.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = (clientId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого клиента?')) {
      setClients(clients.filter(client => client.id !== clientId));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка клиентов...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Управление клиентами"
      subtitle="Создание и редактирование клиентской базы"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего клиентов</p>
                  <p className="text-2xl font-bold text-black mt-1">{clients.length}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Активные клиенты</p>
                  <p className="text-2xl font-bold text-black mt-1">{clients.filter(c => c.ordersCount > 0).length}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Новые за месяц</p>
                  <p className="text-2xl font-bold text-black mt-1">{clients.filter(c => {
                    const monthAgo = new Date();
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return new Date(c.createdAt) > monthAgo;
                  }).length}</p>
                </div>
                <div className="text-2xl">🆕</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-black">Клиенты</h2>
          <Button
            variant="primary"
            onClick={() => setShowForm(true)}
          >
            Добавить клиента
          </Button>
        </div>

        {/* Clients Table */}
        <Card variant="base">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакты</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Адрес</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заказы</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата создания</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{client.name}</div>
                        {client.objectId && (
                          <div className="text-sm text-gray-500">ID: {client.objectId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{client.email}</div>
                        <div className="text-sm text-gray-500">{client.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{client.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {client.ordersCount} заказов
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add/Edit Client Form */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-black mb-4">
                {editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">ФИО *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Иванов Иван Иванович"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="client@example.com"
                  />
                </div>
                <PhoneInput
                  label="Телефон"
                  value={formData.phone}
                  onChange={(value) => setFormData({ ...formData, phone: value })}
                  required
                  placeholder="+7 (999) 123-45-67"
                />
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Адрес *</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="г. Москва, ул. Примерная, д. 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">ID Объекта</label>
                  <input
                    type="text"
                    value={formData.objectId}
                    onChange={(e) => setFormData({ ...formData, objectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="OBJ-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Примечания</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    rows={3}
                    placeholder="Дополнительная информация о клиенте"
                  />
                </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium"
                  >
                    {editingClient ? 'Сохранить' : 'Добавить'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingClient(null);
                      setFormData({
                        name: '',
                        email: '',
                        phone: '',
                        address: '',
                        objectId: '',
                        notes: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all duration-200 text-sm font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}