'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Checkbox, Badge, Accordion, AccordionItem } from '../ui';
import { 
  X, 
  Save, 
  Undo2, 
  Redo2, 
  Settings, 
  Move, 
  Folder, 
  Image,
  Search,
  Package,
  Maximize2,
  Minimize2,
  Check
} from 'lucide-react';
import CategoryTreeSelector from './CategoryTreeSelector';

interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  productCount: number;
  imageUrl: string;
}

interface BlockSettings {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  catalogCategoryId?: string;
  catalogCategoryInfo?: CategoryInfo;
  additionalCatalogCategories?: string[];
  // Настройки отображения
  displayMode?: 'cards' | 'list' | 'table';
  itemsPerPage?: number;
  showImages?: boolean;
  showPrices?: boolean;
  showDescriptions?: boolean;
  showFilters?: boolean;
  showSearch?: boolean;
  imageSize?: 'small' | 'medium' | 'large';
  imageAspectRatio?: 'square' | 'landscape' | 'portrait' | 'auto';
  columns?: number;
  // Фильтры и сортировка
  filters?: { [key: string]: any };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Поля для отображения
  displayFields?: string[];
  imageSettings?: {
    iconSize: number;
    photoSize: number;
    showPhotoCount: boolean;
  };
  aspectRatio?: {
    enabled: boolean;
    ratio: number;
  };
}

interface DetailedBlockEditorProps {
  block: BlockSettings;
  categories: any[];
  onSave: (block: BlockSettings) => void;
  onClose: () => void;
}

