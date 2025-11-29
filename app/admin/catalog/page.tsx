'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui';
import { Plus, Search, Folder, FolderOpen, Edit, Trash2, Settings, ChevronRight, ChevronDown, Package, Package2 } from 'lucide-react';
import { CatalogCategory, CreateCatalogCategoryDto } from '@/lib/types/catalog';
import TemplateManager from '../../../components/admin/TemplateManager';
import PriceListExporter from '../../../components/admin/PriceListExporter';
import BulkEditDialog from '../../../components/admin/BulkEditDialog';
import ProductFilters from '../../../components/admin/ProductFilters';
import ImportInstructionsDialog from '../../../components/admin/ImportInstructionsDialog';
import InstructionsModal from '../../../components/admin/InstructionsModal';
import { fixFieldsEncoding } from '@/lib/encoding-utils';
import { clientLogger } from '@/lib/logging/client-logger';
import { parseApiResponse } from '@/lib/utils/parse-api-response';
import { fetchWithAuth } from '@/lib/utils/fetch-with-auth';

  // Функция анализа свойств группы товаров
  const analyzeGroupProperties = (products: Product[]) => {
    const allKeys = new Set<string>();
    
    products.forEach((product) => {
      if (product.properties_data) {
        const props = typeof product.properties_data === 'string' 
          ? JSON.parse(product.properties_data) 
          : product.properties_data;
        
        Object.keys(props).forEach(key => {
          // Исключаем системные поля
          if (!['photos', 'images', 'id', 'created_at', 'updated_at'].includes(key)) {
            allKeys.add(key);
          }
        });
      }
    });
    
    return Array.from(allKeys).sort();
  };

// Маппинг ключей на читаемые названия
const getDisplayName = (key: string): string => {
  const mapping: Record<string, string> = {
    'Domeo_наименование для Web': 'Название для Web',
    'Domeo_наименование ручки_1С': 'Название ручки 1С',
    'Domeo_цена группы Web': 'Цена группы Web',
    'Фабрика_артикул': 'Фабрика артикул',
    'Фабрика_наименование': 'Фабрика наименование',
    'Цена опт': 'Цена опт',
    'Цена розница': 'Цена розница',
    'Поставщик': 'Поставщик',
    'Бренд': 'Бренд',
    'Группа': 'Группа',
    'Наличие в шоуруме': 'Наличие в шоуруме',
    'SKU внутреннее': 'SKU внутреннее',
    'Domeo_Название модели для Web': 'Название модели для Web',
    'Артикул поставщика': 'Артикул поставщика',
    'Ширина/мм': 'Ширина (мм)',
    'Высота/мм': 'Высота (мм)',
    'Толщина/мм': 'Толщина (мм)',
    'Цена РРЦ': 'Цена РРЦ',
    'Domeo_Цвет': 'Цвет',
    'Тип покрытия': 'Тип покрытия',
    'Модель': 'Модель',
    'Серия': 'Серия'
  };
  
  return mapping[key] || key;
};

interface Product {
  id: string;
  sku: string;
  name: string;
  base_price: number;
  stock_quantity: number;
  brand?: string;
  model?: string;
  properties_data: string | Record<string, any>;
  specifications?: Record<string, any>;
  images?: Array<{ url: string; alt_text?: string }>;
}

interface ImportTemplate {
  id: string;
  catalog_category_id: string;
  name: string;
  description: string;
  requiredFields: string[];
  calculatorFields: string[];
  exportFields: string[];
  templateConfig: {
    headers: string[];
  };
  created_at: string;
  updated_at: string;
}

interface CatalogTreeProps {
  categories: CatalogCategory[];
  onCategorySelect: (category: CatalogCategory) => void;
  onCategoryCreate: (parentId?: string) => void;
  onCategoryEdit: (category: CatalogCategory) => void;
  onCategoryDelete: (category: CatalogCategory) => void;
  selectedCategory: CatalogCategory | null;
  selectedTemplate: ImportTemplate | null;
  templateLoading: boolean;
  loadTemplate: (categoryId: string) => void;
  categoryProducts: Product[];
  productsLoading: boolean;
  loadCategoryProducts: (categoryId: string) => void;
}

