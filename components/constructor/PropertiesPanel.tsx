'use client';

import React, { useState } from 'react';
import { useConstructor } from './ConstructorContext';
import AnimationSystem from './AnimationSystem';
import { Button } from '../ui';
import { 
  Type, 
  Palette, 
  Layout, 
  Smartphone, 
  Tablet, 
  Monitor,
  Copy,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function PropertiesPanel() {
  const { selectedElement, updateElement, deleteElement, duplicateElement } = useConstructor();
  const [activeTab, setActiveTab] = useState<'properties' | 'animations'>('properties');

  if (!selectedElement) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4">
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-lg font-medium mb-2">Свойства элемента</h3>
            <p className="text-sm">
              Выберите элемент на канвасе для редактирования его свойств
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleApplyAnimation = (elementId: string, animation: any) => {
    updateElement(elementId, {
      animations: [animation]
    });
  };

  const handlePropChange = (key: string, value: any) => {
    updateElement(selectedElement.id, { 
      props: { ...selectedElement.props, [key]: value } 
    });
  };

  const handleStyleChange = (key: string, value: any) => {
    updateElement(selectedElement.id, { 
      styles: { ...selectedElement.styles, [key]: value } 
    });
  };

  const handleSizeChange = (key: 'width' | 'height', value: string) => {
    updateElement(selectedElement.id, { 
      size: { ...selectedElement.size, [key]: value } 
    });
  };

  const handlePositionChange = (key: 'x' | 'y', value: number) => {
    updateElement(selectedElement.id, { 
      position: { ...selectedElement.position, [key]: value } 
    });
  };

  const handleDelete = () => {
    if (confirm('Удалить элемент?')) {
      deleteElement(selectedElement.id);
    }
  };

  const handleDuplicate = () => {
    duplicateElement(selectedElement.id);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Свойства</h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDuplicate}
              title="Дублировать"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700"
              title="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Табы */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'properties' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Свойства
          </button>
          <button
            onClick={() => setActiveTab('animations')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'animations' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Анимации
          </button>
        </div>

        {/* Контент вкладок */}
        {activeTab === 'properties' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип элемента
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {selectedElement.type}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Компонент
              </label>
              <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                {selectedElement.component}
              </div>
            </div>

            {/* Позиция и размер */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  X (px)
                </label>
                <input
                  type="number"
                  value={selectedElement.position.x}
                  onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Y (px)
                </label>
                <input
                  type="number"
                  value={selectedElement.position.y}
                  onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ширина
                </label>
                <input
                  type="text"
                  value={selectedElement.size.width}
                  onChange={(e) => handleSizeChange('width', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="100%"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Высота
                </label>
                <input
                  type="text"
                  value={selectedElement.size.height}
                  onChange={(e) => handleSizeChange('height', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  placeholder="auto"
                />
              </div>
            </div>

            {/* Специфичные свойства по типу элемента */}
            <div className="mt-6">
              {selectedElement.type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Текст
                    </label>
                    <textarea
                      value={selectedElement.props.content || ''}
                      onChange={(e) => handlePropChange('content', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Размер шрифта
                    </label>
                    <input
                      type="text"
                      value={selectedElement.props.fontSize || '16px'}
                      onChange={(e) => handlePropChange('fontSize', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="16px"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цвет
                    </label>
                    <input
                      type="color"
                      value={selectedElement.props.color || '#333333'}
                      onChange={(e) => handlePropChange('color', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-1 py-1"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL изображения
                    </label>
                    <input
                      type="text"
                      value={selectedElement.props.src || ''}
                      onChange={(e) => handlePropChange('src', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="/image.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alt текст
                    </label>
                    <input
                      type="text"
                      value={selectedElement.props.alt || ''}
                      onChange={(e) => handlePropChange('alt', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="Описание изображения"
                    />
                  </div>
                </div>
              )}

              {selectedElement.type === 'productGrid' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID категории
                    </label>
                    <input
                      type="text"
                      value={selectedElement.props.categoryId || ''}
                      onChange={(e) => handlePropChange('categoryId', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                      placeholder="category-id"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Колонки
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={selectedElement.props.columns || 3}
                      onChange={(e) => handlePropChange('columns', parseInt(e.target.value) || 3)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedElement.props.showPrices || false}
                        onChange={(e) => handlePropChange('showPrices', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Показывать цены</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedElement.props.showImages || false}
                        onChange={(e) => handlePropChange('showImages', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Показывать изображения</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Responsive настройки */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Smartphone className="h-4 w-4 mr-2" />
                Адаптивность
              </h4>
              
              <div className="space-y-3">
                {['desktop', 'tablet', 'mobile'].map(device => (
                  <div key={device} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center mb-2">
                      {device === 'desktop' && <Monitor className="h-4 w-4 mr-2" />}
                      {device === 'tablet' && <Tablet className="h-4 w-4 mr-2" />}
                      {device === 'mobile' && <Smartphone className="h-4 w-4 mr-2" />}
                      <span className="text-sm font-medium capitalize">{device}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Ширина</label>
                        <input
                          type="text"
                          value={selectedElement.responsive[device as keyof typeof selectedElement.responsive]?.width || ''}
                          onChange={(e) => {
                            const newResponsive = { ...selectedElement.responsive };
                            if (!newResponsive[device as keyof typeof newResponsive]) {
                              newResponsive[device as keyof typeof newResponsive] = {};
                            }
                            newResponsive[device as keyof typeof newResponsive]!.width = e.target.value;
                            updateElement(selectedElement.id, { responsive: newResponsive });
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                          placeholder="100%"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Высота</label>
                        <input
                          type="text"
                          value={selectedElement.responsive[device as keyof typeof selectedElement.responsive]?.height || ''}
                          onChange={(e) => {
                            const newResponsive = { ...selectedElement.responsive };
                            if (!newResponsive[device as keyof typeof newResponsive]) {
                              newResponsive[device as keyof typeof newResponsive] = {};
                            }
                            newResponsive[device as keyof typeof newResponsive]!.height = e.target.value;
                            updateElement(selectedElement.id, { responsive: newResponsive });
                          }}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                          placeholder="auto"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <AnimationSystem 
            elementId={selectedElement.id}
            onApplyAnimation={handleApplyAnimation}
          />
        )}
      </div>
    </div>
  );
}
