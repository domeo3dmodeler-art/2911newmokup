// components/AnalyticsDashboard.tsx
// Компонент дашборда с аналитикой КП

"use client";

import { useState, useEffect, useCallback } from 'react';

type QuoteAnalytics = {
  overview: {
    totalQuotes: number;
    draftQuotes: number;
    sentQuotes: number;
    acceptedQuotes: number;
    rejectedQuotes: number;
    totalValue: number;
    averageValue: number;
    conversionRate: number;
  };
  trends: {
    daily: Array<{
      date: string;
      quotes: number;
      value: number;
    }>;
    weekly: Array<{
      week: string;
      quotes: number;
      value: number;
    }>;
    monthly: Array<{
      month: string;
      quotes: number;
      value: number;
    }>;
  };
  topClients: Array<{
    client: string;
    quotesCount: number;
    totalValue: number;
    lastQuoteDate: string;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  valueDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
};

type AnalyticsFilters = {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  client?: string;
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<QuoteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'clients' | 'distribution'>('overview');

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.status) params.append('status', filters.status);
      if (filters.client) params.append('client', filters.client);

      const response = await fetch(`/api/analytics/quotes?${params}`);
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке аналитики');
      }

      const result = await response.json();
      setAnalytics(result.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const statusLabels = {
    draft: 'Черновик',
    sent: 'Отправлен',
    accepted: 'Принят',
    rejected: 'Отклонен'
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Загрузка аналитики...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error || 'Ошибка загрузки аналитики'}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Аналитика КП</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Фильтры */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="От даты"
            />
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="До даты"
            />
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все статусы</option>
              <option value="draft">Черновик</option>
              <option value="sent">Отправлен</option>
              <option value="accepted">Принят</option>
              <option value="rejected">Отклонен</option>
            </select>
            <input
              type="text"
              value={filters.client || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, client: e.target.value || undefined }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Поиск по клиенту"
            />
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Обзор' },
            { id: 'trends', label: 'Тренды' },
            { id: 'clients', label: 'Клиенты' },
            { id: 'distribution', label: 'Распределение' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Контент табов */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Основные метрики */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <div className="text-blue-600 text-2xl">📊</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Всего КП</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.overview.totalQuotes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <div className="text-green-600 text-2xl">💰</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Общая сумма</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.overview.totalValue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <div className="text-yellow-600 text-2xl">📈</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Конверсия</p>
                  <p className="text-2xl font-semibold text-gray-900">{analytics.overview.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="text-purple-600 text-2xl">📋</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Средняя сумма</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.overview.averageValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Статусы */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Статусы КП</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.statusDistribution.map((status) => (
                <div key={status.status} className="text-center">
                  <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[status.status as keyof typeof statusColors]}`}>
                    {statusLabels[status.status as keyof typeof statusLabels]}
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-gray-900">{status.count}</div>
                    <div className="text-sm text-gray-600">{status.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* График трендов */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Тренды по дням (последние 30 дней)</h3>
            <div className="h-64 flex items-end justify-between space-x-1">
              {analytics.trends.daily.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div 
                    className="bg-blue-500 w-full rounded-t"
                    style={{ height: `${Math.max(4, (day.quotes / Math.max(...analytics.trends.daily.map(d => d.quotes))) * 200)}px` }}
                    title={`${day.date}: ${day.quotes} КП, ${formatCurrency(day.value)}`}
                  />
                  <div className="text-xs text-gray-600 mt-1 transform -rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Топ клиентов</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">КП</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последний КП</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.topClients.map((client, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {client.client}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {client.quotesCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(client.totalValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(client.lastQuoteDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'distribution' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Распределение по суммам */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение по суммам</h3>
            <div className="space-y-3">
              {analytics.valueDistribution.map((range, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{range.range}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${range.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {range.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Распределение по статусам */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Распределение по статусам</h3>
            <div className="space-y-3">
              {analytics.statusDistribution.map((status, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {statusLabels[status.status as keyof typeof statusLabels]}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${status.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-12 text-right">
                      {status.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
