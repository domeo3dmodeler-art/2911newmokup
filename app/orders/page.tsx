'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/layout/AdminLayout';
import { Card, Button } from '../../components/ui';
import { clientLogger } from '@/lib/logging/client-logger';

interface Order {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: 'new' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  responsible: string;
  executor?: string;
  total: number;
  currency: string;
  items: any[];
  notes?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const { fetchWithAuth } = await import('@/lib/utils/fetch-with-auth');
      const { parseApiResponse } = await import('@/lib/utils/parse-api-response');
      const response = await fetchWithAuth('/api/orders');
      if (response.ok) {
        const responseData = await response.json();
        const data = parseApiResponse<{ orders: any[]; pagination?: any }>(responseData);
        setOrders(data.orders || []);
      } else {
        clientLogger.error('Failed to load orders');
        setOrders([]);
      }
    } catch (error) {
      clientLogger.error('Error loading orders:', error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Новый';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Выполнен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Высокий';
      case 'medium': return 'Средний';
      case 'low': return 'Низкий';
      default: return priority;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Управление заказами"
      subtitle="Отслеживание и управление заказами клиентов"
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего заказов</p>
                  <p className="text-2xl font-bold text-black mt-1">{orders.length}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Новые</p>
                  <p className="text-2xl font-bold text-black mt-1">{orders.filter(o => o.status === 'new').length}</p>
                </div>
                <div className="text-2xl">🆕</div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">В работе</p>
                  <p className="text-2xl font-bold text-black mt-1">{orders.filter(o => o.status === 'in_progress').length}</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Выполненные</p>
                  <p className="text-2xl font-bold text-black mt-1">{orders.filter(o => o.status === 'completed').length}</p>
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
                { key: 'all', label: 'Все заказы' },
                { key: 'new', label: 'Новые' },
                { key: 'in_progress', label: 'В работе' },
                { key: 'completed', label: 'Выполненные' },
                { key: 'cancelled', label: 'Отмененные' }
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
          <h2 className="text-xl font-semibold text-black">Заказы</h2>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/doors'}
          >
            Создать заказ
          </Button>
        </div>

        {/* Orders Table */}
        <Card variant="base">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заказ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Приоритет</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ответственный</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{order.number}</div>
                        <div className="text-sm text-gray-500">{order.items.length} позиций</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{order.clientName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {getPriorityText(order.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{order.responsible}</div>
                        {order.executor && (
                          <div className="text-sm text-gray-500">Исполнитель: {order.executor}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Intl.NumberFormat('ru-RU', {
                          style: 'currency',
                          currency: order.currency,
                          minimumFractionDigits: 0
                        }).format(order.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                          Подробнее
                        </button>
                        {order.status === 'new' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'in_progress')}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            В работу
                          </button>
                        )}
                        {order.status === 'in_progress' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'completed')}
                            className="text-green-600 hover:text-green-800 transition-colors duration-200"
                          >
                            Завершить
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

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 w-full max-w-2xl mx-4 max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-black">Заказ {selectedOrder.number}</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Клиент</label>
                    <p className="text-sm text-gray-900">{selectedOrder.clientName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Статус</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {getStatusText(selectedOrder.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Ответственный</label>
                    <p className="text-sm text-gray-900">{selectedOrder.responsible}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Сумма</label>
                    <p className="text-sm text-gray-900">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: selectedOrder.currency,
                        minimumFractionDigits: 0
                      }).format(selectedOrder.total)}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600">Позиции заказа</label>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-600">
                          {item.quantity} × {new Intl.NumberFormat('ru-RU', {
                            style: 'currency',
                            currency: selectedOrder.currency,
                            minimumFractionDigits: 0
                          }).format(item.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedOrder.notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Примечания</label>
                    <p className="text-sm text-gray-900">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}