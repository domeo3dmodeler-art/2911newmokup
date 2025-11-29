'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import AdminLayout from '../../../components/layout/AdminLayout';

interface Product {
  id: string;
  category: string;
  imported_at: string;
  [key: string]: any;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  category: string;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('doors');
  const limit = 20;

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const offset = currentPage * limit;
      const response = await fetch(`/api/admin/products?category=${selectedCategory}&limit=${limit}&offset=${offset}`);
      const data: ProductsResponse = await response.json();
      
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      setError('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка товаров...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="text-gray-500 text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 text-xl mb-4">{error}</p>
          <button 
            onClick={fetchProducts}
            className="px-6 py-3 bg-black text-white rounded-none hover:bg-yellow-400 hover:text-black transition-all duration-200 font-medium"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout title="Товары" subtitle="Управление товарами в каталоге">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Статистика */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Статистика</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCategoryChange('doors')}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedCategory === 'doors' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Двери
              </button>
              <button
                onClick={() => handleCategoryChange('all')}
                className={`px-3 py-1 rounded-md text-sm ${
                  selectedCategory === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Все
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Всего товаров</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">На странице</p>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Страница</p>
              <p className="text-2xl font-bold text-gray-900">{currentPage + 1} из {totalPages}</p>
            </div>
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Товары</h3>
          </div>
          
          {products.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 text-6xl mb-4">📦</div>
              <p className="text-gray-600 text-xl mb-4">Товары не найдены</p>
              <p className="text-gray-500 mb-6">
                {selectedCategory === 'all' 
                  ? 'Загрузите прайс-лист для отображения товаров'
                  : `Загрузите прайс-лист для категории "${selectedCategory}"`
                }
              </p>
              <Link
                href="/admin/categories/doors"
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-none hover:bg-yellow-400 hover:text-black transition-all duration-200 font-medium"
              >
                Загрузить прайс
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Данные товара
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Категория
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Дата импорта
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {product.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(product, null, 2)}
                            </pre>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {product.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(product.imported_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Показано {currentPage * limit + 1} - {Math.min((currentPage + 1) * limit, total)} из {total} товаров
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Назад
                      </button>
                      <span className="px-3 py-1 text-sm text-gray-700">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Вперед
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
