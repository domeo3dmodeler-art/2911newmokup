'use client';

// Отключаем статическую генерацию (динамический контент) - должно быть до импортов
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { ClientAuthGuard } from '@/components/auth/ClientAuthGuard';
import NotificationBell from '@/components/ui/NotificationBell';
import { clientLogger } from '@/lib/logging/client-logger';

// Динамический импорт основного компонента dashboard с отключением SSR
const ComplectatorDashboardComponent = dynamicImport(
  () => import('./ComplectatorDashboardComponent').then(mod => ({ default: mod.ComplectatorDashboardComponent })),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-64"><div className="text-gray-500">Загрузка...</div></div>
  }
);

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  role: string;
  permissions: string[];
}

function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    'admin': 'Администратор',
    'complectator': 'Комплектатор',
    'executor': 'Исполнитель',
    'manager': 'Руководитель'
  };
  return roleMap[role] || role;
}

export default function ComplectatorDashboardPage() {
  return (
    <ClientAuthGuard>
      <ComplectatorDashboardContent />
    </ClientAuthGuard>
  );
}

function ComplectatorDashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Используем унифицированный способ получения токена
        let token = localStorage.getItem('authToken');
        if (!token) {
          // Fallback на старый ключ для совместимости
          token = localStorage.getItem('token');
          if (token) {
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
            if (token) {
              localStorage.setItem('authToken', token);
            }
          }
        }
        
        if (!token) {
          router.push('/login?redirect=/complectator/dashboard');
          return;
        }

        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'x-auth-token': token
          },
          credentials: 'include'
        });

        if (!response.ok) {
          router.push('/login?redirect=/complectator/dashboard');
          return;
        }

        const data = await response.json();
        if (data.user) {
          // Проверяем роль
          if (data.user.role !== 'complectator') {
            router.push('/dashboard');
            return;
          }
          setUser(data.user);
        }
      } catch (error) {
        clientLogger.error('Error fetching user:', error);
        router.push('/login?redirect=/complectator/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
        <ComplectatorDashboardComponent user={user} />
      </main>
    </div>
  );
}

// Экспорт для использования в других местах (например, в /dashboard)
export function ComplectatorDashboard({ user }: { user: User }) {
  return <ComplectatorDashboardComponent user={user} />;
}