// ===================== БАЗОВЫЕ ТИПЫ =====================

export interface Position {
  x: number;
  y: number;
}

// ===================== СВЯЗИ МЕЖДУ БЛОКАМИ =====================

export interface BlockConnection {
  id: string;
  sourceElementId: string;
  targetElementId: string;
  connectionType: 'data' | 'filter' | 'cart' | 'navigate';
  sourceProperty?: string; // Какое свойство источника
  targetProperty?: string; // В какое свойство назначения
  description?: string; // Описание связи
  isActive: boolean;
}

export type ConnectionType = 'data' | 'filter' | 'cart' | 'navigate';

export interface Size {
  width: number;
  height: number;
}

export interface Constraints {
  minWidth: number;
  minHeight: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Style {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  padding?: Spacing;
  margin?: Spacing;
  fontSize?: number;
  color?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  opacity?: number;
  zIndex?: number;
}

// ===================== ЭЛЕМЕНТЫ =====================

export type ElementType = 
  // Макеты и секции
  | 'section' | 'row' | 'column' | 'grid' | 'container' | 'spacer' | 'divider'
  // Базовые элементы
  | 'text' | 'heading' | 'image' | 'button' | 'icon' | 'badge'
  // Навигация
  | 'header' | 'footer' | 'menu' | 'breadcrumb' | 'tabs'
  // Контентные блоки
  | 'hero' | 'card' | 'gallery' | 'video' | 'testimonial' | 'faq'
  // Товарные компоненты
  | 'productConfigurator' | 'productGrid' | 'productFilters' | 'productCarousel' | 'catalogTree'
  // Новые конфигураторы
  | 'stepWizard' | 'comparisonTable' | 'priceCalculator'
  // Калькуляторы
  | 'deliveryCalculator' | 'discountCalculator'
  // Интерактивные элементы
  | 'cart' | 'wishlist' | 'comparison' | 'search'
  // Формы
  | 'form' | 'input' | 'textarea' | 'select' | 'checkbox' | 'radio'
  // Фильтры
  | 'productFilter' | 'propertyFilter' | 'filteredProducts'
  // Специальные
  | 'contact' | 'accordion';

export interface BaseElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  constraints: Constraints;
  style: Style;
  props: Record<string, any>;
  visible?: boolean;
  locked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContainerElement extends BaseElement {
  type: 'container';
  props: {
    children: BaseElement[];
    layout: 'block' | 'flex' | 'grid';
    direction?: 'row' | 'column';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    gap?: number;
    columns?: number;
    rows?: number;
  };
}

// ===================== СТРАНИЦЫ =====================

export interface PageSettings {
  width: number;
  height: number;
  backgroundColor: string;
  padding: Spacing;
  margin: Spacing;
  breakpoints?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  description?: string;
  elements: BaseElement[];
  connections?: BlockConnection[]; // Связи между блоками на странице
  settings: PageSettings;
  theme: Theme;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ===================== ДОКУМЕНТ =====================

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success?: string;
    warning?: string;
    error?: string;
    info?: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      medium: string;
      large: string;
      xlarge: string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    small: string;
    medium: string;
    large: string;
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  shadows: string[];
}

export interface DocumentSettings {
  theme: Theme;
  seo?: {
    siteName?: string;
    siteDescription?: string;
    defaultOgImage?: string;
  };
  analytics?: {
    googleAnalytics?: string;
    yandexMetrika?: string;
  };
  customCSS?: string;
  customJS?: string;
}

export interface DocumentData {
  id: string;
  name: string;
  description?: string;
  pages: Page[];
  settings: DocumentSettings;
  connections: BlockConnection[]; // Связи между блоками
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ===================== КАТЕГОРИИ КАТАЛОГА =====================

export interface CatalogCategory {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  level: number;
  path: string;
  is_active: boolean;
  products_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductProperty {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiselect' | 'range';
  description?: string;
  options?: string[];
  is_required: boolean;
  is_active: boolean;
  is_for_calculator: boolean;
  is_for_export: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryPropertyAssignment {
  id: string;
  catalog_category_id: string;
  product_property_id: string;
  is_required: boolean;
  is_for_calculator: boolean;
  is_for_export: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  catalog_category_id: string;
  properties_data: Record<string, any>;
  base_price: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  filename: string;
  original_name: string;
  url: string;
  alt_text?: string;
  width?: number;
  height?: number;
  file_size?: number;
  mime_type: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

// ===================== КОНФИГУРАТОР =====================

export interface ConfiguratorCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  catalog_category_ids: string[]; // МАССИВ категорий каталога!
  display_config: Record<string, any>;
  property_mapping?: Record<string, string>;
  photo_mapping?: Record<string, any>;
  photo_data?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===================== КОРЗИНА =====================

export interface CartItem {
  id: string;
  product_id: string;
  product: Product;
  quantity: number;
  calculated_price: number;
  total_price: number;
  options: Record<string, any>;
  added_at: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  totals: {
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
  };
  created_at: string;
  updated_at: string;
}

// ===================== ЗАКАЗЫ =====================

export interface Quote {
  id: string;
  number: string;
  client_id: string;
  created_by: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  valid_until?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  items: QuoteItem[];
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface Invoice {
  id: string;
  number: string;
  client_id: string;
  created_by: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  notes?: string;
  terms?: string;
  items: InvoiceItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

// ===================== КЛИЕНТЫ =====================

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ===================== ПОЛЬЗОВАТЕЛИ =====================

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  role: 'ADMIN' | 'COMPLECTATOR' | 'EXECUTOR';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===================== СИСТЕМА ЭКСПОРТА =====================

export interface ExportOptions {
  format: 'html' | 'pdf' | 'xlsx' | 'csv';
  includeCSS: boolean;
  includeJS: boolean;
  minify: boolean;
  optimizeImages: boolean;
  targetCategory?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string | Buffer;
  filename?: string;
  mimeType?: string;
  error?: string;
}

// ===================== КОНТЕКСТЫ =====================

export interface DocumentContextType {
  document: DocumentData;
  updateDocument: (updates: Partial<DocumentData>) => void;
  addPage: (page: Page) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  deletePage: (pageId: string) => void;
}

// ===================== ПРОПСЫ КОМПОНЕНТОВ =====================

export interface ToolbarProps {
  zoom: number;
  viewMode: 'edit' | 'preview';
  pageWidth: number;
  pageHeight: number;
  onZoomChange: (zoom: number) => void;
  onViewModeChange: (mode: 'edit' | 'preview') => void;
  onPageSizeChange: (width: number, height: number) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  showComponentsPanel: boolean;
  showPropertiesPanel: boolean;
  showPagesPanel: boolean;
  showCatalogPanel: boolean;
  showSavePanel: boolean;
  onToggleComponentsPanel: () => void;
  onTogglePropertiesPanel: () => void;
  onTogglePagesPanel: () => void;
  onToggleCatalogPanel: () => void;
  onToggleSavePanel: () => void;
  onShowTemplates: () => void;
}

export interface CanvasProps {
  page: Page | undefined;
  selectedElementId: string | null;
  selectedElementIds: string[]; // Множественное выделение
  zoom: number;
  viewMode: 'edit' | 'preview';
  onSelectElement: (elementId: string | null) => void;
  onSelectElements: (elementIds: string[]) => void; // Новый обработчик для множественного выделения
  onUpdateElement: (elementId: string, updates: Partial<BaseElement>) => void;
  onDeleteElement: (elementId: string) => void;
  onAddElement: (elementType: string, position: Position) => void;
  onConnectionData?: (sourceElementId: string, data: any) => void;
  onUpdateConnection?: (connectionId: string, updates: Partial<BlockConnection>) => void;
  onDeleteConnection?: (connectionId: string) => void;
  onCreateConnection?: (sourceElementId: string, targetElementId: string, connectionType: BlockConnection['connectionType']) => void; // Новый обработчик для создания связи
}

export interface ComponentsPanelProps {
  onAddElement: (elementType: string, position: Position) => void;
  selectedCategory?: string | null;
}

export interface PropertiesPanelProps {
  element: BaseElement | null;
  page: Page | undefined;
  onUpdateElement: (elementId: string, updates: Partial<BaseElement>) => void;
  onUpdatePage: (updates: Partial<Page>) => void;
}

export interface ElementRendererProps {
  element: BaseElement;
  isSelected: boolean;
  isMultiSelected: boolean; // Новое свойство для множественного выделения
  zoom: number;
  onSelect: () => void;
  onMultiSelect: (e: React.MouseEvent) => void; // Новый обработчик для множественного выделения
  onUpdate: (updates: Partial<BaseElement>) => void;
  onDelete: () => void;
}
