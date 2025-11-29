// components/ui/Card.tsx
// Унифицированные карточки в стиле Domeo

import React from 'react';
import { createComponentStyles } from '../../lib/design/tokens';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'base' | 'elevated' | 'interactive';
  padding?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ 
  variant = 'base', 
  padding = 'md', 
  children, 
  className = '',
  ...props 
}: CardProps) {
  const styles = createComponentStyles();
  
  const baseClasses = styles.card.base;
  const variantClasses = styles.card.variants[variant];
  const paddingClasses = styles.card.padding[padding];
  
  return (
    <div
      className={`${baseClasses} ${variantClasses} ${paddingClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ 
  children, 
  className = '',
  ...props 
}: CardHeaderProps) {
  return (
    <div
      className={`px-6 py-4 border-b border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ 
  children, 
  className = '',
  ...props 
}: CardTitleProps) {
  return (
    <h3
      className={`text-lg font-semibold text-gray-900 ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({ 
  children, 
  className = '',
  ...props 
}: CardContentProps) {
  return (
    <div
      className={`px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// Экспорт для удобства
export default Card;
