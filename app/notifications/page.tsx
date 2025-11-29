'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { clientLogger } from '@/lib/logging/client-logger';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  actionText?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { fetchWithAuth } = await import('@/lib/utils/fetch-with-auth');
      const { parseApiResponse } = await import('@/lib/utils/parse-api-response');
      const response = await fetchWithAuth('/api/notifications');
      if (response.ok) {
        const responseData = await response.json();
        const data = parseApiResponse<{ notifications: any[] }>(responseData);
        setNotifications(data.notifications || []);
      } else {
        clientLogger.error('Failed to load notifications');
        setNotifications([]);
      }
    } catch (error) {
      clientLogger.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(notification => 
        filter === 'unread' ? !notification.isRead : notification.isRead
      );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, isRead: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => 
      ({ ...notification, isRead: true })
    ));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(notifications.filter(notification => 
      notification.id !== notificationId
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} дн. назад`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка уведомлений...</p>
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
              <span className="text-lg font-semibold text-black">Уведомления</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium"
              >
                Отметить все как прочитанные
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Всего уведомлений</p>
                <p className="text-2xl font-bold text-black mt-1">{notifications.length}</p>
              </div>
              <div className="text-2xl">📢</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Непрочитанные</p>
                <p className="text-2xl font-bold text-black mt-1">{unreadCount}</p>
              </div>
              <div className="text-2xl">🔔</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Сегодня</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="text-2xl">📅</div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">За неделю</p>
                <p className="text-2xl font-bold text-black mt-1">
                  {notifications.filter(n => {
                    const notificationDate = new Date(n.createdAt);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return notificationDate > weekAgo;
                  }).length}
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {[
              { key: 'all', label: 'Все' },
              { key: 'unread', label: 'Непрочитанные' },
              { key: 'read', label: 'Прочитанные' }
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

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уведомлений</h3>
              <p className="text-gray-600">
                {filter === 'unread' 
                  ? 'Все уведомления прочитаны' 
                  : filter === 'read' 
                    ? 'Нет прочитанных уведомлений'
                    : 'Уведомления появятся здесь'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white border border-gray-200 p-6 hover:border-black transition-all duration-200 ${
                  !notification.isRead ? 'border-l-4 border-l-yellow-400' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="text-2xl">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-black">
                          {notification.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {formatDate(notification.createdAt)}
                        </span>
                        <div className="flex space-x-2">
                          {notification.actionUrl && notification.actionText && (
                            <Link
                              href={notification.actionUrl}
                              className="text-sm text-black hover:text-yellow-400 transition-colors duration-200"
                            >
                              {notification.actionText}
                            </Link>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-sm text-gray-600 hover:text-black transition-colors duration-200"
                            >
                              Отметить как прочитанное
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-sm text-red-600 hover:text-red-800 transition-colors duration-200"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notification Settings */}
        <div className="mt-12 bg-white border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-black mb-4">🔔 Настройки уведомлений</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-black mb-3">Email уведомления</h3>
              <div className="space-y-2">
                {[
                  { id: 'new_orders', label: 'Новые заказы', checked: true },
                  { id: 'quote_expiry', label: 'Истечение КП', checked: true },
                  { id: 'order_completion', label: 'Завершение заказов', checked: false },
                  { id: 'system_updates', label: 'Обновления системы', checked: true }
                ].map(({ id, label, checked }) => (
                  <label key={id} className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={checked}
                      className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-black">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-black mb-3">Push уведомления</h3>
              <div className="space-y-2">
                {[
                  { id: 'urgent_orders', label: 'Срочные заказы', checked: true },
                  { id: 'errors', label: 'Ошибки системы', checked: true },
                  { id: 'daily_summary', label: 'Ежедневная сводка', checked: false }
                ].map(({ id, label, checked }) => (
                  <label key={id} className="flex items-center">
                    <input
                      type="checkbox"
                      defaultChecked={checked}
                      className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded mr-2"
                    />
                    <span className="text-sm text-black">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <button className="px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium">
              Сохранить настройки
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
