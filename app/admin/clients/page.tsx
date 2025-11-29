'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Modal, Alert, LoadingSpinner } from '@/components/ui';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { formatInternationalPhone } from '@/lib/utils/phone';
import Link from 'next/link';
import AdminLayout from '../../../components/layout/AdminLayout';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  address: string;
  objectId: string;
  compilationLeadNumber?: string;
  customFields: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  _count: {
    quotes: number;
    invoices: number;
    orders: number;
    documents: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    address: '',
    objectId: '',
    compilationLeadNumber: '',
    customFields: {} as Record<string, any>
  });

  const fetchClients = useCallback(async () => {
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
      
      const response = await fetch('/api/clients', {
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        alert('Ошибка загрузки заказчиков');
        return;
      }

      const data = await response.json();
      // apiSuccess возвращает { success: true, data: { clients: ..., pagination: ... } }
      const responseData = data && typeof data === 'object' && 'data' in data
        ? (data as { data: { clients?: Client[]; pagination?: Pagination } }).data
        : null;
      const clients = responseData && 'clients' in responseData && Array.isArray(responseData.clients)
        ? responseData.clients
        : (data.clients || []);
      const paginationData = responseData && 'pagination' in responseData
        ? responseData.pagination
        : (data.pagination || null);

      if (response.ok && clients.length >= 0) {
        setClients(clients);
        if (paginationData) {
          setPagination(paginationData);
        }
      } else {
        alert('Ошибка загрузки заказчиков');
      }
    } catch (error) {
      alert('Ошибка загрузки заказчиков');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleCreateClient = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка создания заказчика');
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

      if (response.ok && client) {
        alert('Заказчик создан успешно');
        setShowCreateModal(false);
        resetForm();
        fetchClients();
      } else {
        alert(data.error || 'Ошибка создания заказчика');
      }
    } catch (error) {
      alert('Ошибка создания заказчика');
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка обновления заказчика');
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert('Заказчик обновлен успешно');
        setEditingClient(null);
        resetForm();
        fetchClients();
      } else {
        alert(data.error || 'Ошибка обновления заказчика');
      }
    } catch (error) {
      alert('Ошибка обновления заказчика');
    }
  };

  const handleToggleStatus = async (clientId: string, currentStatus: boolean) => {
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
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        // Обновляем локальное состояние
        setClients(clients.map(client => 
          client.id === clientId 
            ? { ...client, isActive: !currentStatus }
            : client
        ));
        alert('Статус клиента обновлен');
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка обновления статуса');
      }
    } catch (error) {
      alert('Ошибка обновления статуса');
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Удалить заказчика? Это действие нельзя отменить.')) return;

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
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'Ошибка удаления заказчика');
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert('Заказчик удален успешно');
        fetchClients();
      } else {
        alert(data.error || 'Ошибка удаления заказчика');
      }
    } catch (error) {
      alert('Ошибка удаления заказчика');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      middleName: '',
      phone: '',
      address: '',
      objectId: '',
      compilationLeadNumber: '',
      customFields: {}
    });
  };

  const openEditModal = (client: Client) => {
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      middleName: client.middleName || '',
      phone: client.phone,
      address: client.address,
      objectId: client.objectId,
      compilationLeadNumber: (client as any).compilationLeadNumber || '',
      customFields: client.customFields
    });
    setEditingClient(client);
  };

  const openCreateModal = () => {
    resetForm();
    setEditingClient(null);
    setShowCreateModal(true);
  };

  if (loading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner size="lg" color="black" text="Загрузка заказчиков..." />
      </div>
    );
  }

  return (
    <AdminLayout 
      title="Заказчики" 
      subtitle="Управление заказчиками и их документами"
    >
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
          <Button onClick={openCreateModal} variant="primary">
            Добавить заказчика
          </Button>
        </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Поиск по имени, телефону или адресу..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Clients List */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Клиент
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Телефон
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Адрес
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID объекта
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Создан
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients
                .filter((client) => {
                  if (!search) return true;
                  const searchLower = search.toLowerCase();
                  return (
                    client.firstName.toLowerCase().includes(searchLower) ||
                    client.lastName.toLowerCase().includes(searchLower) ||
                    (client.middleName && client.middleName.toLowerCase().includes(searchLower)) ||
                    client.phone.includes(search) ||
                    client.address.toLowerCase().includes(searchLower)
                  );
                })
                .map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                    {client.lastName} {client.firstName} {client.middleName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatInternationalPhone(client.phone)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={client.address}>
                        {client.address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.objectId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(client.id, client.isActive)}
                        className={`px-2 py-1 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                          client.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                        title="Нажмите для изменения статуса"
                      >
                        {client.isActive ? 'Активен' : 'Неактивен'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(client)}
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    🗑️
                  </Button>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                          Подробнее
                </Link>
              </div>
                    </td>
                  </tr>
          ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                ←
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                {pagination.page} из {pagination.pages}
              </span>
              <Button
                variant="ghost"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                →
              </Button>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={showCreateModal || editingClient !== null}
          onClose={() => {
            setShowCreateModal(false);
            setEditingClient(null);
            resetForm();
          }}
          title={editingClient ? 'Редактировать заказчика' : 'Добавить заказчика'}
        >
          <div className="space-y-4">
            {/* Одна строка с полями разной ширины - как в корзине */}
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фамилия *
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Иванов"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Иван"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Отчество
                </label>
                <Input
                  value={formData.middleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, middleName: e.target.value }))}
                  placeholder="Иванович"
                />
              </div>
              <div className="col-span-2">
                <PhoneInput
                  label="Телефон"
                  value={formData.phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                  required
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID объекта *
                </label>
                <Input
                  value={formData.objectId}
                  onChange={(e) => setFormData(prev => ({ ...prev, objectId: e.target.value }))}
                  placeholder="OBJ-001"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Номер лида комплектации
                </label>
                <Input
                  value={formData.compilationLeadNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, compilationLeadNumber: e.target.value }))}
                  placeholder="Номер лида комплектации"
                />
              </div>
              <div className="col-span-12">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес объекта *
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="г. Москва, ул. Примерная, д. 1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingClient(null);
                  resetForm();
                }}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                onClick={editingClient ? handleUpdateClient : handleCreateClient}
                disabled={!formData.firstName || !formData.lastName || !formData.phone || !formData.address || !formData.objectId}
              >
                {editingClient ? 'Обновить' : 'Создать'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
    </AdminLayout>
  );
}

