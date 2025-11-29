'use client';

import React, { useState } from 'react';
import { Card, Button } from '../ui';

interface Module {
  id: string;
  type: string;
  title: string;
  description: string;
  config: any;
}

interface SimpleConstructorProps {
  onComplete: (modules: Module[]) => void;
  onCancel: () => void;
}

const AVAILABLE_MODULES = [
  {
    type: 'product-selector',
    title: 'Выбор товара',
    description: 'Модуль для выбора товара из каталога',
    icon: '🛍️'
  },
  {
    type: 'property-selector',
    title: 'Выбор свойств',
    description: 'Модуль для выбора свойств товара',
    icon: '⚙️'
  },
  {
    type: 'price-calculator',
    title: 'Калькулятор цены',
    description: 'Модуль для расчета цены',
    icon: '💰'
  },
  {
    type: 'cart',
    title: 'Корзина',
    description: 'Модуль корзины товаров',
    icon: '🛒'
  },
  {
    type: 'product-gallery',
    title: 'Галерея товаров',
    description: 'Модуль отображения товаров',
    icon: '🖼️'
  }
];

export default function SimpleConstructor({ onComplete, onCancel }: SimpleConstructorProps) {
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [draggedModule, setDraggedModule] = useState<string | null>(null);

  const handleAddModule = (moduleType: string) => {
    const moduleTemplate = AVAILABLE_MODULES.find(m => m.type === moduleType);
    if (!moduleTemplate) return;

    const newModule: Module = {
      id: `${moduleType}-${Date.now()}`,
      type: moduleType,
      title: moduleTemplate.title,
      description: moduleTemplate.description,
      config: {}
    };

    setSelectedModules(prev => [...prev, newModule]);
  };

  const handleRemoveModule = (moduleId: string) => {
    setSelectedModules(prev => prev.filter(m => m.id !== moduleId));
  };

  const handleMoveModule = (fromIndex: number, toIndex: number) => {
    const newModules = [...selectedModules];
    const [movedModule] = newModules.splice(fromIndex, 1);
    newModules.splice(toIndex, 0, movedModule);
    setSelectedModules(newModules);
  };

  const handleComplete = () => {
    if (selectedModules.length === 0) {
      alert('Добавьте хотя бы один модуль');
      return;
    }
    onComplete(selectedModules);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-black">Конструктор интерфейса</h2>
        <p className="text-gray-600">Добавьте модули для создания конфигуратора</p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Панель модулей */}
        <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-medium text-black mb-4">Доступные модули</h3>
          <div className="space-y-2">
            {AVAILABLE_MODULES.map((module) => (
              <div
                key={module.type}
                className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleAddModule(module.type)}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div>
                    <h4 className="font-medium text-black">{module.title}</h4>
                    <p className="text-sm text-gray-600">{module.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Область конструирования */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h3 className="text-lg font-medium text-black mb-4">Структура конфигуратора</h3>
          
          {selectedModules.length === 0 ? (
            <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-gray-500">Добавьте модули из панели слева</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedModules.map((module, index) => (
                <Card key={module.id} variant="base">
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">
                          {AVAILABLE_MODULES.find(m => m.type === module.type)?.icon}
                        </span>
                        <div>
                          <h4 className="font-medium text-black">{module.title}</h4>
                          <p className="text-sm text-gray-600">{module.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveModule(index, index - 1)}
                          >
                            ↑
                          </Button>
                        )}
                        {index < selectedModules.length - 1 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMoveModule(index, index + 1)}
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveModule(module.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex justify-between">
          <Button variant="secondary" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="primary" onClick={handleComplete}>
            Сохранить конфигурацию
          </Button>
        </div>
      </div>
    </div>
  );
}

