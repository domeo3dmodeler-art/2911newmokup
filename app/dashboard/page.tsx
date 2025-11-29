'use client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../components/layout/AdminLayout';
import { ComplectatorDashboard } from '../complectator/dashboard/page';
import ExecutorDashboard from '../executor/dashboard/page';
import ManagerDashboard from '../manager/dashboard/page';
import { Card, Button } from '../../components/ui';
import { ClientAuthGuard } from '../../components/auth/ClientAuthGuard';
import NotificationBell from '../../components/ui/NotificationBell';
import { clientLogger } from '@/lib/logging/client-logger';
import { fetchWithAuth } from '@/lib/utils/fetch-with-auth';
import { parseApiResponse } from '@/lib/utils/parse-api-response';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  permissions: string[];
}

export default function DashboardPage() {
  return (
    <ClientAuthGuard>
      <DashboardContent />
    </ClientAuthGuard>
  );
}

function DashboardContent() {
  clientLogger.debug('🔄 DashboardContent - компонент рендерится');
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [complectatorStats, setComplectatorStats] = useState<any>(null);
  const isInitializedRef = useRef(false); // Используем useRef чтобы избежать ре-рендеров
  const router = useRouter();

  // Мемоизируем контент по роли (оптимизировано - для complectator и executor не зависит от stats)
  // Для complectator и executor мы сразу возвращаем их дашборды, поэтому не нужно вычислять roleContent
  const roleContent = useMemo(() => {
    if (!user) {
      return {
        title: 'Загрузка...',
        description: 'Пожалуйста, подождите',
        widgets: [],
        quickActions: []
      };
    }
    
    // Для complectator и executor возвращаем минимальный объект - все равно не используется
    if (user.role === 'complectator' || user.role === 'executor') {
      return {
        title: user.role === 'complectator' ? 'Личный кабинет комплектатора' : 'Личный кабинет исполнителя',
        description: user.role === 'complectator' ? 'Работа с клиентами и коммерческими предложениями' : 'Исполнение заказов и работа с фабрикой',
        widgets: [],
        quickActions: []
      };
    }
    
    switch (user.role) {
      case 'admin':
        return {
          title: 'Панель администратора',
          description: 'Управление системой и пользователями',
          widgets: [
            { title: 'Категории товаров', count: stats?.total?.totalCategories || 0, link: '/admin/categories', icon: '📁' },
            { title: 'Пользователи', count: userCount, link: '/admin/users', icon: '👥' },
            { title: 'Импорт прайсов', count: stats?.total?.totalImports || 0, link: '/admin/import', icon: '📊' },
            { title: 'Товары', count: stats?.total?.totalProducts || 0, link: '/admin/catalog/products', icon: '📦' }
          ].filter(Boolean), // Фильтруем undefined/null элементы
          quickActions: [
            { title: 'Создать категорию', link: '/admin/categories/builder', icon: '➕' },
            { title: 'Импорт прайса', link: '/admin/import', icon: '📥' },
            { title: 'Управление пользователями', link: '/admin/users', icon: '👤' },
            { title: 'Настройки системы', link: '/admin/settings', icon: '⚙️' }
          ].filter(Boolean) // Фильтруем undefined/null элементы
        };
      default:
        return {
          title: 'Личный кабинет',
          description: 'Добро пожаловать в систему',
          widgets: [],
          quickActions: []
        };
    }
  }, [user, stats, userCount]); // Убрали complectatorStats - для complectator roleContent не используется
  
  // Дополнительная защита: убеждаемся что widgets и quickActions всегда массивы
  const safeRoleContent = useMemo(() => {
    // Ранний возврат для executor, complectator и manager - их дашборды рендерятся отдельно
    if (user && (user.role === 'executor' || user.role === 'complectator' || user.role === 'manager')) {
      return {
        title: user.role === 'complectator' ? 'Личный кабинет комплектатора' : user.role === 'executor' ? 'Личный кабинет исполнителя' : 'Личный кабинет руководителя',
        description: user.role === 'complectator' ? 'Работа с клиентами и коммерческими предложениями' : user.role === 'executor' ? 'Исполнение заказов и работа с фабрикой' : 'Контроль всех процессов',
        widgets: [],
        quickActions: []
      };
    }
    
    if (!roleContent) return { title: '', description: '', widgets: [], quickActions: [] };
    
    // Улучшенная фильтрация: гарантируем что все элементы имеют icon ДО маппинга
    const safeWidgets = Array.isArray(roleContent.widgets) 
      ? roleContent.widgets
          // Первая фильтрация: только валидные объекты с обязательными полями
          .filter(w => {
            if (!w || typeof w !== 'object') return false;
            if (!w.title || !w.link) return false;
            // Проверяем icon явно
            if (w.icon === undefined || w.icon === null) return false;
            return true;
          })
          // Маппинг с гарантией наличия icon
          .map(w => ({
            title: w.title,
            link: w.link,
            count: w.count ?? 0,
            icon: w.icon ?? '📊' // Fallback на всякий случай
          }))
          // Финальная фильтрация после маппинга
          .filter(w => w && w.title && w.link && w.icon !== undefined && w.icon !== null)
      : [];
    
    const safeQuickActions = Array.isArray(roleContent.quickActions)
      ? roleContent.quickActions
          // Первая фильтрация: только валидные объекты с обязательными полями
          .filter(a => {
            if (!a || typeof a !== 'object') return false;
            if (!a.title || !a.link) return false;
            // Проверяем icon явно
            if (a.icon === undefined || a.icon === null) return false;
            return true;
          })
          // Маппинг с гарантией наличия icon
          .map(a => ({
            title: a.title,
            link: a.link,
            icon: a.icon ?? '⚡' // Fallback на всякий случай
          }))
          // Финальная фильтрация после маппинга
          .filter(a => a && a.title && a.link && a.icon !== undefined && a.icon !== null)
      : [];
    
    return {
      ...roleContent,
      widgets: safeWidgets,
      quickActions: safeQuickActions
    };
  }, [roleContent, user]);

  // Определяем fetchStats ПЕРЕД использованием в useEffect
  const fetchStats = useCallback(async () => {
    try {
      // Получаем токен для авторизации
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
      
      // Запрашиваем статистику в зависимости от роли
      if (userRole === 'admin') {
        // Для админа запрашиваем admin stats и users
        const promises = [
          fetchWithAuth('/api/admin/stats').catch(err => {
            clientLogger.error('Error fetching admin stats:', err);
            return new Response(JSON.stringify({ error: 'Failed to fetch stats' }), { status: 500 });
          }),
          fetchWithAuth('/api/users').catch(err => {
            clientLogger.error('Error fetching users:', err);
            return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
          })
        ];

        const responses = await Promise.all(promises);
        
        if (responses[0].ok) {
                  try {
                    let statsData: unknown;
                    try {
                      statsData = await responses[0].json();
                      statsData = parseApiResponse(statsData);
                    } catch (jsonError) {
                      clientLogger.error('Ошибка парсинга JSON ответа admin/stats:', jsonError);
                      statsData = null;
                    }
                    if (statsData) {
                      setStats(statsData);
                    }
                  } catch (err) {
                    clientLogger.error('Error parsing admin stats:', err);
                  }
        } else {
          // Не логируем 403 как предупреждение, если пользователь не админ (хотя это не должно происходить)
          if (responses[0].status === 403) {
            clientLogger.debug('Admin stats endpoint returned 403 (access denied)');
          } else {
            clientLogger.warn('Admin stats endpoint returned', { status: responses[0].status });
          }
        }
        
        if (responses[1].ok) {
          try {
            let usersData: unknown;
            try {
              usersData = await responses[1].json();
              usersData = parseApiResponse<{ users?: unknown[]; pagination?: any }>(usersData);
            } catch (jsonError) {
              clientLogger.error('Ошибка парсинга JSON ответа users:', jsonError);
              return;
            }
            const usersArray = usersData && typeof usersData === 'object' && usersData !== null && 'users' in usersData && Array.isArray(usersData.users)
              ? usersData.users
              : [];
            setUserCount(usersArray.length);
          } catch (err) {
            clientLogger.error('Error parsing users data:', err);
          }
        } else {
          clientLogger.warn('Users endpoint returned', { status: responses[1].status });
        }
      } else if (userRole === 'complectator') {
        // Для комплектатора запрашиваем только complectator stats
        try {
          const response = await fetchWithAuth('/api/complectator/stats');
          
          if (response.ok) {
            try {
              let complectatorData: unknown;
              try {
                complectatorData = await response.json();
                complectatorData = parseApiResponse<{ stats?: unknown }>(complectatorData);
              } catch (jsonError) {
                clientLogger.error('Ошибка парсинга JSON ответа complectator stats:', jsonError);
                return;
              }
              const statsData = complectatorData && typeof complectatorData === 'object' && complectatorData !== null && 'stats' in complectatorData
                ? complectatorData.stats
                : null;
              setComplectatorStats(statsData);
            } catch (err) {
              clientLogger.error('Error parsing complectator stats:', err);
            }
          } else {
            clientLogger.warn('Complectator stats endpoint returned', { status: response.status });
          }
        } catch (err) {
          clientLogger.error('Error fetching complectator stats:', err);
        }
      }
      // Для других ролей (executor, manager) не запрашиваем статистику
    } catch (fetchStatsError) {
      clientLogger.error('Error loading stats:', fetchStatsError);
      // Не показываем ошибку пользователю, просто логируем
    }
  }, []);

  useEffect(() => {
    // Защита от повторных вызовов
    if (isInitializedRef.current) {
      clientLogger.debug('⏭️ DashboardContent - уже инициализирован, пропускаем');
      return;
    }

    clientLogger.debug('🔄 DashboardContent - useEffect запускается');
    isInitializedRef.current = true; // Устанавливаем флаг сразу чтобы предотвратить повторные вызовы
    
    // Проверяем аутентификацию - сначала localStorage, потом cookie
    let token = localStorage.getItem('authToken');
    if (!token && typeof document !== 'undefined') {
      // Проверяем cookie как fallback
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(c => c.trim().startsWith('auth-token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (!token || !userRole || !userId) {
      clientLogger.debug('❌ DashboardContent - нет токена, редирект на логин');
      router.push('/login?redirect=/dashboard');
      return;
    }

    clientLogger.debug('✅ DashboardContent - токен найден, загружаем данные пользователя');
    
    // Если данных в localStorage нет, пытаемся загрузить с сервера
    const loadUserData = async () => {
      try {
        // Пытаемся получить токен из localStorage или cookie для заголовка
        // Проверяем разные варианты ключей для токена
        let authToken = localStorage.getItem('authToken') || 
                       localStorage.getItem('auth-token') || 
                       localStorage.getItem('domeo-auth-token');
        
        // Если токена нет в localStorage, проверяем cookie
        if (!authToken && typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          const authCookie = cookies.find(c => {
            const trimmed = c.trim();
            return trimmed.startsWith('auth-token=') || trimmed.startsWith('domeo-auth-token=');
          });
          if (authCookie) {
            authToken = authCookie.split('=')[1].trim();
            // Сохраняем токен из cookie в localStorage для следующих запросов
            if (authToken) {
              localStorage.setItem('authToken', authToken);
            }
          }
        }
        
        // Если токена все еще нет, используем данные из localStorage
        if (!authToken) {
          clientLogger.warn('Токен не найден, используем данные из localStorage');
          const userData = {
            id: userId,
            email: localStorage.getItem('userEmail') || '',
            firstName: localStorage.getItem('userFirstName') || 'Иван',
            lastName: localStorage.getItem('userLastName') || 'Иванов',
            middleName: localStorage.getItem('userMiddleName') || '',
            role: userRole,
            permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]')
          };
          setUser(userData);
          return;
        }
        
        clientLogger.debug('📡 Запрос к /api/users/me:', {
          hasToken: !!authToken,
          tokenLength: authToken?.length,
          tokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'нет'
        });
        
        const response = await fetch('/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            ...(authToken ? { 'x-auth-token': authToken } : {})
          },
          credentials: 'include' // Включаем cookie для передачи токена
        });
        
        clientLogger.debug('📡 Ответ от /api/users/me:', {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText
        });
        
        if (response.ok) {
          let userDataFromServer: unknown;
          try {
            userDataFromServer = await response.json();
          } catch (jsonError) {
            clientLogger.error('Ошибка парсинга JSON ответа user data:', jsonError);
            // Используем данные из localStorage как fallback
            const userData = {
              id: userId,
              email: localStorage.getItem('userEmail') || '',
              firstName: localStorage.getItem('userFirstName') || 'Иван',
              lastName: localStorage.getItem('userLastName') || 'Иванов',
              middleName: localStorage.getItem('userMiddleName') || '',
              role: userRole,
              permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]')
            };
            setUser(userData);
            return;
          }
          // apiSuccess возвращает { success: true, data: { user: ... } }
          clientLogger.debug('📦 Raw response from /api/users/me:', { userDataFromServer });
          const responseData = userDataFromServer && typeof userDataFromServer === 'object' && userDataFromServer !== null && 'data' in userDataFromServer
            ? (userDataFromServer as { data: { user?: { id?: string; email?: string; firstName?: string; lastName?: string; middleName?: string; role?: string; permissions?: string[] } } }).data
            : null;
          clientLogger.debug('📦 Extracted responseData:', { responseData });
          const userDataObj = responseData && 'user' in responseData
            ? responseData.user
            : null;
          clientLogger.debug('📦 Extracted userDataObj:', { userDataObj });
          if (userDataObj) {
            // Сохраняем в localStorage для следующих запросов
            localStorage.setItem('userEmail', userDataObj.email || '');
            localStorage.setItem('userFirstName', userDataObj.firstName || '');
            localStorage.setItem('userLastName', userDataObj.lastName || '');
            localStorage.setItem('userMiddleName', userDataObj.middleName || '');
            localStorage.setItem('userRole', userDataObj.role || userRole);
            localStorage.setItem('userId', userDataObj.id || userId);
            // Сохраняем токен, если он есть и отличается от сохраненного
            const localToken = localStorage.getItem('authToken');
            if (authToken && authToken !== localToken) {
              localStorage.setItem('authToken', authToken);
            }
            
            const userData = {
              id: userDataObj.id || userId,
              email: userDataObj.email || localStorage.getItem('userEmail') || '',
              firstName: userDataObj.firstName || localStorage.getItem('userFirstName') || 'Иван',
              lastName: userDataObj.lastName || localStorage.getItem('userLastName') || 'Иванов',
              middleName: userDataObj.middleName || localStorage.getItem('userMiddleName') || '',
              role: userDataObj.role || userRole,
              permissions: userDataObj.permissions || JSON.parse(localStorage.getItem('userPermissions') || '[]')
            };
            
            setUser(userData);
          } else {
            // Если данные пользователя не найдены, используем данные из localStorage
            clientLogger.warn('📦 Данные пользователя не найдены в ответе API, используем localStorage');
            const userData = {
              id: userId,
              email: localStorage.getItem('userEmail') || '',
              firstName: localStorage.getItem('userFirstName') || 'Иван',
              lastName: localStorage.getItem('userLastName') || 'Иванов',
              middleName: localStorage.getItem('userMiddleName') || '',
              role: userRole,
              permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]')
            };
            setUser(userData);
          }
        } else {
          // Если API вернул ошибку, пытаемся получить детали ошибки
          let errorMessage = `Ошибка ${response.status}`;
          try {
            let errorData: unknown;
            try {
              errorData = await response.json();
            } catch (jsonError) {
              clientLogger.warn(`❌ API вернул ошибку ${response.status}, детали недоступны`);
              errorData = null;
            }
            if (errorData && typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
              errorMessage = String((errorData as { error: unknown }).error) || errorMessage;
            }
            clientLogger.warn(`❌ API вернул ошибку ${response.status}`, { errorMessage });
          } catch (e) {
            clientLogger.warn(`❌ API вернул ошибку ${response.status}, детали недоступны`);
          }
          
          // Используем данные из localStorage как fallback
          clientLogger.warn('📦 Используем данные из localStorage');
          const userData = {
            id: userId,
            email: localStorage.getItem('userEmail') || '',
            firstName: localStorage.getItem('userFirstName') || 'Иван',
            lastName: localStorage.getItem('userLastName') || 'Иванов',
            middleName: localStorage.getItem('userMiddleName') || '',
            role: userRole,
            permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]')
          };
          
          setUser(userData);
        }
      } catch (error) {
        clientLogger.error('Error loading user data from server:', error);
        // Fallback на localStorage
        const userData = {
          id: userId,
          email: localStorage.getItem('userEmail') || '',
          firstName: localStorage.getItem('userFirstName') || 'Иван',
          lastName: localStorage.getItem('userLastName') || 'Иванов',
          middleName: localStorage.getItem('userMiddleName') || '',
          role: userRole,
          permissions: JSON.parse(localStorage.getItem('userPermissions') || '[]')
        };
        
        setUser(userData);
      }
    };

    // Загружаем данные пользователя
    loadUserData().then(() => {
      clientLogger.debug('📊 DashboardContent - загружаем статистику');
      // Загружаем статистику для всех ролей асинхронно, чтобы не блокировать рендер
      fetchStats().catch((fetchError) => {
        clientLogger.error('Error in fetchStats:', fetchError);
      });
      setIsLoading(false);
      clientLogger.debug('✅ DashboardContent - isLoading установлен в false');
    }).catch((error) => {
      clientLogger.error('Error in loadUserData:', error);
      setIsLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Пустой массив зависимостей - эффект должен выполняться только один раз при монтировании


  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userMiddleName');
    localStorage.removeItem('userPermissions');
    router.push('/login');
  };

  clientLogger.debug('🔄 DashboardContent - проверка isLoading', { isLoading, userRole: user ? user.role : 'null' });
  
  if (isLoading) {
    clientLogger.debug('⏳ DashboardContent - показываем загрузку');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Для админов используем AdminLayout, для остальных - обычный лейаут
  if (user.role === 'admin') {
    return (
      <AdminLayout
        title={safeRoleContent.title}
        subtitle={safeRoleContent.description}
      >
        <div className="space-y-8">
          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {safeRoleContent.widgets
              .map((widget, index) => {
                // Дополнительная защита перед рендерингом
                if (!widget || !widget.title || !widget.link || widget.icon === undefined || widget.icon === null) {
                  return null;
                }
                return (
              <Card key={index} variant="interactive" className="hover:border-black transition-all duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                      <p className="text-2xl font-bold text-black mt-1">{widget.count ?? 0}</p>
                    </div>
                        <div className="text-2xl">{widget?.icon ?? '📊'}</div>
                  </div>
                </div>
              </Card>
                );
              }).filter(Boolean)}
          </div>

          {/* Quick Actions */}
          <Card variant="base">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Быстрые действия</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {safeRoleContent.quickActions
                  .map((action, index) => {
                    // Дополнительная защита перед рендерингом
                    if (!action || !action.title || !action.link || action.icon === undefined || action.icon === null) {
                      return null;
                    }
                    return (
                  <Button
                    key={index}
                    variant="secondary"
                    className="p-4 h-auto flex flex-col items-center space-y-2"
                    onClick={() => action?.link && router.push(action.link)}
                  >
                        <div className="text-2xl">{action?.icon ?? '⚡'}</div>
                    <p className="text-sm font-medium">{action.title}</p>
                  </Button>
                    );
                  }).filter(Boolean)}
              </div>
            </div>
          </Card>

        </div>
      </AdminLayout>
    );
  }

  // Для не-админов используем обычный лейаут
  // Специальный случай: роль комплектатора — показываем новый ЛК комплектатора с единой шапкой
  if (user.role === 'complectator') {
    clientLogger.debug('🎯 DashboardContent - рендер для complectator, загружаем ComplectatorDashboard');
    return (
      <div className="min-h-screen bg-white">
        {/* Header (унифицированный стиль) */}
        <header className="bg-white border-b border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div 
                  onClick={() => router.push('/')}
                  className="cursor-pointer hover:opacity-70 transition-opacity duration-200"
                >
                  <h1 className="text-2xl font-bold text-black">Domeo</h1>
                  <p className="text-xs text-gray-500 font-medium">Личный кабинет</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell userRole={user.role} />
                <div className="text-sm text-gray-700">
                  {user.lastName} {user.firstName.charAt(0)}.{(user.middleName && user.middleName.trim()) ? user.middleName.charAt(0) + '.' : ''} ({getRoleText(user.role)})
                </div>
                <button
                  onClick={() => router.back()}
                  className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ComplectatorDashboard user={user} />
        </main>
      </div>
    );
  }

  // Специальный случай: роль исполнителя — показываем новый ЛК исполнителя с единой шапкой
  if (user.role === 'executor') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header (унифицированный стиль) */}
        <header className="bg-white border-b border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div 
                  onClick={() => router.push('/')}
                  className="cursor-pointer hover:opacity-70 transition-opacity duration-200"
                >
                  <h1 className="text-2xl font-bold text-black">Domeo</h1>
                  <p className="text-xs text-gray-500 font-medium">Личный кабинет</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell userRole={user.role} />
                <div className="text-sm text-gray-700">
                  {user.lastName} {user.firstName.charAt(0)}.{(user.middleName && user.middleName.trim()) ? user.middleName.charAt(0) + '.' : ''} ({getRoleText(user.role)})
                </div>
                <button
                  onClick={() => router.back()}
                  className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ExecutorDashboard />
        </main>
      </div>
    );
  }

  // Специальный случай: роль руководителя — показываем ЛК руководителя с единой шапкой
  if (user.role === 'manager') {
    return (
      <div className="min-h-screen bg-white">
        {/* Header (унифицированный стиль) */}
        <header className="bg-white border-b border-black/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div 
                  onClick={() => router.push('/')}
                  className="cursor-pointer hover:opacity-70 transition-opacity duration-200"
                >
                  <h1 className="text-2xl font-bold text-black">Domeo</h1>
                  <p className="text-xs text-gray-500 font-medium">Личный кабинет</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationBell userRole={user.role} />
                <div className="text-sm text-gray-700">
                  {user.lastName} {user.firstName.charAt(0)}.{(user.middleName && user.middleName.trim()) ? user.middleName.charAt(0) + '.' : ''} ({getRoleText(user.role)})
                </div>
                <button
                  onClick={() => router.back()}
                  className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
                >
                  Назад
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ManagerDashboard user={user} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div 
                onClick={() => router.push('/')}
                className="cursor-pointer hover:opacity-70 transition-opacity duration-200"
              >
                <h1 className="text-2xl font-bold text-black">Domeo</h1>
                <p className="text-xs text-gray-500 font-medium">Configurators</p>
              </div>
              <div className="flex items-center">
                <span className="text-black mx-3 text-lg font-bold">•</span>
                <h2 className="text-lg font-semibold text-black">{getRoleDisplayName(user.role)}</h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {user.lastName} {user.firstName.charAt(0)}.{(user.middleName && user.middleName.trim()) ? user.middleName.charAt(0) + '.' : ''} ({getRoleText(user.role)})
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black">{safeRoleContent.title}</h1>
          <p className="text-gray-600 mt-2">{safeRoleContent.description}</p>
        </div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {safeRoleContent.widgets
            .map((widget, index) => {
              // Дополнительная защита перед рендерингом
              if (!widget || !widget.title || !widget.link || widget.icon === undefined || widget.icon === null) {
                return null;
              }
              return (
            <div
              key={index}
              onClick={() => widget?.link && router.push(widget.link)}
              className="bg-white border border-gray-200 p-6 hover:border-black transition-all duration-200 group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{widget.title}</p>
                  <p className="text-2xl font-bold text-black mt-1">{widget.count ?? 0}</p>
                </div>
                <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                      {widget?.icon ?? '📊'}
                </div>
              </div>
            </div>
              );
            }).filter(Boolean)}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-50 p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Быстрые действия</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {safeRoleContent.quickActions
              .map((action, index) => {
                // Дополнительная защита перед рендерингом
                if (!action || !action.title || !action.link || action.icon === undefined || action.icon === null) {
                  return null;
                }
                return (
              <button
                key={index}
                onClick={() => action?.link && router.push(action.link)}
                className="bg-white border border-gray-200 p-4 hover:border-black hover:bg-black hover:text-white transition-all duration-200 group text-center"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">
                      {action?.icon ?? '⚡'}
                </div>
                <p className="text-sm font-medium">{action.title}</p>
              </button>
                );
              }).filter(Boolean)}
          </div>
        </div>

      </main>
    </div>
  );

  function getRoleText(role: string) {
    const roleMap: { [key: string]: string } = {
      'admin': 'Администратор',
      'complectator': 'Комплектатор',
      'executor': 'Исполнитель',
      'manager': 'Руководитель'
    };
    return roleMap[role] || 'Пользователь';
  }

  function getRoleDisplayName(role: string) {
    const roleMap: { [key: string]: string } = {
      'admin': 'Администратор',
      'complectator': 'Комплектатор',
      'executor': 'Исполнитель',
      'manager': 'Руководитель'
    };
    return roleMap[role] || 'Пользователь';
  }
}
