// Типы для профессионального конструктора с drag & drop

declare global {
  interface Window {
    handleBlockDrop: (dragItem: DragItem, position: { x: number; y: number }) => void;
  }
}

export interface DragItem {
  id: string;
  type: string;
  source: 'palette' | 'canvas';
}

export interface BlockDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

export interface ImagePreviewSettings {
  size: 'thumbnail' | 'small' | 'medium' | 'large';
  aspectRatio: 'square' | 'landscape' | 'portrait' | 'auto';
  borderRadius: number;
  shadow: boolean;
  captionField: string; // поле из товара для подписи
  placeholderImage: string;
  showOnHover: boolean;
}

export interface ProductFilter {
  id: string;
  field: string;
  type: 'select' | 'range' | 'checkbox' | 'text' | 'color';
  label: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
  required: boolean;
  showInProductCard: boolean;
  showInFilters: boolean;
}

export interface ProfessionalBlock {
  id: string;
  name: string;
  type: 'product-grid' | 'product-configurator' | 'cart-display' | 'text' | 'image' | 'filter' | 'product-gallery' | 'product-detail';
  
  // Позиция и размеры
  position: BlockDimensions;
  isDragging: boolean;
  isResizing: boolean;
  
  // Настройки макета
  width: '25%' | '33%' | '50%' | '66%' | '75%' | '100%' | 'custom';
  customWidth?: string;
  alignment: 'left' | 'center' | 'right';
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  backgroundColor?: string;
  borderColor?: string;
  borderRadius?: string;
  zIndex: number;
  
  // Настройки товаров
  productSettings?: {
    categoryId: string;
    showImages: boolean;
    imageSettings: ImagePreviewSettings;
    showPrices: boolean;
    priceFormat: 'with-currency' | 'without-currency';
    showDescriptions: boolean;
    descriptionLength: 'short' | 'medium' | 'full';
    showAddToCart: boolean;
    columns: number;
    itemsPerPage: number;
    sortBy: 'name' | 'price' | 'popularity' | 'newest';
    filters: ProductFilter[];
    showProductCount: boolean;
    showPagination: boolean;
  };
  
  // Настройки галереи товаров
  gallerySettings?: {
    categoryId: string;
    layout: 'grid' | 'carousel' | 'masonry';
    columns: number;
    imageSettings: ImagePreviewSettings;
    showThumbnails: boolean;
    showNavigation: boolean;
    autoPlay: boolean;
    showProductInfo: boolean;
  };
  
  // Настройки детального просмотра товара
  detailSettings?: {
    showMainImage: boolean;
    showThumbnailGallery: boolean;
    showZoom: boolean;
    imageSettings: ImagePreviewSettings;
    showProductInfo: boolean;
    showPrice: boolean;
    showDescription: boolean;
    showSpecifications: boolean;
    showRelatedProducts: boolean;
  };
  
  // Настройки конфигуратора
  configuratorSettings?: {
    mainCategory: string;
    showCalculator: boolean;
    showPriceBreakdown: boolean;
    allowCustomQuantities: boolean;
    requiredFields: string[];
    showImagePreview: boolean;
  };
  
  // Настройки корзины
  cartSettings?: {
    showItemDetails: boolean;
    showSubtotals: boolean;
    showTotal: boolean;
    groupByCategory: boolean;
    showQuantityControls: boolean;
    allowItemRemoval: boolean;
    showPricingBreakdown: boolean;
    currency: string;
    showImages: boolean;
    imageSize: 'small' | 'medium';
  };
  
  // Настройки текста
  textSettings?: {
    content: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: string;
    color: string;
    backgroundColor?: string;
    padding: string;
  };
  
  // Настройки изображения
  imageSettings?: {
    src: string;
    alt: string;
    width: string;
    height: string;
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down';
    borderRadius: string;
    shadow: boolean;
    caption?: string;
    clickAction: 'none' | 'zoom' | 'link' | 'gallery';
  };
  
  // Настройки фильтров
  filterSettings?: {
    categoryId: string;
    availableFilters: string[];
    showSearch: boolean;
    showSorting: boolean;
    showPriceRange: boolean;
    layout: 'horizontal' | 'vertical' | 'dropdown';
    showFilterCount: boolean;
  };
}

export interface CanvasState {
  blocks: ProfessionalBlock[];
  selectedBlockId: string | null;
  draggedBlockId: string | null;
  draggedItem: DragItem | null;
  dropZone: string | null;
  gridSize: number;
  snapToGrid: boolean;
  showGrid: boolean;
  zoom: number;
  pan: { x: number; y: number };
}

export interface DragState {
  isDragging: boolean;
  dragType: 'move' | 'resize' | 'new';
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  draggedBlockId: string | null;
  draggedItem: DragItem | null;
  dropZone: string | null;
  dragPreview: any;
}
