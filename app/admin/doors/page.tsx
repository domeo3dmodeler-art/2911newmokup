// app/admin/doors/page.tsx
// Главная страница админки Doors

"use client";

import Link from 'next/link';
import { Button, Card } from '@/components/ui';

export default function DoorsAdminPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Админка Doors</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Серии */}
        <Link href="/admin/doors/series" className="group">
          <Card variant="interactive" padding="md">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Серии</h2>
            </div>
            <p className="text-gray-600 mb-4">Управление сериями дверей, материалами и базовыми ценами</p>
            <div className="text-sm text-blue-600 group-hover:text-blue-800">Управление →</div>
          </Card>
        </Link>

        {/* Опции */}
        <Link href="/admin/doors/options" className="group">
          <Card variant="interactive" padding="md">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Опции</h2>
            </div>
            <p className="text-gray-600 mb-4">Фурнитура, размеры, отделка и другие опции</p>
            <div className="text-sm text-green-600 group-hover:text-green-800">Управление →</div>
          </Card>
        </Link>

        {/* Ограничения */}
        <Link href="/admin/doors/constraints" className="group">
          <Card variant="interactive" padding="md">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Ограничения</h2>
            </div>
            <p className="text-gray-600 mb-4">Правила совместимости опций между собой</p>
            <div className="text-sm text-yellow-600 group-hover:text-yellow-800">Управление →</div>
          </Card>
        </Link>

        {/* Шаблоны КП */}
        <Link href="/admin/doors/templates" className="group">
          <Card variant="interactive" padding="md">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Шаблоны КП</h2>
            </div>
            <p className="text-gray-600 mb-4">Настройка шаблонов и предпросмотр PDF</p>
            <div className="text-sm text-purple-600 group-hover:text-purple-800">Управление →</div>
          </Card>
        </Link>

        {/* Импорт прайса */}
        <Link href="/admin/import" className="group">
          <Card variant="interactive" padding="md">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Импорт прайса</h2>
            </div>
            <p className="text-gray-600 mb-4">Загрузка и публикация прайс-листов</p>
            <div className="text-sm text-indigo-600 group-hover:text-indigo-800">Управление →</div>
          </Card>
        </Link>

        {/* Аналитика */}
        <Link href="/analytics" className="group">
          <Card variant="interactive" padding="md">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-4">Аналитика</h2>
            </div>
            <p className="text-gray-600 mb-4">Статистика и метрики по КП</p>
            <div className="text-sm text-red-600 group-hover:text-red-800">Просмотр →</div>
          </Card>
        </Link>
      </div>

      {/* Быстрые действия */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => window.location.href = '/admin/doors/series/new'}>
            Создать серию
          </Button>
          <Button variant="success" onClick={() => window.location.href = '/admin/doors/options/new'}>
            Добавить опцию
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/admin/doors/constraints/new'}>
            Добавить ограничение
          </Button>
          <Button variant="primary" onClick={() => window.location.href = '/admin/import'}>
            Импортировать прайс
          </Button>
        </div>
      </div>
    </div>
  );
}
