// ===================== Профессиональная библиотека компонентов =====================

import { 
  ComponentConfig, 
  ComponentType, 
  ComponentCategory,
  ComponentStyles,
  AnimationConfig,
  DataBindingConfig 
} from './types';

// ===================== Базовые стили =====================

export const defaultStyles: ComponentStyles = {
  display: 'block',
  position: 'relative',
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  padding: { top: 16, right: 16, bottom: 16, left: 16 },
  backgroundColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderStyle: 'solid',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  fontSize: 14,
  fontWeight: 'normal',
  color: '#374151',
  textAlign: 'left',
  lineHeight: 1.5,
  opacity: 1,
  transform: 'none',
  filter: 'none',
};

// ===================== Профессиональные компоненты =====================

export const PROFESSIONAL_COMPONENTS: Partial<ComponentConfig>[] = [
  // ===================== E-commerce компоненты =====================
  {
    type: 'product-grid' as ComponentType,
    title: 'Сетка товаров',
    description: 'Адаптивная сетка товаров с фильтрацией и сортировкой',
    icon: '🛍️',
    category: 'ecommerce' as ComponentCategory,
    settings: {
      columns: 3,
      gap: 16,
      showFilters: true,
      showSorting: true,
      showPagination: true,
      itemsPerPage: 12,
      cardStyle: 'modern',
      showPrice: true,
      showRating: true,
      showAddToCart: true,
    },
    styles: {
      ...defaultStyles,
      display: 'grid',
      gap: 16,
    },
    animations: [
      {
        id: 'fade-in',
        name: 'Появление',
        type: 'fadeIn',
        duration: 300,
        delay: 0,
        easing: 'ease-out',
        trigger: 'load',
        properties: { opacity: [0, 1] },
      },
    ],
    dataBinding: {
      source: 'products',
      field: '*',
      filter: 'category === currentCategory',
      sort: { field: 'name', direction: 'asc' },
      limit: 12,
    },
  },
  {
    type: 'price-calculator' as ComponentType,
    title: 'Калькулятор цены',
    description: 'Динамический расчет стоимости с учетом выбранных опций',
    icon: '💰',
    category: 'ecommerce' as ComponentCategory,
    settings: {
      basePrice: 0,
      showBreakdown: true,
      currency: 'RUB',
      taxIncluded: true,
      discountEnabled: true,
      formula: 'basePrice + optionsPrice + tax - discount',
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#f8fafc',
      borderColor: '#3b82f6',
      borderWidth: 2,
    },
    animations: [
      {
        id: 'price-update',
        name: 'Обновление цены',
        type: 'scale',
        duration: 200,
        delay: 0,
        easing: 'ease-out',
        trigger: 'custom',
        properties: { transform: ['scale(1)', 'scale(1.05)', 'scale(1)'] },
      },
    ],
    dataBinding: {
      source: 'cart',
      field: 'totalPrice',
      transform: 'formatCurrency',
    },
  },
  {
    type: 'filter-panel' as ComponentType,
    title: 'Панель фильтров',
    description: 'Мощная система фильтрации с множественным выбором',
    icon: '🔍',
    category: 'ecommerce' as ComponentCategory,
    settings: {
      filters: [
        { type: 'range', field: 'price', label: 'Цена', min: 0, max: 100000 },
        { type: 'multiselect', field: 'brand', label: 'Бренд', options: [] },
        { type: 'multiselect', field: 'color', label: 'Цвет', options: [] },
        { type: 'multiselect', field: 'size', label: 'Размер', options: [] },
      ],
      showReset: true,
      showCount: true,
      collapsible: true,
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
    },
    dataBinding: {
      source: 'products',
      field: 'filters',
    },
  },
  {
    type: 'search-bar' as ComponentType,
    title: 'Поисковая строка',
    description: 'Умный поиск с автодополнением и подсказками',
    icon: '🔎',
    category: 'ecommerce' as ComponentCategory,
    settings: {
      placeholder: 'Поиск товаров...',
      showSuggestions: true,
      debounceMs: 300,
      minLength: 2,
      maxSuggestions: 10,
      searchFields: ['name', 'description', 'tags'],
      highlightResults: true,
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: '#3b82f6',
      borderWidth: 2,
      borderRadius: 25,
    },
    animations: [
      {
        id: 'focus',
        name: 'Фокус',
        type: 'scale',
        duration: 200,
        delay: 0,
        easing: 'ease-out',
        trigger: 'hover',
        properties: { transform: ['scale(1)', 'scale(1.02)'] },
      },
    ],
    dataBinding: {
      source: 'products',
      field: 'searchResults',
    },
  },
  {
    type: 'cart-summary' as ComponentType,
    title: 'Корзина',
    description: 'Корзина покупок с возможностью экспорта',
    icon: '🛒',
    category: 'ecommerce' as ComponentCategory,
    settings: {
      showQuantity: true,
      showTotal: true,
      showTax: true,
      showDiscount: true,
      allowEdit: true,
      allowRemove: true,
      exportFormats: ['pdf', 'excel', 'csv'],
      showRelatedProducts: true,
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#f8fafc',
      borderColor: '#10b981',
      borderWidth: 2,
    },
    animations: [
      {
        id: 'add-to-cart',
        name: 'Добавление в корзину',
        type: 'scale',
        duration: 300,
        delay: 0,
        easing: 'ease-out',
        trigger: 'custom',
        properties: { transform: ['scale(1)', 'scale(1.1)', 'scale(1)'] },
      },
    ],
    dataBinding: {
      source: 'cart',
      field: '*',
    },
  },

  // ===================== Layout компоненты =====================
  {
    type: 'text-block' as ComponentType,
    title: 'Текстовый блок',
    description: 'Богатый текстовый редактор с форматированием',
    icon: '📝',
    category: 'content' as ComponentCategory,
    settings: {
      content: 'Введите текст...',
      allowHtml: true,
      maxLength: 5000,
      showWordCount: true,
      placeholder: 'Начните печатать...',
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    dataBinding: {
      source: 'custom',
      field: 'content',
    },
  },
  {
    type: 'image-block' as ComponentType,
    title: 'Блок изображения',
    description: 'Адаптивные изображения с оптимизацией',
    icon: '🖼️',
    category: 'media' as ComponentCategory,
    settings: {
      src: '',
      alt: '',
      width: '100%',
      height: 'auto',
      lazyLoading: true,
      showCaption: false,
      caption: '',
      clickAction: 'none',
      linkUrl: '',
    },
    styles: {
      ...defaultStyles,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
      borderRadius: 8,
    },
    animations: [
      {
        id: 'fade-in',
        name: 'Появление',
        type: 'fadeIn',
        duration: 500,
        delay: 0,
        easing: 'ease-out',
        trigger: 'load',
        properties: { opacity: [0, 1] },
      },
    ],
    dataBinding: {
      source: 'custom',
      field: 'imageUrl',
    },
  },

  // ===================== Interactive компоненты =====================
  {
    type: 'slider' as ComponentType,
    title: 'Слайдер',
    description: 'Интерактивный слайдер для выбора значений',
    icon: '🎚️',
    category: 'interactive' as ComponentCategory,
    settings: {
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 50,
      showLabels: true,
      showValue: true,
      orientation: 'horizontal',
      trackColor: '#e5e7eb',
      thumbColor: '#3b82f6',
    },
    styles: {
      ...defaultStyles,
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      borderWidth: 0,
    },
    dataBinding: {
      source: 'custom',
      field: 'value',
    },
  },
  {
    type: 'tabs' as ComponentType,
    title: 'Вкладки',
    description: 'Табы для организации контента',
    icon: '📑',
    category: 'interactive' as ComponentCategory,
    settings: {
      tabs: [
        { id: 'tab1', label: 'Вкладка 1', content: 'Содержимое вкладки 1' },
        { id: 'tab2', label: 'Вкладка 2', content: 'Содержимое вкладки 2' },
      ],
      defaultTab: 'tab1',
      orientation: 'horizontal',
      showIcons: false,
      closable: false,
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    dataBinding: {
      source: 'custom',
      field: 'activeTab',
    },
  },
  {
    type: 'accordion' as ComponentType,
    title: 'Аккордеон',
    description: 'Сворачиваемые секции контента',
    icon: '📋',
    category: 'interactive' as ComponentCategory,
    settings: {
      items: [
        { id: 'item1', title: 'Секция 1', content: 'Содержимое секции 1', expanded: false },
        { id: 'item2', title: 'Секция 2', content: 'Содержимое секции 2', expanded: false },
      ],
      allowMultiple: true,
      showIcons: true,
      animation: true,
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
    },
    animations: [
      {
        id: 'expand',
        name: 'Разворачивание',
        type: 'slideIn',
        duration: 300,
        delay: 0,
        easing: 'ease-out',
        trigger: 'custom',
        properties: { height: ['0px', 'auto'] },
      },
    ],
    dataBinding: {
      source: 'custom',
      field: 'expandedItems',
    },
  },

  // ===================== Form компоненты =====================
  {
    type: 'button' as ComponentType,
    title: 'Кнопка',
    description: 'Интерактивная кнопка с анимациями',
    icon: '🔘',
    category: 'forms' as ComponentCategory,
    settings: {
      text: 'Нажмите меня',
      variant: 'primary',
      size: 'medium',
      disabled: false,
      loading: false,
      icon: '',
      iconPosition: 'left',
      action: 'none',
      linkUrl: '',
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderColor: '#3b82f6',
      borderRadius: 6,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    animations: [
      {
        id: 'click',
        name: 'Нажатие',
        type: 'scale',
        duration: 150,
        delay: 0,
        easing: 'ease-out',
        trigger: 'click',
        properties: { transform: ['scale(1)', 'scale(0.95)', 'scale(1)'] },
      },
    ],
    dataBinding: {
      source: 'custom',
      field: 'clicked',
    },
  },
  {
    type: 'input' as ComponentType,
    title: 'Поле ввода',
    description: 'Поле ввода с валидацией',
    icon: '📝',
    category: 'forms' as ComponentCategory,
    settings: {
      type: 'text',
      placeholder: 'Введите значение...',
      required: false,
      disabled: false,
      readonly: false,
      maxLength: 255,
      minLength: 0,
      pattern: '',
      validation: {
        required: false,
        min: 0,
        max: 255,
        pattern: '',
        custom: '',
      },
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 1,
      borderRadius: 6,
    },
    dataBinding: {
      source: 'custom',
      field: 'value',
    },
  },
  {
    type: 'select' as ComponentType,
    title: 'Выпадающий список',
    description: 'Список выбора с поиском',
    icon: '📋',
    category: 'forms' as ComponentCategory,
    settings: {
      options: [
        { value: 'option1', label: 'Опция 1' },
        { value: 'option2', label: 'Опция 2' },
      ],
      multiple: false,
      searchable: true,
      clearable: true,
      placeholder: 'Выберите опцию...',
      disabled: false,
    },
    styles: {
      ...defaultStyles,
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 1,
      borderRadius: 6,
    },
    dataBinding: {
      source: 'custom',
      field: 'selectedValue',
    },
  },
];

// ===================== Утилиты =====================

export function createComponent(
  type: ComponentType, 
  overrides: Partial<ComponentConfig> = {}
): ComponentConfig {
  const baseComponent = PROFESSIONAL_COMPONENTS.find(comp => comp.type === type);
  
  if (!baseComponent) {
    throw new Error(`Component type ${type} not found`);
  }

  const id = `component-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    type,
    title: baseComponent.title || '',
    description: baseComponent.description || '',
    icon: baseComponent.icon || '📦',
    category: baseComponent.category || 'custom',
    position: { x: 0, y: 0 },
    size: { width: 300, height: 200 },
    zIndex: 1,
    locked: false,
    settings: { ...baseComponent.settings },
    styles: { ...baseComponent.styles },
    animations: [...(baseComponent.animations || [])],
    conditions: [],
    dataBinding: { ...baseComponent.dataBinding },
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function getComponentsByCategory(category: ComponentCategory): Partial<ComponentConfig>[] {
  return PROFESSIONAL_COMPONENTS.filter(comp => comp.category === category);
}

export function getComponentByType(type: ComponentType): Partial<ComponentConfig> | undefined {
  return PROFESSIONAL_COMPONENTS.find(comp => comp.type === type);
}