function CatalogTree({ 
  categories, 
  onCategorySelect, 
  onCategoryCreate, 
  onCategoryEdit, 
  onCategoryDelete,
  selectedCategory,
  selectedTemplate,
  templateLoading,
  loadTemplate,
  categoryProducts,
  productsLoading,
  loadCategoryProducts
}: CatalogTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<CatalogCategory[]>([]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCategorySelect = (category: CatalogCategory) => {
    onCategorySelect(category);
    
    // Обновляем хлебные крошки
    const buildBreadcrumbs = (cat: CatalogCategory, allCategories: CatalogCategory[]): CatalogCategory[] => {
      const crumbs: CatalogCategory[] = [cat];
      // Здесь можно добавить логику для построения полного пути
      return crumbs;
    };
    
    setBreadcrumbs(buildBreadcrumbs(category, categories));
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderCategory = (category: CatalogCategory, level: number = 0) => {
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isExpanded = expandedNodes.has(category.id);
    const indent = level * 24; // Увеличиваем отступ для лучшей визуализации

    return (
      <div key={category.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 cursor-pointer group transition-colors duration-150 ${
            level === 0 
              ? 'hover:bg-blue-50 border-l-2 border-transparent hover:border-blue-200' 
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${indent + 12}px` }}
          onClick={() => handleCategorySelect(category)}
        >
          {/* Индикатор раскрытия/сворачивания */}
          <div className="flex items-center w-6 mr-2">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(category.id);
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors duration-150"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-600" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
              </div>
            )}
          </div>

          {/* Иконка категории */}
          <div className="mr-3">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-600" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )
            ) : (
              <Package2 className="h-4 w-4 text-gray-400" />
            )}
          </div>
          
          {/* Основной контент */}
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <span className={`font-medium truncate ${
                level === 0 ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {category.name}
              </span>
              
              {/* Счетчик товаров */}
              <Badge 
                variant="secondary" 
                className={`text-xs shrink-0 ${
                  (category.products_count || 0) > 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {category.products_count || 0}
              </Badge>
            </div>
            
            {/* Действия (показываются при наведении) */}
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryCreate(category.id);
                }}
                className="h-7 w-7 p-0 hover:bg-blue-100 hover:text-blue-600"
                title="Добавить подкатегорию"
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryEdit(category);
                }}
                className="h-7 w-7 p-0 hover:bg-gray-100"
                title="Редактировать"
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategoryDelete(category);
                }}
                className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                title="Удалить"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Подкатегории с анимацией */}
        {hasChildren && isExpanded && (
          <div className="overflow-hidden">
            <div className="transition-all duration-200 ease-in-out">
              {category.subcategories?.map(subcategory => 
                renderCategory(subcategory, level + 1)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Поиск и действия */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск категорий..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => onCategoryCreate()}
          size="sm"
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить</span>
        </Button>
      </div>

      {/* Хлебные крошки */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
          <span>Путь:</span>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              {index > 0 && <ChevronRight className="h-3 w-3 text-gray-400" />}
              <button
                onClick={() => handleCategorySelect(crumb)}
                className="hover:text-blue-600 transition-colors duration-150"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Информация о выбранной категории */}
      {selectedCategory && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-blue-900">{selectedCategory.name}</h3>
              <p className="text-sm text-blue-700">
                Уровень {selectedCategory.level} • {selectedCategory.products_count || 0} товаров
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCategoryEdit(selectedCategory)}
                className="text-blue-600 border-blue-300 hover:bg-blue-100"
              >
                <Edit className="h-3 w-3 mr-1" />
                Редактировать
              </Button>
            </div>
          </div>
        </div>
      )}

      
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">
              {searchTerm ? 'Категории не найдены' : 'Каталог пуст'}
            </p>
            <p className="text-sm text-gray-400">
              {searchTerm 
                ? 'Попробуйте изменить поисковый запрос' 
                : 'Добавьте категории или импортируйте каталог'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredCategories.map(category => renderCategory(category, 0))}
          </div>
        )}
      </div>
    </div>
  );
}


export default function CatalogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CatalogCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(100);
  const [currentLoadedCount, setCurrentLoadedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CatalogCategory | null>(null);
  const [editProductDialogOpen, setEditProductDialogOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [newCategoryParent, setNewCategoryParent] = useState<string | undefined>();
  const [categoryToDelete, setCategoryToDelete] = useState<CatalogCategory | null>(null);
  const [instructionsDialogOpen, setInstructionsDialogOpen] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Проверка доступа: только админы могут открыть эту страницу
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAdminAccess = async () => {
      try {
        const response = await fetchWithAuth('/api/users/me');
        if (!response.ok) {
          clientLogger.debug('Не удалось получить данные пользователя, редирект');
          router.push('/auth/unauthorized');
          return;
        }
        
        const data = await response.json();
        const responseData = parseApiResponse<{ user?: { role?: string } }>(data);
        const userRole = responseData?.user?.role;
        
        if (userRole !== 'admin') {
          clientLogger.debug('Пользователь не является админом, редирект с админской страницы', { role: userRole });
          router.push('/auth/unauthorized');
          return;
        }
        
        // Пользователь админ, разрешаем доступ
        setHasAccess(true);
        setAccessChecked(true);
      } catch (error) {
        clientLogger.error('Ошибка при проверке доступа:', error);
        router.push('/auth/unauthorized');
      }
    };
    
    checkAdminAccess();
  }, [router]);

  useEffect(() => {
    // Загружаем категории только после проверки доступа и подтверждения, что пользователь админ
    if (accessChecked && hasAccess) {
    loadCategories();
    }
  }, [accessChecked, hasAccess]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/catalog/categories');
      
      if (!response.ok) {
        clientLogger.error('Error loading categories', { status: response.status });
        setCategories([]);
        return;
      }
      
      const data = await response.json();
      clientLogger.debug('📡 Ответ от /api/catalog/categories:', data);
      
      // apiSuccess возвращает { success: true, data: { categories: ..., total_count: ... } }
      const responseData = parseApiResponse<{ categories: CatalogCategory[]; total_count: number }>(data);
      const categories = responseData?.categories || [];
      
      clientLogger.debug('📦 Извлеченные категории:', { count: categories.length, categories });
      setCategories(categories);
    } catch (error) {
      clientLogger.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };


  const loadCategoryProducts = useCallback(async (categoryId: string, limit?: number, append: boolean = false) => {
    const actualLimit = limit || itemsPerPage;
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setProductsLoading(true);
      }
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const offset = append ? currentLoadedCount : 0;
      const response = await fetch(`/api/catalog/products?category=${categoryId}&limit=${actualLimit}&offset=${offset}`, {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        clientLogger.error('Error loading products', { status: response.status });
        if (!append) {
          setCategoryProducts([]);
          setCurrentLoadedCount(0);
        }
        setTotalProductsCount(0);
        return;
      }
      
      const data = await response.json();
      clientLogger.debug('📡 Ответ от /api/catalog/products:', data);
      
      // apiSuccess возвращает { success: true, data: { products: ..., total: ... } }
      const responseData = parseApiResponse<{ products: Product[]; total: number }>(data);
      const products = responseData?.products || [];
      const total = responseData?.total || 0;
      
      clientLogger.debug('📦 Извлеченные товары:', { count: products.length, total, products });
      
      // Обновляем состояние независимо от количества товаров
        if (append) {
          // Дозагружаем товары
          setCategoryProducts(prev => [...prev, ...products]);
          setCurrentLoadedCount(prev => prev + products.length);
        } else {
          // Загружаем с начала
          setCategoryProducts(products);
          setCurrentLoadedCount(products.length);
        }
        setTotalProductsCount(total);
    } catch (error) {
      clientLogger.error('Error loading products:', error);
      if (!append) {
        setCategoryProducts([]);
        setCurrentLoadedCount(0);
      }
    } finally {
      setProductsLoading(false);
      setLoadingMore(false);
    }
  }, [itemsPerPage, currentLoadedCount]);

  const loadTemplate = useCallback(async (categoryId: string) => {
    try {
      setTemplateLoading(true);
      const response = await fetchWithAuth(`/api/admin/templates?catalogCategoryId=${categoryId}`);
      
      if (!response.ok) {
        clientLogger.error('Error loading template', { status: response.status });
        setSelectedTemplate(null);
        return;
      }
      
      const data = await response.json();
      clientLogger.debug('📡 Ответ от /api/admin/templates:', data);
        
      // apiSuccess возвращает { success: true, data: { template: ... } }
      const responseData = parseApiResponse<{ template?: ImportTemplate }>(data);
      const template = responseData?.template;
      
      if (template) {
        if (template.requiredFields) {
          try {
            const fields = template.requiredFields; // Уже парсится в API
            // Исправляем кодировку полей
            const fixedFields = fixFieldsEncoding(fields);
          } catch (e) {
            clientLogger.error('Error processing requiredFields:', e);
          }
        } else {
          clientLogger.error('Template has no requiredFields!');
        }
        
        setSelectedTemplate(template);
      } else {
        setSelectedTemplate(null);
      }
    } catch (error) {
      clientLogger.error('Error loading template:', error);
      setSelectedTemplate(null);
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  const handleCategorySelect = useCallback((category: CatalogCategory) => {
    setSelectedCategory(category);
    setSelectedTemplate(null); // Сбрасываем шаблон - будем считать что следующая загрузка будет первая
    setCurrentLoadedCount(0); // Сбрасываем счетчик загруженных товаров
    if (category.id) {
      loadTemplate(category.id);
      loadCategoryProducts(category.id); // Загружаем товары с настройками по умолчанию
    }
  }, [loadTemplate, loadCategoryProducts]);

  // Функции для массового редактирования
  const handleBulkEdit = useCallback(async (updates: Array<{ id: string; updates: Partial<Product> }>) => {
    try {
      const response = await fetch('/api/admin/products/bulk-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Успешно обновлено ${result.updated} товаров`);
        
        // Перезагружаем товары
        if (selectedCategory) {
          await loadCategoryProducts(selectedCategory.id);
        }
        
        // Очищаем выбор
        setSelectedProducts(new Set());
      } else {
        alert(`❌ Ошибка при обновлении: ${result.error}`);
      }
    } catch (error) {
      clientLogger.error('Ошибка массового редактирования:', error);
      alert('Ошибка при массовом редактировании товаров');
    }
  }, [selectedCategory, loadCategoryProducts]);

  const handleProductSelect = useCallback((productId: string, selected: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIds = new Set(filteredProducts.map(p => p.id));
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
    }
  }, [filteredProducts]);

  const handleFilteredProducts = useCallback((products: Product[]) => {
    setFilteredProducts(products);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilteredProducts(categoryProducts);
  }, [categoryProducts]);

  // Обновляем отфильтрованные товары при изменении категории
  useEffect(() => {
    setFilteredProducts(categoryProducts);
    setSelectedProducts(new Set());
  }, [categoryProducts]);

  const handleCategoryCreate = (parentId?: string) => {
    setNewCategoryParent(parentId);
    setCreateDialogOpen(true);
  };

  const handleCategoryEdit = (category: CatalogCategory) => {
    setCategoryToEdit(category);
    setEditDialogOpen(true);
  };

  const handleCategoryDelete = (category: CatalogCategory) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAllProducts = async (categoryId: string) => {
    try {
      
      const response = await fetch(`/api/admin/products/delete-all?categoryId=${categoryId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Успешно удалено ${result.deleted} товаров из категории "${selectedCategory?.name}"`);
        
        // Обновляем счетчики товаров в категориях каталога
        try {
          const updateCountsResponse = await fetch('/api/admin/categories/update-counts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (updateCountsResponse.ok) {
            const countsData = await updateCountsResponse.json();
            // Счетчики обновлены
          } else {
            // Не удалось обновить счетчики
          }
        } catch (updateError) {
          // Ошибка при обновлении счетчиков
        }
        
        // Перезагружаем список товаров
        await loadCategoryProducts(categoryId);
        // Перезагружаем список категорий для обновления счетчиков
        await loadCategories();
      } else {
        alert(`Ошибка при удалении товаров: ${result.error}`);
      }
    } catch (error) {
      clientLogger.error('Ошибка при удалении товаров:', error);
      alert('Ошибка при удалении товаров');
    }
  };

  const handleCreateCategory = async (data: CreateCatalogCategoryDto) => {
    try {
      const response = await fetch('/api/catalog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          parent_id: newCategoryParent
        })
      });

      if (response.ok) {
        await loadCategories();
        setCreateDialogOpen(false);
        setNewCategoryParent(undefined);
      }
    } catch (error) {
      clientLogger.error('Error creating category:', error);
    }
  };

  const handleEditCategory = async (data: CreateCatalogCategoryDto) => {
    if (!categoryToEdit) return;

    try {
      const response = await fetch(`/api/catalog/categories/${categoryToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await loadCategories();
        setEditDialogOpen(false);
        setCategoryToEdit(null);
      }
    } catch (error) {
      clientLogger.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await fetch(`/api/catalog/categories/${categoryToDelete.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadCategories();
        setDeleteDialogOpen(false);
        setCategoryToDelete(null);
        setSelectedCategory(null);
      }
    } catch (error) {
      clientLogger.error('Error deleting category:', error);
    }
  };

  // Функции для работы с товарами
  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setEditProductDialogOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Удалить товар "${product.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Товар "${product.name}" успешно удален`);
        
        // Перезагружаем товары
        if (selectedCategory) {
          await loadCategoryProducts(selectedCategory.id);
        }
        
        // Обновляем счетчики категорий
        await loadCategories();
      } else {
        alert(`❌ Ошибка при удалении товара: ${result.error}`);
      }
    } catch (error) {
      clientLogger.error('Ошибка при удалении товара:', error);
      alert('Ошибка при удалении товара');
    }
  };

  const handleDeleteProductPhotos = async (product: Product) => {
    if (!confirm(`Удалить все фотографии товара "${product.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/catalog/products/${product.id}/photos`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем список товаров
        if (selectedCategory) {
          await loadCategoryProducts(selectedCategory.id);
        }
        alert('Фотографии успешно удалены');
      } else {
        alert(`Ошибка: ${result.message}`);
      }
    } catch (error) {
      clientLogger.error('Ошибка при удалении фотографий:', error);
      alert('Ошибка при удалении фотографий');
    }
  };

  const handleDeleteAllPhotos = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/catalog/categories/${categoryId}/photos`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем список товаров
        if (selectedCategory) {
          await loadCategoryProducts(selectedCategory.id);
        }
        alert(`✅ Успешно удалено фотографий: ${result.deletedCount}`);
      } else {
        alert(`❌ Ошибка: ${result.message}`);
      }
    } catch (error) {
      clientLogger.error('Ошибка при удалении всех фотографий:', error);
      alert('❌ Ошибка при удалении всех фотографий');
    }
  };

  const handleUpdateProduct = async (productData: Partial<Product>) => {
    if (!productToEdit) return;

    try {
      const response = await fetch(`/api/admin/products/${productToEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Товар "${productToEdit.name}" успешно обновлен`);
        
        // Перезагружаем товары
        if (selectedCategory) {
          await loadCategoryProducts(selectedCategory.id);
        }
        
        setEditProductDialogOpen(false);
        setProductToEdit(null);
      } else {
        alert(`❌ Ошибка при обновлении товара: ${result.error}`);
      }
    } catch (error) {
      clientLogger.error('Ошибка при обновлении товара:', error);
      alert('Ошибка при обновлении товара');
    }
  };

  // Показываем загрузку до проверки доступа
  if (!accessChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  // Если доступ не разрешен, не показываем содержимое (редирект уже выполнен)
  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка каталога...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Дерево каталога</h2>
            <CatalogTree
              categories={categories}
              onCategorySelect={handleCategorySelect}
              onCategoryCreate={handleCategoryCreate}
              onCategoryEdit={handleCategoryEdit}
              onCategoryDelete={handleCategoryDelete}
              selectedCategory={selectedCategory}
              selectedTemplate={selectedTemplate}
              templateLoading={templateLoading}
              loadTemplate={loadTemplate}
              categoryProducts={categoryProducts}
              productsLoading={productsLoading}
              loadCategoryProducts={loadCategoryProducts}
            />
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="p-4">
            {selectedCategory ? (
              <div className="space-y-6">
                {/* Заголовок с информацией о категории */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{selectedCategory.name}</h2>
                    <div className="text-sm text-gray-600 mt-1">
                      ID: {selectedCategory.id} • Уровень: {selectedCategory.level}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setInstructionsDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      <Settings className="h-3 w-3" />
                      <span>Инструкция</span>
                    </Button>
                    <TemplateManager
                      catalogCategoryId={selectedCategory?.id || null}
                      catalogCategoryName={selectedCategory?.name}
                    />
                    <PriceListExporter
                      catalogCategoryId={selectedCategory?.id || null}
                      catalogCategoryName={selectedCategory?.name}
                    />
                    {selectedProducts.size > 0 && (
                      <Button
                        onClick={() => setBulkEditOpen(true)}
                        variant="primary"
                        className="flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Редактировать ({selectedProducts.size})</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Фильтры товаров */}
                {categoryProducts.length > 0 && (
                  <ProductFilters
                    products={categoryProducts}
                    onFilteredProducts={handleFilteredProducts}
                    onClearFilters={handleClearFilters}
                  />
                )}

                {/* Список товаров */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-medium text-gray-900">Товары категории</h3>
                    {productsLoading && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    )}
                  </div>
                  
                  {productsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Загрузка товаров...</p>
                    </div>
                  ) : categoryProducts.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm text-gray-600">
                            Найдено товаров: <span className="font-semibold text-blue-600">{totalProductsCount}</span>
                            {currentLoadedCount < totalProductsCount && (
                              <span className="text-gray-500 ml-2">(показано {currentLoadedCount})</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <label className="text-sm text-gray-600">Показать:</label>
                            <select
                              value={itemsPerPage}
                              onChange={(e) => {
                                const newItemsPerPage = parseInt(e.target.value);
                                setItemsPerPage(newItemsPerPage);
                                setCurrentLoadedCount(0); // Сбрасываем счетчик при изменении размера страницы
                                if (selectedCategory) {
                                  loadCategoryProducts(selectedCategory.id, newItemsPerPage);
                                }
                              }}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={50}>50</option>
                              <option value={100}>100</option>
                              <option value={250}>250</option>
                              <option value={500}>500</option>
                              <option value={1000}>1000</option>
                              <option value={totalProductsCount}>Все ({totalProductsCount})</option>
                            </select>
                            <span className="text-sm text-gray-500">товаров</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center space-x-1 text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={() => {
                              const totalProductsCount = selectedCategory.products_count || 0;
                              if (confirm(`Вы уверены, что хотите удалить все фотографии из категории "${selectedCategory.name}" (${totalProductsCount} товаров)? Это действие нельзя отменить.`)) {
                                handleDeleteAllPhotos(selectedCategory.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Удалить все фото</span>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            className="flex items-center space-x-1"
                            onClick={() => {
                              const totalProductsCount = selectedCategory.products_count || 0;
                              if (confirm(`Вы уверены, что хотите удалить все товары (${totalProductsCount} шт.) из категории "${selectedCategory.name}"? Это действие нельзя отменить.`)) {
                                handleDeleteAllProducts(selectedCategory.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Удалить все товары</span>
                          </Button>
                        </div>
                      </div>
                      
                      {/* Улучшенная таблица товаров */}
                      <div className="relative">
                        <div className="overflow-x-auto max-w-full border border-gray-200 rounded-lg shadow-sm bg-white">
                          <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <input
                                  type="checkbox"
                                  checked={selectedProducts.size === filteredProducts.length && filteredProducts.length > 0}
                                  onChange={(e) => handleSelectAll(e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                #
                              </th>
                              {/* Динамические заголовки на основе реальных свойств товаров */}
                              {(() => {
                                const groupProperties = analyzeGroupProperties(filteredProducts);
                                return groupProperties.map(key => (
                                  <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {getDisplayName(key)}
                                  </th>
                                ));
                              })()}
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Фото
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Действия
                              </th>
                            </tr>
                          </thead>
                          
                          {/* Тело таблицы */}
                          <tbody className="bg-white divide-y divide-gray-200">
                              {filteredProducts.map((product: Product, index: number) => {
                                // Парсим свойства товара
                                const properties = product.properties_data ? 
                                  (typeof product.properties_data === 'string' ? JSON.parse(product.properties_data) : product.properties_data) : {};
                                
                                // Получаем динамические свойства группы
                                const groupProperties = analyzeGroupProperties(filteredProducts);
                                
                                // Проверяем наличие фото
                                const hasPhotos = properties.photos && Array.isArray(properties.photos) && properties.photos.length > 0;
                                
                                return (
                              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={(e) => handleProductSelect(product.id, e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-500">
                                  {index + 1}
                                </td>
                                {/* Динамические ячейки данных на основе реальных свойств товаров */}
                                {(() => {
                                  const groupProperties = analyzeGroupProperties(filteredProducts);
                                  return groupProperties.map(key => (
                                    <td key={key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                      <div className="max-w-xs truncate" title={String(properties[key] || '-')}>
                                        {properties[key] || '-'}
                                      </div>
                                    </td>
                                  ));
                                })()}
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                      {hasPhotos ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✅ Есть
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        ❌ Нет
                                      </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                          onClick={() => handleEditProduct(product)}
                                    >
                                      Редактировать
                                    </Button>
                                    {hasPhotos && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs text-orange-600 hover:text-orange-700"
                                        onClick={() => handleDeleteProductPhotos(product)}
                                        title="Удалить все фотографии"
                                      >
                                        🗑️ Фото
                                      </Button>
                                    )}
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs text-red-600 hover:text-red-700"
                                          onClick={() => handleDeleteProduct(product)}
                                    >
                                      Удалить
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                                );
                              })}
                          </tbody>
                        </table>
                        </div>
                        
                        {/* Информационная панель */}
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6 text-sm text-blue-800">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">📊 Всего товаров:</span>
                                <span className="font-bold text-blue-900">{totalProductsCount}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="font-medium">👁️ Показано:</span>
                                <span className="font-bold text-blue-900">{currentLoadedCount}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">📄 Страница:</span>
                                <span className="font-bold text-blue-900">
                                  {Math.ceil(currentLoadedCount / itemsPerPage)} из {Math.ceil(totalProductsCount / itemsPerPage)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-blue-700">Горизонтальная прокрутка:</span>
                              <div className="flex space-x-1">
                                <button 
                                  className="px-3 py-1 bg-white border border-blue-300 rounded text-xs hover:bg-blue-50 text-blue-700"
                                  onClick={() => {
                                    const table = document.querySelector('.overflow-x-auto');
                                    if (table) table.scrollLeft -= 200;
                                  }}
                                >
                                  ←
                                </button>
                                <button 
                                  className="px-3 py-1 bg-white border border-blue-300 rounded text-xs hover:bg-blue-50 text-blue-700"
                                  onClick={() => {
                                    const table = document.querySelector('.overflow-x-auto');
                                    if (table) table.scrollLeft += 200;
                                  }}
                                >
                                  →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {currentLoadedCount < totalProductsCount && (
                        <div className="text-center pt-4 border-t border-gray-200">
                          <p className="text-sm text-gray-600 mb-3">
                            Показано {currentLoadedCount} из {totalProductsCount} товаров
                          </p>
                          <div className="flex items-center justify-center space-x-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Дозагрузить еще товаров
                                if (selectedCategory) {
                                  loadCategoryProducts(selectedCategory.id, itemsPerPage, true);
                                }
                              }}
                              disabled={loadingMore}
                              className="flex items-center space-x-2"
                            >
                              {loadingMore ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                  <span>Загрузка...</span>
                                </>
                              ) : (
                                <>
                                  <span>Загрузить еще {Math.min(itemsPerPage, totalProductsCount - currentLoadedCount)}</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Загрузить все оставшиеся товары
                                if (selectedCategory) {
                                  loadCategoryProducts(selectedCategory.id, totalProductsCount - currentLoadedCount, true);
                                }
                              }}
                              disabled={loadingMore}
                              className="flex items-center space-x-2"
                            >
                              {loadingMore ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                                  <span>Загрузка...</span>
                                </>
                              ) : (
                                <>
                                  <span>Показать все ({totalProductsCount})</span>
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">В этой категории нет товаров</h3>
                      <p className="text-gray-500 mb-4">Товары не были импортированы в эту категорию</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // Переход к импорту товаров
                          window.location.href = `/admin/catalog/import?category=${selectedCategory.id}`;
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Импортировать товары
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                Выберите категорию для просмотра списка товаров
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Диалог создания категории */}
      <CreateCategoryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSubmit={handleCreateCategory}
        parentId={newCategoryParent}
      />

      {/* Диалог редактирования категории */}
      <EditCategoryDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleEditCategory}
        category={categoryToEdit}
      />

      {/* Диалог удаления категории */}
      <DeleteCategoryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCategory}
        category={categoryToDelete}
      />

      <BulkEditDialogWrapper
        isOpen={bulkEditOpen}
        onClose={() => setBulkEditOpen(false)}
        products={Array.from(selectedProducts).map(id => 
          filteredProducts.find(p => p.id === id)!
        ).filter(Boolean)}
        onSave={handleBulkEdit}
      />

      {/* Диалог редактирования товара */}
      <EditProductDialog
        open={editProductDialogOpen}
        onOpenChange={setEditProductDialogOpen}
        onSubmit={handleUpdateProduct}
        product={productToEdit}
      />

      {/* Диалог инструкций по импорту */}
      <ImportInstructionsDialog
        open={instructionsDialogOpen}
        onOpenChange={setInstructionsDialogOpen}
      />
      
      {/* Подробная инструкция */}
      <InstructionsModal
        isOpen={instructionsDialogOpen}
        onClose={() => setInstructionsDialogOpen(false)}
      />

    </div>
  );
}

// Компоненты диалогов
function CreateCategoryDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  parentId 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCatalogCategoryDto) => void;
  parentId?: string;
}) {
  const [formData, setFormData] = useState({
    name: '',
    sort_order: 0,
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', sort_order: 0, is_active: true });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать категорию</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название категории"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Порядок сортировки</label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Активна</label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Создать</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCategoryDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  category 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateCatalogCategoryDto) => void;
  category: CatalogCategory | null;
}) {
  const [formData, setFormData] = useState({
    name: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        sort_order: category.sort_order,
        is_active: category.is_active
      });
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать категорию</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название категории"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Порядок сортировки</label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active_edit"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="is_active_edit" className="text-sm font-medium">Активна</label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  category 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  category: CatalogCategory | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Удалить категорию</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600">
            Вы уверены, что хотите удалить категорию "{category?.name}"?
          </p>
          <p className="text-sm text-red-600">
            Это действие нельзя отменить. Все подкатегории и товары также будут удалены.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Удалить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Компонент диалога массового редактирования
function BulkEditDialogWrapper({ 
  isOpen, 
  onClose, 
  products, 
  onSave 
}: {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSave: (updates: Array<{ id: string; updates: Partial<Product> }>) => Promise<void>;
}) {
  return (
    <BulkEditDialog
      isOpen={isOpen}
      onClose={onClose}
      products={products}
      onSave={onSave}
    />
  );
}

// Диалог редактирования товара
function EditProductDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  product 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Product>) => void;
  product: Product | null;
}) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    base_price: 0,
    stock_quantity: 0,
    is_active: true,
    sort_order: 0,
  });

  const [propertiesData, setPropertiesData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        base_price: product.base_price || 0,
        stock_quantity: product.stock_quantity || 0,
        is_active: true,
        sort_order: 0,
      });

      // Парсим свойства товара
      const properties = product.properties_data ? 
        (typeof product.properties_data === 'string' ? JSON.parse(product.properties_data) : product.properties_data) : {};
      setPropertiesData(properties);
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      properties_data: propertiesData,
    });
  };

  const handlePropertyChange = (key: string, value: any) => {
    setPropertiesData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать товар: {product.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основные поля */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Название</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Название товара"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <Input
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Артикул товара"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Базовая цена</label>
              <Input
                type="number"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Остаток</label>
              <Input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Свойства товара */}
          <div>
            <h3 className="text-lg font-medium mb-3">Свойства товара</h3>
            <div className="space-y-3">
              {Object.entries(propertiesData).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <label className="w-48 text-sm font-medium truncate" title={key}>
                    {key}:
                  </label>
                  <Input
                    value={String(value)}
                    onChange={(e) => handlePropertyChange(key, e.target.value)}
                    className="flex-1"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit">Сохранить</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
