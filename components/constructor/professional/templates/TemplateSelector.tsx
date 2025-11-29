'use client';

import React, { useState } from 'react';
import { Plus, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { PageTemplate } from './PageTemplates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: PageTemplate) => void;
  onStartBlank: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onStartBlank
}) => {
  const [showTemplates, setShowTemplates] = useState(false);

  const quickTemplates: PageTemplate[] = [
    {
      id: 'door-landing',
      name: 'Лендинг дверей',
      description: 'Современный лендинг с конфигуратором',
      category: 'landing',
      preview: '/templates/door-landing.jpg',
      tags: ['двери', 'конфигуратор'],
      featured: true,
      popular: true,
      difficulty: 'beginner',
      estimatedTime: '15 минут',
      industry: ['строительство'],
      elements: []
    },
    {
      id: 'door-catalog',
      name: 'Каталог дверей',
      description: 'Каталог с фильтрами и поиском',
      category: 'catalog',
      preview: '/templates/door-catalog.jpg',
      tags: ['каталог', 'фильтры'],
      featured: false,
      popular: true,
      difficulty: 'beginner',
      estimatedTime: '10 минут',
      industry: ['строительство'],
      elements: []
    },
    {
      id: 'door-configurator-page',
      name: 'Конфигуратор дверей',
      description: 'Пошаговый конфигуратор',
      category: 'configurator',
      preview: '/templates/door-configurator.jpg',
      tags: ['конфигуратор', 'пошаговый'],
      featured: true,
      popular: false,
      difficulty: 'intermediate',
      estimatedTime: '20 минут',
      industry: ['строительство'],
      elements: []
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Создайте свою страницу
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Выберите готовый шаблон или начните с чистого листа. 
            Наш конструктор поможет создать профессиональную страницу за считанные минуты.
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Templates */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Быстрые шаблоны</h2>
                <p className="text-gray-600">Популярные готовые решения</p>
              </div>
            </div>

            <div className="space-y-4">
              {quickTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => onSelectTemplate(template)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </h3>
                        {template.featured && (
                          <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Рекомендуемый
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>⏱️ {template.estimatedTime}</span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-1 rounded-full ${
                          template.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                          template.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {template.difficulty === 'beginner' ? 'Начинающий' :
                           template.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowTemplates(true)}
              className="w-full mt-6 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <FileText className="w-5 h-5 mr-2" />
              Показать все шаблоны
            </button>
          </div>

          {/* Start Blank */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Начать с нуля</h2>
                <p className="text-gray-600">Создать уникальный дизайн</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Полная свобода творчества</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Добавляйте любые компоненты
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Настраивайте стили и цвета
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Создавайте уникальные макеты
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Интегрируйте товарные компоненты
                  </li>
                </ul>
              </div>

              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Рекомендуется для:</h3>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Опытных пользователей</li>
                  <li>• Уникальных проектов</li>
                  <li>• Специфических требований</li>
                </ul>
              </div>

              <button
                onClick={onStartBlank}
                className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Начать с чистого листа
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Быстро</h3>
            <p className="text-gray-600">Создайте страницу за 10-15 минут с готовыми шаблонами</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Профессионально</h3>
            <p className="text-gray-600">Готовые решения от дизайнеров с лучшими практиками</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Гибко</h3>
            <p className="text-gray-600">Полная кастомизация под ваши потребности</p>
          </div>
        </div>
      </div>
    </div>
  );
};

