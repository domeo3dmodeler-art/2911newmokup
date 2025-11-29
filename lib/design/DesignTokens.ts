// lib/design/DesignTokens.ts
// Единая система дизайн-токенов для Domeo

export const colors = {
  // Основные цвета бренда
  primary: {
    black: '#000000',
    white: '#FFFFFF',
    yellow: '#FFD700', // Золотистый желтый
    yellowLight: '#FFF8DC', // Светло-желтый
    yellowDark: '#B8860B', // Темно-желтый
  },
  
  // Нейтральные цвета
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  },
  
  // Семантические цвета
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Границы и разделители
  border: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
  }
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  '2xl': '2rem',   // 32px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
  '5xl': '6rem',   // 96px
} as const;

export const typography = {
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
    '5xl': '3rem',    // 48px
  },
  
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  lineHeight: {
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  }
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  full: '9999px',
} as const;

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Утилиты для создания CSS классов
export const createStyle = {
  // Кнопки
  button: {
    primary: `
      px-4 py-2 bg-black text-white border border-black
      hover:bg-yellow-400 hover:text-black hover:border-yellow-400
      transition-all duration-200 font-medium text-sm
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    secondary: `
      px-4 py-2 bg-white text-black border border-black
      hover:bg-black hover:text-white
      transition-all duration-200 font-medium text-sm
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      px-4 py-2 text-black border border-transparent
      hover:border-black hover:bg-gray-50
      transition-all duration-200 font-medium text-sm
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    compact: `
      px-2 py-1 text-xs border border-black text-black
      hover:bg-black hover:text-white
      transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
    `
  },
  
  // Карточки
  card: {
    base: `
      bg-white border border-black/10 p-6
      hover:border-black transition-all duration-200
    `,
    elevated: `
      bg-white border border-black/10 p-6 shadow-sm
      hover:shadow-md hover:border-black transition-all duration-200
    `,
    interactive: `
      bg-white border border-black/10 p-6 cursor-pointer
      hover:border-black hover:bg-gray-50 transition-all duration-200
    `
  },
  
  // Формы
  input: {
    base: `
      w-full px-3 py-2 border border-gray-300 text-black
      focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    error: `
      w-full px-3 py-2 border border-red-300 text-black bg-red-50
      focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400
    `
  },
  
  // Модальные окна
  modal: {
    overlay: `
      fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
    `,
    content: `
      bg-white p-6 w-full max-w-md mx-4 border border-black/10
    `,
    header: `
      flex justify-between items-center mb-4
    `,
    footer: `
      flex space-x-3 pt-4
    `
  },
  
  // Навигация
  nav: {
    item: `
      px-3 py-2 text-black hover:text-yellow-400 transition-colors duration-200
    `,
    active: `
      px-3 py-2 text-yellow-400 font-medium
    `
  },
  
  // Сетка
  grid: {
    responsive: `
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
    `,
    compact: `
      grid grid-cols-2 md:grid-cols-4 gap-4
    `,
    wide: `
      grid grid-cols-1 lg:grid-cols-2 gap-8
    `
  }
} as const;

// Экспорт всех токенов
export const designTokens = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions,
  breakpoints,
  createStyle,
} as const;
