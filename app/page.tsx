'use client';

import Link from 'next/link';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge } from '../components/ui';
import { formatUserName, getRoleDisplayName, User } from '../lib/utils/user-display';

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Динамические фоны для разных категорий товаров
  const backgrounds = useMemo(() => [
    {
      category: 'doors',
      gradient: 'from-gray-50 to-gray-100',
      pattern: 'doors',
      title: 'Двери и фурнитура',
      description: 'Межкомнатные и входные двери премиум-класса'
    },
    {
      category: 'flooring',
      gradient: 'from-gray-50 to-gray-100',
      pattern: 'flooring',
      title: 'Напольные покрытия',
      description: 'Ламинат, паркет, линолеум'
    },
    {
      category: 'kitchens',
      gradient: 'from-gray-50 to-gray-100',
      pattern: 'kitchens',
      title: 'Кухни на заказ',
      description: 'Кухонные гарнитуры и мебель'
    },
    {
      category: 'tiles',
      gradient: 'from-gray-50 to-gray-100',
      pattern: 'tiles',
      title: 'Плитка и керамика',
      description: 'Керамическая плитка, мозаика'
    }
  ], []);

  useEffect(() => {
    setIsLoaded(true);
    
    // Проверяем аутентификацию
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');

    if (token && userRole && userId) {
      // Пользователь авторизован
      const userData = {
        id: userId,
        email: localStorage.getItem('userEmail') || '',
        firstName: localStorage.getItem('userFirstName') || 'Иван',
        lastName: localStorage.getItem('userLastName') || 'Иванов',
        middleName: localStorage.getItem('userMiddleName') || 'Иванович',
        role: userRole
      };
      
      setUser(userData);
    }
    
    setIsLoading(false);
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % backgrounds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgrounds]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userMiddleName');
    localStorage.removeItem('userPermissions');
    setUser(null);
    router.push('/');
  };

  const currentBg = backgrounds[currentSlide];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">

      {/* Header */}
      <header className="bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Заголовок */}
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-black">Domeo</h1>
                <p className="text-xs text-gray-500 font-medium">Configurators</p>
              </div>
              <div className="flex items-center">
                <span className="text-black mx-3 text-lg font-bold">•</span>
                <h2 className="text-lg font-semibold text-black">Конфигураторы товаров</h2>
              </div>
            </div>

            {/* Навигация */}
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Показываем ФИО пользователя */}
                  <div className="text-sm text-gray-600">
                    {formatUserName(user)} ({getRoleDisplayName(user.role)})
                  </div>
                  
                  {/* Кнопка выхода */}
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2 bg-transparent border border-black text-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium"
                  >
                    Выход
                  </button>
                  
                  {/* Кнопка панели управления или личного кабинета */}
                  <Link 
                    href="/dashboard" 
                    className="px-6 py-2 bg-black text-white rounded-none hover:bg-yellow-400 hover:text-black transition-all duration-200 text-sm font-medium"
                  >
                    {user.role === 'admin' ? 'Панель управления' : 'Личный кабинет'}
                  </Link>
                </>
              ) : (
                <>
                  {/* Кнопка входа для неавторизованных пользователей */}
                  <Link 
                    href="/login" 
                    className="px-6 py-2 bg-transparent border border-black text-black rounded-none hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium"
                  >
                    Вход
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Categories Section - перенесены наверх */}
        <section className="py-20 px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-black mb-6">
                Категории товаров
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">
                Выберите категорию для начала работы с конфигуратором
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Двери - АКТИВНАЯ */}
              <Link href="/doors" className="group relative">
                <Card variant="interactive" padding="md" className="h-full">
                  {/* Статус бейдж */}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge variant="warning" size="sm">
                      Активно
                    </Badge>
                  </div>
                
                {/* Иконка категории */}
                <div className="p-8 pb-6">
                  <div className="w-20 h-20 bg-black/5 flex items-center justify-center mb-6 group-hover:bg-black/10 transition-colors duration-300">
                    <svg className="w-12 h-12 text-black" viewBox="0 0 24 24" fill="none">
                      {/* Дверная рама */}
                      <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      {/* Дверное полотно */}
                      <rect x="6" y="4" width="12" height="16" rx="1" fill="currentColor" fillOpacity="0.1"/>
                      {/* Дверная ручка */}
                      <circle cx="15" cy="12" r="1.5" fill="currentColor"/>
                      {/* Дверные панели */}
                      <rect x="7" y="6" width="10" height="2" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
                      <rect x="7" y="10" width="10" height="2" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
                      <rect x="7" y="14" width="10" height="2" rx="0.5" fill="currentColor" fillOpacity="0.2"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-black mb-3 group-hover:text-yellow-400 transition-colors">
                    Двери
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 font-light">
                    Межкомнатные и входные двери премиум-класса
                  </p>
                  
                  <div className="flex items-center text-black font-semibold text-sm">
                    <span>Начать работу</span>
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                </Card>
              </Link>

              {/* Напольные покрытия - ЗАГЛУШКА */}
              <div className="relative opacity-60">
                <Card variant="base" padding="md" className="h-full">
                  {/* Статус бейдж */}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge variant="default" size="sm">
                      Скоро
                    </Badge>
                  </div>
                
                {/* Иконка категории */}
                <div className="p-8 pb-6">
                  <div className="w-20 h-20 bg-black/5 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none">
                      {/* Паркетные доски */}
                      <rect x="2" y="8" width="4" height="8" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="7" y="8" width="4" height="8" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="12" y="8" width="4" height="8" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="17" y="8" width="4" height="8" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      
                      {/* Стыки между досками */}
                      <line x1="6" y1="8" x2="6" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                      <line x1="11" y1="8" x2="11" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                      <line x1="16" y1="8" x2="16" y2="16" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                      
                      {/* Текстура дерева */}
                      <path d="M3 10 Q4 9 5 10 Q6 9 7 10" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4"/>
                      <path d="M8 10 Q9 9 10 10 Q11 9 12 10" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4"/>
                      <path d="M13 10 Q14 9 15 10 Q16 9 17 10" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4"/>
                      <path d="M18 10 Q19 9 20 10" stroke="currentColor" strokeWidth="0.3" fill="none" opacity="0.4"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-400 mb-3">
                    Напольные покрытия
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                    Ламинат, паркет, линолеум
                  </p>
                  
                  <div className="flex items-center text-gray-400 font-semibold text-sm">
                    <span>Скоро</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                </Card>
              </div>

              {/* Кухни - ЗАГЛУШКА */}
              <div className="relative opacity-60">
                <Card variant="base" padding="md" className="h-full">
                  {/* Статус бейдж */}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge variant="default" size="sm">
                      Скоро
                    </Badge>
                  </div>
                
                {/* Иконка категории */}
                <div className="p-8 pb-6">
                  <div className="w-20 h-20 bg-black/5 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none">
                      {/* Кухонный гарнитур */}
                      <rect x="2" y="6" width="20" height="12" rx="1" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.5"/>
                      
                      {/* Верхние шкафы */}
                      <rect x="3" y="7" width="4" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="8" y="7" width="4" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="13" y="7" width="4" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="18" y="7" width="3" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      
                      {/* Нижние шкафы */}
                      <rect x="3" y="14" width="4" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="8" y="14" width="4" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="13" y="14" width="4" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      <rect x="18" y="14" width="3" height="3" rx="0.5" fill="currentColor" fillOpacity="0.3"/>
                      
                      {/* Ручки */}
                      <circle cx="5" cy="10" r="0.5" fill="currentColor"/>
                      <circle cx="10" cy="10" r="0.5" fill="currentColor"/>
                      <circle cx="15" cy="10" r="0.5" fill="currentColor"/>
                      <circle cx="19.5" cy="10" r="0.5" fill="currentColor"/>
                      
                      {/* Столешница */}
                      <rect x="2" y="5" width="20" height="1" fill="currentColor" fillOpacity="0.4"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-400 mb-3">
                    Кухни
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                    Кухонные гарнитуры на заказ
                  </p>
                  
                  <div className="flex items-center text-gray-400 font-semibold text-sm">
                    <span>Скоро</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                </Card>
              </div>

              {/* Плитка - ЗАГЛУШКА */}
              <div className="relative opacity-60">
                <Card variant="base" padding="md" className="h-full">
                  {/* Статус бейдж */}
                  <div className="absolute top-4 right-4 z-20">
                    <Badge variant="default" size="sm">
                      Скоро
                    </Badge>
                  </div>
                
                {/* Иконка категории */}
                <div className="p-8 pb-6">
                  <div className="w-20 h-20 bg-black/5 flex items-center justify-center mb-6">
                    <svg className="w-12 h-12 text-gray-400" viewBox="0 0 24 24" fill="none">
                      {/* Плиточная сетка */}
                      <rect x="2" y="2" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      <rect x="9" y="2" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      <rect x="16" y="2" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      
                      <rect x="2" y="9" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      <rect x="9" y="9" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      <rect x="16" y="9" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      
                      <rect x="2" y="16" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      <rect x="9" y="16" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      <rect x="16" y="16" width="6" height="6" rx="0.5" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="0.3"/>
                      
                      {/* Швы между плитками */}
                      <line x1="8" y1="2" x2="8" y2="22" stroke="currentColor" strokeWidth="0.2" opacity="0.6"/>
                      <line x1="15" y1="2" x2="15" y2="22" stroke="currentColor" strokeWidth="0.2" opacity="0.6"/>
                      <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="0.2" opacity="0.6"/>
                      <line x1="2" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="0.2" opacity="0.6"/>
                      
                      {/* Декоративные элементы */}
                      <circle cx="5" cy="5" r="0.8" fill="currentColor" fillOpacity="0.2"/>
                      <circle cx="12" cy="5" r="0.8" fill="currentColor" fillOpacity="0.2"/>
                      <circle cx="19" cy="5" r="0.8" fill="currentColor" fillOpacity="0.2"/>
                      <circle cx="5" cy="12" r="0.8" fill="currentColor" fillOpacity="0.2"/>
                      <circle cx="12" cy="12" r="0.8" fill="currentColor" fillOpacity="0.2"/>
                      <circle cx="19" cy="12" r="0.8" fill="currentColor" fillOpacity="0.2"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-400 mb-3">
                    Плитка
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                    Керамическая плитка и мозаика
                  </p>
                  
                  <div className="flex items-center text-gray-400 font-semibold text-sm">
                    <span>Скоро</span>
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                </Card>
              </div>

            </div>
          </div>
        </section>

        {/* Hero Section */}
        <section className="py-20 px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h1 className="text-4xl font-bold text-black mb-8 leading-tight">
                Профессиональная система
                <span className="block text-black">
                  по расчету и продаже товаров
                </span>
              </h1>
              
              <div className="mb-8">
                <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed font-light">
                  Подбирайте товары • Выставляйте счет • Размещайте заказ у поставщика
                </p>
              </div>
              
              {/* Текущая категория */}
              <div className="mb-12">
                <div className="inline-flex items-center px-6 py-3 bg-black/5 border border-black/10">
                  <div className="w-2 h-2 bg-black rounded-full mr-3"></div>
                  <span className="text-sm font-medium text-black">{currentBg.title}</span>
                  <span className="mx-3 text-black">•</span>
                  <span className="text-gray-600 text-sm">{currentBg.description}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/doors"
                  className="px-8 py-4 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200 font-semibold text-lg"
                >
                  Начать работу
                </Link>
                <Link
                  href="/nocode-builder"
                  className="px-8 py-4 bg-transparent border border-black text-black hover:bg-black hover:text-white transition-all duration-200 font-semibold text-lg"
                >
                  No-Code редактор
                </Link>
                <Link
                  href="/catalog"
                  className="px-8 py-4 bg-transparent border border-black text-black hover:bg-black hover:text-white transition-all duration-200 font-semibold text-lg"
                >
                  Каталог товаров
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div>
                <h3 className="text-lg font-bold">Domeo Configurators</h3>
                <p className="text-gray-400 text-sm">Профессиональные конфигураторы товаров</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Domeo Configurators. Все права защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
