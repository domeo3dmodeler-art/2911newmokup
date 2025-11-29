// Система дизайна на основе стиля изображения
export const designSystem = {
  // Цветовая палитра
  colors: {
    // Основные цвета
    white: '#FFFFFF',
    black: '#000000',
    
    // Текстовые цвета
    textPrimary: '#333333',      // Основной текст
    textSecondary: '#666666',    // Вторичный текст
    textLight: '#999999',        // Светлый текст
    
    // Фоновые цвета
    backgroundPrimary: '#FFFFFF',    // Основной фон
    backgroundSecondary: '#F8F9FA', // Вторичный фон
    backgroundSelected: '#E9ECEF',  // Выделенный элемент
    
    // Границы и разделители
    borderLight: '#E0E0E0',      // Светлые границы
    borderMedium: '#CCCCCC',     // Средние границы
    borderDark: '#999999',       // Темные границы
    
    // Акцентные цвета
    accentGray: '#6C757D',       // Серый акцент
    accentBlue: '#007BFF',       // Синий акцент (для ссылок)
    
    // Состояния
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    
    // Кнопки
    buttonPrimary: '#000000',    // Основная кнопка (черная)
    buttonSecondary: '#6C757D', // Вторичная кнопка (серая)
    buttonLight: '#F8F9FA',     // Светлая кнопка
  },
  
  // Типографика
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    },
    
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px'
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  
  // Отступы и размеры
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px'
  },
  
  // Радиусы скругления
  borderRadius: {
    none: '0',
    sm: '3px',
    md: '5px',
    lg: '8px',
    xl: '12px',
    full: '9999px'
  },
  
  // Тени
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
  },
  
  // Переходы
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out'
  }
};

// Готовые классы для компонентов
export const componentStyles = {
  // Кнопки
  button: {
    primary: `
      background-color: ${designSystem.colors.buttonPrimary};
      color: ${designSystem.colors.white};
      border: none;
      border-radius: ${designSystem.borderRadius.sm};
      padding: ${designSystem.spacing.sm} ${designSystem.spacing.lg};
      font-size: ${designSystem.typography.fontSize.sm};
      font-weight: ${designSystem.typography.fontWeight.medium};
      cursor: pointer;
      transition: all ${designSystem.transitions.fast};
      font-family: ${designSystem.typography.fontFamily.primary};
    `,
    
    secondary: `
      background-color: ${designSystem.colors.buttonSecondary};
      color: ${designSystem.colors.white};
      border: none;
      border-radius: ${designSystem.borderRadius.sm};
      padding: ${designSystem.spacing.sm} ${designSystem.spacing.lg};
      font-size: ${designSystem.typography.fontSize.sm};
      font-weight: ${designSystem.typography.fontWeight.medium};
      cursor: pointer;
      transition: all ${designSystem.transitions.fast};
      font-family: ${designSystem.typography.fontFamily.primary};
    `,
    
    light: `
      background-color: ${designSystem.colors.buttonLight};
      color: ${designSystem.colors.textPrimary};
      border: 1px solid ${designSystem.colors.borderLight};
      border-radius: ${designSystem.borderRadius.sm};
      padding: ${designSystem.spacing.sm} ${designSystem.spacing.lg};
      font-size: ${designSystem.typography.fontSize.sm};
      font-weight: ${designSystem.typography.fontWeight.normal};
      cursor: pointer;
      transition: all ${designSystem.transitions.fast};
      font-family: ${designSystem.typography.fontFamily.primary};
    `
  },
  
  // Поля ввода
  input: `
    background-color: ${designSystem.colors.white};
    color: ${designSystem.colors.textPrimary};
    border: 1px solid ${designSystem.colors.borderLight};
    border-radius: ${designSystem.borderRadius.sm};
    padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
    font-size: ${designSystem.typography.fontSize.sm};
    font-family: ${designSystem.typography.fontFamily.primary};
    transition: border-color ${designSystem.transitions.fast};
  `,
  
  // Выпадающие списки
  select: `
    background-color: ${designSystem.colors.white};
    color: ${designSystem.colors.textPrimary};
    border: 1px solid ${designSystem.colors.borderLight};
    border-radius: ${designSystem.borderRadius.sm};
    padding: ${designSystem.spacing.sm} ${designSystem.spacing.md};
    font-size: ${designSystem.typography.fontSize.sm};
    font-family: ${designSystem.typography.fontFamily.primary};
    cursor: pointer;
    transition: border-color ${designSystem.transitions.fast};
  `,
  
  // Карточки
  card: `
    background-color: ${designSystem.colors.white};
    border: 1px solid ${designSystem.colors.borderLight};
    border-radius: ${designSystem.borderRadius.md};
    padding: ${designSystem.spacing.lg};
    box-shadow: ${designSystem.shadows.sm};
  `,
  
  // Заголовки
  heading: {
    h1: `
      font-size: ${designSystem.typography.fontSize['3xl']};
      font-weight: ${designSystem.typography.fontWeight.bold};
      color: ${designSystem.colors.textPrimary};
      font-family: ${designSystem.typography.fontFamily.primary};
      line-height: ${designSystem.typography.lineHeight.tight};
      margin: 0;
    `,
    
    h2: `
      font-size: ${designSystem.typography.fontSize['2xl']};
      font-weight: ${designSystem.typography.fontWeight.semibold};
      color: ${designSystem.colors.textPrimary};
      font-family: ${designSystem.typography.fontFamily.primary};
      line-height: ${designSystem.typography.lineHeight.tight};
      margin: 0;
    `,
    
    h3: `
      font-size: ${designSystem.typography.fontSize.xl};
      font-weight: ${designSystem.typography.fontWeight.semibold};
      color: ${designSystem.colors.textPrimary};
      font-family: ${designSystem.typography.fontFamily.primary};
      line-height: ${designSystem.typography.lineHeight.normal};
      margin: 0;
    `,
    
    h4: `
      font-size: ${designSystem.typography.fontSize.lg};
      font-weight: ${designSystem.typography.fontWeight.medium};
      color: ${designSystem.colors.textPrimary};
      font-family: ${designSystem.typography.fontFamily.primary};
      line-height: ${designSystem.typography.lineHeight.normal};
      margin: 0;
    `
  },
  
  // Текст
  text: {
    body: `
      font-size: ${designSystem.typography.fontSize.sm};
      font-weight: ${designSystem.typography.fontWeight.normal};
      color: ${designSystem.colors.textPrimary};
      font-family: ${designSystem.typography.fontFamily.primary};
      line-height: ${designSystem.typography.lineHeight.normal};
      margin: 0;
    `,
    
    caption: `
      font-size: ${designSystem.typography.fontSize.xs};
      font-weight: ${designSystem.typography.fontWeight.normal};
      color: ${designSystem.colors.textSecondary};
      font-family: ${designSystem.typography.fontFamily.primary};
      line-height: ${designSystem.typography.lineHeight.normal};
      margin: 0;
    `
  }
};

