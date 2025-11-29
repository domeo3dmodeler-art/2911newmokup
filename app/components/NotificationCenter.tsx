// components/NotificationCenter.tsx
// Компонент центра уведомлений

"use client";

import { useState, useEffect } from 'react';
import { quoteNotificationService, QuoteNotification, NotificationSettings } from '@/lib/notifications/quote-notifications';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function NotificationCenter({ isOpen, onClose }: Props) {
  const [notifications, setNotifications] = useState<QuoteNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(quoteNotificationService.getSettings());
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = () => {
    setNotifications(quoteNotificationService.getNotifications());
  };

  const handleMarkAsRead = (notificationId: string) => {
    quoteNotificationService.markAsRead(notificationId);
    loadNotifications();
  };

  const handleMarkAllAsRead = () => {
    quoteNotificationService.markAllAsRead();
    loadNotifications();
  };

  const handleRemoveNotification = (notificationId: string) => {
    quoteNotificationService.removeNotification(notificationId);
    loadNotifications();
  };

  const handleClearAll = () => {
    quoteNotificationService.clearAllNotifications();
    loadNotifications();
  };

  const handleSettingsChange = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    quoteNotificationService.updateSettings(updatedSettings);
  };

  const handleRequestPermission = async () => {
    const granted = await quoteNotificationService.requestNotificationPermission();
    if (granted) {
      alert('Разрешение на уведомления предоставлено');
    } else {
      alert('Разрешение на уведомления отклонено');
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Только что';
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Заголовок */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Уведомления</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600"
                title="Настройки"
              >
                ⚙️
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Настройки */}
          {showSettings && (
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Настройки уведомлений</h3>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.browserNotifications}
                    onChange={(e) => handleSettingsChange({ browserNotifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Браузерные уведомления</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) => handleSettingsChange({ emailNotifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Email уведомления</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.statusChangeNotifications}
                    onChange={(e) => handleSettingsChange({ statusChangeNotifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Уведомления о смене статуса</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.newQuoteNotifications}
                    onChange={(e) => handleSettingsChange({ newQuoteNotifications: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Уведомления о новых КП</span>
                </label>
              </div>
              
              <button
                onClick={handleRequestPermission}
                className="mt-3 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Запросить разрешение
              </button>
            </div>
          )}

          {/* Действия */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
            <div className="text-sm text-gray-600">
              {notifications.filter(n => !n.read).length} непрочитанных
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Отметить все как прочитанные
              </button>
              <button
                onClick={handleClearAll}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Очистить все
              </button>
            </div>
          </div>

          {/* Список уведомлений */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-2">🔔</div>
                  <div>Нет уведомлений</div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={() => handleRemoveNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-sm ${!notification.read ? 'text-blue-800' : 'text-gray-600'} mt-1`}>
                          {notification.message}
                        </p>
                        
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">
                            КП: {notification.quoteTitle}
                          </span>
                        </div>
                        
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            Отметить как прочитанное
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
