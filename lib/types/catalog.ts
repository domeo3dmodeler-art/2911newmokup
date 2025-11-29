// Типы для системы каталога товаров

export interface CatalogImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  warnings: string[];
  categories: Array<{
    name: string;
    level: number;
    path: string;
    parent?: string;
    fullPath?: string;
  }>;
}

export interface CatalogCategory {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Связанные данные
  subcategories?: CatalogCategory[];
  parent?: CatalogCategory;
  products_count?: number;
}

export interface ProductProperty {
  id: string;
  name: string;
  type: PropertyType;
  description?: string;
  options?: string[]; // для select полей
  is_required: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  categories?: Array<{
    id: string;
    name: string;
    is_required: boolean;
    is_for_calculator: boolean;
    is_for_export: boolean;
  }>;
}

export type PropertyType = 'text' | 'number' | 'select' | 'boolean' | 'date' | 'file';

export interface CategoryPropertyAssignment {
  id: string;
  catalog_category_id: string;
  product_property_id: string;
  is_required: boolean;
  is_for_calculator: boolean;
  is_for_export: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  
  // Связанные данные
  product_property?: ProductProperty;
}

export interface ImportTemplate {
  id: string;
  catalog_category_id: string;
  name: string;
  required_fields: string[];
  calculator_fields: string[];
  export_fields: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ExportSetting {
  id: string;
  catalog_category_id: string;
  export_type: ExportType;
  fields_config: ExportFieldConfig[];
  display_config: ExportDisplayConfig;
  created_at: Date;
  updated_at: Date;
}

export type ExportType = 'quote' | 'invoice' | 'supplier_order';

export interface ExportFieldConfig {
  property_id: string;
  property_name: string;
  display_name: string;
  is_visible: boolean;
  sort_order: number;
  format?: string; // для форматирования значений
}

export interface ExportDisplayConfig {
  title: string;
  show_header: boolean;
  show_footer: boolean;
  show_totals: boolean;
  currency: string;
  tax_rate: number;
  template_id?: string;
}

export interface FrontendCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  catalog_category_ids: string[];
  display_config: FrontendDisplayConfig;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FrontendDisplayConfig {
  layout: 'grid' | 'list' | 'table';
  show_filters: boolean;
  show_search: boolean;
  items_per_page: number;
  sort_options: SortOption[];
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  label: string;
}

// DTO для API
export interface CreateCatalogCategoryDto {
  name: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface UpdateCatalogCategoryDto {
  name?: string;
  parent_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateProductPropertyDto {
  name: string;
  type: PropertyType;
  description?: string;
  options?: string[];
  is_required?: boolean;
  is_active?: boolean;
}

export interface UpdateProductPropertyDto {
  name?: string;
  type?: PropertyType;
  description?: string;
  options?: string[];
  is_required?: boolean;
  is_active?: boolean;
}

export interface CreatePropertyAssignmentDto {
  catalog_category_id: string;
  product_property_id: string;
  is_required?: boolean;
  is_for_calculator?: boolean;
  is_for_export?: boolean;
  sort_order?: number;
}

export interface UpdatePropertyAssignmentDto {
  is_required?: boolean;
  is_for_calculator?: boolean;
  is_for_export?: boolean;
  sort_order?: number;
}

export interface CreateImportTemplateDto {
  catalog_category_id: string;
  name: string;
  required_fields: string[];
  calculator_fields: string[];
  export_fields: string[];
}

export interface CreateExportSettingDto {
  catalog_category_id: string;
  export_type: ExportType;
  fields_config: ExportFieldConfig[];
  display_config: ExportDisplayConfig;
}

export interface CreateFrontendCategoryDto {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  catalog_category_ids: string[];
  display_config?: FrontendDisplayConfig;
  is_active?: boolean;
}

// Ответы API
export interface CatalogTreeResponse {
  categories: CatalogCategory[];
  total_count: number;
}

export interface PropertyModerationResponse {
  properties: ProductProperty[];
  pending_count: number;
  total_count: number;
}

export interface CategoryWithPropertiesResponse extends CatalogCategory {
  property_assignments: CategoryPropertyAssignment[];
  import_templates: ImportTemplate[];
  export_settings: ExportSetting[];
}
