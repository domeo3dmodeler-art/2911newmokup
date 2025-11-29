'use client';

import React from 'react';
import { BaseElement } from '../types';

interface RadioProps {
  element: BaseElement;
  onUpdate: (updates: Partial<BaseElement>) => void;
}

export function Radio({ element, onUpdate }: RadioProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      props: {
        ...element.props,
        value: e.target.value
      }
    });
  };

  const {
    name = 'radio-group',
    value = '',
    options = [
      { value: 'option1', label: 'Опция 1' },
      { value: 'option2', label: 'Опция 2' },
      { value: 'option3', label: 'Опция 3' }
    ],
    label = '',
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
    <div className="w-full">
      {label && (
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </legend>
          <div className="space-y-2">
            {options.map((option: any, index: number) => (
              <div key={index} className="flex items-center">
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  disabled={disabled}
                  onChange={handleChange}
                  className={`
                    ${sizeClasses[size as keyof typeof sizeClasses]}
                    border-gray-300 text-blue-600 shadow-sm
                    focus:ring-2 focus:ring-blue-500 focus:ring-offset-0
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                  `}
                />
                <label className={`ml-2 ${textSizeClasses[size as keyof typeof textSizeClasses]} text-gray-700`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}

