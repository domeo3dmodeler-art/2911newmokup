'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronDown, FileText, CreditCard, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DocumentQuickViewModal from '@/components/documents/DocumentQuickViewModal';
import { OrderDetailsModal } from '@/components/complectator/OrderDetailsModal';
import { clientLogger } from '@/lib/logging/client-logger';
import { fetchWithAuth } from '@/lib/utils/fetch-with-auth';
import { parseApiResponse } from '@/lib/utils/parse-api-response';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  document_id?: string;
}

interface NotificationBellProps {
  userRole: string;
}

export default function NotificationBell({ userRole }: NotificationBellProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Получаем уведомления
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetchWithAuth('/api/notifications');

      if (response.ok) {
        const data = await response.json();
        const parsedData = parseApiResponse<{ notifications: Notification[] }>(data);
        const notificationsList = parsedData.notifications || (Array.isArray(parsedData) ? parsedData : []);
        setNotifications(notificationsList);
        setUnreadCount(notificationsList.filter((n: Notification) => !n.is_read).length);
      } else {
        // Если ошибка авторизации или другая ошибка, просто логируем
        if (response.status !== 401 && response.status !== 403) {
          clientLogger.debug('Failed to fetch notifications:', { status: response.status });
        }
      }
    } catch (error) {
      // Игнорируем ошибки сети, если пользователь не авторизован
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        clientLogger.debug('Network error fetching notifications (user may not be authenticated)');
      } else {
        clientLogger.error('Error fetching notifications:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Отмечаем уведомление как прочитанное
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetchWithAuth(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (response.ok) {
        // Обновляем локальное состояние
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      clientLogger.error('Error marking notification as read:', error);
    }
  };

  // Получаем иконку для типа уведомления
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'invoice_paid':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'status_changed':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'supplier_order':
        return <Package className="h-4 w-4 text-orange-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  // Форматируем время
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    return `${days} дн назад`;
  };

  // Проверяем, является ли document_id заказом
  const checkIfOrder = async (documentId: string): Promise<boolean> => {
    try {
      const response = await fetchWithAuth(`/api/orders/${documentId}`);
      if (response.ok) {
        return true; // Это заказ
      }
    } catch (error) {
      // Игнорируем ошибки
    }
    return false;
  };

  // Обработка клика на уведомление
  const handleNotificationClick = async (notification: Notification) => {
    clientLogger.debug('Notification clicked', { 
      notificationId: notification.id, 
      type: notification.type, 
      documentId: notification.document_id,
      userRole 
    });

    // Отмечаем как прочитанное
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Закрываем dropdown
    setIsOpen(false);

    // Открываем модальное окно с документом
    if (notification.document_id) {
      const notificationType = notification.type || '';
      
      // Проверяем тип уведомления для определения типа документа
      // Типы уведомлений: "order:STATUS", "invoice:STATUS", "supplier_order:STATUS", "order_created", "invoice_created", "supplier_order_created"
      const isOrderNotification = notificationType.startsWith('order:') || notificationType === 'order_created';
      
      if (isOrderNotification) {
        // Это уведомление о заказе - открываем OrderDetailsModal для всех ролей
        clientLogger.debug('Opening OrderDetailsModal for order notification', { 
          documentId: notification.document_id,
          notificationType 
        });
        setSelectedOrderId(notification.document_id);
        setIsOrderModalOpen(true);
        return;
      }
      
      // Для остальных типов документов проверяем, является ли это заказом
      // (на случай, если тип уведомления не указан или указан неправильно)
      clientLogger.debug('Checking if document is an order', { documentId: notification.document_id });
      const isOrder = await checkIfOrder(notification.document_id);
      
      if (isOrder) {
        // Это заказ - открываем OrderDetailsModal для всех ролей
        clientLogger.debug('Document is an order, opening OrderDetailsModal', { documentId: notification.document_id });
        setSelectedOrderId(notification.document_id);
        setIsOrderModalOpen(true);
        return;
      }
      
      // Для других типов документов (invoice, quote, supplier_order) используем DocumentQuickViewModal
      clientLogger.debug('Opening DocumentQuickViewModal for non-order document', { 
        documentId: notification.document_id,
        notificationType 
      });
      setSelectedDocumentId(notification.document_id);
      setIsModalOpen(true);
    } else {
      clientLogger.warn('Notification has no document_id', { notificationId: notification.id });
    }
  };

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Загружаем уведомления при монтировании
  useEffect(() => {
    fetchNotifications();
    
    // Обновляем уведомления каждые 30 секунд
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Колокольчик */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown с уведомлениями */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Заголовок */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Уведомления</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-gray-500">{unreadCount} непрочитанных</span>
              )}
            </div>
          </div>

          {/* Список уведомлений */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Загрузка...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Нет уведомлений</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Иконка */}
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Контент */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      
                      {notification.client && (
                        <p className="text-xs text-gray-500 mt-1">
                          Клиент: {notification.client.lastName} {notification.client.firstName} {notification.client.middleName}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Подвал */}
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setIsOpen(false);
                // Здесь можно добавить переход к полному списку уведомлений
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Показать все уведомления
            </button>
          </div>
        </div>
      )}

      {/* Модальное окно для быстрого просмотра документа */}
      {selectedDocumentId && (
        <DocumentQuickViewModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDocumentId(null);
          }}
          documentId={selectedDocumentId}
        />
      )}

      {/* Модальное окно заказа для всех ролей */}
      {selectedOrderId && (
        <OrderDetailsModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setSelectedOrderId(null);
          }}
          orderId={selectedOrderId}
          userRole={userRole}
        />
      )}
    </div>
  );
}
