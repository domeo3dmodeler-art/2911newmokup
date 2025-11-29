'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/layout/AdminLayout';
import { clientLogger } from '@/lib/logging/client-logger';

type FieldMapping = {
  key: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'url';
  required: boolean;
  unit?: string;
  options?: string[];
};

type Category = { 
  id: string; 
  name: string; 
  slug: string;
  description?: string; 
  parentId?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  
  // NoCode конфигурация
  configuratorConfig: any;
  pageTemplate?: string;
  customLayout?: any;
  
  // Свойства товаров
  properties: FieldMapping[];
  importMapping: Record<string, string>;
  
  // Статистика
  productsCount: number;
  subcategoriesCount: number;
  
  // Связи
  subcategories?: Category[];
  parent?: {
    id: string;
    name: string;
    slug: string;
  };
  
  // Метаданные
  createdAt: string;
  updatedAt: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
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
      
      const response = await fetch('/api/admin/categories', {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        clientLogger.error('Error fetching categories', { status: response.status });
        setCategories([]);
        return;
      }
      
      const data = await response.json();
      // apiSuccess возвращает { success: true, data: { categories: ... } }
      const responseData = data && typeof data === 'object' && 'data' in data
        ? (data as { data: { categories?: Category[] } }).data
        : null;
      const categories = responseData && 'categories' in responseData && Array.isArray(responseData.categories)
        ? responseData.categories
        : (data.categories || []);
      
      if (data.success) {
        setCategories(categories);
      } else {
        clientLogger.error('Error fetching categories', { error: data.error });
        setCategories([]);
      }
    } catch (error) {
      clientLogger.error('Error fetching categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить категорию "${categoryName}"? Это действие нельзя отменить.`)) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert('Ошибка при удалении категории: ' + (errorData.error || 'Неизвестная ошибка'));
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Обновляем список категорий
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        alert('Категория успешно удалена');
      } else {
        alert('Ошибка при удалении категории: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      clientLogger.error('Error deleting category:', error);
      alert('Ошибка при удалении категории');
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Загрузка категорий...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Категории конфигуратора" subtitle="Управление категориями для пользовательского интерфейса">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Заголовок */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-600">Управление категориями для пользователей</p>
            </div>
            <Link
              href="/admin/categories/builder"
              className="px-6 py-3 bg-black text-white rounded-none hover:bg-yellow-400 hover:text-black transition-all duration-200 font-medium"
            >
              + Создать категорию
            </Link>
          </div>

          {/* Поиск и статистика */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск категорий..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {categories.length} категорий конфигуратора
            </div>
          </div>

          {/* Список категорий */}
          <div className="space-y-6">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Категории конфигуратора не созданы</h3>
                <p className="text-gray-600 mb-6">Создайте первую категорию для начала работы</p>
                <Link
                  href="/admin/categories/builder"
                  className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-yellow-400 hover:text-black transition-all duration-200 font-medium"
                >
                  + Создать первую категорию
                </Link>
              </div>
            ) : (
              categories.map(category => (
              <div key={category.id} className="bg-white rounded-xl shadow-md border border-gray-200">
                {/* Основная категория */}
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-gray-100 p-3 rounded-lg mr-4">
                      <span className="text-3xl">📦</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                        <span className="text-sm text-gray-500">({category.slug})</span>
                        {!category.isActive && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            Неактивна
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{category.description || 'Без описания'}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                        <span>Товаров: {category.productsCount}</span>
                        <span>Подкатегорий: {category.subcategoriesCount}</span>
                        <span>Уровень: {category.level}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/admin/categories/${category.id}/configurator`}
                        className="px-3 py-2 bg-black text-white text-sm rounded-none hover:bg-yellow-400 hover:text-black text-center transition-all duration-200 font-medium"
                        title="Настроить конфигуратор"
                      >
                        🎨 Конфигуратор
                      </Link>
                      <Link
                        href={`/admin/categories/builder?id=${category.id}`}
                        className="px-3 py-2 bg-transparent border border-black text-black text-sm rounded-none hover:bg-black hover:text-white text-center transition-all duration-200 font-medium"
                      >
                        Редактировать
                      </Link>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="px-3 py-2 bg-red-600 text-white text-sm rounded-none hover:bg-red-700 text-center transition-all duration-200 font-medium"
                        title="Удалить категорию"
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>

                  {/* NoCode конфигурация */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-blue-900">NoCode конфигурация</h4>
                      <div className="flex items-center space-x-2">
                        {category.pageTemplate && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Шаблон: {category.pageTemplate}
                          </span>
                        )}
                        {category.customLayout && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Кастомный лейаут
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-blue-700">
                      {Object.keys(category.configuratorConfig).length > 0 
                        ? `Настроено: ${Object.keys(category.configuratorConfig).join(', ')}`
                        : 'Конфигуратор не настроен'
                      }
                    </div>
                  </div>

                  {/* Свойства товаров */}
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Свойства товаров:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.properties.slice(0, 4).map((prop) => (
                        <span 
                          key={prop.key}
                          className={`px-2 py-1 text-xs rounded-full ${
                            prop.required 
                              ? 'bg-gray-200 text-gray-800 border border-gray-300' 
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {prop.name}
                          {prop.required && ' *'}
                        </span>
                      ))}
                      {category.properties.length > 4 && (
                        <span className="px-2 py-1 text-xs bg-gray-200 text-gray-800 rounded-full border border-gray-300">
                          +{category.properties.length - 4} еще
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Подкатегории */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Подкатегории</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.subcategories.map(subcategory => (
                        <div key={subcategory.id} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center mb-3">
                            <div className="bg-gray-100 p-2 rounded-lg mr-3">
                              <span className="text-xl">📦</span>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900">{subcategory.name}</h5>
                              <p className="text-xs text-gray-500">{subcategory.description}</p>
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-xs text-gray-600 mb-1">Свойства:</p>
                            <div className="flex flex-wrap gap-1">
                              {subcategory.properties.slice(0, 3).map((prop) => (
                                <span 
                                  key={prop.key}
                                  className={`px-1 py-0.5 text-xs rounded ${
                                    prop.required 
                                      ? 'bg-gray-200 text-gray-800' 
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {prop.name}
                                  {prop.required && ' *'}
                                </span>
                              ))}
                              {subcategory.properties.length > 3 && (
                                <span className="px-1 py-0.5 text-xs bg-gray-200 text-gray-800 rounded">
                                  +{subcategory.properties.length - 3}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <button className="flex-1 px-2 py-1 bg-transparent border border-black text-black text-xs rounded-none hover:bg-black hover:text-white text-center transition-all duration-200 font-medium">
                              Редактировать
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(subcategory.id, subcategory.name)}
                              className="flex-1 px-2 py-1 bg-red-600 text-white text-xs rounded-none hover:bg-red-700 text-center transition-all duration-200 font-medium"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              ))
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
}