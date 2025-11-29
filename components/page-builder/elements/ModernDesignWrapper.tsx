'use client';

import React from 'react';
import { tailwindClasses } from '../../../lib/design-system';

interface ModernDesignWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export function ModernDesignWrapper({ children, className = '' }: ModernDesignWrapperProps) {
  return (
    <div className={`${tailwindClasses.container} ${className}`}>
      {children}
    </div>
  );
}

// Компонент для заголовков в современном стиле
export function ModernHeading({ 
  level, 
  children, 
  className = '' 
}: { 
  level: 1 | 2 | 3 | 4; 
  children: React.ReactNode; 
  className?: string; 
}) {
  const headingClasses = {
    1: tailwindClasses.heading1,
    2: tailwindClasses.heading2,
    3: tailwindClasses.heading3,
    4: tailwindClasses.heading4
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  
  return (
    <Tag className={`${headingClasses[level]} ${className}`}>
      {children}
    </Tag>
  );
}

// Компонент для кнопок в современном стиле
export function ModernButton({ 
  variant = 'primary', 
  children, 
  onClick, 
  className = '',
  disabled = false,
  type = 'button'
}: {
  variant?: 'primary' | 'secondary' | 'light';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) {
  const buttonClasses = {
    primary: tailwindClasses.buttonPrimary,
    secondary: tailwindClasses.buttonSecondary,
    light: tailwindClasses.buttonLight
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${buttonClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// Компонент для полей ввода в современном стиле
export function ModernInput({ 
  type = 'text',
  placeholder,
  value,
  onChange,
  className = ''
}: {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`${tailwindClasses.input} ${className}`}
    />
  );
}

// Компонент для выпадающих списков в современном стиле
export function ModernSelect({ 
  children,
  value,
  onChange,
  className = ''
}: {
  children: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`${tailwindClasses.select} ${className}`}
    >
      {children}
    </select>
  );
}

// Компонент для карточек в современном стиле
export function ModernCard({ 
  children, 
  className = '',
  hover = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={`${tailwindClasses.card} ${hover ? tailwindClasses.hover : ''} ${className}`}>
      {children}
    </div>
  );
}

// Компонент для текста в современном стиле
export function ModernText({ 
  variant = 'body', 
  children, 
  className = '' 
}: { 
  variant?: 'body' | 'caption'; 
  children: React.ReactNode; 
  className?: string; 
}) {
  const textClasses = {
    body: tailwindClasses.body,
    caption: tailwindClasses.caption
  };

  return (
    <p className={`${textClasses[variant]} ${className}`}>
      {children}
    </p>
  );
}

// Компонент для секций в современном стиле
export function ModernSection({ 
  children, 
  className = '',
  title,
  titleLevel = 3
}: { 
  children: React.ReactNode; 
  className?: string;
  title?: string;
  titleLevel?: 1 | 2 | 3 | 4;
}) {
  return (
    <div className={`${tailwindClasses.section} ${className}`}>
      {title && (
        <ModernHeading level={titleLevel} className="mb-4">
          {title}
        </ModernHeading>
      )}
      {children}
    </div>
  );
}

// Компонент для сетки в современном стиле
export function ModernGrid({ 
  children, 
  columns = 1,
  gap = 'md',
  className = ''
}: { 
  children: React.ReactNode; 
  columns?: 1 | 2 | 3 | 4 | 6;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  const gapClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  return (
    <div className={`grid ${gridClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// Компонент для выбора опций в современном стиле (как на изображении)
export function ModernOptionSelector({ 
  options,
  selectedValue,
  onSelect,
  className = ''
}: {
  options: Array<{ value: string; label: string; image?: string }>;
  selectedValue?: string;
  onSelect: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`
            flex flex-col items-center p-4 border border-gray-300 rounded-md
            transition-all duration-150 hover:bg-gray-50
            ${selectedValue === option.value ? 'bg-gray-200 border-gray-400' : 'bg-white'}
          `}
        >
          {option.image && (
            <div className="w-12 h-12 mb-2 flex items-center justify-center">
              <img src={option.image} alt={option.label} className="max-w-full max-h-full object-contain" />
            </div>
          )}
          <span className="text-sm font-medium text-gray-800 text-center">
            {option.label}
          </span>
        </button>
      ))}
    </div>
  );
}

