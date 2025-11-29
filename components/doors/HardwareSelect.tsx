'use client';

import React, { useState } from 'react';
import { fmtInt } from './utils';

interface HardwareOption {
  id: string;
  name: string;
  price?: number;
  showroom?: boolean;
  description?: string;
}

interface HardwareSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: HardwareOption[];
  allowEmpty?: boolean;
  disabled?: boolean;
}

export function HardwareSelect({
  label,
  value,
  onChange,
  options,
  allowEmpty = false,
  disabled = false,
}: HardwareSelectProps) {
  const [showDescription, setShowDescription] = useState<string | null>(null);
  const selectedOption = options.find(opt => opt.id === value);

  return (
    <div className="text-sm space-y-1">
      <div className={`text-gray-600 ${disabled ? 'opacity-50' : ''}`}>{label}</div>
      
      {/* Селект и цена в одной строке */}
      <div className="flex items-center gap-3">
        <select
          value={value}
          onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
          disabled={disabled}
          className={`flex-1 border border-black/20 px-3 py-2 text-black ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''}`}
        >
          {allowEmpty && <option value="">—</option>}
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name.replace('Комплект фурнитуры — ', '')}
            </option>
          ))}
        </select>
        
        {selectedOption && (
          <div className="flex items-center gap-2">
            {selectedOption.description && (
              <button
                type="button"
                onClick={() => setShowDescription(showDescription === selectedOption.id ? null : selectedOption.id)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
                title="Показать описание"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            <div className="text-sm font-medium text-gray-900 min-w-[80px] text-right">
              {selectedOption.price ? `${fmtInt(selectedOption.price)} ₽` : ''}
            </div>
          </div>
        )}
      </div>
      
      {/* Описание комплекта */}
      {showDescription && selectedOption && (
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
          <div className="font-medium mb-1">Описание комплекта:</div>
          <div>{selectedOption.description}</div>
        </div>
      )}
    </div>
  );
}

