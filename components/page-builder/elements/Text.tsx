'use client';

import React from 'react';

interface TextProps {
  text: string;
  align?: 'left' | 'center' | 'right';
  color?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  className?: string;
}

export function Text({ 
  text, 
  align = 'left', 
  color = '#374151',
  size = 'base',
  className = ''
}: TextProps) {
  const sizeClasses = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  return (
    <p
      className={`${sizeClasses[size]} ${alignClasses[align]} ${className}`}
      style={{ color }}
    >
      {text}
    </p>
  );
}

