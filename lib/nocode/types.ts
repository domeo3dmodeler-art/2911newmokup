// ===================== Профессиональный NoCode конструктор - Типы =====================

export interface DragDropItem {
  id: string;
  type: ComponentType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  locked: boolean;
}

export interface ComponentConfig {
  id: string;
  type: ComponentType;
  title: string;
  description: string;
  icon: string;
  category: ComponentCategory;
  
  // Позиционирование и размеры
  position: DragDropItem['position'];
  size: DragDropItem['size'];
  zIndex: number;
  locked: boolean;
  
  // Настройки компонента
  settings: Record<string, any>;
  
  // Стилизация
  styles: ComponentStyles;
  
  // Анимации
  animations: AnimationConfig[];
  
  // Условная логика
  conditions: ConditionConfig[];
  
  // Связи с данными
  dataBinding: DataBindingConfig;
  
  // Версионирование
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComponentStyles {
  // Layout
  display: 'block' | 'flex' | 'grid' | 'inline-block';
  position: 'static' | 'relative' | 'absolute' | 'fixed';
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number;
  
  // Spacing
  margin: { top: number; right: number; bottom: number; left: number };
  padding: { top: number; right: number; bottom: number; left: number };
  
  // Visual
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'none';
  borderRadius: number;
  boxShadow: string;
  
  // Typography
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  
  // Effects
  opacity: number;
  transform: string;
  filter: string;
}

export interface AnimationConfig {
  id: string;
  name: string;
  type: 'fadeIn' | 'fadeOut' | 'slideIn' | 'slideOut' | 'scale' | 'rotate' | 'custom';
  duration: number; // milliseconds
  delay: number;
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  trigger: 'hover' | 'click' | 'load' | 'scroll' | 'custom';
  properties: Record<string, any>;
}

export interface ConditionConfig {
  id: string;
  name: string;
  condition: string; // JavaScript expression
  action: 'show' | 'hide' | 'enable' | 'disable' | 'custom';
  target: string; // Component ID or 'self'
}

export interface DataBindingConfig {
  source: 'products' | 'categories' | 'cart' | 'user' | 'custom';
  field: string;
  transform?: string; // JavaScript function
  filter?: string; // JavaScript expression
  sort?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  
  // Структура страницы
  layout: PageLayout;
  components: ComponentConfig[];
  
  // Настройки страницы
  settings: PageSettings;
  
  // Версионирование
  version: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface PageLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns: number;
  rows: number;
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  backgroundColor: string;
  maxWidth: number;
  minHeight: number;
}

export interface PageSettings {
  title: string;
  description: string;
  keywords: string[];
  seoTitle: string;
  seoDescription: string;
  
  // Настройки производительности
  lazyLoading: boolean;
  preloadImages: boolean;
  cacheStrategy: 'none' | 'memory' | 'localStorage' | 'sessionStorage';
  
  // Настройки экспорта
  exportFormats: ExportFormat[];
}

export interface ExportFormat {
  type: 'pdf' | 'excel' | 'csv' | 'json' | 'html' | 'image';
  template: string;
  settings: Record<string, any>;
}

// ===================== Типы компонентов =====================

export type ComponentType = 
  | 'product-grid'           // Сетка товаров
  | 'product-list'           // Список товаров
  | 'product-card'           // Карточка товара
  | 'product-gallery'        // Галерея товара
  | 'product-details'         // Детали товара
  | 'price-calculator'        // Калькулятор цены
  | 'filter-panel'           // Панель фильтров
  | 'search-bar'              // Поисковая строка
  | 'sort-dropdown'           // Сортировка
  | 'pagination'              // Пагинация
  | 'breadcrumbs'             // Хлебные крошки
  | 'category-tree'           // Дерево категорий
  | 'cart-summary'            // Корзина
  | 'checkout-form'           // Форма заказа
  | 'contact-form'            // Контактная форма
  | 'text-block'              // Текстовый блок
  | 'image-block'             // Блок изображения
  | 'video-player'            // Видеоплеер
  | 'slider'                  // Слайдер
  | 'tabs'                    // Вкладки
  | 'accordion'               // Аккордеон
  | 'modal'                   // Модальное окно
  | 'button'                   // Кнопка
  | 'input'                    // Поле ввода
  | 'select'                   // Выпадающий список
  | 'checkbox'                 // Чекбокс
  | 'radio'                    // Радиокнопка
  | 'custom-html'              // Пользовательский HTML
  | 'custom-component';        // Пользовательский компонент

export type ComponentCategory = 
  | 'layout'      // Компоненты макета
  | 'content'      // Контентные компоненты
  | 'navigation'   // Навигационные компоненты
  | 'forms'        // Формы и поля ввода
  | 'media'        // Медиа компоненты
  | 'interactive'  // Интерактивные компоненты
  | 'ecommerce'    // E-commerce компоненты
  | 'custom';      // Пользовательские компоненты

// ===================== Drag & Drop =====================

export interface DragDropState {
  isDragging: boolean;
  draggedItem: DragDropItem | null;
  dropTarget: string | null;
  dragOffset: { x: number; y: number };
  snapToGrid: boolean;
  gridSize: number;
}

export interface DropZone {
  id: string;
  type: 'canvas' | 'container' | 'component';
  bounds: { x: number; y: number; width: number; height: number };
  accepts: ComponentType[];
  maxItems?: number;
}

// ===================== Real-time Preview =====================

export interface PreviewState {
  isPreviewMode: boolean;
  selectedDevice: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  showComponentBorders: boolean;
}

// ===================== Версионирование =====================

export interface VersionHistory {
  id: string;
  templateId: string;
  version: number;
  name: string;
  description: string;
  changes: ChangeLog[];
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

export interface ChangeLog {
  type: 'add' | 'remove' | 'modify' | 'move' | 'style';
  componentId: string;
  componentType: ComponentType;
  description: string;
  before?: any;
  after?: any;
}

// ===================== Экспорт =====================

export interface ExportJob {
  id: string;
  templateId: string;
  format: ExportFormat['type'];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    url: string;
    filename: string;
    size: number;
  };
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// ===================== Поиск =====================

export interface SearchConfig {
  enabled: boolean;
  fields: string[];
  filters: SearchFilter[];
  sortOptions: SearchSortOption[];
  suggestions: boolean;
  autocomplete: boolean;
  debounceMs: number;
}

export interface SearchFilter {
  field: string;
  type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'range';
  label: string;
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
}

export interface SearchSortOption {
  field: string;
  label: string;
  direction: 'asc' | 'desc';
}

// ===================== Утилиты =====================

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface ComponentValidation {
  componentId: string;
  rules: ValidationRule[];
  isValid: boolean;
  errors: string[];
}
