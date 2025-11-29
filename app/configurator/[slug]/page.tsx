'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ConfiguratorMain from '../../../components/configurator/ConfiguratorMain';
import { useAuth } from '../../../hooks/useAuth';
import { clientLogger } from '@/lib/logging/client-logger';

interface ConfiguratorCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  is_active: boolean;
}

export default function ConfiguratorPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  
  const [configuratorCategory, setConfiguratorCategory] = useState<ConfiguratorCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfiguratorCategory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/frontend-categories?slug=${slug}`);
      const data = await response.json();
      
      if (data.success && data.categories && data.categories.length > 0) {
        const category = data.categories[0];
        if (category.is_active) {
          setConfiguratorCategory(category);
        } else {
          setError('Конфигуратор недоступен');
        }
      } else {
        setError('Конфигуратор не найден');
      }
    } catch (error) {
      clientLogger.error('Error loading configurator category:', error);
      setError('Ошибка загрузки конфигуратора');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadConfiguratorCategory();
  }, [loadConfiguratorCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка конфигуратора...</p>
        </div>
      </div>
    );
  }

  if (error || !configuratorCategory) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔧</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Конфигуратор не найден'}
          </h1>
          <p className="text-gray-600 mb-6">
            Возможно, конфигуратор был удален или перемещен
          </p>
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </a>
        </div>
      </div>
    );
  }

  return (
    <ConfiguratorMain
      configuratorCategoryId={configuratorCategory.id}
      configuratorCategory={configuratorCategory}
      userRole={user?.role || 'guest'}
    />
  );
}
