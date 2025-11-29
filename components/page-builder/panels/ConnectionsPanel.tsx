'use client';

import React, { useState } from 'react';
import { BlockConnection, ConnectionType, BaseElement } from '../types';

interface ConnectionsPanelProps {
  elements: BaseElement[];
  connections: BlockConnection[];
  onAddConnection: (connection: Omit<BlockConnection, 'id'>) => void;
  onUpdateConnection: (connectionId: string, updates: Partial<BlockConnection>) => void;
  onDeleteConnection: (connectionId: string) => void;
}

const connectionTypes: { value: ConnectionType; label: string; description: string; icon: string }[] = [
  { value: 'data', label: 'Передача данных', description: 'Передача выбранных товаров или свойств', icon: '📊' },
  { value: 'filter', label: 'Синхронизация фильтров', description: 'Синхронизация фильтров между блоками', icon: '🔍' },
  { value: 'cart', label: 'Корзина', description: 'Добавление товаров в корзину', icon: '🛒' },
  { value: 'navigate', label: 'Навигация', description: 'Переход между страницами или секциями', icon: '🧭' }
];

export function ConnectionsPanel({ 
  elements, 
  connections, 
  onAddConnection, 
  onUpdateConnection, 
  onDeleteConnection 
}: ConnectionsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newConnection, setNewConnection] = useState({
    sourceElementId: '',
    targetElementId: '',
    connectionType: 'data' as ConnectionType,
    sourceProperty: '',
    targetProperty: '',
    description: '',
    isActive: true
  });

  const handleAddConnection = () => {
    if (newConnection.sourceElementId && newConnection.targetElementId) {
      onAddConnection(newConnection);
      setNewConnection({
        sourceElementId: '',
        targetElementId: '',
        connectionType: 'data',
        sourceProperty: '',
        targetProperty: '',
        description: '',
        isActive: true
      });
      setShowAddForm(false);
    }
  };

  const getElementName = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    return element ? `${element.type} (${element.id.slice(0, 8)})` : 'Неизвестный элемент';
  };

  const getConnectionIcon = (type: ConnectionType) => {
    return connectionTypes.find(ct => ct.value === type)?.icon || '🔗';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="mr-2">🔗</span>
          Связи между блоками
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Настройте взаимодействие между компонентами
        </p>
      </div>

      {/* Кнопка добавления связи */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <span className="mr-2">➕</span>
          Добавить связь
        </button>
      </div>

      {/* Форма добавления связи */}
      {showAddForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            {/* Источник */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Источник (откуда)
              </label>
              <select
                value={newConnection.sourceElementId}
                onChange={(e) => setNewConnection(prev => ({ ...prev, sourceElementId: e.target.value }))}
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
                value={newConnection.targetElementId}
                onChange={(e) => setNewConnection(prev => ({ ...prev, targetElementId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите назначение</option>
                {elements.filter(el => el.id !== newConnection.sourceElementId).map(element => (
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
                value={newConnection.connectionType}
                onChange={(e) => setNewConnection(prev => ({ ...prev, connectionType: e.target.value as ConnectionType }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {connectionTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {connectionTypes.find(t => t.value === newConnection.connectionType)?.description}
              </p>
            </div>

            {/* Описание */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание связи
              </label>
              <input
                type="text"
                value={newConnection.description}
                onChange={(e) => setNewConnection(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Например: Передача выбранных товаров в корзину"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Кнопки */}
            <div className="flex space-x-2">
              <button
                onClick={handleAddConnection}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
              >
                Создать
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список связей */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <div className="text-4xl mb-2">🔗</div>
            <p className="text-sm">Нет созданных связей</p>
            <p className="text-xs text-gray-400 mt-1">
              Добавьте связи для взаимодействия блоков
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {connections.map(connection => (
              <div
                key={connection.id}
                className={`p-3 border rounded-lg ${
                  connection.isActive 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <span className="text-lg mr-2">
                        {getConnectionIcon(connection.connectionType)}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {connectionTypes.find(t => t.value === connection.connectionType)?.label}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        connection.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {connection.isActive ? 'Активна' : 'Отключена'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <span className="font-medium">От:</span> {getElementName(connection.sourceElementId)}
                      </div>
                      <div>
                        <span className="font-medium">К:</span> {getElementName(connection.targetElementId)}
                      </div>
                      {connection.description && (
                        <div className="italic text-gray-500">
                          {connection.description}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-1 ml-2">
                    <button
                      onClick={() => onUpdateConnection(connection.id, { isActive: !connection.isActive })}
                      className={`px-2 py-1 rounded text-xs ${
                        connection.isActive
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {connection.isActive ? 'Отключить' : 'Включить'}
                    </button>
                    <button
                      onClick={() => onDeleteConnection(connection.id)}
                      className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Статистика */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Всего связей:</span>
          <span className="font-medium">{connections.length}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Активных:</span>
          <span className="font-medium text-green-600">
            {connections.filter(c => c.isActive).length}
          </span>
        </div>
      </div>
    </div>
  );
}
