import { useState, useEffect } from 'react';
import { clientLogger } from '@/lib/logging/client-logger';

// Типы данных для каталога
export interface CatalogCategory {
  id: string;
  name: string;
  parent_id?: string;
  level: number;
  path: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  products_count?: number;
  subcategories?: CatalogCategory[];
}

export interface ProductProperty {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date' | 'file';
  description?: string;
  options?: string;
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  catalog_category_id: string;
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  series?: string;
  base_price: number;
  currency: string;
  stock_quantity: number;
  min_order_qty: number;
  weight?: number;
  dimensions: string;
  specifications: string;
  properties_data: string;
  tags: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  catalog_category?: {
    id: string;
    name: string;
    level: number;
    path: string;
  };
  images?: ProductImage[];
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

// Хук для работы с каталогом
export const useCatalogData = () => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка дерева каталога
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/catalog/categories');
      if (!response.ok) {
        throw new Error('Ошибка загрузки категорий');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      clientLogger.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка товаров по категории
  const loadProducts = async (categoryId?: string, limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      params.append('limit', limit.toString());
      
      const response = await fetch(`/api/catalog/products?${params}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки товаров');
      }
      
      const data = await response.json();
      if (data.success) {
        setProducts(data.products || []);
      } else {
        throw new Error(data.message || 'Ошибка загрузки товаров');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      clientLogger.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка свойств товаров для категории
  const loadProperties = async (categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      
      const response = await fetch(`/api/catalog/properties?${params}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки свойств');
      }
      
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      clientLogger.error('Error loading properties:', err);
    } finally {
      setLoading(false);
    }
  };

  // Поиск товаров
  const searchProducts = async (query: string, categoryId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('search', query);
      if (categoryId) params.append('categoryId', categoryId);
      params.append('limit', '20');
      
      const response = await fetch(`/api/catalog/products?${params}`);
      if (!response.ok) {
        throw new Error('Ошибка поиска товаров');
      }
      
      const data = await response.json();
      if (data.success) {
        return data.products || [];
      } else {
        throw new Error(data.message || 'Ошибка поиска товаров');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      clientLogger.error('Error searching products:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Получение товара по ID
  const getProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/catalog/products/${productId}`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки товара');
      }
      
      const data = await response.json();
      if (data.success) {
        return data.product;
      } else {
        throw new Error(data.message || 'Ошибка загрузки товара');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
      clientLogger.error('Error loading product:', err);
      return null;
    }
  };

  // Загрузка изображений товара
  const loadProductImages = async (productId: string) => {
    try {
      const response = await fetch(`/api/catalog/products/${productId}/images`);
      if (!response.ok) {
        throw new Error('Ошибка загрузки изображений');
      }
      
      const data = await response.json();
      if (data.success) {
        return data.images || [];
      } else {
        throw new Error(data.message || 'Ошибка загрузки изображений');
      }
    } catch (err) {
      clientLogger.error('Error loading product images:', err);
      return [];
    }
  };

  // Утилиты для работы с данными
  const getCategoryById = (id: string): CatalogCategory | undefined => {
    const findCategory = (cats: CatalogCategory[]): CatalogCategory | undefined => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.subcategories) {
          const found = findCategory(cat.subcategories);
          if (found) return found;
        }
      }
      return undefined;
    };
    return findCategory(categories);
  };

  const getCategoryPath = (categoryId: string): string[] => {
    const category = getCategoryById(categoryId);
    if (!category) return [];
    
    const path = [category.name];
    if (category.parent_id) {
      const parentPath = getCategoryPath(category.parent_id);
      return [...parentPath, ...path];
    }
    return path;
  };

  const getCategoryProductsCount = (categoryId: string): number => {
    const category = getCategoryById(categoryId);
    return category?.products_count || 0;
  };

  const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter(p => p.catalog_category_id === categoryId);
  };

  const getPropertyValues = (product: Product, propertyName: string): any => {
    try {
      const propertiesData = JSON.parse(product.properties_data || '{}');
      return propertiesData[propertyName];
    } catch {
      return null;
    }
  };

  const getProductPrimaryImage = (product: Product): ProductImage | null => {
    if (!product.images || product.images.length === 0) return null;
    return product.images.find(img => img.is_primary) || product.images[0];
  };

  // Автоматическая загрузка категорий при инициализации
  useEffect(() => {
    loadCategories();
  }, []);

  return {
    // Данные
    categories,
    products,
    properties,
    loading,
    error,
    
    // Методы загрузки
    loadCategories,
    loadProducts,
    loadProperties,
    searchProducts,
    getProduct,
    loadProductImages,
    
    // Утилиты
    getCategoryById,
    getCategoryPath,
    getCategoryProductsCount,
    getProductsByCategory,
    getPropertyValues,
    getProductPrimaryImage,
    
    // Сброс состояния
    clearError: () => setError(null),
  };
};




