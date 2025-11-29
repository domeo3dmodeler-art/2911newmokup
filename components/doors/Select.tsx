'use client';

import React from 'react';

interface SelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  allowEmpty?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  allowEmpty = false,
  disabled = false,
  isLoading = false,
}: SelectProps) {
  // Стабилизируем опции - показываем текущие даже если массив пустой
  const stableOptions = options.length > 0 ? options : (value ? [value] : []);
  
  return (
    <label className="text-sm space-y-1">
      <div className={`text-gray-600 ${disabled ? 'opacity-50' : ''}`}>
        {label}
        {isLoading && <span className="ml-2 text-xs text-blue-600">⏳</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        disabled={disabled || isLoading}
        className={`w-full border border-black/20 px-3 py-2 text-black ${disabled || isLoading ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
      >
        {allowEmpty && <option value="">—</option>}
        {stableOptions.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

