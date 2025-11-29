'use client';

import React from 'react';
import { BaseElement } from '../types';

interface InputProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function Input({ element, onUpdate }: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      props: {
        ...element.props,
        value: e.target.value
      }
    });
  };

  const {
    placeholder = 'Введите значение',
    type = 'text',
    value = '',
    label = '',
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
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={handleChange}
        className={`
          w-full border border-gray-300 rounded-md shadow-sm
          focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
          ${sizeClasses[size as keyof typeof sizeClasses]}
        `}
      />
      {required && !value && (
        <p className="mt-1 text-sm text-red-600">Это поле обязательно для заполнения</p>
      )}
    </div>
  );
}

