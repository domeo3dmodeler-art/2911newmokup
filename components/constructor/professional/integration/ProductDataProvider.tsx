'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CatalogCategory, ProductProperty, Product, CatalogData } from './CatalogIntegration';
import { clientLogger } from '@/lib/logging/client-logger';

interface ProductDataContextType {
  // Данные
  categories: CatalogCategory[];
  products: Product[];
  properties: ProductProperty[];
  selectedCategory: CatalogCategory | null;
  
  // Состояние
  loading: boolean;
  error: string | null;
  
  // Действия
  selectCategory: (categoryId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  getProductsByProperty: (propertyKey: string, value: string) => Product[];
  getPropertyValues: (propertyKey: string) => string[];
}

const ProductDataContext = createContext<ProductDataContextType | undefined>(undefined);

interface ProductDataProviderProps {
  children: ReactNode;
}

export const ProductDataProvider: React.FC<ProductDataProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка дерева каталога
  const loadCategories = async () => {
    try {
      const response = await fetch('/api/catalog/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    }
  };

  // Загрузка товаров категории
  const loadCategoryProducts = async (categoryId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/products/category/${categoryId}?limit=1000`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      if (data.success) {
        setProducts(data.data.products || []);
        setProperties(data.data.filters?.available || []);
        
        // Находим выбранную категорию
        const category = findCategoryById(categoryId);
        setSelectedCategory(category);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Поиск категории по ID
  const findCategoryById = (categoryId: string): CatalogCategory | null => {
    const findInCategories = (cats: CatalogCategory[]): CatalogCategory | null => {
      for (const cat of cats) {
        if (cat.id === categoryId) {
          return cat;
        }
        if (cat.subcategories) {
          const found = findInCategories(cat.subcategories);
          if (found) return found;
        }
      }
      return null;
    };
    
    return findInCategories(categories);
  };

  // Выбор категории
  const selectCategory = async (categoryId: string) => {
    try {
      await loadCategoryProducts(categoryId);
    } catch (err) {
      clientLogger.error('Error selecting category:', err);
    }
  };

  // Обновление данных
  const refreshData = async () => {
    try {
      setLoading(true);
      await loadCategories();
      if (selectedCategory) {
        await loadCategoryProducts(selectedCategory.id);
      }
    } catch (err) {
      clientLogger.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Поиск товаров
  const searchProducts = async (query: string): Promise<Product[]> => {
    if (!selectedCategory) return [];
    
    try {
      const response = await fetch(
        `/api/products/category/${selectedCategory.id}?search=${encodeURIComponent(query)}&limit=1000`
      );
      if (!response.ok) {
        throw new Error('Failed to search products');
      }
      
      const data = await response.json();
      return data.success ? data.data.products || [] : [];
    } catch (err) {
      clientLogger.error('Error searching products:', err);
      return [];
    }
  };

  // Получение товаров по свойству
  const getProductsByProperty = (propertyKey: string, value: string): Product[] => {
    return products.filter(product => {
      const propertyValue = product.properties_data[propertyKey];
      return propertyValue === value || String(propertyValue) === String(value);
    });
  };

  // Получение уникальных значений свойства
  const getPropertyValues = (propertyKey: string): string[] => {
    const values = new Set<string>();
    
    products.forEach(product => {
      const value = product.properties_data[propertyKey];
      if (value !== null && value !== undefined && value !== '') {
        values.add(String(value));
      }
    });
    
    return Array.from(values).sort();
  };

  // Инициализация
  useEffect(() => {
    loadCategories();
  }, []);

  const contextValue: ProductDataContextType = {
    categories,
    products,
    properties,
    selectedCategory,
    loading,
    error,
    selectCategory,
    refreshData,
    searchProducts,
    getProductsByProperty,
    getPropertyValues
  };

  return (
    <ProductDataContext.Provider value={contextValue}>
      {children}
    </ProductDataContext.Provider>
  );
};

// Хук для использования контекста
export const useProductData = (): ProductDataContextType => {
  const context = useContext(ProductDataContext);
  if (context === undefined) {
    throw new Error('useProductData must be used within a ProductDataProvider');
  }
  return context;
};

