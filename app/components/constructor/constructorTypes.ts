// Типы данных для профессионального конструктора страниц

// ===== БАЗОВЫЕ ТИПЫ =====

export interface Category {
  id: string;
  name: string;
  parentId?: string;
  level: number;
  properties: Property[];
  products: Product[];
  image?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Property {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'color' | 'boolean';
  values?: string[];
  unit?: string;
  required: boolean;
  filterable: boolean;
  displayable: boolean;
  categoryId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  properties: { [propertyId: string]: any };
  categoryId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode {
  id: string;
  name: string;
  level: number;
  children: CategoryTreeNode[];
  productCount: number;
  isExpanded: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface UserBehavior {
  userId: string;
  action: 'view' | 'filter' | 'select' | 'purchase';
  categoryId?: string;
  productId?: string;
  propertyId?: string;
  value?: any;
  timestamp: Date;
}

export interface FilterPreferences {
  preferredFilters: string[];
  filterOrder: string[];
  defaultValues: { [propertyId: string]: any };
}

// ===== БЛОКИ КОНСТРУКТОРА =====

export interface BaseBlock {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor: string;
  borderColor: string;
  borderRadius: string;
  zIndex: number;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Блок 1: Наименование категории
export interface CategoryTitleBlock extends BaseBlock {
  type: 'category-title';
  settings: {
    categoryId: string;
    title: string;
    subtitle?: string;
    showBreadcrumbs: boolean;
    showProductCount: boolean;
    breadcrumbSeparator: string;
    titleStyle: {
      fontSize: string;
      fontWeight: 'normal' | 'bold';
      color: string;
      textAlign: 'left' | 'center' | 'right';
    };
    subtitleStyle: {
      fontSize: string;
      fontWeight: 'normal' | 'bold';
      color: string;
      textAlign: 'left' | 'center' | 'right';
    };
  };
}

// Блок 2: Основная категория товаров
export interface MainCategoryBlock extends BaseBlock {
  type: 'main-category';
  settings: {
    categoryId: string;
    subcategoryIds: string[];
    productDisplay: {
      layout: 'grid' | 'list' | 'masonry';
      columns: number;
      itemsPerPage: number;
      imageSize: 'small' | 'medium' | 'large';
      showImages: boolean;
      showPrices: boolean;
      showDescriptions: boolean;
      showProperties: string[]; // ID выбранных свойств
    };
    categoryTree: CategoryTreeNode;
    sorting: {
      field: 'name' | 'price' | 'createdAt' | 'popularity';
      direction: 'asc' | 'desc';
    };
    pagination: {
      enabled: boolean;
      showPageNumbers: boolean;
      showPrevNext: boolean;
    };
  };
}

// Блок 3: Подкатегории товаров
export interface SubcategoryBlock extends BaseBlock {
  type: 'subcategory';
  settings: {
    parentCategoryId: string;
    subcategories: {
      id: string;
      name: string;
      productCount: number;
      image?: string;
      description?: string;
    }[];
    layout: 'horizontal' | 'vertical' | 'grid';
    showProductCount: boolean;
    showImages: boolean;
    showDescriptions: boolean;
    maxSubcategories: number;
    cardStyle: {
      backgroundColor: string;
      borderColor: string;
      borderRadius: string;
      padding: string;
      hoverEffect: boolean;
    };
  };
}

// Блок 4: Дополнительные категории
export interface AdditionalCategoryBlock extends BaseBlock {
  type: 'additional-category';
  settings: {
    categoryId: string;
    pricingStrategy: 'separate' | 'combined';
    targetMainCategory?: string;
    displaySettings: {
      layout: 'grid' | 'list';
      columns: number;
      imageSize: 'small' | 'medium' | 'large';
      showImages: boolean;
      showPrices: boolean;
      showDescriptions: boolean;
    };
    combinationRules: {
      combineWithMain: boolean;
      showAsSeparateLine: boolean;
      calculateTotal: boolean;
      displayCombinedPrice: boolean;
    };
  };
}

// Блок 5: Конструктор подбора товара
export interface ProductSelectorBlock extends BaseBlock {
  type: 'product-selector';
  settings: {
    categoryId: string;
    selectorProperties: {
      propertyId: string;
      propertyName: string;
      inputType: 'select' | 'radio' | 'checkbox' | 'range' | 'color' | 'text' | 'number';
      required: boolean;
      defaultValue?: any;
      options?: SelectOption[];
      placeholder?: string;
      min?: number;
      max?: number;
      step?: number;
    }[];
    display: {
      showPrice: boolean;
      showImage: boolean;
      showDescription: boolean;
      showSelectedProperties: boolean;
      priceFormat: 'simple' | 'detailed' | 'withDiscount';
    };
    layout: {
      orientation: 'horizontal' | 'vertical';
      columns: number;
      spacing: string;
    };
  };
}

// Блок 6: Конструктор фильтров
export interface FilterConstructorBlock extends BaseBlock {
  type: 'filter-constructor';
  settings: {
    categoryId: string;
    filterProperties: {
      propertyId: string;
      propertyName: string;
      filterType: 'range' | 'select' | 'multiselect' | 'checkbox' | 'color';
      showInFilter: boolean;
      position: number;
      defaultValue?: any;
      options?: SelectOption[];
    }[];
    layout: {
      orientation: 'horizontal' | 'vertical' | 'sidebar';
      columns: number;
      spacing: string;
    };
    controls: {
      showApplyButton: boolean;
      showClearButton: boolean;
      autoApply: boolean;
      showResultCount: boolean;
    };
    styling: {
      backgroundColor: string;
      borderColor: string;
      borderRadius: string;
      padding: string;
    };
  };
}

// Блок 7: Блок изображения товара
export interface ProductImageBlock extends BaseBlock {
  type: 'product-image';
  settings: {
    imageSettings: {
      size: 'small' | 'medium' | 'large' | 'fullscreen';
      aspectRatio: 'square' | 'landscape' | 'portrait' | 'auto';
      showGallery: boolean;
      showZoom: boolean;
      showThumbnails: boolean;
      thumbnailSize: 'small' | 'medium' | 'large';
      zoomLevel: number;
    };
    targetProduct?: string;
    fallbackImage?: string;
    styling: {
      borderColor: string;
      borderRadius: string;
      shadow: boolean;
      hoverEffect: boolean;
    };
  };
}

// Блок 8: Корзина с экспортами
export interface CartExportBlock extends BaseBlock {
  type: 'cart-export';
  settings: {
    exportSettings: {
      quote: {
        enabled: boolean;
        template: string;
        showPrices: boolean;
        showTotals: boolean;
        showTaxes: boolean;
        customFields: string[];
      };
      invoice: {
        enabled: boolean;
        template: string;
        showPrices: boolean;
        showTaxes: boolean;
        showTotals: boolean;
        taxRate: number;
        customFields: string[];
      };
      order: {
        enabled: boolean;
        template: string;
        showPrices: boolean;
        showDelivery: boolean;
        showTotals: boolean;
        deliveryOptions: string[];
        customFields: string[];
      };
    };
    pricingRules: {
      combineAdditionalCategories: boolean;
      showSeparateLines: boolean;
      calculateTotal: boolean;
      showTaxes: boolean;
      showDiscounts: boolean;
    };
    display: {
      showItemImages: boolean;
      showItemDescriptions: boolean;
      showItemProperties: boolean;
      allowQuantityChange: boolean;
      allowItemRemoval: boolean;
    };
  };
}

// Блок 9: Текстовый блок
export interface TextBlock extends BaseBlock {
  type: 'text';
  settings: {
    content: string;
    formatting: {
      fontSize: string;
      fontFamily: string;
      fontWeight: 'normal' | 'bold' | 'light';
      textAlign: 'left' | 'center' | 'right' | 'justify';
      color: string;
      backgroundColor: string;
      padding: string;
      margin: string;
      lineHeight: number;
      letterSpacing: string;
    };
    advanced: {
      allowHtml: boolean;
      allowMarkdown: boolean;
      autoLink: boolean;
      showWordCount: boolean;
    };
  };
}

// Блок 10: Блок изображения (общий)
export interface ImageBlock extends BaseBlock {
  type: 'image';
  settings: {
    src: string;
    alt: string;
    width: string;
    height: string;
    objectFit: 'cover' | 'contain' | 'fill' | 'scale-down';
    borderRadius: string;
    shadow: boolean;
    hoverEffect: boolean;
    clickAction: 'none' | 'zoom' | 'link' | 'gallery';
    linkUrl?: string;
  };
}

// ===== AI ИНСТРУМЕНТЫ =====

export interface AIBlockSuggestion {
  suggestion: {
    blockType: string;
    position: { x: number; y: number };
    settings: Partial<BaseBlock>;
    reason: string;
    confidence: number; // 0-1
  }[];
}

export interface AIUXOptimization {
  suggestions: {
    type: 'layout' | 'content' | 'navigation' | 'performance';
    description: string;
    impact: 'low' | 'medium' | 'high';
    implementation: string;
    estimatedTime: string;
  }[];
}

export interface AICategoryBuilder {
  generateCategoryStructure: (products: Product[]) => CategoryTree;
  suggestProductGrouping: (products: Product[]) => ProductGroup[];
  optimizeCategoryNames: (categories: Category[]) => Category[];
  suggestProperties: (products: Product[]) => Property[];
}

export interface AIFilterOptimization {
  suggestFilterProperties: (products: Product[]) => Property[];
  optimizeFilterOrder: (filters: Filter[]) => Filter[];
  predictUserPreferences: (userBehavior: UserBehavior[]) => FilterPreferences;
  suggestDefaultValues: (filters: Filter[], userBehavior: UserBehavior[]) => { [propertyId: string]: any };
}

// ===== ДОПОЛНИТЕЛЬНЫЕ ТИПЫ =====

export interface CategoryTree {
  root: CategoryTreeNode;
  flat: Category[];
  maxLevel: number;
}

export interface ProductGroup {
  id: string;
  name: string;
  products: Product[];
  commonProperties: Property[];
  averagePrice: number;
  priceRange: { min: number; max: number };
}

export interface Filter {
  id: string;
  propertyId: string;
  type: string;
  position: number;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  selectedProperties: { [propertyId: string]: any };
  price: number;
  categoryId: string;
  isMainCategory: boolean;
}

export interface ExportTemplate {
  id: string;
  name: string;
  type: 'quote' | 'invoice' | 'order';
  template: string;
  variables: string[];
  isDefault: boolean;
}

// ===== СОСТОЯНИЕ КОНСТРУКТОРА =====

export interface ConstructorState {
  blocks: BaseBlock[];
  selectedBlockId: string | null;
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  aiSuggestions: AIBlockSuggestion | null;
  isAIEnabled: boolean;
  snapToGrid: boolean;
  showGrid: boolean;
  pageSettings: {
    width: number;
    height: number;
    backgroundColor: string;
    title: string;
    description: string;
  };
}

// ===== ДЕЙСТВИЯ КОНСТРУКТОРА =====

export type ConstructorAction = 
  | { type: 'ADD_BLOCK'; payload: BaseBlock }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; updates: Partial<BaseBlock> } }
  | { type: 'DELETE_BLOCK'; payload: string }
  | { type: 'DUPLICATE_BLOCK'; payload: string }
  | { type: 'SELECT_BLOCK'; payload: string | null }
  | { type: 'MOVE_BLOCK'; payload: { id: string; x: number; y: number } }
  | { type: 'RESIZE_BLOCK'; payload: { id: string; width: number; height: number } }
  | { type: 'LOAD_CATEGORIES'; payload: Category[] }
  | { type: 'LOAD_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; updates: Partial<CartItem> } }
  | { type: 'CLEAR_CART' }
  | { type: 'GENERATE_AI_SUGGESTIONS'; payload: AIBlockSuggestion }
  | { type: 'APPLY_AI_SUGGESTION'; payload: { suggestionId: string } }
  | { type: 'TOGGLE_AI'; payload: boolean }
  | { type: 'TOGGLE_SNAP_TO_GRID'; payload: boolean }
  | { type: 'TOGGLE_SHOW_GRID'; payload: boolean }
  | { type: 'UPDATE_PAGE_SETTINGS'; payload: Partial<ConstructorState['pageSettings']> };




