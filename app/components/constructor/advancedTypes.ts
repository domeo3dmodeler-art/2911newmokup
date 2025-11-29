// Расширенные типы для продвинутого конструктора

// CategoryLink removed - categories are now simply part of one configurator category

export interface ProductDisplaySettings {
  categoryId: string;
  showPrices: boolean;
  showImages: boolean;
  showDescriptions: boolean;
  columns: number;
  itemsPerPage: number;
  sortBy: 'name' | 'price' | 'popularity' | 'custom';
  filters: ProductFilter[];
}

export interface ProductFilter {
  id: string;
  field: string;
  type: 'select' | 'range' | 'checkbox' | 'text';
  label: string;
  options?: string[];
  minValue?: number;
  maxValue?: number;
}

export interface CartDisplaySettings {
  showItemDetails: boolean;
  showSubtotals: boolean;
  showTotal: boolean;
  groupByCategory: boolean;
  showQuantityControls: boolean;
  allowItemRemoval: boolean;
  showPricingBreakdown: boolean;
}

export interface AdvancedConstructorElement {
  id: string;
  type: 'layout' | 'content' | 'product' | 'cart' | 'configurator';
  component: string;
  props: Record<string, any>;
  position: { x: number; y: number };
  size: { width: string; height: string };
  responsive: ResponsiveSettings;
  layout: LayoutSettings;
  productSettings?: ProductDisplaySettings;
  cartSettings?: CartDisplaySettings;
  categoryLinks?: CategoryLink[];
  styles?: Record<string, any>;
}

export interface LayoutSettings {
  width: 'full' | 'half' | 'third' | 'quarter' | 'custom';
  customWidth?: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  margin: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  padding: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: string;
  borderRadius?: string;
}

export interface ResponsiveSettings {
  desktop?: Partial<LayoutSettings>;
  tablet?: Partial<LayoutSettings>;
  mobile?: Partial<LayoutSettings>;
}

export interface ConfiguratorSettings {
  mainCategory: string;
  additionalCategories: CategoryLink[];
  pricingFormula: string;
  displayOptions: {
    showPriceBreakdown: boolean;
    showQuantityControls: boolean;
    allowCustomQuantities: boolean;
    groupItemsByCategory: boolean;
  };
  validation: {
    requiredFields: string[];
    minQuantity: number;
    maxQuantity: number;
  };
}

export interface AdvancedConstructorState {
  elements: AdvancedConstructorElement[];
  selectedElementId: string | null;
  categoryLinks: CategoryLink[];
  globalSettings: {
    currency: string;
    taxRate: number;
    showPrices: boolean;
    allowGuestCheckout: boolean;
  };
  history: AdvancedConstructorElement[][];
  historyPointer: number;
}
