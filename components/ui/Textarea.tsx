import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'outline' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  className?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', size = 'md', error = false, ...props }, ref) => {
    const baseStyles = 'flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 resize-vertical';
    
    const variants = {
      default: 'border-gray-300 focus:ring-blue-500',
      outline: 'border-gray-300 focus:ring-blue-500',
      filled: 'border-gray-300 bg-gray-50 focus:ring-blue-500'
    };

    const sizes = {
      sm: 'px-2 py-1 text-xs min-h-[60px]',
      md: 'px-3 py-2 text-sm min-h-[80px]',
      lg: 'px-4 py-3 text-base min-h-[100px]'
    };

    const errorStyles = error ? 'border-red-500 focus:ring-red-500' : '';

    const combinedClassName = [
      baseStyles,
      variants[variant],
      sizes[size],
      errorStyles,
      className
    ].filter(Boolean).join(' ');

    return (
      <textarea
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea };
