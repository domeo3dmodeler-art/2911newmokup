'use client';

import React from 'react';
import { BaseElement } from '../types';

interface SelectProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function Select({ element, onUpdate }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({
      props: {
        ...element.props,
        value: e.target.value
      }
    });
  };

  const {
    label = '',
    value = '',
    options = [
      { value: 'option1', label: 'Опция 1' },
      { value: 'option2', label: 'Опция 2' },
      { value: 'option3', label: 'Опция 3' }
    ],
    placeholder = 'Выберите опцию',
    required = false,
    disabled = false,
    size = 'medium'
  } = element.props;

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-base',
    large: 'px-4 py-3 text-lg'
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value}
        disabled={disabled}
        onChange={handleChange}
        className={`
          w-full border border-gray-300 rounded-md shadow-sm bg-white
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${sizeClasses[size as keyof typeof sizeClasses]}
        `}
      >
        <option value="">{placeholder}</option>
        {options.map((option: any, index: number) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {required && !value && (
        <p className="mt-1 text-sm text-red-600">Это поле обязательно для заполнения</p>
      )}
    </div>
  );
}

