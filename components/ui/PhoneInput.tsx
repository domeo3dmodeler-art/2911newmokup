// components/ui/PhoneInput.tsx
// Компонент для ввода телефонного номера с валидацией и маской

'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';
import { 
  isValidInternationalPhone, 
  applyPhoneMask, 
  normalizePhoneForStorage,
  formatInternationalPhone,
  getCountryCode,
  isRussianPhone
} from '@/lib/utils/phone';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function PhoneInput({
  value,
  onChange,
  onBlur,
  placeholder = '+7 (___) ___-__-__',
  label,
  required = false,
  disabled = false,
  className,
  error
}: PhoneInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Инициализация значения
  useEffect(() => {
    if (value) {
      setDisplayValue(formatInternationalPhone(value));
      setIsValid(isValidInternationalPhone(value));
    } else {
      setDisplayValue('');
      setIsValid(true);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Применяем маску
    const maskedValue = applyPhoneMask(inputValue);
    setDisplayValue(maskedValue);
    
    // Нормализуем для хранения
    const normalizedValue = normalizePhoneForStorage(inputValue);
    
    // Проверяем валидность
    const valid = !normalizedValue || isValidInternationalPhone(normalizedValue);
    setIsValid(valid);
    
    // Передаем нормализованное значение
    onChange(normalizedValue);
  };

  const handleBlur = () => {
    // При потере фокуса форматируем финальное значение
    if (value) {
      const formatted = formatInternationalPhone(value);
      setDisplayValue(formatted);
    }
    
    if (onBlur) {
      onBlur();
    }
  };

  const getCountryFlag = () => {
    const countryCode = getCountryCode(value);
    const flags: Record<string, string> = {
      'RU': '🇷🇺',
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷'
    };
    return flags[countryCode] || '🌍';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor="phone" className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg">
          {value ? getCountryFlag() : '📞'}
        </div>
        
        <Input
          id="phone"
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pl-10',
            !isValid && 'border-red-500 focus:border-red-500',
            error && 'border-red-500 focus:border-red-500'
          )}
        />
        
        {value && isValid && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-green-500 text-sm">✓</span>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {!isValid && value && (
        <p className="text-sm text-red-500">
          Введите номер в международном формате (например: +7 999 123-45-67)
        </p>
      )}
      
      {value && isValid && (
        <div className="text-xs text-gray-500">
          {isRussianPhone(value) ? 'Российский номер' : 'Международный номер'}
        </div>
      )}
    </div>
  );
}
