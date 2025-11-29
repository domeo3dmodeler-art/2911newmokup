'use client';

import React from 'react';
import { BaseElement } from '../types';

interface CheckboxProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function Checkbox({ element, onUpdate }: CheckboxProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    onUpdate({
      props: {
        ...element.props,
        checked
      }
    });
  };

  const {
    label = 'Чекбокс',
    checked = false,
    disabled = false,
    size = 'medium'
  } = element.props;

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={handleChange}
        className={`
          ${sizeClasses[size as keyof typeof sizeClasses]}
          border-gray-300 rounded shadow-sm
          focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
          disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
        `}
      />
      <label className={`ml-2 ${textSizeClasses[size as keyof typeof textSizeClasses]} text-gray-700`}>
        {label}
      </label>
    </div>
  );
}

