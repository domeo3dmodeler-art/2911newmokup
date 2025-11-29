// Типы для UltimateConstructorFixed

export interface DragState {
  isDragging: boolean;
  dragType: 'new' | 'move' | 'resize';
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  draggedItem: {
    id: string;
    type: string;
    source: 'palette' | 'canvas';
  } | null;
  dragOffset: { x: number; y: number };
}

export interface BlockSettings {
  id: string;
  name: string;
  type: 'category-title' | 'main-category' | 'subcategory' | 'additional-category' | 'product-selector' | 'filter-constructor' | 'product-image' | 'cart-export' | 'text' | 'document-generator' | 'cart';
  
  // Позиция и размеры
  x: number;
  y: number;
  width: number;
  height: number;

  // Настройки для новых блоков
  categoryTitleSettings?: {
    title: string;
    subtitle?: string;
    showBreadcrumbs: boolean;
    showProductCount: boolean;
  };

  mainCategorySettings?: {
    categoryId: string;
    layout: 'grid' | 'list' | 'masonry';
    columns: number;
    itemsPerPage: number;
    showImages: boolean;
    showPrices: boolean;
    showDescriptions: boolean;
    imageSize: 'small' | 'medium' | 'large';
    imageAspectRatio: 'square' | 'landscape' | 'portrait';
    showCaptions: boolean;
    captionProperty: 'name' | 'description' | 'price' | 'material' | 'color';
  };

  subcategorySettings?: {
    parentCategoryId: string;
    layout: 'horizontal' | 'vertical' | 'grid';
    maxSubcategories: number;
    showProductCount: boolean;
    showImages: boolean;
    showDescriptions: boolean;
    imageSize: 'small' | 'medium' | 'large';
    imageAspectRatio: 'square' | 'landscape' | 'portrait';
  };

  additionalCategorySettings?: {
    categoryId: string;
    pricingStrategy: 'separate' | 'combined';
    targetMainCategory?: string;
    showImages: boolean;
    showPrices: boolean;
    showDescriptions: boolean;
    imageSize: 'small' | 'medium' | 'large';
    imageAspectRatio: 'square' | 'landscape' | 'portrait';
    showCaptions: boolean;
    captionProperty: 'name' | 'description' | 'price' | 'material' | 'color';
  };

  productSelectorSettings?: {
    categoryId: string;
    selectedProperties: string[];
    layout: 'horizontal' | 'vertical';
    showPrice: boolean;
    showImage: boolean;
    showDescription: boolean;
  };

  filterConstructorSettings?: {
    categoryId: string;
    selectedFilters: string[];
    layout: 'horizontal' | 'vertical' | 'sidebar';
    showApplyButton: boolean;
    showClearButton: boolean;
    autoApply: boolean;
    showResultCount: boolean;
  };

  productImageSettings?: {
    size: 'small' | 'medium' | 'large' | 'fullscreen';
    aspectRatio: 'square' | 'landscape' | 'portrait' | 'auto';
    showGallery: boolean;
    showZoom: boolean;
    showThumbnails: boolean;
    zoomLevel: number;
  };

  cartExportSettings?: {
    quote: {
      enabled: boolean;
      showPrices: boolean;
      showTotals: boolean;
    };
    invoice: {
      enabled: boolean;
      showPrices: boolean;
      showTaxes: boolean;
      showTotals: boolean;
    };
    order: {
      enabled: boolean;
      showPrices: boolean;
      showDelivery: boolean;
      showTotals: boolean;
    };
    combineAdditionalCategories: boolean;
    showSeparateLines: boolean;
    calculateTotal: boolean;
  };
  
  // Настройки макета
  displayWidth: '25%' | '33%' | '50%' | '66%' | '75%' | '100%' | 'custom';
  customWidth?: string;
  alignment: 'left' | 'center' | 'right';
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  backgroundColor: string;
  borderColor: string;
  borderRadius: string;
  zIndex: number;
  
  // Настройки товаров
  productSettings?: {
    categoryId: string;
    showImages: boolean;
    imageSize: 'small' | 'medium' | 'large';
    imageAspectRatio: 'square' | 'landscape' | 'portrait';
    showPrices: boolean;
    showDescriptions: boolean;
    columns: number;
    itemsPerPage: number;
    sortBy: 'name' | 'price' | 'popularity';
    filters: Array<{ field: string; operator: string; value: unknown }>;
  };
  
  // Настройки детального просмотра
  detailViewSettings?: {
    showImages: boolean;
    imageSize: 'small' | 'medium' | 'large';
    showPrices: boolean;
    showDescriptions: boolean;
    showProperties: boolean;
    showRelatedProducts: boolean;
  };
  
  // Настройки текста
  textSettings?: {
    content: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: string;
  };
  
  // Настройки документа
  documentSettings?: {
    template: string;
    showHeader: boolean;
    showFooter: boolean;
    showLogo: boolean;
    showPrices: boolean;
    showTotals: boolean;
  };
  
  // Настройки фильтров
  filterSettings?: {
    filters: Array<{ field: string; operator: string; value: unknown }>;
    showApplyButton: boolean;
  };
}

export interface AvailableBlock {
  type: BlockSettings['type'];
  name: string;
  icon: string;
  description: string;
}

