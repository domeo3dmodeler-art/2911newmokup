'use client';

import React, { useState, useEffect } from 'react';
import { Database, TrendingUp, RefreshCw, Trash2, Settings, BarChart3, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceStats {
  slowQueries: Array<{
    id: string;
    query_text: string;
    execution_time_ms: number;
    created_at: string;
  }>;
  performanceStats: Array<{
    table_name: string;
    operation_type: string;
    _avg: { execution_time_ms: number };
    _count: { id: number };
  }>;
  cacheStats: {
    totalCachedQueries: number;
    totalHits: number;
  };
  memoryCache: {
    size: number;
  };
}

export default function DatabaseOptimizationPanel() {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadRecommendations();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/database/optimization?action=stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Ошибка при загрузке статистики');
      }
    } catch (err) {
      setError('Ошибка при загрузке статистики');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch('/api/admin/database/optimization?action=recommendations');
      const data = await response.json();
      
      if (response.ok) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      clientLogger.error('Ошибка при загрузке рекомендаций:', err);
    }
  };

  const executeOptimization = async (action: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/database/optimization?action=${action}`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Обновляем статистику после оптимизации
        await loadStats();
        await loadRecommendations();
      } else {
        setError(data.error || 'Ошибка при выполнении оптимизации');
      }
    } catch (err) {
      setError('Ошибка при выполнении оптимизации');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}мс`;
    return `${(ms / 1000).toFixed(2)}с`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Database className="w-6 h-6 mr-2" />
            Оптимизация базы данных
          </h2>
          <p className="text-gray-600 mt-1">
            Мониторинг производительности и оптимизация запросов
          </p>
        </div>
        
        <button
          onClick={() => {
            loadStats();
            loadRecommendations();
          }}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Обновить
        </button>
      </div>

      {/* Сообщения об ошибках и успехе */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Рекомендации по оптимизации
          </h3>
          <ul className="space-y-2">
            {recommendations.map((recommendation, index) => (
              <li key={index} className="text-yellow-800 flex items-start">
                <span className="w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                {recommendation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Статистика производительности */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Общая статистика */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Общая статистика
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Кэшированных запросов:</span>
                <span className="font-semibold">{stats.cacheStats.totalCachedQueries}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Попаданий в кэш:</span>
                <span className="font-semibold">{stats.cacheStats.totalHits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Записей в памяти:</span>
                <span className="font-semibold">{stats.memoryCache.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Медленных запросов:</span>
                <span className="font-semibold text-red-600">{stats.slowQueries.length}</span>
              </div>
            </div>
          </div>

          {/* Статистика по таблицам */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Производительность по таблицам
            </h3>
            <div className="space-y-3">
              {stats.performanceStats.map((stat, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{stat.table_name}</div>
                    <div className="text-sm text-gray-600">{stat.operation_type}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatTime(stat._avg.execution_time_ms)}</div>
                    <div className="text-sm text-gray-600">{stat._count.id} запросов</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Медленные запросы */}
      {stats && stats.slowQueries.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Медленные запросы (&gt;1с)
          </h3>
          <div className="space-y-3">
            {stats.slowQueries.slice(0, 5).map((query) => (
              <div key={query.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-red-900">
                    {formatTime(query.execution_time_ms)}
                  </span>
                  <span className="text-sm text-red-600">
                    {formatDate(query.created_at)}
                  </span>
                </div>
                <div className="text-sm text-red-800 font-mono bg-red-100 p-2 rounded">
                  {query.query_text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Операции оптимизации */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Операции оптимизации
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Полная оптимизация */}
          <button
            onClick={() => executeOptimization('optimize')}
            disabled={loading}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Database className="w-8 h-8 text-blue-600 mb-2" />
            <span className="font-medium text-gray-900">Полная оптимизация</span>
            <span className="text-sm text-gray-600 text-center">
              Все операции оптимизации
            </span>
          </button>

          {/* Обновление статистики */}
          <button
            onClick={() => executeOptimization('update-stats')}
            disabled={loading}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
            <span className="font-medium text-gray-900">Обновить статистику</span>
            <span className="text-sm text-gray-600 text-center">
              Кэш статистики товаров
            </span>
          </button>

          {/* Нормализация свойств */}
          <button
            onClick={() => executeOptimization('normalize-properties')}
            disabled={loading}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="w-8 h-8 text-purple-600 mb-2" />
            <span className="font-medium text-gray-900">Нормализовать свойства</span>
            <span className="text-sm text-gray-600 text-center">
              JSON → отдельная таблица
            </span>
          </button>

          {/* Очистка кэша */}
          <button
            onClick={() => executeOptimization('cleanup-cache')}
            disabled={loading}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Trash2 className="w-8 h-8 text-red-600 mb-2" />
            <span className="font-medium text-gray-900">Очистить кэш</span>
            <span className="text-sm text-gray-600 text-center">
              Удалить устаревшие записи
            </span>
          </button>

          {/* Оптимизация SQLite */}
          <button
            onClick={() => executeOptimization('optimize-sqlite')}
            disabled={loading}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Settings className="w-8 h-8 text-orange-600 mb-2" />
            <span className="font-medium text-gray-900">Настройки SQLite</span>
            <span className="text-sm text-gray-600 text-center">
              PRAGMA оптимизации
            </span>
          </button>

          {/* Виртуальные колонки */}
          <button
            onClick={() => executeOptimization('create-virtual-columns')}
            disabled={loading}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <TrendingUp className="w-8 h-8 text-indigo-600 mb-2" />
            <span className="font-medium text-gray-900">Виртуальные колонки</span>
            <span className="text-sm text-gray-600 text-center">
              Индексы для JSON полей
            </span>
          </button>
        </div>
      </div>

      {/* Информация о загрузке */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Оптимизация БД</h3>
              <p className="text-gray-600">Выполняется операция оптимизации...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
