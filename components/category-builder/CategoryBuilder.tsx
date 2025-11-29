'use client';

import React, { useState } from 'react';
import { Card, Button } from '../ui';
import Constructor from '../constructor/Constructor';
import { clientLogger } from '@/lib/logging/client-logger';

interface CategoryBuilderProps {
  categoryData: {
    id: string;
    [key: string]: unknown;
  } | null;
  onComplete: () => void;
}

export default function CategoryBuilder({ 
  categoryData, 
  onComplete 
}: CategoryBuilderProps) {
  const [showConstructor, setShowConstructor] = useState(false);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/categories/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: categoryData?.id,
          template: { name: 'Advanced Template', components: [] }
        }),
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      clientLogger.error('Error saving template:', error);
    }
  };

      if (showConstructor) {
        return (
          <div className="h-screen">
            <Constructor />
          </div>
        );
      }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Конструктор категории</h2>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setShowConstructor(true)} 
            variant="primary"
          >
            Открыть конструктор
          </Button>
          <Button onClick={handleSave} variant="secondary">
            Сохранить
          </Button>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-lg border-2 border-dashed border-blue-300">
        <div className="text-center">
          <div className="text-6xl mb-6">🎨</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            Профессиональный No-Code конструктор
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Создавайте уникальные конфигураторы товаров с помощью drag & drop интерфейса. 
            Без программирования, с профессиональными результатами.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🛍️</div>
              <div className="text-sm font-medium">Сетка товаров</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🔍</div>
              <div className="text-sm font-medium">Фильтры</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🛒</div>
              <div className="text-sm font-medium">Корзина</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">💰</div>
              <div className="text-sm font-medium">Калькулятор</div>
            </div>
          </div>

          <Button 
            onClick={() => setShowConstructor(true)} 
            variant="primary"
            size="lg"
            className="text-lg px-8 py-3"
          >
            🚀 Запустить конструктор
          </Button>
        </div>
      </div>
    </Card>
  );
}