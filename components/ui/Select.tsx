// components/ui/Select.tsx
// Унифицированные селекты в стиле Domeo

import React, { useId } from 'react';
import { createComponentStyles } from '../../lib/design/tokens';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

export function Select({ 
  label, 
  error, 
  helperText, 
  options = [],
  placeholder,
  className = '',
  id,
  onValueChange,
  onChange,
  ...props 
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const styles = createComponentStyles();
  
  const selectClasses = error ? styles.input.error : styles.input.base;
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };
  
  return (
    <div className={styles.form.field}>
      {label && (
        <label 
          htmlFor={selectId}
          className={styles.input.label}
        >
          {label}
        </label>
      )}
      
        <select
          id={selectId}
          className={`${selectClasses} ${className}`}
          onChange={handleChange}
          {...props}
        >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        
        {options && options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className={styles.input.errorText}>{error}</p>
      )}
      
      {helperText && !error && (
        <p className={styles.input.helper}>{helperText}</p>
      )}
    </div>
  );
}

// Дополнительные компоненты для совместимости
export const SelectTrigger = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`relative ${className}`} {...props}>
    {children}
  </div>
);

export const SelectValue = ({ placeholder, value }: { placeholder?: string; value?: string }) => (
  <span>{value || placeholder}</span>
);

export const SelectContent = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg ${className}`} {...props}>
    {children}
  </div>
);

export const SelectItem = ({ children, value, onSelect, className = '', ...props }: { 
  children: React.ReactNode; 
  value: string; 
  onSelect?: (value: string) => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${className}`}
    onClick={() => onSelect?.(value)}
    {...props}
  >
    {children}
  </div>
);

// Экспорт для удобства
export default Select;