// Утилиты для применения стилей
export const applyStyles = (styles: string) => styles.replace(/\s+/g, ' ').trim();

// Готовые CSS классы для Tailwind
export const tailwindClasses = {
  // Кнопки
  buttonPrimary: 'bg-black text-white border-none rounded-sm px-6 py-2 text-sm font-medium cursor-pointer transition-all duration-150 font-sans hover:bg-gray-800',
  buttonSecondary: 'bg-gray-600 text-white border-none rounded-sm px-6 py-2 text-sm font-medium cursor-pointer transition-all duration-150 font-sans hover:bg-gray-700',
  buttonLight: 'bg-gray-50 text-gray-800 border border-gray-300 rounded-sm px-6 py-2 text-sm font-normal cursor-pointer transition-all duration-150 font-sans hover:bg-gray-100',
  
  // Поля ввода
  input: 'bg-white text-gray-800 border border-gray-300 rounded-sm px-4 py-2 text-sm font-sans transition-colors duration-150 focus:border-gray-500 focus:outline-none',
  select: 'bg-white text-gray-800 border border-gray-300 rounded-sm px-4 py-2 text-sm font-sans cursor-pointer transition-colors duration-150 focus:border-gray-500 focus:outline-none',
  
  // Карточки
  card: 'bg-white border border-gray-300 rounded-md p-6 shadow-sm',
  
  // Заголовки
  heading1: 'text-3xl font-bold text-gray-800 font-sans leading-tight m-0',
  heading2: 'text-2xl font-semibold text-gray-800 font-sans leading-tight m-0',
  heading3: 'text-xl font-semibold text-gray-800 font-sans leading-normal m-0',
  heading4: 'text-lg font-medium text-gray-800 font-sans leading-normal m-0',
  
  // Текст
  body: 'text-sm font-normal text-gray-800 font-sans leading-normal m-0',
  caption: 'text-xs font-normal text-gray-600 font-sans leading-normal m-0',
  
  // Контейнеры
  container: 'bg-white min-h-screen',
  section: 'bg-white p-6',
  
  // Выделение
  selected: 'bg-gray-200',
  hover: 'hover:bg-gray-50'
};

