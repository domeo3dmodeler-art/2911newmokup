'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button } from '../../../components/ui';
import StatCard from '../../../components/ui/StatCard';
import { 
  FileText, 
  Users,
  TrendingUp,
  Loader2,
  Search,
  Eye,
  Filter,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { COMPLECTATOR_FILTER_STATUSES, ORDER_STATUSES_COMPLECTATOR, ORDER_STATUSES_EXECUTOR, getStatusLabel } from '@/lib/utils/document-statuses';
import { getOrderDisplayStatus } from '@/lib/utils/order-status-display';
import { clientLogger } from '@/lib/logging/client-logger';
import { OrderDetailsModal } from '@/components/complectator/OrderDetailsModal';

interface ManagerStats {
  orders: {
    total: number;
    byStatus: Array<{ status: string; count: number }>;
    paid: number;
    completed: number;
  };
  complectators: Array<{ complectatorId: string | null; complectatorName: string; count: number }>;
  executors: Array<{ executorId: string | null; executorName: string; count: number }>;
}

interface ManagerDashboardComponentProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: string;
    permissions: string[];
  };
}

interface Order {
  id: string;
  number: string;
  status: string;
  created_at: string;
  complectator_id: string | null;
  complectator_name: string | null;
  executor_id: string | null;
  executor_name: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    fullName: string;
    address: string;
  };
  invoice: {
    id: string;
    number: string;
    status: string;
    total_amount: number;
  } | null;
}

export function ManagerDashboardComponent({ user }: ManagerDashboardComponentProps) {
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  
  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [complectatorFilter, setComplectatorFilter] = useState<string>('all');
  const [executorFilter, setExecutorFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка статистики
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/manager/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      clientLogger.error('Error fetching manager stats', error);
    }
  }, []);

  // Загрузка заказов
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const params = new URLSearchParams();
      params.append('manager_id', user.id);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (complectatorFilter !== 'all') params.append('complectator_id', complectatorFilter);
      if (executorFilter !== 'all') params.append('executor_id', executorFilter);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        toast.error('Ошибка загрузки заказов');
      }
    } catch (error) {
      clientLogger.error('Error fetching orders', error);
      toast.error('Ошибка загрузки заказов');
    } finally {
      setOrdersLoading(false);
    }
  }, [user.id, statusFilter, complectatorFilter, executorFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchStats();
    fetchOrders();
  }, [fetchStats, fetchOrders]);

  // Фильтрация заказов по поиску
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.number.toLowerCase().includes(query) ||
        order.client.fullName.toLowerCase().includes(query) ||
        order.client.address.toLowerCase().includes(query) ||
        (order.complectator_name && order.complectator_name.toLowerCase().includes(query)) ||
        (order.executor_name && order.executor_name.toLowerCase().includes(query))
      );
    }
    return filtered;
  }, [orders, searchQuery]);

  // Все статусы для фильтра
  const allStatuses = useMemo(() => {
    const complectatorStatuses = Object.values(ORDER_STATUSES_COMPLECTATOR).map(s => s.apiValue);
    const executorStatuses = Object.values(ORDER_STATUSES_EXECUTOR).map(s => s.apiValue);
    return [...new Set([...complectatorStatuses, ...executorStatuses])];
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-black">Личный кабинет Руководителя</h1>
        <p className="text-gray-600 mt-2">Контроль всех процессов и заказов</p>
      </div>

      {/* Статистика */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Всего заказов"
            value={stats.orders.total}
            icon={FileText}
            color="blue"
          />
          <StatCard
            title="Оплачено"
            value={stats.orders.paid}
            icon={TrendingUp}
            color="green"
          />
          <StatCard
            title="Выполнено"
            value={stats.orders.completed}
            icon={FileText}
            color="purple"
          />
          <StatCard
            title="Комплектаторов"
            value={stats.complectators.length}
            icon={Users}
            color="orange"
          />
        </div>
      )}

      {/* Фильтры */}
      <Card variant="base" className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Все статусы</option>
              {allStatuses.map(status => (
                <option key={status} value={status}>
                  {getOrderDisplayStatus(status)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Комплектатор</label>
            <select
              value={complectatorFilter}
              onChange={(e) => setComplectatorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Все комплектаторы</option>
              {stats?.complectators.map(c => (
                <option key={c.complectatorId} value={c.complectatorId || ''}>
                  {c.complectatorName} ({c.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Исполнитель</label>
            <select
              value={executorFilter}
              onChange={(e) => setExecutorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="all">Все исполнители</option>
              {stats?.executors.map(e => (
                <option key={e.executorId} value={e.executorId || ''}>
                  {e.executorName} ({e.count})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата от</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата до</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </Card>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Поиск по номеру заказа, клиенту, адресу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Таблица заказов */}
      <Card variant="base" className="overflow-hidden">
        {ordersLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Дата</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Номер</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Клиент</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Комплектатор</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Исполнитель</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Сумма</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      Нет заказов
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{order.number}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.client.fullName}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.complectator_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.executor_name || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getOrderDisplayStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {order.invoice?.total_amount ? `${order.invoice.total_amount.toLocaleString('ru-RU')} ₽` : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setIsOrderModalOpen(true);
                          }}
                          className="text-gray-600 hover:text-black transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Модальное окно заказа */}
      {selectedOrderId && (
        <OrderDetailsModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
          userRole="manager"
        />
      )}
    </div>
  );
}

