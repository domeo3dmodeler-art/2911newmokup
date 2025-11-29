'use client';

import React, { useState } from 'react';
import { BlockConnection, ConnectionType } from '../types';

interface ConnectionEditorProps {
  connection: BlockConnection;
  elements: Array<{ id: string; type: string }>;
  onUpdate: (connectionId: string, updates: Partial<BlockConnection>) => void;
  onDelete: (connectionId: string) => void;
  onClose: () => void;
}

const connectionTypes: { value: ConnectionType; label: string; description: string; icon: string }[] = [
  { value: 'data', label: 'Передача данных', description: 'Передача выбранных товаров или свойств', icon: '📊' },
  { value: 'filter', label: 'Синхронизация фильтров', description: 'Синхронизация фильтров между блоками', icon: '🔍' },
  { value: 'cart', label: 'Корзина', description: 'Добавление товаров в корзину', icon: '🛒' },
  { value: 'navigate', label: 'Навигация', description: 'Переход между страницами или секциями', icon: '🧭' }
];

export function ConnectionEditor({ connection, elements, onUpdate, onDelete, onClose }: ConnectionEditorProps) {
  const [formData, setFormData] = useState<Partial<BlockConnection>>({
    sourceElementId: connection.sourceElementId,
    targetElementId: connection.targetElementId,
    connectionType: connection.connectionType,
    sourceProperty: connection.sourceProperty || '',
    targetProperty: connection.targetProperty || '',
    description: connection.description || '',
    isActive: connection.isActive
  });

  const handleSave = () => {
    onUpdate(connection.id, formData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(connection.id);
    onClose();
  };

  const getElementName = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    return element ? `${element.type} (${elementId.slice(0, 8)})` : 'Неизвестный элемент';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Настройка связи
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Форма */}
        <div className="p-4 space-y-4">
          {/* Источник */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Источник (откуда)
            </label>
            <select
              value={formData.sourceElementId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, sourceElementId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите источник</option>
              {elements.map(element => (
                <option key={element.id} value={element.id}>
                  {element.type} ({element.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>

          {/* Назначение */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Назначение (куда)
            </label>
            <select
              value={formData.targetElementId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, targetElementId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите назначение</option>
              {elements.filter(el => el.id !== formData.sourceElementId).map(element => (
                <option key={element.id} value={element.id}>
                  {element.type} ({element.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>

          {/* Тип связи */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип связи
            </label>
            <select
              value={formData.connectionType || 'data'}
              onChange={(e) => setFormData(prev => ({ ...prev, connectionType: e.target.value as ConnectionType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {connectionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              {connectionTypes.find(t => t.value === formData.connectionType)?.description}
            </div>
          </div>

          {/* Свойство источника */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Свойство источника
            </label>
            <input
              type="text"
              value={formData.sourceProperty || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, sourceProperty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="selectedValue, filters, etc."
            />
          </div>

          {/* Свойство назначения */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Свойство назначения
            </label>
            <input
              type="text"
              value={formData.targetProperty || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, targetProperty: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="filters, data, etc."
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание (необязательно)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Описание связи..."
            />
          </div>

          {/* Активность */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive || false}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="mr-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700">
              Связь активна
            </label>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Удалить связь
          </button>
          <div className="space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

