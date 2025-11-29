'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clientLogger } from '@/lib/logging/client-logger';

interface ClientAuthGuardProps {
  children: React.ReactNode;
}

export function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Проверяем авторизацию только на клиенте
    if (typeof window === 'undefined') {
      return;
    }

    // Защита от повторных вызовов
    let isMounted = true;

    const checkAuth = () => {
      try {
        // Проверяем сначала localStorage, потом cookie
        let token = localStorage.getItem('authToken');
        
        if (!token && typeof document !== 'undefined') {
          // Проверяем cookie как fallback
          const cookies = document.cookie.split(';');
          const authCookie = cookies.find(c => c.trim().startsWith('auth-token=') || c.trim().startsWith('domeo-auth-token='));
          if (authCookie) {
            token = authCookie.split('=')[1].trim();
            // Сохраняем токен из cookie в localStorage для следующих запросов
            if (token) {
              localStorage.setItem('authToken', token);
            }
          }
        }
        
        // Диагностика localStorage
        clientLogger.debug('🔍 ClientAuthGuard - localStorage check:', {
          token: token ? token.substring(0, 20) + '...' : 'Нет токена',
          userId: localStorage.getItem('userId') || 'Нет userId',
          userRole: localStorage.getItem('userRole') || 'Нет userRole',
          cookies: typeof document !== 'undefined' ? document.cookie : 'N/A',
          allKeys: Object.keys(localStorage)
        });
        
        // Проверяем только токен - это достаточно для авторизации
        if (token) {
          clientLogger.debug('✅ ClientAuthGuard - авторизация успешна по токену');
          
          // Если нет userId или userRole в localStorage, пытаемся загрузить их с сервера
          const userId = localStorage.getItem('userId');
          const userRole = localStorage.getItem('userRole');
          
          if (!userId || !userRole) {
            clientLogger.debug('📥 ClientAuthGuard - загружаем данные пользователя с сервера...');
            fetch('/api/users/me', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            })
              .then(res => {
                if (res.ok) {
                  return res.json();
                }
                throw new Error('Failed to load user data');
              })
              .then(data => {
                if (data.user && isMounted) {
                  // Сохраняем данные в localStorage
                  localStorage.setItem('userId', data.user.id);
                  localStorage.setItem('userRole', data.user.role);
                  localStorage.setItem('userEmail', data.user.email || '');
                  localStorage.setItem('userFirstName', data.user.firstName || '');
                  localStorage.setItem('userLastName', data.user.lastName || '');
                  localStorage.setItem('userMiddleName', data.user.middleName || '');
                  clientLogger.debug('✅ ClientAuthGuard - данные пользователя загружены');
                }
              })
              .catch(err => {
                clientLogger.error('❌ ClientAuthGuard - ошибка загрузки данных пользователя:', err);
              });
          }
          
          // Используем функцию обновления состояния для гарантированного обновления, но только если компонент еще смонтирован
          if (isMounted) {
            setIsAuthenticated((prev) => {
              // Предотвращаем повторные установки
              if (prev === true) {
                clientLogger.debug('⏭️ ClientAuthGuard - уже авторизован, пропускаем');
                return prev;
              }
              clientLogger.debug('🔄 ClientAuthGuard - обновление состояния, prev:', prev, '-> true');
              return true;
            });
          }
        } else {
          clientLogger.debug('❌ ClientAuthGuard - токен не найден, редирект на логин');
          if (isMounted) {
            setIsAuthenticated(false);
            router.push('/login');
          }
        }
      } catch (authError) {
        clientLogger.error('❌ ClientAuthGuard - ошибка при проверке авторизации:', authError);
        if (isMounted) {
          setIsAuthenticated(false);
          router.push('/login');
        }
      }
    };

    // Выполняем проверку немедленно, без задержки
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Показываем загрузку пока проверяем авторизацию
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован, не показываем ничего (редирект уже произошел)
  if (!isAuthenticated) {
    clientLogger.debug('❌ ClientAuthGuard - рендер: не авторизован');
    return null;
  }

  // Если авторизован, показываем содержимое
  clientLogger.debug('✅ ClientAuthGuard - рендер: авторизован, показываем содержимое');
  return <>{children}</>;
}
