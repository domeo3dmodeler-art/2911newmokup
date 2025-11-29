'use client';

// components/layout/AdminLayout.tsx
// Основной layout для админ панели с боковым меню

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../ui/NotificationBell';

// Функция для получения заголовка страницы
function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/admin': 'Панель управления',
    '/admin/categories': 'Категории конфигуратора',
    '/admin/categories/builder': 'Конструктор страниц',
    '/professional-builder': 'Профессиональный конструктор',
    '/admin/catalog': 'Каталог товаров',
    '/admin/catalog/import': 'Импорт товаров',
    '/admin/users': 'Пользователи',
    '/admin/notifications-demo': 'Демо уведомлений',
    '/admin/settings': 'Настройки'
  };
  
  return titles[pathname] || 'Админ панель';
}

// Функция для форматирования имени пользователя
function formatUserName(user: any): string {
  if (!user) return 'Пользователь';
  return `${user.lastName || ''} ${user.firstName || ''} ${user.middleName || ''}`.trim() || user.email || 'Пользователь';
}

// Функция для получения отображаемого названия роли
function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    'admin': 'Администратор',
    'complectator': 'Комплектатор',
    'executor': 'Исполнитель'
  };
  return roleNames[role] || role || 'Пользователь';
}

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backHref?: string;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
        {
          id: 'dashboard',
          label: 'Главная',
          href: '/dashboard'
        },
  {
    id: 'catalog',
    label: 'Каталог товаров',
    href: '/admin/catalog',
    children: [
      { id: 'catalog-tree', label: 'Дерево каталога', href: '/admin/catalog' },
      { id: 'catalog-tree-import', label: 'Импорт дерева каталогов', href: '/admin/catalog/tree-import' },
      { id: 'catalog-properties', label: 'Свойства товаров', href: '/admin/catalog/properties' },
      { id: 'catalog-import', label: 'Импорт товаров', href: '/admin/catalog/import' },
      { id: 'catalog-products', label: 'Товары', href: '/admin/catalog/products' }
    ]
  },
  {
    id: 'configurator',
    label: 'Категории конфигуратора',
    href: '/admin/categories',
    children: [
      { id: 'configurator-list', label: 'Список категорий', href: '/admin/categories' },
      { id: 'configurator-create', label: 'Создать категорию', href: '/admin/categories/builder' },
      { id: 'configurator-professional', label: 'Профессиональный конструктор', href: '/professional-builder' }
    ]
  },
  { id: 'analytics', href: '/admin/analytics', label: 'Аналитика', icon: 'BarChart3' },
  {
    id: 'clients',
    label: 'Заказчики',
    href: '/admin/clients'
  },
  {
    id: 'users',
    label: 'Пользователи',
    href: '/admin/users'
  },
  {
    id: 'settings',
    label: 'Настройки',
    href: '/admin/settings'
  }
];

export default function AdminLayout({ children, title, subtitle, showBackButton = false, backHref = '/' }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['catalog', 'configurator']));
  const pathname = usePathname();
  const { user: currentUser, isAuthenticated, isLoading, logout } = useAuth();

  // Показываем загрузку пока проверяется аутентификация
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем сообщение
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">Для доступа к админ-панели необходимо войти в систему</p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Войти в систему
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Фильтрация меню по ролям
  const getFilteredMenuItems = () => {
    if (!currentUser) return [];

    const userRole = currentUser.role;
    const filteredItems = [];
    
    if (userRole === 'admin') {
      // Админ видит все пункты меню
      return menuItems;
    }
    
    if (userRole === 'complectator') {
      // Комплектатор видит категории, каталог и конфигуратор
      const allowedItems = ['catalog', 'configurator'];
      filteredItems.push(...menuItems.filter(item => allowedItems.includes(item.id)));
      
      // Добавляем специфичный пункт для комплектатора
      filteredItems.unshift({
        id: 'complectator-dashboard',
        href: '/complectator/dashboard',
        label: 'Панель комплектовщика',
        icon: 'ShoppingCart'
      });
    }
    
    if (userRole === 'executor') {
      // Исполнитель видит каталог
      const allowedItems = ['catalog'];
      filteredItems.push(...menuItems.filter(item => allowedItems.includes(item.id)));
      
      // Добавляем специфичный пункт для исполнителя
      filteredItems.unshift({
        id: 'executor-dashboard',
        href: '/executor/dashboard',
        label: 'Панель исполнителя',
        icon: 'Package'
      });
    }
    
    return filteredItems;
  };

  const filteredMenuItems = getFilteredMenuItems();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(menuId)) {
        newSet.delete(menuId);
      } else {
        newSet.add(menuId);
      }
      return newSet;
    });
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-black/10 transform transition-transform duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-black/10">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-black">Domeo</span>
          </Link>
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {filteredMenuItems.map((item) => (
              <div key={item.id}>
                {item.children ? (
                  // Menu item with children (expandable)
                  <div>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`group w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                      }`}
                    >
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-400 text-black rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {/* Arrow icon */}
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedMenus.has(item.id) ? 'rotate-90' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    
                    {/* Submenu */}
                    {expandedMenus.has(item.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.href}
                            className={`group flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                              pathname === child.href
                                ? 'bg-gray-100 text-black'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-black'
                            }`}
                          >
                            <span>{child.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Regular menu item (no children)
                  <Link
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                    }`}
                  >
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="ml-2 px-2 py-1 text-xs font-medium bg-yellow-400 text-black rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {currentUser ? `${currentUser.lastName} ${currentUser.firstName} ${currentUser.middleName || ''}`.trim() : 'Пользователь'}
              </p>
              <p className="text-xs text-gray-500 truncate">{getRoleDisplayName(currentUser?.role || 'admin')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-black/10">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
              <div className="ml-4 lg:ml-0">
                {title && (
                  <h1 className="text-xl font-semibold text-black">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-sm text-gray-600">{subtitle}</p>
                )}
              </div>
            </div>

            {/* User info and actions moved to top right */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {currentUser?.firstName?.[0] || 'A'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser ? `${currentUser.lastName} ${currentUser.firstName}`.trim() : 'Пользователь'}
                  </p>
                  <p className="text-xs text-gray-500">{getRoleDisplayName(currentUser?.role || 'admin')}</p>
                </div>
              </div>
              <NotificationBell userRole={currentUser?.role || 'admin'} />
              {showBackButton ? (
                <Link href={backHref}>
                  <Button variant="ghost" size="sm">
                    ← Назад
                  </Button>
                </Link>
              ) : (
                <Button variant="ghost" size="sm" onClick={logout}>
                  Выйти
                </Button>
              )}
            </div>
          </div>
        </div>


        {/* Page content */}
        <main className="p-0">
          {children}
        </main>
      </div>

    </div>
  );
}
