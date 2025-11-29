'use client';

import React, { useState, useEffect } from 'react';
import { PublishedPageViewer } from '../../components/page-builder/PublishedPageViewer';

export default function PreviewPage() {
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Получаем данные текущей страницы из localStorage
    const savedPage = localStorage.getItem('current-page-preview');
    if (savedPage) {
      try {
        const pageData = JSON.parse(savedPage);
        setCurrentPage(pageData);
      } catch (err) {
        setError('Ошибка загрузки данных страницы');
      }
    } else {
      setError('Нет данных для предпросмотра');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка предпросмотра...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка предпросмотра</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Нет данных для предпросмотра</h2>
          <p className="text-gray-600 mb-4">Откройте конструктор и создайте страницу</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">{currentPage.name}</h1>
              <p className="text-sm text-gray-500">Предпросмотр страницы</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => window.close()}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1">
        <PublishedPageViewer
          page={currentPage}
          viewMode="preview"
        />
      </div>
    </div>
  );
}

