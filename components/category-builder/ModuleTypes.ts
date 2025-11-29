'use client';

// components/category-builder/ModuleTypes.ts
// Типы модулей для конструктора категорий

export interface ModuleConfig {
  id: string;
  type: ModuleType;
  title: string;
  description: string;
  icon: string;
  settings: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export type ModuleType = 
  | 'filter'           // Модуль фильтров
  | 'selector'         // Модуль селектора
  | 'parameters'       // Модуль параметров
  | 'preview'          // Модуль превью
  | 'cart'             // Модуль корзины
  | 'export'           // Модуль экспорта
  | 'text'             // Текстовый блок
  | 'image'            // Изображение
  | 'spacer';          // Отступ

export interface FilterModuleConfig extends ModuleConfig {
  type: 'filter';
  settings: {
    fields: FilterField[];
    layout: 'horizontal' | 'vertical' | 'grid';
    showLabels: boolean;
    required: boolean;
  };
}

export interface SelectorModuleConfig extends ModuleConfig {
  type: 'selector';
  settings: {
    field: string;
    options: SelectorOption[];
    layout: 'dropdown' | 'buttons' | 'cards';
    multiple: boolean;
  };
}

export interface ParametersModuleConfig extends ModuleConfig {
  type: 'parameters';
  settings: {
    fields: ParameterField[];
    layout: 'form' | 'grid' | 'tabs';
    showPrices: boolean;
  };
}

export interface PreviewModuleConfig extends ModuleConfig {
  type: 'preview';
  settings: {
    showImage: boolean;
    showSpecs: boolean;
    showPrice: boolean;
    imageSize: 'small' | 'medium' | 'large';
  };
}

export interface CartModuleConfig extends ModuleConfig {
  type: 'cart';
  settings: {
    showQuantity: boolean;
    showTotal: boolean;
    showActions: boolean;
    layout: 'compact' | 'detailed';
  };
}

export interface ExportModuleConfig extends ModuleConfig {
  type: 'export';
  settings: {
    formats: ('pdf' | 'xlsx' | 'csv')[];
    showPreview: boolean;
    requireClient: boolean;
  };
}

export interface FilterField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'range' | 'checkbox';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface SelectorOption {
  id: string;
  name: string;
  value: string;
  image?: string;
  price?: number;
  description?: string;
}

export interface ParameterField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'color' | 'material';
  required: boolean;
  options?: string[];
  price?: number;
  unit?: string;
}

// Предустановленные модули
export const DEFAULT_MODULES: Partial<ModuleConfig>[] = [
  {
    type: 'filter',
    title: 'Фильтры',
    description: 'Выбор параметров товара',
    icon: '🔍',
    settings: {
      fields: [],
      layout: 'horizontal',
      showLabels: true,
      required: false
    }
  },
  {
    type: 'selector',
    title: 'Селектор модели',
    description: 'Выбор модели/серии товара',
    icon: '📋',
    settings: {
      field: 'model',
      options: [],
      layout: 'cards',
      multiple: false
    }
  },
  {
    type: 'parameters',
    title: 'Параметры',
    description: 'Дополнительные опции',
    icon: '⚙️',
    settings: {
      fields: [],
      layout: 'form',
      showPrices: true
    }
  },
  {
    type: 'preview',
    title: 'Превью',
    description: 'Визуализация товара',
    icon: '👁️',
    settings: {
      showImage: true,
      showSpecs: true,
      showPrice: true,
      imageSize: 'medium'
    }
  },
  {
    type: 'cart',
    title: 'Корзина',
    description: 'Добавление в заказ',
    icon: '🛒',
    settings: {
      showQuantity: true,
      showTotal: true,
      showActions: true,
      layout: 'detailed'
    }
  },
  {
    type: 'export',
    title: 'Экспорт',
    description: 'Генерация документов',
    icon: '📤',
    settings: {
      formats: ['pdf', 'xlsx'],
      showPreview: true,
      requireClient: true
    }
  }
];
