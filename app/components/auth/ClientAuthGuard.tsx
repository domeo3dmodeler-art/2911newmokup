'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ClientAuthGuardProps {
  children: React.ReactNode;
}

export function ClientAuthGuard({ children }: ClientAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const userRole = localStorage.getItem('userRole');
      
      // Диагностика localStorage
      clientLogger.debug('🔍 ClientAuthGuard - localStorage check:', {
        token: token ? token.substring(0, 20) + '...' : 'Нет токена',
        userId: userId || 'Нет userId',
        userRole: userRole || 'Нет userRole',
        allKeys: Object.keys(localStorage)
      });
      
      // Проверяем только токен - это достаточно для авторизации
      if (token) {
        clientLogger.debug('✅ ClientAuthGuard - авторизация успешна по токену');
        setIsAuthenticated(true);
      } else {
        clientLogger.debug('❌ ClientAuthGuard - токен не найден, редирект на логин');
        setIsAuthenticated(false);
        router.push('/login');
      }
    };

    // Добавляем небольшую задержку для стабильности
    const timeoutId = setTimeout(checkAuth, 100);
    
    // Добавляем таймаут для диагностики
    const diagnosticTimeout = setTimeout(() => {
      const currentAuth = localStorage.getItem('authToken') ? true : false;
      clientLogger.debug('⚠️ ClientAuthGuard - таймаут диагностики, текущее состояние:', currentAuth);
    }, 5000);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(diagnosticTimeout);
    };
  }, [router, isAuthenticated]);

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
    return null;
  }

  // Если авторизован, показываем содержимое
  return <>{children}</>;
}
