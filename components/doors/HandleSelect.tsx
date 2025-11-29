'use client';

import React, { useEffect, useState } from 'react';
import type { Handle } from './types';

interface HandleSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  handles: Record<string, Handle[]>;
  allowEmpty?: boolean;
  disabled?: boolean;
}

export function HandleSelect({
  label,
  value,
  onChange,
  handles,
  allowEmpty = false,
  disabled = false,
}: HandleSelectProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const selectedHandle = Object.values(handles).flat().find(h => h.id === value);

  // Устанавливаем группу "Базовый" по умолчанию при загрузке
  useEffect(() => {
    if (handles['Базовый'] && handles['Базовый'].length > 0 && !selectedGroup) {
      setSelectedGroup('Базовый');
    }
  }, [handles, selectedGroup]);

  const handleGroupSelect = (groupName: string) => {
    setSelectedGroup(groupName);
    // Сбрасываем выбор ручки при смене группы
    onChange('');
  };

  const handleHandleSelect = (handleId: string) => {
    onChange(handleId);
  };

  const resetSelection = () => {
    onChange('');
    setSelectedGroup(null);
  };

  // Получаем все ручки для выбранной группы
  const currentGroupHandles = selectedGroup ? handles[selectedGroup] || [] : [];
  const displayPrice = selectedHandle 
    ? selectedHandle.price 
    : currentGroupHandles.length > 0 
      ? currentGroupHandles[0].price 
      : 0;

  return (
    <div className="text-sm space-y-1">
      <div className={`text-gray-600 ${disabled ? 'opacity-50' : ''}`}>{label}</div>
      
      {/* Компактный выбор: группа - ручка - цена */}
      <div className="flex items-center gap-3">
        {/* Селект группы */}
        <select
          value={selectedGroup || ''}
          onChange={(e) => handleGroupSelect(e.target.value)}
          disabled={disabled}
          className={`border border-black/20 px-3 py-2 text-black ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
          style={{ minWidth: '120px' }}
        >
          <option value="">Группа</option>
          {['Базовый', 'Комфорт', 'Бизнес'].map((groupName) => (
            handles[groupName] && (
              <option key={groupName} value={groupName}>
                {groupName}
              </option>
            )
          ))}
        </select>

        {/* Селект ручки */}
        <select
          value={value}
          onChange={(e) => handleHandleSelect(e.target.value)}
          disabled={disabled || !selectedGroup}
          className={`flex-1 border border-black/20 px-3 py-2 text-black ${disabled || !selectedGroup ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        >
          <option value="">Выберите ручку</option>
          {currentGroupHandles.map((handle) => (
            <option key={handle.id} value={handle.id}>
              Ручка {handle.name} {handle.showroom ? '●' : '○'}
            </option>
          ))}
        </select>

        {/* Цена и информация */}
        <div className="flex items-center gap-2">
          {selectedHandle && (
            <button
              type="button"
              onClick={() => setShowInfo(!showInfo)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Показать информацию"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <div className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
            {displayPrice ? `${displayPrice} ₽` : '—'}
          </div>
        </div>
      </div>

      {/* Информация о ручке */}
      {showInfo && selectedHandle && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
          <div className="space-y-1">
            <div><span className="font-medium">Поставщик:</span> {selectedHandle.supplier || 'Не указан'}</div>
            <div><span className="font-medium">Наименование:</span> {selectedHandle.factoryName || 'Не указано'}</div>
            <div><span className="font-medium">Артикул:</span> {selectedHandle.article || 'Не указан'}</div>
            <div><span className="font-medium">Наличие в шоуруме:</span> {selectedHandle.showroom ? 'Да' : 'Нет'}</div>
          </div>
        </div>
      )}

      {/* Кнопка сброса выбора */}
      {selectedHandle && (
        <button
          type="button"
          onClick={resetSelection}
          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
        >
          Выбрать другую ручку
        </button>
      )}
    </div>
  );
}

