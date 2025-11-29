'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Badge, Input, Dialog, DialogContent, DialogHeader, DialogTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, AlertCircle, FileText, Download, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { ProductProperty, PropertyType, CreateProductPropertyDto } from '@/lib/types/catalog';
import { clientLogger } from '@/lib/logging/client-logger';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<ProductProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showAll, setShowAll] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showCategoryTree, setShowCategoryTree] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState<ProductProperty | null>(null);

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
      
      const [propertiesRes, categoriesRes] = await Promise.all([
        fetch('/api/catalog/properties', { headers, credentials: 'include' }),
        fetch('/api/catalog/categories-flat', { headers, credentials: 'include' })
      ]);

      if (propertiesRes.ok) {
      const propertiesData = await propertiesRes.json();
        // apiSuccess возвращает { success: true, data: { properties: ... } }
        const responseData = propertiesData && typeof propertiesData === 'object' && 'data' in propertiesData
          ? (propertiesData as { data: { properties?: ProductProperty[] } }).data
          : null;
        const properties = responseData && 'properties' in responseData && Array.isArray(responseData.properties)
          ? responseData.properties
          : (propertiesData.properties || []);

      if (propertiesData.success) {
          setProperties(properties);
        }
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        // apiSuccess возвращает { success: true, data: { categories: ... } }
        const responseData = categoriesData && typeof categoriesData === 'object' && 'data' in categoriesData
          ? (categoriesData as { data: { categories?: any[] } }).data
          : null;
        const categories = responseData && 'categories' in responseData && Array.isArray(responseData.categories)
          ? responseData.categories
          : (categoriesData.categories || []);

      if (categoriesData.success) {
          setCategories(categories);
        }
      }
    } catch (error) {
      clientLogger.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadProperties = useCallback(async () => {
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
      
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append('categoryId', selectedCategory);
      }
      if (showAll) {
        params.append('showAll', 'true');
      }

      const url = `/api/catalog/properties?${params.toString()}`;
      clientLogger.debug('Loading properties from', { url });
      
      const response = await fetch(url, {
        headers,
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки свойств');
      }
      
      const data = await response.json();
      // apiSuccess возвращает { success: true, data: { properties: ... } }
      const responseData = data && typeof data === 'object' && 'data' in data
        ? (data as { data: { properties?: ProductProperty[] } }).data
        : null;
      const properties = responseData && 'properties' in responseData && Array.isArray(responseData.properties)
        ? responseData.properties
        : (data.properties || []);
      
      setProperties(properties);
    } catch (error) {
      clientLogger.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, showAll]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  // Закрытие дерева категорий при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.category-tree-container')) {
        setShowCategoryTree(false);
      }
    };

    if (showCategoryTree) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryTree]);

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const buildCategoryTree = (categories: any[], parentId: string | null = null): any[] => {
    return categories
      .filter(cat => {
        if (parentId === null) {
          return cat.parent_id === null;
        }
        return cat.parent_id === parentId;
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(cat => {
        const children = buildCategoryTree(categories, cat.id);
        return {
          ...cat,
          children: children.length > 0 ? children : undefined
        };
      });
  };

  const renderCategoryNode = (category: any, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`
            flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded
            ${isSelected ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            setSelectedCategory(category.id);
            setShowCategoryTree(false);
          }}
        >
          <div
            className="flex items-center mr-2"
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) {
                toggleCategoryExpanded(category.id);
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )
            ) : (
              <div className="w-4 h-4" />
            )}
          </div>
          
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-gray-500" />
          )}
          
          <span className="text-sm font-medium truncate">{category.name}</span>
          
          {category.product_count !== undefined && category.product_count > 0 && (
            <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {category.product_count}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {category.children.map((child: any) => renderCategoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };


  const handleCreateProperty = async (data: CreateProductPropertyDto) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch('/api/catalog/properties', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Ошибка создания свойства: ${errorData.error || 'Неизвестная ошибка'}`);
        return;
      }

      const result = await response.json();
      
      if (response.ok && result.success) {
        await loadProperties();
        setCreateDialogOpen(false);
        alert('Свойство успешно создано!');
      } else {
        alert(`Ошибка создания свойства: ${result.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      clientLogger.error('Error creating property:', error);
      alert('Ошибка при создании свойства');
    }
  };

  const handleEditProperty = async (data: CreateProductPropertyDto) => {
    if (!propertyToEdit) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/catalog/properties/${propertyToEdit.id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Ошибка обновления свойства: ${errorData.error || 'Неизвестная ошибка'}`);
        return;
      }

      const result = await response.json();

      if (response.ok) {
        await loadProperties();
        setEditDialogOpen(false);
        setPropertyToEdit(null);
        alert('Свойство успешно обновлено!');
      } else {
        alert(`Ошибка обновления свойства: ${result.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      clientLogger.error('Error updating property:', error);
      alert('Ошибка при обновлении свойства');
    }
  };

  const handleDeleteProperty = async (property: ProductProperty) => {
    if (!confirm(`Удалить свойство "${property.name}"?`)) return;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }
      
      const response = await fetch(`/api/catalog/properties/${property.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Ошибка удаления свойства: ${errorData.error || 'Неизвестная ошибка'}`);
        return;
      }

      const result = await response.json();

      if (response.ok) {
        await loadProperties();
        alert('Свойство успешно удалено!');
      } else {
        alert(`Ошибка удаления свойства: ${result.error || 'Неизвестная ошибка'}`);
      }
    } catch (error) {
      clientLogger.error('Error deleting property:', error);
      alert('Ошибка при удалении свойства');
    }
  };

  const getPropertyTypeLabel = (type: PropertyType): string => {
    const labels = {
      text: 'Текст',
      number: 'Число',
      select: 'Список',
      boolean: 'Да/Нет',
      date: 'Дата',
      file: 'Файл'
    };
    return labels[type] || type;
  };

  const getStatusBadge = (property: ProductProperty) => {
    if (!property.is_active) {
      return <Badge variant="secondary">Неактивно</Badge>;
    }
    return <Badge variant="default">Активно</Badge>;
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = showAll || property.is_active;
    
    // Если категория не выбрана, показываем все свойства
    if (!selectedCategory) {
      return matchesSearch && matchesStatus;
    }
    
    // Если категория выбрана, показываем только свойства этой категории
    const hasCategoryAssignment = property.categories?.some(cat => cat.id === selectedCategory);
    return matchesSearch && matchesStatus && hasCategoryAssignment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка свойств...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600">Всего свойств</p>
              <p className="text-2xl font-bold">{properties.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600">Активных</p>
              <p className="text-2xl font-bold">{properties.filter(p => p.is_active).length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600">Обязательных</p>
              <p className="text-2xl font-bold">{properties.filter(p => p.is_required).length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Download className="h-5 w-5 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600">В категориях</p>
              <p className="text-2xl font-bold">{properties.filter(p => p.categories && p.categories.length > 0).length}</p>
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
                  ? categories.find(c => c.id === selectedCategory)?.name || 'Выберите категорию'
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
                  {buildCategoryTree(categories).map(category => renderCategoryNode(category))}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск свойств..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">
              Найдено: {filteredProperties.length}
            </span>
          </div>
        </div>
        
        {/* Дополнительные опции */}
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showAll"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showAll" className="text-sm font-medium">
              Показать все свойства (включая неактивные)
            </label>
          </div>
          
          {selectedCategory && (
            <div className="text-sm text-blue-600">
              Фильтр по категории: {categories.find(c => c.id === selectedCategory)?.name}
            </div>
          )}
        </div>
      </Card>

      {/* Кнопка добавления свойства */}
      <div className="flex justify-center">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить свойство</span>
        </Button>
      </div>

      {/* Список свойств */}
          <Card className="p-4">
            <div className="space-y-2">
          {filteredProperties.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              {searchTerm || selectedCategory || !showAll
                ? 'Свойства не найдены' 
                : 'Свойства не добавлены'
              }
            </div>
          ) : (
            filteredProperties.map(property => (
              <div
                key={property.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-medium text-lg">{property.name}</h3>
                    <Badge variant="outline">{getPropertyTypeLabel(property.type)}</Badge>
                    {getStatusBadge(property)}
                    {property.is_required && (
                      <Badge variant="error">Обязательное</Badge>
                    )}
                  </div>
                  
                  {property.description && (
                    <p className="text-sm text-gray-600 mb-2">{property.description}</p>
                  )}
                  
                  {property.options && property.options.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Варианты:</p>
                      <div className="flex flex-wrap gap-1">
                        {property.options.slice(0, 3).map((option, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {option}
                          </Badge>
                        ))}
                        {property.options.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{property.options.length - 3} еще
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>ID: {property.id}</span>
                    <span>Создано: {property.created_at ? new Date(property.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</span>
                    <span>Обновлено: {property.updated_at ? new Date(property.updated_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</span>
                  </div>
                  
                  {/* Категории */}
                  {property.categories && property.categories.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-500 mb-1">Назначено категориям:</div>
                      <div className="flex flex-wrap gap-1">
                        {property.categories.map(category => (
                          <Badge key={category.id} variant="secondary" className="text-xs">
                            {category.name}
                            {category.is_required && <span className="ml-1 text-red-500">*</span>}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPropertyToEdit(property);
                      setEditDialogOpen(true);
                    }}
                    title="Редактировать"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProperty(property)}
                    className="text-red-600 hover:text-red-700"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
            </div>
          </Card>

          {/* Диалог создания свойства */}
          <CreatePropertyDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSubmit={handleCreateProperty}
          />

          {/* Диалог редактирования свойства */}
          <EditPropertyDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onSubmit={handleEditProperty}
            property={propertyToEdit}
          />
    </div>
  );
}

// Компонент диалога создания свойства
function CreatePropertyDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductPropertyDto) => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as PropertyType,
    description: '',
    options: [] as string[],
    is_required: false,
    is_active: true
  });
  const [newOption, setNewOption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      type: 'text',
      description: '',
      options: [],
      is_required: false,
      is_active: true
    });
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Создать свойство</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название свойства"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип *</label>
            <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as PropertyType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Текст</SelectItem>
                <SelectItem value="number">Число</SelectItem>
                <SelectItem value="select">Список</SelectItem>
                <SelectItem value="boolean">Да/Нет</SelectItem>
                <SelectItem value="date">Дата</SelectItem>
                <SelectItem value="file">Файл</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание свойства (необязательно)"
            />
          </div>

          {formData.type === 'select' && (
            <div>
              <label className="block text-sm font-medium mb-1">Варианты выбора *</label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Добавить вариант"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" onClick={addOption} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{option}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_required"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_required" className="text-sm font-medium">Обязательное поле</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Активно</label>
            </div>
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

// Компонент диалога редактирования свойства
function EditPropertyDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  property 
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateProductPropertyDto) => void;
  property: ProductProperty | null;
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'text' as PropertyType,
    description: '',
    options: [] as string[],
    is_required: false,
    is_active: true
  });
  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        type: property.type || 'text',
        description: property.description || '',
        options: property.options || [],
        is_required: property.is_required || false,
        is_active: property.is_active !== undefined ? property.is_active : true
      });
    } else {
      // Сбрасываем форму если property null
      setFormData({
        name: '',
        type: 'text',
        description: '',
        options: [],
        is_required: false,
        is_active: true
      });
    }
  }, [property]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addOption = () => {
    if (newOption.trim()) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать свойство</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Введите название свойства"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Тип *</label>
            <Select value={formData.type} onValueChange={(value: string) => setFormData({ ...formData, type: value as PropertyType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Текст</SelectItem>
                <SelectItem value="number">Число</SelectItem>
                <SelectItem value="select">Список</SelectItem>
                <SelectItem value="boolean">Да/Нет</SelectItem>
                <SelectItem value="date">Дата</SelectItem>
                <SelectItem value="file">Файл</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание</label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание свойства (необязательно)"
            />
          </div>

          {formData.type === 'select' && (
            <div>
              <label className="block text-sm font-medium mb-1">Варианты выбора *</label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Добавить вариант"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                  />
                  <Button type="button" onClick={addOption} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{option}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_required_edit"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_required_edit" className="text-sm font-medium">Обязательное поле</label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active_edit"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="is_active_edit" className="text-sm font-medium">Активно</label>
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