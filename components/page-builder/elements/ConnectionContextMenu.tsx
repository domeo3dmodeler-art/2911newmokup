'use client';

import React from 'react';
import { BlockConnection } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';

interface ConnectionContextMenuProps {
  selectedElementIds: string[];
  onCreateConnection: (sourceElementId: string, targetElementId: string, connectionType: BlockConnection['connectionType']) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

export function ConnectionContextMenu({ 
  selectedElementIds, 
  onCreateConnection, 
  onClose, 
  position 
}: ConnectionContextMenuProps) {
  clientLogger.debug('🔗 ConnectionContextMenu: Рендер', {
    selectedElementIds,
    selectedElementIdsLength: selectedElementIds.length,
    position,
    hasOnCreateConnection: !!onCreateConnection
  });
  
  if (selectedElementIds.length < 2) {
    clientLogger.debug('🔗 ConnectionContextMenu: Недостаточно элементов для создания связи');
    return null;
  }

  const connectionTypes = [
    {
      type: 'filter' as const,
      label: 'Фильтры',
      icon: '🔍',
      color: 'bg-orange-100 text-orange-700 border-orange-200'
    },
    {
      type: 'data' as const,
      label: 'Данные',
      icon: '📊',
      color: 'bg-green-100 text-green-700 border-green-200'
    },
    {
      type: 'cart' as const,
      label: 'Корзина',
      icon: '🛒',
      color: 'bg-purple-100 text-purple-700 border-purple-200'
    },
    {
      type: 'navigate' as const,
      label: 'Навигация',
      icon: '🧭',
      color: 'bg-blue-100 text-blue-700 border-blue-200'
    }
  ];

  const handleCreateConnection = (connectionType: BlockConnection['connectionType'], direction: 'forward' | 'backward') => {
    // Определяем источник и назначение в зависимости от направления
    const sourceElementId = direction === 'forward' ? selectedElementIds[0] : selectedElementIds[1];
    const targetElementId = direction === 'forward' ? selectedElementIds[1] : selectedElementIds[0];
    
    clientLogger.debug('🔗 ConnectionContextMenu: handleCreateConnection вызван', {
      connectionType,
      direction,
      sourceElementId,
      targetElementId,
      selectedElementIds
    });
    
    onCreateConnection(sourceElementId, targetElementId, connectionType);
    onClose();
  };

  // Вычисляем позицию с учетом границ экрана
  const getMenuPosition = () => {
    const menuWidth = 220; // Ширина меню (уменьшена)
    const menuHeight = 120; // Примерная высота меню (уменьшена)
    const padding = 10; // Отступ от края экрана
    
    let x = position.x;
    let y = position.y;
    
    // Проверяем правую границу
    if (x + menuWidth / 2 > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    
    // Проверяем левую границу
    if (x - menuWidth / 2 < padding) {
      x = menuWidth / 2 + padding;
    }
    
    // Проверяем нижнюю границу
    if (y + menuHeight / 2 > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    
    // Проверяем верхнюю границу
    if (y - menuHeight / 2 < padding) {
      y = menuHeight / 2 + padding;
    }
    
    return { x, y };
  };

  const menuPosition = getMenuPosition();

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-25"
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-56"
        style={{
          left: `${menuPosition.x}px`,
          top: `${menuPosition.y}px`,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-sm">Создать связь</h3>
        </div>

        {/* Connection Types - Выпадающий список */}
        <div className="mb-3">
          <select
            onChange={(e) => {
              if (e.target.value) {
                const [type, direction] = e.target.value.split('_');
                handleCreateConnection(type as BlockConnection['connectionType'], direction as 'forward' | 'backward');
              }
            }}
            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
            defaultValue=""
          >
            <option value="">Выберите тип связи</option>
            {connectionTypes.map((connection) => (
              <React.Fragment key={connection.type}>
                <option value={`${connection.type}_forward`}>
                  {connection.icon} {connection.label} → (от первого ко второму)
                </option>
                <option value={`${connection.type}_backward`}>
                  {connection.icon} {connection.label} ← (от второго к первому)
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </>
  );
}
