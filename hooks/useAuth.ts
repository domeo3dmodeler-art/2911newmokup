import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/lib/utils/fetch-with-auth';
import { parseApiResponse } from '@/lib/utils/parse-api-response';
import { clientLogger } from '@/lib/logging/client-logger';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  permissions?: string[];
  lastLogin?: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Унифицированный hook для работы с авторизацией
 * Использует authToken из localStorage (основной источник) с fallback на cookies
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });

  const router = useRouter();

  /**
   * Получает токен из localStorage или cookies
   */
  const getToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    
    // Основной источник - localStorage
    let token = localStorage.getItem('authToken');
    
    // Fallback на старый ключ для совместимости
    if (!token) {
      token = localStorage.getItem('token');
      if (token) {
        // Миграция на новый ключ
        localStorage.setItem('authToken', token);
        localStorage.removeItem('token');
      }
    }
    
    // Fallback на cookies
    if (!token && typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      const authCookie = cookies.find(
        c => c.trim().startsWith('auth-token=') || c.trim().startsWith('domeo-auth-token=')
      );
      if (authCookie) {
        token = authCookie.split('=')[1].trim();
        // Сохраняем в localStorage для следующих запросов
        if (token) {
          localStorage.setItem('authToken', token);
        }
      }
    }
    
    return token;
  }, []);

  /**
   * Сохраняет данные пользователя в localStorage
   */
  const saveUserToLocalStorage = useCallback((user: User) => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userEmail', user.email || '');
    localStorage.setItem('userFirstName', user.firstName || '');
    localStorage.setItem('userLastName', user.lastName || '');
    localStorage.setItem('userMiddleName', user.middleName || '');
  }, []);

  /**
   * Очищает данные пользователя из localStorage
   */
  const clearUserFromLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('token'); // Старый ключ
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userMiddleName');
  }, []);

  // Проверка токена при загрузке
  const checkAuth = useCallback(async () => {
    try {
      const token = getToken();
      
      if (!token) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
        return;
      }

      // Проверяем токен через API используя fetchWithAuth
      const response = await fetchWithAuth('/api/users/me');

      if (response.ok) {
        const data = await response.json();
        const responseData = parseApiResponse<{ user?: User }>(data);
        const userData = responseData?.user || data.user || data;
        
        if (userData && userData.id) {
          // Сохраняем данные пользователя в localStorage
          saveUserToLocalStorage(userData);
          
        setAuthState({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });
        } else {
          throw new Error('Invalid user data');
        }
      } else {
        // Токен недействителен
        clearUserFromLocalStorage();
        deleteCookie('auth-token');
        deleteCookie('domeo-auth-token');
        
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      }
    } catch (error) {
      clientLogger.error('Auth check error:', error);
      clearUserFromLocalStorage();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Ошибка проверки авторизации'
      });
    }
  }, [getToken, saveUserToLocalStorage, clearUserFromLocalStorage]);

  // Вход в систему
  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      const responseData = parseApiResponse<{ token?: string; user?: User }>(data);

      if (responseData && responseData.token) {
        const token = responseData.token;
        const user = responseData.user || data.user;
        
        // Сохраняем токен в localStorage (основной источник)
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', token);
        }
        
        // Также сохраняем в cookies для совместимости
        setCookie('auth-token', token, 1); // 1 день
        
        // Сохраняем данные пользователя
        if (user) {
          saveUserToLocalStorage(user);
        }
        
        setAuthState({
          user: user || null,
          isAuthenticated: true,
          isLoading: false,
          error: null
        });

        return { success: true };
      } else {
        const errorMessage = data.error || 'Ошибка входа';
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }));
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = 'Ошибка соединения с сервером';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [saveUserToLocalStorage]);

  // Выход из системы
  const logout = useCallback(() => {
    clearUserFromLocalStorage();
    deleteCookie('auth-token');
    deleteCookie('domeo-auth-token');
    
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
    router.push('/login');
  }, [router, clearUserFromLocalStorage]);

  // Регистрация
  const register = useCallback(async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role: string;
  }) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (data.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null
        }));
        return { success: true };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'Ошибка регистрации'
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'Ошибка соединения с сервером';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Проверка роли
  const hasRole = useCallback((role: string) => {
    return authState.user?.role === role;
  }, [authState.user]);

  // Проверка прав доступа
  const hasPermission = useCallback((permission: string) => {
    if (!authState.user) return false;
    
    // Простая проверка прав на основе роли
    const rolePermissions = {
      admin: ['*'], // Админ имеет все права
      complectator: ['categories', 'catalog', 'documents'],
      executor: ['catalog', 'orders']
    };

    const userPermissions = rolePermissions[authState.user.role as keyof typeof rolePermissions] || [];
    
    return userPermissions.includes('*') || userPermissions.includes(permission);
  }, [authState.user]);

  // Проверка авторизации при загрузке
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    ...authState,
    login,
    logout,
    register,
    hasRole,
    hasPermission,
    checkAuth
  };
}

// Утилиты для работы с cookies
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  
  // Для локальной разработки убираем secure
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const secureFlag = isLocalhost ? '' : 'secure;';
  
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;${secureFlag}samesite=lax`;
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
