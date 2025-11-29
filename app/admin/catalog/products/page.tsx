'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui';
import { Plus, Search, Edit, Trash2, Upload, Download, Eye, Package, AlertCircle, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { CatalogCategory } from '@/lib/types/catalog';
import { clientLogger } from '@/lib/logging/client-logger';

interface Product {
  id: string;
  sku: string;
  name: string;
  catalog_category_id: string;
  properties_data: Record<string, any>;
  base_price: number;
  currency: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  catalog_category: {
    id: string;
    name: string;
    level: number;
    path: string;
  };
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCategoryForImport, setSelectedCategoryForImport] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryTree, setShowCategoryTree] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      // Загружаем категории каталога
      const categoriesRes = await fetch('/api/catalog/categories', {
        headers,
        credentials: 'include',
      });
      
      if (categoriesRes.ok) {
      const categoriesData = await categoriesRes.json();
        // apiSuccess возвращает { success: true, data: { categories: ... } }
        const responseData = categoriesData && typeof categoriesData === 'object' && 'data' in categoriesData
          ? (categoriesData as { data: { categories?: CatalogCategory[] } }).data
          : null;
        const categories = responseData && 'categories' in responseData && Array.isArray(responseData.categories)
          ? responseData.categories
          : (categoriesData.categories || []);
        setCatalogCategories(categories);
      }

      // Загружаем товары
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('catalogCategoryId', selectedCategory);

      const productsRes = await fetch(`/api/catalog/products?${params}`, {
        headers,
        credentials: 'include',
      });
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        // apiSuccess возвращает { success: true, data: { products: ..., total: ..., page: ..., limit: ..., totalPages: ... } }
        const responseData = productsData && typeof productsData === 'object' && 'data' in productsData
          ? (productsData as { data: ProductsResponse }).data
          : null;
        const products = responseData || productsData;

        setProducts(products.products || []);
        setTotalPages(products.totalPages || 1);
        setTotal(products.total || 0);
      }
    } catch (error) {
      clientLogger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Удалить товар "${product.name}"?`)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/catalog/products/${product.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      clientLogger.error('Error deleting product:', error);
    }
  };

  const handleDownloadTemplate = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/templates/download?catalogCategoryId=${categoryId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-template-${categoryId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      clientLogger.error('Error downloading template:', error);
    }
  };

  const handleImportProducts = async (file: File, categoryId: string) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('catalogCategoryId', categoryId);

      const response = await fetch('/api/admin/import/unified', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        alert(`Успешно импортировано ${result.imported} товаров`);
        await loadData();
        setImportDialogOpen(false);
      } else {
        alert(`Ошибка импорта: ${result.message}`);
        if (result.errors && result.errors.length > 0) {
          clientLogger.error('Import errors:', result.errors);
        }
      }
    } catch (error) {
      clientLogger.error('Error importing products:', error);
      alert('Ошибка при импорте товаров');
    }
  };

  const formatPrice = (price: number, currency?: string) => {
    // Если валюта не указана или пустая, используем RUB по умолчанию
    const currencyCode = currency && currency.trim() ? currency : 'RUB';
    
    try {
      return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currencyCode
      }).format(price);
    } catch (error) {
      // Если валюта не поддерживается, используем числовой формат
      return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  // Функции для работы с деревом каталога
  const toggleCategoryExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const buildCategoryTree = (categories: CatalogCategory[]) => {
    const categoryMap = new Map<string, CatalogCategory & { children: CatalogCategory[] }>();
    const rootCategories: (CatalogCategory & { children: CatalogCategory[] })[] = [];

    // Создаем карту категорий с пустыми массивами детей
    categories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Строим дерево
    categories.forEach(category => {
      const categoryWithChildren = categoryMap.get(category.id)!;
      if (category.parent_id && categoryMap.has(category.parent_id)) {
        const parent = categoryMap.get(category.parent_id)!;
        parent.children.push(categoryWithChildren);
      } else {
        rootCategories.push(categoryWithChildren);
      }
    });

    return rootCategories;
  };

  const renderCategoryNode = (category: CatalogCategory & { children: CatalogCategory[] }, level = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const hasChildren = category.children.length > 0;

    return (
      <div key={category.id}>
        <div
          className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleCategoryExpanded(category.id);
            } else {
              setSelectedCategory(category.id);
              setShowCategoryTree(false);
            }
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1 text-gray-500" />
            )
          ) : (
            <div className="w-5 mr-1" />
          )}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
            )
          ) : (
            <div className="w-6 mr-2" />
          )}
          <span className="text-sm">{category.name}</span>
        </div>
        {isExpanded && (category as CatalogCategory & { children: CatalogCategory[] }).children?.map((child) => renderCategoryNode(child as CatalogCategory & { children: CatalogCategory[] }, level + 1))}
      </div>
    );
  };

  // Закрытие дерева при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-tree-container')) {
        setShowCategoryTree(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка товаров...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Всего товаров</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Активных</p>
              <p className="text-2xl font-bold">{products.filter(p => p.is_active).length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">В наличии</p>
              <p className="text-2xl font-bold">{products.filter(p => p.stock_quantity > 0).length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">Категорий</p>
              <p className="text-2xl font-bold">{catalogCategories.length}</p>
            </div>
          </div>
        </Card>
      </div>


      {/* Фильтры */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative category-tree-container">
            <Button
              variant="outline"
              onClick={() => setShowCategoryTree(!showCategoryTree)}
              className="w-full justify-between"
            >
              <span>
                {selectedCategory 
                  ? catalogCategories.find(c => c.id === selectedCategory)?.name || 'Выберите категорию'
                  : 'Выберите категорию'
                }
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            
            {showCategoryTree && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
                <div className="p-2">
                  <div
                    className="flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded text-gray-700"
                    onClick={() => {
                      setSelectedCategory('');
                      setShowCategoryTree(false);
                    }}
                  >
                    <span className="text-sm font-medium">Все категории</span>
                  </div>
                  {buildCategoryTree(catalogCategories).map(category => renderCategoryNode(category as CatalogCategory & { children: CatalogCategory[] }))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">
              Найдено: {products.length}
            </span>
          </div>
        </div>
        
        {/* Дополнительные опции */}
        <div className="mt-4 flex items-center space-x-4">
          {selectedCategory && (
            <div className="text-sm text-blue-600">
              Фильтр по категории: {catalogCategories.find(c => c.id === selectedCategory)?.name}
            </div>
          )}
        </div>
      </Card>

      {/* Кнопка добавления товара */}
      <div className="flex justify-center">
        <Button
          className="flex items-center space-x-1"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить товар</span>
        </Button>
      </div>

      {/* Список товаров */}
      <Card className="p-4">
        {products.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {searchTerm || selectedCategory ? 'Товары не найдены' : 'Товары не добавлены'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Цена</TableHead>
                  <TableHead>Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map(product => (
                  <TableRow key={product.id}>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        {Object.keys(product.properties_data).length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {Object.entries(product.properties_data).slice(0, 2).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: {value}
                              </span>
                            ))}
                            {Object.keys(product.properties_data).length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.catalog_category.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatPrice(product.base_price, product.currency)}
                    </TableCell>
                    <TableCell>
                      <span className={product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Активен</Badge>
                      ) : (
                        <Badge variant="secondary">Неактивен</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(product.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Показано {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, total)} из {total}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Назад
              </Button>
              <span className="text-sm">
                Страница {currentPage} из {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Вперед
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Диалог импорта */}
      <ImportProductsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportProducts}
        catalogCategories={catalogCategories}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}

// Компонент диалога импорта
function ImportProductsDialog({ 
  open, 
  onOpenChange, 
  onImport,
  catalogCategories,
  onDownloadTemplate
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (file: File, categoryId: string) => void;
  catalogCategories: CatalogCategory[];
  onDownloadTemplate: (categoryId: string) => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setSelectedFile(file);
    } else {
      alert('Поддерживаются только файлы Excel (.xlsx, .xls)');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleSubmit = () => {
    if (!selectedFile || !selectedCategory) {
      alert('Выберите файл и категорию');
      return;
    }

    onImport(selectedFile, selectedCategory);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Импорт товаров из Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Категория каталога</label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите категорию" />
              </SelectTrigger>
              <SelectContent>
                {catalogCategories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name} (L{category.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadTemplate(selectedCategory)}
              >
                <Download className="h-4 w-4 mr-1" />
                Скачать шаблон
              </Button>
              <span className="text-sm text-gray-500">
                Скачайте шаблон для правильного формата данных
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Файл Excel</label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <div className="text-green-600">✓ {selectedFile.name}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    Удалить
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-gray-400" />
                  <div>
                    <span className="text-blue-600">Нажмите для выбора</span> или перетащите файл
                  </div>
                  <div className="text-sm text-gray-500">
                    Поддерживаются файлы .xlsx, .xls
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload">
                    <Button variant="outline" size="sm">
                      Выбрать файл
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || !selectedCategory}
            >
              Импортировать
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
