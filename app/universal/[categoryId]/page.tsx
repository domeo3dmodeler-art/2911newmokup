'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { NoCodeComponentRenderer } from '../../../components/nocode/NoCodeComponents';
import { clientLogger } from '@/lib/logging/client-logger';

// ===================== Универсальный генератор страниц =====================

interface UniversalPageProps {
  params: {
    categoryId: string;
  };
  searchParams?: {
    templateId?: string;
    [key: string]: string | string[] | undefined;
  };
}

// Предустановленные шаблоны для категорий
const categoryTemplates: Record<string, any> = {
  doors: {
    id: 'doors-template',
    name: 'Конфигуратор дверей',
    layout: { type: 'grid', columns: 3, gap: 8, responsive: true },
    components: [
      {
        id: 'style-selector',
        type: 'style-selector',
        position: { row: 1, col: 1, span: 1 },
        config: {
          title: 'Полотно',
          options: ['Скрытая', 'Современная', 'Неоклассика', 'Классика']
        },
        title: 'Выбор стиля',
        visible: true
      },
      {
        id: 'model-selector',
        type: 'model-selector',
        position: { row: 2, col: 1, span: 1 },
        config: {
          title: 'Модели',
          models: [
            { id: 'pg-base-1', name: 'PG Base 1', description: 'Современная дверь' },
            { id: 'po-base-1-1', name: 'PO Base 1/1', description: 'Классическая дверь' },
            { id: 'neo-1', name: 'Neo-1', description: 'Неоклассическая дверь' }
          ]
        },
        title: 'Выбор модели',
        visible: true
      },
      {
        id: 'parameters-form',
        type: 'parameters-form',
        position: { row: 3, col: 1, span: 1 },
        config: {
          fields: [
            { key: 'finish', label: 'Покрытие', type: 'select', options: ['Ламинат', 'ПВХ', 'Шпон'] },
            { key: 'color', label: 'Цвет', type: 'select', options: ['Белый', 'Дуб', 'Орех'] },
            { key: 'width', label: 'Ширина', type: 'number', min: 600, max: 1000 },
            { key: 'height', label: 'Высота', type: 'number', min: 1900, max: 2200 }
          ]
        },
        title: 'Параметры',
        visible: true
      },
      {
        id: 'preview-panel',
        type: 'preview-panel',
        position: { row: 1, col: 2, span: 2 },
        config: {
          showImage: true,
          showPrice: true,
          showSpecs: true
        },
        title: 'Предпросмотр',
        visible: true
      },
      {
        id: 'cart-panel',
        type: 'cart-panel',
        position: { row: 3, col: 2, span: 2 },
        config: {
          showTotal: true,
          allowEdit: true,
          exportOptions: ['kp', 'invoice', 'factory-csv', 'factory-xlsx']
        },
        title: 'Корзина',
        visible: true
      }
    ]
  },
};

// Главный компонент универсальной страницы
export default function UniversalPage({ params, searchParams }: UniversalPageProps) {
  const { categoryId } = params;
  const templateId = searchParams?.templateId;
  const [pageData, setPageData] = useState({});
  const [componentData, setComponentData] = useState<Record<string, any>>({});

  // Получаем шаблон для категории
  const template = categoryTemplates[categoryId];

  useEffect(() => {
    if (!template) {
      clientLogger.warn(`Шаблон для категории "${categoryId}" не найден`);
      return;
    }
    
    // Инициализируем данные компонентов
    const initialData: Record<string, any> = {};
    template.components.forEach((component: any) => {
      initialData[component.id] = {};
    });
    setComponentData(initialData);
  }, [categoryId, template]);

  const handleComponentUpdate = (id: string, data: any) => {
    setComponentData(prev => ({ ...prev, [id]: data }));
  };

  if (!template) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Категория не найдена</h1>
          <p className="text-gray-600 mb-6">Шаблон для категории "{categoryId}" не найден</p>
          <Link 
            href="/nocode-builder" 
            className="px-4 py-2 bg-black text-white hover:bg-yellow-400 hover:text-black transition-all duration-200"
          >
            Создать шаблон
          </Link>
        </div>
      </div>
    );
  }

  const layout = template.layout || { type: 'grid', columns: 3, gap: 8, responsive: true };
  const components = template.components || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Link href="/" className="text-2xl font-bold text-black">
                Domeo
              </Link>
              <span className="text-black text-lg font-bold">•</span>
              <span className="text-lg font-semibold text-black capitalize">{categoryId}</span>
            </div>
            <div className="flex space-x-2">
              <Link 
                href="/nocode-builder"
                className="px-4 py-2 border border-black text-black hover:bg-black hover:text-white transition-all duration-200 text-sm font-medium"
              >
                Редактировать
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">{template.name}</h1>
          <p className="text-gray-600">Конфигуратор товаров категории {categoryId}</p>
        </div>

        {/* Dynamic Page Content */}
        <div 
          className="space-y-6"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
            gap: `${layout.gap * 0.25}rem`
          }}
        >
          {components
            .filter((component: any) => component.visible)
            .map((component: any) => (
              <div
                key={component.id}
                className="bg-white border border-black/10"
                style={{
                  gridColumn: `span ${component.position.span || 1}`,
                  gridRow: component.position.row
                }}
              >
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-black mb-4">
                    {component.title || component.type}
                  </h2>
                  
                  <NoCodeComponentRenderer
                    type={component.type}
                    id={component.id}
                    config={component.config}
                    data={componentData[component.id]}
                    onUpdate={handleComponentUpdate}
                  />
                </div>
              </div>
            ))}
        </div>
      </main>
    </div>
  );
}