const DetailedBlockEditor: React.FC<DetailedBlockEditorProps> = ({
  block,
  categories,
  onSave,
  onClose
}) => {
  const [editedBlock, setEditedBlock] = useState<BlockSettings>(block);
  const [history, setHistory] = useState<BlockSettings[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [activeTab, setActiveTab] = useState('main');
  const [selectedCategory, setSelectedCategory] = useState<{id: string, info: any} | null>(null);
  const [availableProperties, setAvailableProperties] = useState<any[]>([]);
  const [showPropertySelection, setShowPropertySelection] = useState(false);
  const [selectedPropertyValues, setSelectedPropertyValues] = useState<any[]>([]);
  const [selectedPropertyForValues, setSelectedPropertyForValues] = useState<string | null>(null);
  const [selectedFilterValues, setSelectedFilterValues] = useState<Set<string>>(new Set());
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  // Сохраняем пропорции при открытии
  const [originalAspectRatio, setOriginalAspectRatio] = useState<number>(
    block.height / block.width
  );

  useEffect(() => {
    setEditedBlock(block);
    setOriginalAspectRatio(block.height / block.width);
  }, [block]);

  // Загружаем доступные свойства при изменении категории
  useEffect(() => {
    const loadAvailableProperties = async () => {
      if (editedBlock.catalogCategoryId) {
        try {
          const response = await fetch(`/api/products/category/${editedBlock.catalogCategoryId}?page=1&limit=1`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.filters.available) {
              setAvailableProperties(data.data.filters.available);
            }
          }
        } catch (error) {
          clientLogger.error('Error loading available properties:', error);
        }
      } else {
        setAvailableProperties([]);
      }
    };

    loadAvailableProperties();
  }, [editedBlock.catalogCategoryId]);

  // Обновляем отфильтрованные категории при изменении поиска
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchTerm, categories]);

  // Автоматическое обновление названия блока при выборе категории
  useEffect(() => {
    if (editedBlock?.catalogCategoryInfo && editedBlock.type === 'main-category') {
      const newName = editedBlock.catalogCategoryInfo.name;
      if (editedBlock.name !== newName) {
        handleBlockUpdate({
          ...editedBlock,
          name: newName
        });
      }
    }
  }, [editedBlock?.catalogCategoryInfo, editedBlock?.type, editedBlock?.name, handleBlockUpdate]);

  // Сохранение в историю
  const saveToHistory = useCallback((blockState: BlockSettings) => {
    const newHistory = [...history.slice(0, historyIndex + 1), blockState];
    if (newHistory.length > 5) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(Math.min(newHistory.length - 1, 4));
  }, [history, historyIndex]);

  // Обновление блока с сохранением в историю
  const handleBlockUpdate = useCallback((updatedBlock: BlockSettings) => {
    saveToHistory(editedBlock);
    setEditedBlock(updatedBlock);
  }, [editedBlock, saveToHistory]);

  // Отмена действия
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setEditedBlock(prevState);
      setHistoryIndex(prev => prev - 1);
    }
  };

  // Повтор действия
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setEditedBlock(nextState);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Обновление размеров с сохранением пропорций
  const handleSizeChange = (field: 'width' | 'height', value: number) => {
    const updatedBlock = { ...editedBlock };
    
    if (field === 'width') {
      updatedBlock.width = Math.max(1, Math.floor(value));
      if (editedBlock.aspectRatio?.enabled) {
        updatedBlock.height = Math.floor(updatedBlock.width * editedBlock.aspectRatio.ratio);
      }
    } else {
      updatedBlock.height = Math.max(1, Math.floor(value));
      if (editedBlock.aspectRatio?.enabled) {
        updatedBlock.width = Math.floor(updatedBlock.height / editedBlock.aspectRatio.ratio);
      }
    }

    handleBlockUpdate(updatedBlock);
  };

  // Переключение сохранения пропорций
  const handleAspectRatioToggle = (enabled: boolean) => {
    const updatedBlock = { ...editedBlock };
    if (enabled) {
      const ratio = editedBlock.height / editedBlock.width;
      updatedBlock.aspectRatio = { enabled: true, ratio };
    } else {
      updatedBlock.aspectRatio = { enabled: false, ratio: originalAspectRatio };
    }

    handleBlockUpdate(updatedBlock);
  };

  // Обновление настроек изображений
  const handleImageSettingsChange = (field: string, value: any) => {
    const updatedBlock = { ...editedBlock };
    updatedBlock.imageSettings = {
      ...updatedBlock.imageSettings,
      iconSize: 32,
      photoSize: 200,
      showPhotoCount: true,
      [field]: value
    };

    handleBlockUpdate(updatedBlock);
  };

  // Загрузка уникальных значений выбранного свойства
  const loadPropertyValues = async (propertyKey: string) => {
    if (!editedBlock.catalogCategoryId) return;
    
    clientLogger.debug('Loading property values for:', propertyKey);
    clientLogger.debug('Category ID:', editedBlock.catalogCategoryId);
    
    try {
      // Загружаем больше товаров для точного подсчета
      const url = `/api/products/category/${editedBlock.catalogCategoryId}?page=1&limit=5000&fields=["${propertyKey}"]`;
      clientLogger.debug('API URL:', url);
      
      const response = await fetch(url);
      clientLogger.debug('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        clientLogger.debug('API response data:', data);
        
        if (data.success && data.data.products) {
          clientLogger.debug('Products count:', data.data.products.length);
          
          // Показываем все доступные ключи свойств из первого товара
          if (data.data.products.length > 0) {
            const firstProduct = data.data.products[0];
            if (firstProduct.properties_data) {
              let propertiesData = firstProduct.properties_data;
              
              // Если properties_data - это строка, парсим её как JSON
              if (typeof propertiesData === 'string') {
                try {
                  propertiesData = JSON.parse(propertiesData);
                } catch (e) {
                  clientLogger.warn('Failed to parse properties_data for logging:', e);
                }
              }
              
              clientLogger.debug('Available property keys:', Object.keys(propertiesData));
              clientLogger.debug('Looking for property:', propertyKey);
            }
          }
          
          // Извлекаем уникальные значения свойства
          const values = new Set();
          const valueCounts = new Map();
          
          data.data.products.forEach((product: any) => {
            if (product.properties_data) {
              let propertiesData = product.properties_data;
              
              // Если properties_data - это строка, парсим её как JSON
              if (typeof propertiesData === 'string') {
                try {
                  propertiesData = JSON.parse(propertiesData);
                } catch (e) {
                  clientLogger.warn('Failed to parse properties_data:', e);
                  return;
                }
              }
              
              // Ищем свойство по точному совпадению или по частичному совпадению
              let foundValue = propertiesData[propertyKey];
              
              // Если точного совпадения нет, ищем по частичному совпадению
              if (!foundValue) {
                const keys = Object.keys(propertiesData);
                const matchingKey = keys.find(key => 
                  key.includes(propertyKey) || propertyKey.includes(key) ||
                  key.toLowerCase().includes(propertyKey.toLowerCase()) ||
                  propertyKey.toLowerCase().includes(key.toLowerCase())
                );
                if (matchingKey) {
                  foundValue = propertiesData[matchingKey];
                  clientLogger.debug(`Found property by partial match: "${matchingKey}" for "${propertyKey}"`);
                }
              }
              
              if (foundValue) {
                values.add(foundValue);
                valueCounts.set(foundValue, (valueCounts.get(foundValue) || 0) + 1);
              }
            }
          });
          
          clientLogger.debug('Unique values found:', Array.from(values));
          clientLogger.debug('Value counts:', Object.fromEntries(valueCounts));
          
          // Сортируем по количеству товаров (по убыванию)
          const sortedValues = Array.from(values).map(value => ({
            value,
            count: valueCounts.get(value)
          })).sort((a, b) => b.count - a.count);
          
          clientLogger.debug('Sorted values:', sortedValues);
          
          setSelectedPropertyValues(sortedValues);
          setFilteredProducts(data.data.products); // Сохраняем товары для фильтрации
        } else {
          clientLogger.debug('No products found or API error');
        }
      } else {
        clientLogger.error('API request failed:', response.status, response.statusText);
      }
    } catch (error) {
      clientLogger.error('Error loading property values:', error);
    }
  };

  // Фильтрация товаров по выбранным значениям
  const filterProductsByValues = (selectedValues: Set<string>) => {
    if (!selectedPropertyForValues || selectedValues.size === 0) {
      return filteredProducts;
    }
    
    return filteredProducts.filter((product: any) => {
      const productValue = product.properties_data?.[selectedPropertyForValues];
      return productValue && selectedValues.has(productValue);
    });
  };

  // Обработка выбора/снятия выбора значения фильтра
  const handleFilterValueToggle = (value: string) => {
    const newSelectedValues = new Set(selectedFilterValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }
    setSelectedFilterValues(newSelectedValues);
  };

  // Сохранение изменений
  const handleSave = () => {
    onSave(editedBlock);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Подробное редактирование блока
              </h2>
            </div>
            <Badge variant="outline" className="text-sm">
              {editedBlock.name}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Отменить"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Повторить"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Левая панель - настройки */}
            <div className="w-96 border-r border-gray-200 overflow-y-auto">
              <div className="p-6">
                {/* Вкладки */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setActiveTab('main')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'main'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Основные
                  </button>
                  <button
                    onClick={() => setActiveTab('display')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'display'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Отображение
                  </button>
                  <button
                    onClick={() => setActiveTab('filters')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'filters'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Фильтры
                  </button>
                </div>

                {/* Содержимое вкладок */}
                {activeTab === 'main' && (
                  <Accordion>
                  <AccordionItem 
                    value="main" 
                    title="Основные" 
                    icon={<Settings className="w-4 h-4" />}
                    defaultOpen={true}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Название блока
                        </label>
                        <Input
                          value={editedBlock.name}
                          onChange={(e) => handleBlockUpdate({ ...editedBlock, name: e.target.value })}
                          placeholder="Введите название блока"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Позиция (X, Y)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            value={editedBlock.x}
                            onChange={(e) => handleBlockUpdate({ 
                              ...editedBlock, 
                              x: Math.floor(Number(e.target.value) || 0) 
                            })}
                            placeholder="X"
                            className="text-center"
                          />
                          <Input
                            type="number"
                            value={editedBlock.y}
                            onChange={(e) => handleBlockUpdate({ 
                              ...editedBlock, 
                              y: Math.floor(Number(e.target.value) || 0) 
                            })}
                            placeholder="Y"
                            className="text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Z-индекс
                        </label>
                        <Input
                          type="number"
                          value={editedBlock.zIndex}
                          onChange={(e) => handleBlockUpdate({ 
                            ...editedBlock, 
                            zIndex: Math.floor(Number(e.target.value) || 1) 
                          })}
                          placeholder="1"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </AccordionItem>

                  <AccordionItem 
                    value="size" 
                    title="Размеры" 
                    icon={<Move className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Размеры (px)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ширина</label>
                            <Input
                              type="number"
                              value={editedBlock.width}
                              onChange={(e) => handleSizeChange('width', Number(e.target.value) || 1)}
                              placeholder="Ширина"
                              className="text-center"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Высота</label>
                            <Input
                              type="number"
                              value={editedBlock.height}
                              onChange={(e) => handleSizeChange('height', Number(e.target.value) || 1)}
                              placeholder="Высота"
                              className="text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={editedBlock.aspectRatio?.enabled || false}
                          onCheckedChange={handleAspectRatioToggle}
                        />
                        <label className="text-sm text-gray-700">
                          Сохранить пропорции
                        </label>
                      </div>

                      {editedBlock.aspectRatio?.enabled && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-700">
                            Соотношение: {editedBlock.aspectRatio.ratio.toFixed(2)}:1
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionItem>

                  <AccordionItem 
                    value="categories" 
                    title="Категории" 
                    icon={<Folder className="w-4 h-4" />}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Поиск категории
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <Input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск по названию..."
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Основная категория
                        </label>
                        <CategoryTreeSelector
                          value={editedBlock.catalogCategoryId || ''}
                          onChange={(categoryId, categoryInfo) => {
                            // Не обновляем сразу, только сохраняем выбранную категорию
                            setSelectedCategory({ id: categoryId, info: categoryInfo });
                          }}
                          categories={filteredCategories}
                        />
                        {selectedCategory && (
                          <div className="mt-3 flex items-center justify-between bg-blue-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <Package className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-blue-900">
                                {selectedCategory.info.name}
                              </span>
                              <span className="text-sm text-blue-700">
                                ({selectedCategory.info.productCount} товаров)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => {
                                handleBlockUpdate({
                                  ...editedBlock,
                                  catalogCategoryId: selectedCategory.id,
                                  catalogCategoryInfo: selectedCategory.info
                                });
                                setSelectedCategory(null);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Выбрать
                            </Button>
                          </div>
                        )}
                      </div>

                      {editedBlock.catalogCategoryInfo && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Package className="w-4 h-4 text-green-600" />
                            <span className="font-medium text-green-900">
                              {editedBlock.catalogCategoryInfo.name}
                            </span>
                          </div>
                          <p className="text-sm text-green-700">
                            Товаров: {editedBlock.catalogCategoryInfo.productCount}
                          </p>
                        </div>
                      )}

                      {!editedBlock.catalogCategoryId && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-700">
                            ⚠️ Выберите категорию для отображения товаров
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionItem>

                  <AccordionItem 
                    value="images" 
                    title="Изображения" 
                    icon={<Image className="w-4 h-4" aria-label="Иконка изображения" />}
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Размер иконок товаров (px)
                        </label>
                        <Input
                          type="number"
                          value={editedBlock.imageSettings?.iconSize || 32}
                          onChange={(e) => handleImageSettingsChange('iconSize', Number(e.target.value) || 32)}
                          placeholder="32"
                          className="w-full"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Размер фото товаров (px)
                        </label>
                        <Input
                          type="number"
                          value={editedBlock.imageSettings?.photoSize || 200}
                          onChange={(e) => handleImageSettingsChange('photoSize', Number(e.target.value) || 200)}
                          placeholder="200"
                          className="w-full"
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={editedBlock.imageSettings?.showPhotoCount || false}
                          onCheckedChange={(checked) => handleImageSettingsChange('showPhotoCount', checked)}
                        />
                        <label className="text-sm text-gray-700">
                          Показывать количество фото
                        </label>
                      </div>

                      {editedBlock.catalogCategoryInfo && (
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm text-blue-700">
                            📷 Изображения берутся из привязанных фото товаров категории
                          </p>
                        </div>
                      )}
                    </div>
                  </AccordionItem>
                </Accordion>
                )}

                {/* Вкладка "Отображение" */}
                {activeTab === 'display' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Настройки отображения</h3>
                      
                      {/* Режим отображения */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Режим отображения
                        </label>
                        <select
                          value={editedBlock.displayMode || 'cards'}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            displayMode: e.target.value as 'cards' | 'list' | 'table'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="cards">Карточки</option>
                          <option value="list">Список</option>
                          <option value="table">Таблица</option>
                        </select>
                      </div>

                      {/* Количество колонок */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Количество колонок
                        </label>
                        <Input
                          type="number"
                          value={editedBlock.columns || 3}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            columns: parseInt(e.target.value) || 3
                          })}
                          min="1"
                          max="6"
                          placeholder="3"
                          className="w-full"
                        />
                      </div>

                      {/* Товаров на странице */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Товаров на странице
                        </label>
                        <Input
                          type="number"
                          value={editedBlock.itemsPerPage || 12}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            itemsPerPage: parseInt(e.target.value) || 12
                          })}
                          min="1"
                          max="100"
                          placeholder="12"
                          className="w-full"
                        />
                      </div>

                      {/* Размер изображений */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Размер изображений
                        </label>
                        <select
                          value={editedBlock.imageSize || 'medium'}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            imageSize: e.target.value as 'small' | 'medium' | 'large'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="small">Маленький</option>
                          <option value="medium">Средний</option>
                          <option value="large">Большой</option>
                        </select>
                      </div>

                      {/* Пропорции изображений */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Пропорции изображений
                        </label>
                        <select
                          value={editedBlock.imageAspectRatio || 'square'}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            imageAspectRatio: e.target.value as 'square' | 'landscape' | 'portrait' | 'auto'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="square">Квадрат</option>
                          <option value="landscape">Горизонтальный</option>
                          <option value="portrait">Вертикальный</option>
                          <option value="auto">Автоматически</option>
                        </select>
                      </div>

                      {/* Чекбоксы отображения */}
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedBlock.showImages !== false}
                            onCheckedChange={(checked) => handleBlockUpdate({
                              ...editedBlock,
                              showImages: checked
                            })}
                          />
                          <label className="text-sm text-gray-700">
                            Показывать изображения
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedBlock.showPrices !== false}
                            onCheckedChange={(checked) => handleBlockUpdate({
                              ...editedBlock,
                              showPrices: checked
                            })}
                          />
                          <label className="text-sm text-gray-700">
                            Показывать цены
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedBlock.showDescriptions !== false}
                            onCheckedChange={(checked) => handleBlockUpdate({
                              ...editedBlock,
                              showDescriptions: checked
                            })}
                          />
                          <label className="text-sm text-gray-700">
                            Показывать описания
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedBlock.showFilters !== false}
                            onCheckedChange={(checked) => handleBlockUpdate({
                              ...editedBlock,
                              showFilters: checked
                            })}
                          />
                          <label className="text-sm text-gray-700">
                            Показывать фильтры
                          </label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={editedBlock.showSearch !== false}
                            onCheckedChange={(checked) => handleBlockUpdate({
                              ...editedBlock,
                              showSearch: checked
                            })}
                          />
                          <label className="text-sm text-gray-700">
                            Показывать поиск
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Вкладка "Фильтры" */}
                {activeTab === 'filters' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Настройки фильтрации</h3>
                      
                      {/* Сортировка */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Сортировка по умолчанию
                        </label>
                        <select
                          value={editedBlock.sortBy || 'name'}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            sortBy: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="name">По названию</option>
                          <option value="base_price">По цене</option>
                          <option value="created_at">По дате добавления</option>
                          <option value="sku">По артикулу</option>
                        </select>
                      </div>

                      {/* Порядок сортировки */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Порядок сортировки
                        </label>
                        <select
                          value={editedBlock.sortOrder || 'asc'}
                          onChange={(e) => handleBlockUpdate({
                            ...editedBlock,
                            sortOrder: e.target.value as 'asc' | 'desc'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="asc">По возрастанию</option>
                          <option value="desc">По убыванию</option>
                        </select>
                      </div>

                      {/* Поля для отображения */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Поля для отображения
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {availableProperties.length > 0 ? (
                            availableProperties.map(property => (
                              <div key={property.key} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={editedBlock.displayFields?.includes(property.key) || false}
                                  onCheckedChange={(checked) => {
                                    const currentFields = editedBlock.displayFields || [];
                                    const newFields = checked 
                                      ? [...currentFields, property.key]
                                      : currentFields.filter(f => f !== property.key);
                                    handleBlockUpdate({
                                      ...editedBlock,
                                      displayFields: newFields
                                    });
                                  }}
                                />
                                <label className="text-sm text-gray-700">
                                  {property.key}
                                </label>
                                <span className="text-xs text-gray-500">
                                  ({property.count} значений)
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">
                              {editedBlock.catalogCategoryId ? 'Загрузка свойств...' : 'Выберите категорию для загрузки свойств'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Правая панель - предпросмотр */}
            <div className="flex-1 bg-gray-50 p-6">
              <div className="bg-white rounded-lg shadow-lg p-8 h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Предпросмотр блока: {editedBlock.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Размер: {editedBlock.width} × {editedBlock.height} px
                  </p>
                  <p className="text-xs text-gray-500">
                    Пропорции: {(editedBlock.width / editedBlock.height).toFixed(2)}:1
                  </p>
                </div>
                
                {/* Область для редактирования блока с увеличенными размерами */}
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 overflow-hidden bg-white shadow-sm mx-auto"
                  style={{
                    width: '600px',
                    height: `${600 * (editedBlock.height / editedBlock.width)}px`,
                    maxHeight: '500px',
                    aspectRatio: `${editedBlock.width} / ${editedBlock.height}`
                  }}
                >
                  {editedBlock.catalogCategoryId ? (
                    <div className="h-full flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-gray-600">
                          Реальные пропорции блока (увеличенные для редактирования)
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setShowPropertySelection(true)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Выбрать свойства
                        </Button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto">
                        {selectedPropertyValues.length > 0 ? (
                          <div className="space-y-2">
                            <div className="text-sm text-gray-600 mb-3">
                              Уникальные значения свойства "{selectedPropertyForValues}":
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedPropertyValues.map((item, index) => (
                                <div key={index} className={`flex items-center justify-between p-2 rounded text-sm border transition-colors ${
                                  selectedFilterValues.has(item.value) 
                                    ? 'bg-green-50 border-green-300' 
                                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                                }`}>
                                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                                    <Checkbox
                                      checked={selectedFilterValues.has(item.value)}
                                      onCheckedChange={() => handleFilterValueToggle(item.value)}
                                      className="w-4 h-4"
                                    />
                                    <span className="text-sm font-medium truncate">{item.value}</span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    selectedFilterValues.has(item.value)
                                      ? 'text-green-600 bg-green-100'
                                      : 'text-blue-600 bg-blue-100'
                                  }`}>
                                    {item.count}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  Выбрано значений: {selectedFilterValues.size}
                                </span>
                                <span className="text-gray-600">
                                  Товаров: {filterProductsByValues(selectedFilterValues).length}
                                </span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedFilterValues(new Set());
                                  }}
                                  className="flex-1"
                                >
                                  Снять выбор
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedPropertyValues([]);
                                    setSelectedPropertyForValues(null);
                                    setSelectedFilterValues(new Set());
                                    setFilteredProducts([]);
                                  }}
                                  className="flex-1"
                                >
                                  Очистить все
                                </Button>
                              </div>
                            </div>
                            
                            {/* Предпросмотр отфильтрованных товаров */}
                            {selectedFilterValues.size > 0 && (
                              <div className="mt-4 border-t pt-4">
                                <div className="text-sm text-gray-600 mb-3">
                                  Предпросмотр товаров ({filterProductsByValues(selectedFilterValues).length} из {filteredProducts.length}):
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-1">
                                  {filterProductsByValues(selectedFilterValues).slice(0, 10).map((product: any, index: number) => (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-xs">
                                      <span className="font-medium truncate flex-1">{product.name}</span>
                                      <span className="text-gray-500">{product.sku}</span>
                                      {product.base_price && (
                                        <span className="text-green-600 font-medium">
                                          {product.base_price} {product.currency || '₽'}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {filterProductsByValues(selectedFilterValues).length > 10 && (
                                    <div className="text-xs text-gray-500 text-center py-2">
                                      ... и еще {filterProductsByValues(selectedFilterValues).length - 10} товаров
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {editedBlock.displayFields && editedBlock.displayFields.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-sm text-gray-600 mb-2">
                                  Выбранные свойства для отображения:
                                </div>
                                {editedBlock.displayFields.map(propertyKey => {
                                  const property = availableProperties.find(p => p.key === propertyKey);
                                  return (
                                    <div key={propertyKey} className="flex items-center space-x-2 p-2 bg-green-50 rounded text-sm border border-green-200">
                                      <Checkbox
                                        checked={true}
                                        onCheckedChange={(checked) => {
                                          if (!checked) {
                                            const newFields = editedBlock.displayFields?.filter(f => f !== propertyKey) || [];
                                            handleBlockUpdate({
                                              ...editedBlock,
                                              displayFields: newFields
                                            });
                                          }
                                        }}
                                        className="w-4 h-4"
                                      />
                                      <span className="text-sm font-medium truncate">{propertyKey}</span>
                                      <span className="text-xs text-gray-500">({property?.count || 0})</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                <Settings className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Свойства не выбраны</p>
                                <p className="text-xs">Нажмите "Выбрать свойства" для настройки</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">Выберите категорию для редактирования блока</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Информация о выбранной категории (только если выбрана) */}
                {editedBlock.catalogCategoryInfo && (
                  <div className="mt-4 bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        Категория: {editedBlock.catalogCategoryInfo.name}
                      </span>
                      <span className="text-sm text-blue-700">
                        ({editedBlock.catalogCategoryInfo.productCount} товаров)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно для выбора свойств */}
      {showPropertySelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl w-[80vw] h-[80vh] flex flex-col">
            {/* Заголовок модального окна */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    Выбор свойств для отображения
                  </h2>
                </div>
                <Badge variant="outline" className="text-sm">
                  {editedBlock.catalogCategoryInfo?.name || 'Категория не выбрана'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => {
                    // Выбираем все свойства
                    const allFields = availableProperties.map(p => p.key);
                    handleBlockUpdate({
                      ...editedBlock,
                      displayFields: allFields
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Выбрать все
                </Button>
                <Button
                  onClick={() => {
                    // Снимаем выбор со всех свойств
                    handleBlockUpdate({
                      ...editedBlock,
                      displayFields: []
                    });
                  }}
                  variant="outline"
                  size="sm"
                >
                  Снять все
                </Button>
                <Button
                  onClick={() => setShowPropertySelection(false)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Готово
                </Button>
                <Button variant="ghost" onClick={() => setShowPropertySelection(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Содержимое модального окна */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    Выберите свойства товаров, которые будут отображаться в блоке. 
                    Всего доступно: {availableProperties.length} свойств
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
                  {availableProperties.map(property => (
                    <div key={property.key} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={editedBlock.displayFields?.includes(property.key) || false}
                          onCheckedChange={(checked) => {
                            const currentFields = editedBlock.displayFields || [];
                            const newFields = checked 
                              ? [...currentFields, property.key]
                              : currentFields.filter(f => f !== property.key);
                            handleBlockUpdate({
                              ...editedBlock,
                              displayFields: newFields
                            });
                          }}
                          className="w-5 h-5 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {property.key}
                          </h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {property.count} значений
                          </p>
                          
                          {/* Кнопка для работы только с этим свойством */}
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleBlockUpdate({
                                  ...editedBlock,
                                  simpleMode: true,
                                  focusedProperty: property.key,
                                  displayFields: [property.key],
                                  propertyDisplayMode: 'chips',
                                  showProductList: true
                                });
                                setShowPropertySelection(false);
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              ⚡ Работать только с этим свойством
                            </Button>
                          </div>
                          {property.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {property.description}
                            </p>
                          )}
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPropertyForValues(property.key);
                                loadPropertyValues(property.key);
                                setShowPropertySelection(false);
                              }}
                              className="w-full text-xs"
                            >
                              Загрузить значения
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {availableProperties.length === 0 && (
                  <div className="text-center py-12">
                    <Settings className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      {editedBlock.catalogCategoryId ? 'Загрузка свойств...' : 'Выберите категорию для загрузки свойств'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Подвал модального окна */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Выбрано: {editedBlock.displayFields?.length || 0} из {availableProperties.length} свойств
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setShowPropertySelection(false)}
                    variant="outline"
                  >
                    Отмена
                  </Button>
                  <Button
                    onClick={() => {
                      // Загружаем значения выбранного свойства
                      if (editedBlock.displayFields && editedBlock.displayFields.length > 0) {
                        loadPropertyValues(editedBlock.displayFields[0]);
                      }
                      setShowPropertySelection(false);
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedBlockEditor;
