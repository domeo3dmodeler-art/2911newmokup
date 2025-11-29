import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import StatCard from '../ui/StatCard';
import { 
  Users, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Download,
  Activity,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyStats: Array<{
    month: string;
    users: number;
    products: number;
    orders: number;
    revenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    category: string;
    views: number;
    orders: number;
    revenue: number;
  }>;
  userActivity: Array<{
    userId: string;
    userName: string;
    role: string;
    lastLogin: string;
    totalLogins: number;
    actionsCount: number;
  }>;
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    diskUsage: number;
  };
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'users' | 'system'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics?type=general');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      clientLogger.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async (type: string) => {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      clientLogger.error('Ошибка экспорта:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500">
        <p>Не удалось загрузить данные аналитики</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Заголовок с экспортом */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Аналитика системы</h1>
          <p className="text-gray-600">Обзор производительности и статистики</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => exportAnalytics('general')}
            className="flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Обзор', icon: BarChart3 },
            { id: 'products', name: 'Товары', icon: Package },
            { id: 'users', name: 'Пользователи', icon: Users },
            { id: 'system', name: 'Система', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Основные метрики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Пользователи"
              value={data.totalUsers}
              icon={Users}
              color="blue"
              change={12}
            />
            <StatCard
              title="Товары"
              value={data.totalProducts}
              icon={Package}
              color="green"
              change={8}
            />
            <StatCard
              title="Заказы"
              value={data.totalOrders}
              icon={ShoppingCart}
              color="purple"
              change={15}
            />
            <StatCard
              title="Выручка"
              value={`${data.totalRevenue.toLocaleString('ru-RU')} ₽`}
              icon={DollarSign}
              color="yellow"
              change={22}
            />
          </div>

          {/* Топ товары */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Популярные товары</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.topProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{product.revenue.toLocaleString('ru-RU')} ₽</p>
                      <p className="text-sm text-gray-500">{product.orders} заказов</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Статистика по товарам</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.topProducts.map((product) => (
              <div key={product.id} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{product.name}</h4>
                <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Просмотры:</span>
                    <span>{product.views}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Заказы:</span>
                    <span>{product.orders}</span>
                  </div>
                  <div className="flex justify-between text-sm font-medium">
                    <span>Выручка:</span>
                    <span>{product.revenue.toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Активность пользователей</h3>
          <div className="space-y-4">
            {data.userActivity.map((user) => (
              <div key={user.userId} className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="font-medium text-gray-900">{user.userName}</p>
                  <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Входов: {user.totalLogins}</p>
                  <p>Действий: {user.actionsCount}</p>
                  <p>Последний вход: {new Date(user.lastLogin).toLocaleDateString('ru-RU')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Производительность</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Время отклика:</span>
                  <span className="font-medium">{data.systemHealth.responseTime} мс</span>
                </div>
                <div className="flex justify-between">
                  <span>Время работы:</span>
                  <span className="font-medium">{data.systemHealth.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Ошибки:</span>
                  <span className="font-medium">{data.systemHealth.errorRate}%</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Ресурсы</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Память</span>
                    <span>{data.systemHealth.memoryUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${data.systemHealth.memoryUsage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span>Диск</span>
                    <span>{data.systemHealth.diskUsage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${data.systemHealth.diskUsage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
