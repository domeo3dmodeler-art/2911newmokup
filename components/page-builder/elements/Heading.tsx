'use client';

import React from 'react';

interface HeadingProps {
  text: string;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  align?: 'left' | 'center' | 'right';
  color?: string;
  size?: string;
  className?: string;
}

export function Heading({ 
  text, 
  level = 'h1', 
  align = 'left', 
  color = '#1f2937',
  size,
  className = ''
}: HeadingProps) {
  const baseClasses = 'font-bold text-gray-900';
  
  const sizeClasses = {
    h1: 'text-4xl md:text-5xl',
    h2: 'text-3xl md:text-4xl', 
    h3: 'text-2xl md:text-3xl',
    h4: 'text-xl md:text-2xl',
    h5: 'text-lg md:text-xl',
    h6: 'text-base md:text-lg'
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const HeadingTag = level as keyof JSX.IntrinsicElements;

  return (
    <HeadingTag
      className={`${baseClasses} ${sizeClasses[level]} ${alignClasses[align]} ${className}`}
      style={{ color }}
    >
      {text}
    </HeadingTag>
  );
}

