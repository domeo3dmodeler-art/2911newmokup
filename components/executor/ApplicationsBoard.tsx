'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Button } from '../ui';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Download,
  Eye,
  Search,
  BadgeCheck,
  XCircle
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';
import { toast } from 'sonner';
import { parseApiResponse } from '@/lib/utils/parse-api-response';

// Статусы заявок (используем статусы из канонического документа)
const APPLICATION_STATUSES = {
  NEW_PLANNED: { label: 'Счет оплачен (Заказываем)', color: 'bg-gray-100 text-gray-800', icon: FileText },
  UNDER_REVIEW: { label: 'На проверке', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  AWAITING_MEASUREMENT: { label: 'Ждет замер', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
  AWAITING_INVOICE: { label: 'Ожидает опт. счет', color: 'bg-blue-100 text-blue-800', icon: Upload },
  READY_FOR_PRODUCTION: { label: 'Готов к запуску в производство', color: 'bg-purple-100 text-purple-800', icon: BadgeCheck },
  COMPLETED: { label: 'Выполнен', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  RETURNED_TO_COMPLECTATION: { label: 'Вернуть в комплектацию', color: 'bg-red-100 text-red-800', icon: XCircle }
};

interface Application {
  id: string;
  number: string;
  client_id: string;
  invoice_id: string | null;
  lead_number: string | null;
  complectator_id: string | null;
  complectator_name: string | null;
  executor_id: string | null;
  status: keyof typeof APPLICATION_STATUSES;
  project_file_url: string | null;
  door_dimensions: Array<{
    width?: number;
    height?: number;
    quantity?: number;
    opening_side?: string | null;
    latches_count?: number;
    [key: string]: unknown;
  }> | null;
  measurement_done: boolean;
  project_complexity: string | null;
  wholesale_invoices: string[];
  technical_specs: string[];
  verification_status: string | null;
  verification_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    phone: string;
    address: string;
    fullName: string;
  };
  invoice: {
    id: string;
    number: string;
    status: string;
    total_amount: number;
    cart_data?: string | null;
  } | null;
}

interface ApplicationsBoardProps {
  executorId: string;
}

export function ApplicationsBoard({ executorId }: ApplicationsBoardProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<keyof typeof APPLICATION_STATUSES | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicationDetail, setShowApplicationDetail] = useState(false);

  // Загрузка заявок
  const fetchApplications = useCallback(async () => {
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

      const response = await fetch(`/api/orders?executor_id=${executorId}`, {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const responseData = await response.json();
        const parsedData = parseApiResponse<{ orders?: any[] }>(responseData);
        const ordersArray = parsedData && 'orders' in parsedData && Array.isArray(parsedData.orders)
          ? parsedData.orders
          : [];
        setApplications(ordersArray);
      } else {
        toast.error('Ошибка загрузки заявок');
      }
    } catch (error) {
      clientLogger.error('Error fetching applications:', error);
      toast.error('Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  }, [executorId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Фильтрация заявок по статусу и поиску
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Фильтр по статусу
    if (activeStatus !== 'all') {
      filtered = filtered.filter(app => app.status === activeStatus);
    }

    // Фильтр по поиску
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.number.toLowerCase().includes(query) ||
        app.client.fullName.toLowerCase().includes(query) ||
        app.client.address.toLowerCase().includes(query) ||
        (app.lead_number && app.lead_number.toLowerCase().includes(query)) ||
        (app.complectator_name && app.complectator_name.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [applications, activeStatus, searchQuery]);

  // Подсчет заявок по статусам
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    Object.keys(APPLICATION_STATUSES).forEach(status => {
      counts[status] = applications.filter(app => app.status === status).length;
    });

    return counts;
  }, [applications]);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  // Открытие детального вида заявки
  const handleApplicationClick = (application: Application) => {
    setSelectedApplication(application);
    setShowApplicationDetail(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Поиск по номеру заявки, клиенту, адресу..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Вкладки статусов */}
      <div className="flex space-x-2 overflow-x-auto border-b border-gray-200">
        <button
          onClick={() => setActiveStatus('all')}
          className={`px-4 py-2 whitespace-nowrap font-medium border-b-2 transition-colors ${
            activeStatus === 'all'
              ? 'border-black text-black'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          Все ({applications.length})
        </button>
        {Object.entries(APPLICATION_STATUSES).map(([status, config]) => {
          const count = statusCounts[status];
          const Icon = config.icon;
          
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status as keyof typeof APPLICATION_STATUSES)}
              className={`px-4 py-2 whitespace-nowrap font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeStatus === status
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-600 hover:text-black'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{config.label}</span>
              {count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Таблица заявок */}
      <Card variant="base" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ДАТА
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ЛИД
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  КОМПЛЕКТАТОР
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  ФИО КЛИЕНТА
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Адрес
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    {searchQuery ? 'Заявки не найдены' : 'Нет заявок'}
                  </td>
                </tr>
              ) : (
                filteredApplications.map((application) => {
                  const statusConfig = APPLICATION_STATUSES[application.status];
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr
                      key={application.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleApplicationClick(application)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(application.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {application.lead_number || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {application.complectator_name || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {application.client.fullName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={application.client.address}>
                          {application.client.address}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplicationClick(application);
                          }}
                          className="text-gray-600 hover:text-black transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Модальное окно детального вида заявки */}
      {showApplicationDetail && selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => {
            setShowApplicationDetail(false);
            setSelectedApplication(null);
          }}
          onUpdate={fetchApplications}
        />
      )}
    </div>
  );
}

// Компонент модального окна детального вида заявки
function ApplicationDetailModal({
  application,
  onClose,
  onUpdate
}: {
  application: Application;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [currentApplication, setCurrentApplication] = useState(application);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [showProjectUpload, setShowProjectUpload] = useState(false);
  const [showFilesUpload, setShowFilesUpload] = useState(false);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [wholesaleInvoices, setWholesaleInvoices] = useState<File[]>([]);
  const [technicalSpecs, setTechnicalSpecs] = useState<File[]>([]);
  const [newStatus, setNewStatus] = useState<string>(application.status);
  const [requireMeasurement, setRequireMeasurement] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    matches: boolean;
    invoice_items_count: number;
    project_doors_count: number;
    details?: Array<{ index?: number; width?: number; height?: number; quantity?: number; opening_side?: string | null; latches_count?: number; [key: string]: unknown }>;
    [key: string]: unknown;
  } | null>(null);

  // Обновление данных заявки
  const fetchApplication = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const response = await fetch(`/api/orders/${application.id}`, {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const responseData = await response.json();
        const parsedData = parseApiResponse<{ order?: any }>(responseData);
        const orderData = parsedData && 'order' in parsedData ? parsedData.order : null;
        if (orderData) {
          setCurrentApplication(orderData);
        } else {
          clientLogger.warn('Invalid response format from /api/orders/[id]:', responseData);
        }
      } else {
        clientLogger.error('Error fetching order:', { status: response.status });
      }
    } catch (error) {
      clientLogger.error('Error fetching application:', error);
    }
  };

  // Загрузка проекта/планировки
  const handleProjectUpload = async () => {
    if (!projectFile) {
      toast.error('Выберите файл проекта');
      return;
    }

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const formData = new FormData();
      formData.append('file', projectFile);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const response = await fetch(`/api/orders/${application.id}/project`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Проект загружен успешно');
        await fetchApplication();
        setShowProjectUpload(false);
        setProjectFile(null);
      } else {
        let errorMessage = 'Ошибка загрузки проекта';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          clientLogger.error('Error uploading project:', errorData);
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          clientLogger.error('Error parsing error response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      clientLogger.error('Error uploading project:', error);
      toast.error('Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка оптовых счетов и техзаданий
  const handleFilesUpload = async () => {
    if (wholesaleInvoices.length === 0 && technicalSpecs.length === 0) {
      toast.error('Выберите файлы для загрузки');
      return;
    }

    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const formData = new FormData();
      
      wholesaleInvoices.forEach(file => {
        formData.append('wholesale_invoices', file);
      });
      
      technicalSpecs.forEach(file => {
        formData.append('technical_specs', file);
      });

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const response = await fetch(`/api/orders/${application.id}/files`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Файлы загружены успешно');
        await fetchApplication();
        setShowFilesUpload(false);
        setWholesaleInvoices([]);
        setTechnicalSpecs([]);
      } else {
        let errorMessage = 'Ошибка загрузки файлов';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          clientLogger.error('Error uploading files:', errorData);
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          clientLogger.error('Error parsing error response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      clientLogger.error('Error uploading files:', error);
      toast.error('Ошибка загрузки файлов');
    } finally {
      setLoading(false);
    }
  };

  // Изменение статуса
  const handleStatusChange = async () => {
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

      const response = await fetch(`/api/orders/${application.id}/status`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          require_measurement: currentApplication.status === 'UNDER_REVIEW' ? newStatus === 'AWAITING_MEASUREMENT' : undefined
        })
      });

      if (response.ok) {
        toast.success('Статус изменен успешно');
        await fetchApplication();
        onUpdate();
        setShowStatusChangeModal(false);
      } else {
        let errorMessage = 'Ошибка изменения статуса';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          clientLogger.error('Error changing status:', errorData);
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          clientLogger.error('Error parsing error response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      clientLogger.error('Error changing status:', error);
      toast.error('Ошибка изменения статуса');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка данных дверей из счета
  const loadDoorsFromInvoice = async () => {
    try {
      if (!currentApplication.invoice?.cart_data) {
        toast.error('Нет данных корзины в счете');
        return;
      }

      const cartData = JSON.parse(currentApplication.invoice.cart_data);
      const items = cartData.items || [];

      // Преобразуем данные из счета в формат door_dimensions
      const doorDimensions = items.map((item: { width?: number; height?: number; quantity?: number; qty?: number; [key: string]: unknown }) => ({
        width: item.width || 0,
        height: item.height || 0,
        quantity: item.quantity || item.qty || 1,
        opening_side: null,
        latches_count: 0,
        notes: item.name || item.model || ''
      }));

      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      const response = await fetch(`/api/orders/${application.id}/door-dimensions`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          door_dimensions: doorDimensions
        })
      });

      if (response.ok) {
        toast.success('Данные дверей загружены из счета');
        await fetchApplication();
      } else {
        let errorMessage = 'Ошибка загрузки данных дверей';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          clientLogger.error('Error loading doors from invoice:', errorData);
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          clientLogger.error('Error parsing error response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      clientLogger.error('Error loading doors from invoice:', error);
      toast.error('Ошибка загрузки данных дверей');
    } finally {
      setLoading(false);
    }
  };

  // Проверка данных заявки
  const handleVerify = async () => {
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

      const response = await fetch(`/api/orders/${application.id}/verify`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          verification_status: 'VERIFIED',
          verification_notes: ''
        })
      });

      if (response.ok) {
        const responseData = await response.json();
        const parsedData = parseApiResponse<{ verification_result?: any }>(responseData);
        const verificationResult = parsedData && 'verification_result' in parsedData ? parsedData.verification_result : null;
        if (verificationResult) {
          setVerifyResult(verificationResult);
          setShowVerifyModal(true);
          toast.success('Проверка выполнена успешно');
        } else {
          clientLogger.warn('Invalid response format from /api/orders/[id]/verify:', responseData);
          toast.error('Ошибка: неверный формат ответа');
        }
      } else {
        let errorMessage = 'Ошибка проверки заявки';
        try {
          const errorData = await response.json();
          if (errorData.error) {
            if (typeof errorData.error === 'string') {
              errorMessage = errorData.error;
            } else if (errorData.error.message) {
              errorMessage = errorData.error.message;
            }
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          clientLogger.error('Error verifying application:', errorData);
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          clientLogger.error('Error parsing error response:', parseError);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      clientLogger.error('Error verifying application:', error);
      toast.error('Ошибка проверки заявки');
    } finally {
      setLoading(false);
    }
  };

  // Получение доступных статусов для перехода
  const getAvailableStatuses = () => {
    const validTransitions: Record<string, string[]> = {
      'NEW_PLANNED': ['UNDER_REVIEW'],
      'UNDER_REVIEW': ['AWAITING_MEASUREMENT', 'AWAITING_INVOICE'],
      'AWAITING_MEASUREMENT': ['AWAITING_INVOICE'],
      'AWAITING_INVOICE': ['COMPLETED'],
      'COMPLETED': []
    };
    return validTransitions[currentApplication.status] || [];
  };

  const availableStatuses = getAvailableStatuses();
  const statusConfig = APPLICATION_STATUSES[currentApplication.status];
  const StatusIcon = statusConfig.icon;

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Заголовок */}
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
              <h2 className="text-2xl font-bold text-black">Заявка {currentApplication.number}</h2>
              <div className="flex items-center space-x-2 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  <StatusIcon className="h-4 w-4 mr-1" />
                  {statusConfig.label}
                </span>
                <span className="text-sm text-gray-500">
                  Создана: {formatDate(currentApplication.created_at)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Левая колонка */}
            <div className="space-y-6">
              {/* Информация о клиенте */}
              <Card variant="base" className="p-4">
                <h3 className="font-semibold text-black mb-3">Информация о клиенте</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">ФИО:</span>{' '}
                    <span className="font-medium">{currentApplication.client.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Телефон:</span>{' '}
                    <span className="font-medium">{currentApplication.client.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Адрес:</span>{' '}
                    <span className="font-medium">{currentApplication.client.address}</span>
                  </div>
                  {currentApplication.lead_number && (
                    <div>
                      <span className="text-gray-600">Номер лида:</span>{' '}
                      <span className="font-medium">{currentApplication.lead_number}</span>
                    </div>
                  )}
                  {currentApplication.complectator_name && (
                    <div>
                      <span className="text-gray-600">Комплектатор:</span>{' '}
                      <span className="font-medium">{currentApplication.complectator_name}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Связанный счет */}
              {currentApplication.invoice && (
                <Card variant="base" className="p-4">
                  <h3 className="font-semibold text-black mb-3">Связанный счет</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Номер:</span>{' '}
                      <span className="font-medium">{currentApplication.invoice.number}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Сумма:</span>{' '}
                      <span className="font-medium">{currentApplication.invoice.total_amount.toLocaleString('ru-RU')} ₽</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Статус:</span>{' '}
                      <span className="font-medium">{currentApplication.invoice.status}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Проект/планировка */}
              <Card variant="base" className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-black">Проект/планировка</h3>
                  {!currentApplication.project_file_url && (
                    <span className="text-red-600 text-xs">* Обязательно</span>
                  )}
                </div>
                {currentApplication.project_file_url ? (
                  <div className="space-y-2">
                    <a
                      href={currentApplication.project_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Открыть проект
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowProjectUpload(true)}
                      className="w-full"
                    >
                      Заменить файл
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProjectUpload(true)}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить проект
                  </Button>
                )}
              </Card>

              {/* Данные дверей */}
              <Card variant="base" className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-black">Данные дверей</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Если есть invoice с cart_data, загружаем данные дверей из счета
                      if (currentApplication.invoice?.cart_data) {
                        loadDoorsFromInvoice();
                      }
                    }}
                    disabled={!currentApplication.invoice?.cart_data}
                  >
                    Загрузить из счета
                  </Button>
                </div>
                
                {currentApplication.door_dimensions && currentApplication.door_dimensions.length > 0 ? (
                  <div className="space-y-3">
                    {currentApplication.door_dimensions.map((door: { width?: number; height?: number; quantity?: number; opening_side?: string | null; latches_count?: number; [key: string]: unknown }, index: number) => (
                      <div key={index} className="border rounded p-3">
                        <div className="font-medium mb-2">Дверь {index + 1}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Размер:</span>{' '}
                            <span className="font-medium">{door.width} x {door.height} мм</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Количество:</span>{' '}
                            <span className="font-medium">{door.quantity} шт.</span>
                          </div>
                          {door.opening_side && (
                            <div>
                              <span className="text-gray-600">Открывание:</span>{' '}
                              <span className="font-medium">{door.opening_side === 'LEFT' ? 'Левое' : door.opening_side === 'RIGHT' ? 'Правое' : door.opening_side}</span>
                            </div>
                          )}
                          {door.latches_count !== undefined && (
                            <div>
                              <span className="text-gray-600">Завертки:</span>{' '}
                              <span className="font-medium">{door.latches_count} шт.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Данные дверей не указаны. Загрузите из счета или введите вручную.
                  </div>
                )}
              </Card>
            </div>

            {/* Правая колонка */}
            <div className="space-y-6">
              {/* Оптовые счета и техзадания */}
              <Card variant="base" className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-black">Оптовые счета и техзадания</h3>
                  {currentApplication.status === 'AWAITING_INVOICE' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowFilesUpload(true)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить файлы
                    </Button>
                  )}
                </div>
                
                {currentApplication.wholesale_invoices.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Оптовые счета:</h4>
                    <div className="space-y-1">
                      {currentApplication.wholesale_invoices.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Счет {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {currentApplication.technical_specs.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Техзадания:</h4>
                    <div className="space-y-1">
                      {currentApplication.technical_specs.map((url: string, index: number) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm flex items-center"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Техзадание {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Действия */}
              <Card variant="base" className="p-4">
                <h3 className="font-semibold text-black mb-3">Действия</h3>
                <div className="space-y-2">
                  {currentApplication.status === 'UNDER_REVIEW' && 
                   currentApplication.project_file_url && 
                   currentApplication.invoice && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerify}
                      disabled={loading}
                      className="w-full"
                    >
                      Проверить данные дверей
                    </Button>
                  )}
                  {availableStatuses.length > 0 && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        setNewStatus(availableStatuses[0]);
                        setShowStatusChangeModal(true);
                      }}
                      className="w-full"
                    >
                      Изменить статус
                    </Button>
                  )}
                </div>
                
                {/* Статус проверки */}
                {currentApplication.verification_status && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm">
                      <span className="text-gray-600">Статус проверки:</span>{' '}
                      <span className={`font-medium ${
                        currentApplication.verification_status === 'VERIFIED' 
                          ? 'text-green-600' 
                          : currentApplication.verification_status === 'FAILED' 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                      }`}>
                        {currentApplication.verification_status === 'VERIFIED' 
                          ? 'Проверено' 
                          : currentApplication.verification_status === 'FAILED' 
                          ? 'Ошибка проверки' 
                          : 'Ожидает проверки'
                        }
                      </span>
                    </div>
                    {currentApplication.verification_notes && (
                      <div className="text-sm text-gray-600 mt-1">
                        {currentApplication.verification_notes}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* Модальное окно загрузки проекта */}
        {showProjectUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Загрузка проекта/планировки</h3>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.dwg,.dxf"
                onChange={(e) => setProjectFile(e.target.files?.[0] || null)}
                className="mb-4 w-full"
              />
              <div className="flex space-x-2">
                <Button onClick={handleProjectUpload} disabled={loading || !projectFile} className="flex-1">
                  {loading ? 'Загрузка...' : 'Загрузить'}
                </Button>
                <Button variant="outline" onClick={() => setShowProjectUpload(false)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно загрузки файлов */}
        {showFilesUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Загрузка файлов</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Оптовые счета (PDF, Excel)</label>
                  <input
                    type="file"
                    accept=".pdf,.xlsx,.xls"
                    multiple
                    onChange={(e) => setWholesaleInvoices(Array.from(e.target.files || []))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Техзадания на проемы (PDF)</label>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={(e) => setTechnicalSpecs(Array.from(e.target.files || []))}
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleFilesUpload} disabled={loading} className="flex-1">
                  {loading ? 'Загрузка...' : 'Загрузить'}
                </Button>
                <Button variant="outline" onClick={() => setShowFilesUpload(false)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно изменения статуса */}
        {showStatusChangeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Изменение статуса</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Новый статус</label>
                  {currentApplication.status === 'UNDER_REVIEW' && availableStatuses.length > 1 ? (
                    // Для UNDER_REVIEW показываем выбор между AWAITING_MEASUREMENT и AWAITING_INVOICE
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="newStatus"
                          value="AWAITING_MEASUREMENT"
                          checked={newStatus === 'AWAITING_MEASUREMENT'}
                          onChange={(e) => {
                            setNewStatus(e.target.value);
                            setRequireMeasurement(true);
                          }}
                        />
                        <span className="text-sm">{APPLICATION_STATUSES['AWAITING_MEASUREMENT'].label}</span>
                      </label>
                      <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="newStatus"
                          value="AWAITING_INVOICE"
                          checked={newStatus === 'AWAITING_INVOICE'}
                          onChange={(e) => {
                            setNewStatus(e.target.value);
                            setRequireMeasurement(false);
                          }}
                        />
                        <span className="text-sm">{APPLICATION_STATUSES['AWAITING_INVOICE'].label}</span>
                      </label>
                    </div>
                  ) : (
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      {availableStatuses.map(status => (
                        <option key={status} value={status}>
                          {APPLICATION_STATUSES[status as keyof typeof APPLICATION_STATUSES].label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {currentApplication.status === 'UNDER_REVIEW' && (
                  <div className="text-sm text-gray-600">
                    {newStatus === 'AWAITING_MEASUREMENT' 
                      ? 'Заявка будет направлена на замер'
                      : 'Заявка готова к запросу счета у поставщика'
                    }
                  </div>
                )}
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={handleStatusChange} disabled={loading} className="flex-1">
                  {loading ? 'Изменение...' : 'Изменить'}
                </Button>
                <Button variant="outline" onClick={() => setShowStatusChangeModal(false)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно результатов проверки */}
        {showVerifyModal && verifyResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4">Результаты проверки данных дверей</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">Сравнение данных:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Позиций в счете:</span>{' '}
                      <span className="font-medium">{verifyResult.invoice_items_count}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Дверей в проекте:</span>{' '}
                      <span className="font-medium">{verifyResult.project_doors_count}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className={`font-medium ${
                      verifyResult.matches ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {verifyResult.matches ? '✓ Данные совпадают' : '✗ Данные не совпадают'}
                    </span>
                  </div>
                </div>

                {verifyResult.details && verifyResult.details.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Детали проверки:</div>
                    <div className="space-y-2">
                      {verifyResult.details.map((detail: { 
                        index?: number; 
                        invoice?: { width?: number; height?: number; quantity?: number };
                        project?: { width?: number; height?: number; quantity?: number; opening_side?: string | null; latches_count?: number };
                        matches?: boolean;
                        [key: string]: unknown 
                      }, index: number) => (
                        <div key={index} className="border rounded p-3">
                          <div className="font-medium mb-2">Позиция {detail.index}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 mb-1">Из счета:</div>
                              {detail.invoice ? (
                                <div>
                                  {detail.invoice.width} x {detail.invoice.height} мм, {detail.invoice.quantity} шт.
                                </div>
                              ) : (
                                <div className="text-gray-400">Нет данных</div>
                              )}
                            </div>
                            <div>
                              <div className="text-gray-600 mb-1">Из проекта:</div>
                              {detail.project ? (
                                <div>
                                  {detail.project.width} x {detail.project.height} мм, {detail.project.quantity} шт.
                                  {detail.project.opening_side && (
                                    <div className="text-xs mt-1">Открывание: {detail.project.opening_side}</div>
                                  )}
                                  {detail.project.latches_count !== undefined && (
                                    <div className="text-xs">Завертки: {detail.project.latches_count} шт.</div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-400">Нет данных</div>
                              )}
                            </div>
                          </div>
                          <div className={`mt-2 text-xs ${
                            detail.matches ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {detail.matches ? '✓ Совпадает' : '✗ Не совпадает'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2 mt-6">
                <Button onClick={() => {
                  setShowVerifyModal(false);
                  fetchApplication();
                }} className="flex-1">
                  Закрыть
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

