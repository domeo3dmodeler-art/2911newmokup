// components/ui/Alert.tsx
// Унифицированные уведомления в стиле Domeo

import React from 'react';
import { createComponentStyles } from '../../lib/design/tokens';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export function Alert({ 
  variant = 'info', 
  title, 
  children, 
  onClose,
  className = '',
  ...props 
}: AlertProps) {
  const styles = createComponentStyles();
  
  const variantClasses = {
    success: styles.notification.success,
    error: styles.notification.error,
    warning: styles.notification.warning,
    info: styles.notification.info,
  };
  
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
  };
  
  return (
    <div
      className={`${styles.notification.base} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg">{icons[variant]}</span>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className="text-sm font-medium mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm">
            {children}
          </div>
        </div>
        {onClose && (
          <div className="ml-auto pl-3">
            <button
              onClick={onClose}
              className="text-current hover:opacity-75 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Экспорт для удобства
export default Alert;
