// lib/design/tokens.ts
// Дизайн-токены для единой дизайн-системы Domeo

export const designTokens = {
  // Цвета
  colors: {
    // Основные цвета
    primary: {
      50: '#fefce8',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b', // Основной желтый
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    black: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#000000', // Основной черный
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    red: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626', // Основной красный
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    green: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a', // Основной зеленый
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    blue: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // Основной синий
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
  },

  // Типографика
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  // Отступы
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },

  // Радиусы
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },

  // Тени
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },

  // Переходы
  transition: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
};

// Функция для создания стилей компонентов
export function createComponentStyles() {
  return {
    // Кнопки
    button: {
      base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
      variants: {
        primary: 'bg-black text-white border border-black hover:bg-yellow-400 hover:text-black focus:ring-yellow-400',
        secondary: 'bg-transparent border border-black text-black hover:bg-black hover:text-white focus:ring-black',
        ghost: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-400',
        danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white border border-green-600 hover:bg-green-700 focus:ring-green-500',
      },
      sizes: {
        sm: 'px-2 py-1 text-xs rounded-none',
        md: 'px-3 py-2 text-sm rounded-none',
        lg: 'px-6 py-3 text-base rounded-none',
      },
    },

    // Карточки
    card: {
      base: 'bg-white border border-gray-200',
      variants: {
        base: 'shadow-sm',
        elevated: 'shadow-md',
        interactive: 'shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer',
      },
      padding: {
        sm: 'p-3',
        md: 'p-6',
        lg: 'p-8',
      },
    },

    // Поля ввода
    input: {
      base: 'block w-full px-3 py-2 border border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors duration-200',
      error: 'block w-full px-3 py-2 border border-red-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-colors duration-200',
      label: 'block text-sm font-medium text-black mb-1',
      helper: 'text-sm text-gray-500 mt-1',
      errorText: 'text-sm text-red-600 mt-1',
    },

    // Модальные окна
    modal: {
      overlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50',
      content: 'bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-hidden',
      header: 'px-6 py-4 border-b border-gray-200 flex items-center justify-between',
      body: 'px-6 py-4 overflow-y-auto',
      footer: 'px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3',
    },

    // Таблицы
    table: {
      container: 'overflow-x-auto',
      table: 'min-w-full divide-y divide-gray-200',
      thead: 'bg-gray-50',
      th: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
      tbody: 'bg-white divide-y divide-gray-200',
      td: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900',
    },

    // Формы
    form: {
      field: 'space-y-1',
      group: 'space-y-4',
      section: 'space-y-6',
    },

    // Навигация
    nav: {
      item: 'px-3 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-md transition-colors duration-200',
      active: 'px-3 py-2 text-sm font-medium text-black bg-gray-100 rounded-md',
    },

    // Уведомления
    notification: {
      base: 'p-4 rounded-md border',
      success: 'bg-green-50 border-green-200 text-green-800',
      error: 'bg-red-50 border-red-200 text-red-800',
      warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    },
  };
}

export default designTokens;
