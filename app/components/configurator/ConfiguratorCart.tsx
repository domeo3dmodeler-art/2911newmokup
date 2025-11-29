'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Select } from '../ui';
import { ShoppingCart, Plus, Minus, Trash2, Package, Settings, Calculator, FileText, User } from 'lucide-react';
import ExportToClient from '../cart/ExportToClient';

interface ConfiguratorCategory {
  id: string;
  name: string;
  slug: string;
}

interface CatalogCategory {
  id: string;
  name: string;
  level: number;
  path: string;
}

interface CategoryLink {
  id: string;
  configurator_category_id: string;
  catalog_category_id: string;
  link_type: 'main' | 'additional';
  display_order: number;
  is_required: boolean;
  pricing_type: 'separate' | 'included' | 'formula';
  formula?: string;
  export_as_separate: boolean;
  catalog_category: CatalogCategory;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  description?: string;
  properties_data?: string;
}

interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  category_link: CategoryLink;
  calculated_price?: number;
}

interface GroupedCartItem {
  id: string;
  name: string;
  items: CartItem[];
  total_price: number;
  is_grouped: boolean;
  main_item?: CartItem;
}

interface ExportSetting {
  id: string;
  name: string;
  document_type: 'quote' | 'invoice' | 'order';
  configurator_category_id: string;
}

interface ConfiguratorCartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onExport: (type: 'quote' | 'invoice' | 'order', exportSettingId?: string) => void;
  showGrouped?: boolean;
  configuratorCategoryId?: string;
}

export default function ConfiguratorCart({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onExport,
  showGrouped = false,
  configuratorCategoryId
}: ConfiguratorCartProps) {
  const [groupedItems, setGroupedItems] = useState<GroupedCartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [viewMode, setViewMode] = useState<'separated' | 'grouped'>('separated');
  const [exportSettings, setExportSettings] = useState<ExportSetting[]>([]);
  const [selectedExportSettings, setSelectedExportSettings] = useState<Record<string, string>>({});
  const [showExportToClient, setShowExportToClient] = useState(false);

  const groupCartItems = useCallback(() => {
    const groups: Record<string, CartItem[]> = {};
    const separateItems: CartItem[] = [];

    // Группируем товары по основной категории
    cartItems.forEach(item => {
      if (item.category_link.link_type === 'main') {
        // Основной товар - создаем группу
        const groupKey = `main_${item.category_link.catalog_category_id}`;
        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(item);
      } else if (item.category_link.pricing_type === 'included') {
        // Дополнительный товар, включенный в цену - ищем основной товар
        const mainItem = cartItems.find(ci => 
          ci.category_link.link_type === 'main' && 
          ci.category_link.configurator_category_id === item.category_link.configurator_category_id
        );
        
        if (mainItem) {
          const groupKey = `main_${mainItem.category_link.catalog_category_id}`;
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(item);
        } else {
          separateItems.push(item);
        }
      } else {
        // Отдельная строка
        separateItems.push(item);
      }
    });

    const grouped: GroupedCartItem[] = [];

    // Создаем группы
    Object.entries(groups).forEach(([groupKey, items]) => {
      const mainItem = items.find(item => item.category_link.link_type === 'main');
      const additionalItems = items.filter(item => item.category_link.link_type === 'additional');
      
      if (mainItem) {
        const groupName = additionalItems.length > 0 
          ? `${mainItem.product.name} + комплект`
          : mainItem.product.name;

        const totalPrice = items.reduce((sum, item) => 
          sum + (item.calculated_price || item.product.price) * item.quantity, 0
        );

        grouped.push({
          id: groupKey,
          name: groupName,
          items,
          total_price: totalPrice,
          is_grouped: true,
          main_item: mainItem
        });
      }
    });

    // Добавляем отдельные товары
    separateItems.forEach(item => {
      grouped.push({
        id: item.id,
        name: item.product.name,
        items: [item],
        total_price: (item.calculated_price || item.product.price) * item.quantity,
        is_grouped: false
      });
    });

    setGroupedItems(grouped);
  }, [cartItems]);

  const calculateTotalPrice = useCallback(() => {
    const total = cartItems.reduce((sum, item) => 
      sum + (item.calculated_price || item.product.price) * item.quantity, 0
    );
    setTotalPrice(total);
  }, [cartItems]);

  const loadExportSettings = useCallback(async () => {
    try {
      const response = await fetch(`/api/configurator/export-settings?configuratorCategoryId=${configuratorCategoryId}`);
      const data = await response.json();
      
      if (data.success) {
        setExportSettings(data.settings || []);
      }
    } catch (error) {
      clientLogger.error('Error loading export settings:', error);
    }
  }, [configuratorCategoryId]);

  useEffect(() => {
    if (showGrouped) {
      groupCartItems();
    }
    calculateTotalPrice();
  }, [cartItems, showGrouped, groupCartItems, calculateTotalPrice]);

  useEffect(() => {
    if (configuratorCategoryId) {
      loadExportSettings();
    }
  }, [configuratorCategoryId, loadExportSettings]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      onRemoveItem(itemId);
    } else {
      onUpdateQuantity(itemId, quantity);
    }
  };

  const getLinkTypeIcon = (type: string) => {
    return type === 'main' ? Package : Settings;
  };

  const getLinkTypeColor = (type: string) => {
    return type === 'main' ? 'text-blue-600' : 'text-green-600';
  };

  const getPricingTypeLabel = (type: string) => {
    const labels = {
      separate: 'Отдельная строка',
      included: 'Включено в цену',
      formula: 'По формуле'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (cartItems.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Корзина пуста</p>
          <p className="text-sm text-gray-400">
            Выберите товары из конфигуратора
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Заголовок корзины */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-6 w-6 text-gray-700" />
          <h2 className="text-xl font-semibold">Корзина</h2>
          <Badge variant="secondary">{cartItems.length} позиций</Badge>
        </div>
        <div className="flex items-center space-x-2">
          {showGrouped && (
            <div className="flex bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'separated' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('separated')}
              >
                Раздельно
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grouped')}
              >
                Группами
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Очистить
          </Button>
        </div>
      </div>

      {/* Список товаров */}
      <div className="space-y-2">
        {(viewMode === 'grouped' && showGrouped ? groupedItems : 
          cartItems.map(item => ({
            id: item.id,
            name: item.product.name,
            items: [item],
            total_price: (item.calculated_price || item.product.price) * item.quantity,
            is_grouped: false
          }))
        ).map(group => (
          <Card key={group.id} className="p-4">
            {group.is_grouped ? (
              // Группированный вид
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <h3 className="font-medium">{group.name}</h3>
                    <Badge variant="outline">Комплект</Badge>
                  </div>
                  <div className="text-lg font-semibold text-blue-600">
                    {group.total_price.toLocaleString()} ₽
                  </div>
                </div>
                
                <div className="space-y-2 ml-7">
                  {group.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        {React.createElement(getLinkTypeIcon(item.category_link.link_type), {
                          className: `h-4 w-4 ${getLinkTypeColor(item.category_link.link_type)}`
                        })}
                        <span>{item.product.name}</span>
                        <span className="text-gray-500">({item.product.sku})</span>
                        <Badge variant="outline" className="text-xs">
                          {getPricingTypeLabel(item.category_link.pricing_type)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">
                          {item.quantity} × {(item.calculated_price || item.product.price).toLocaleString()} ₽
                        </span>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onRemoveItem(item.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Раздельный вид
              group.items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {React.createElement(getLinkTypeIcon(item.category_link.link_type), {
                        className: `h-5 w-5 ${getLinkTypeColor(item.category_link.link_type)}`
                      })}
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">{item.product.sku}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.category_link.link_type === 'main' ? 'default' : 'secondary'}>
                          {item.category_link.link_type === 'main' ? 'Основная' : 'Дополнительная'}
                        </Badge>
                        <Badge variant="outline">
                          {getPricingTypeLabel(item.category_link.pricing_type)}
                        </Badge>
                      </div>
                    </div>
                    {item.category_link.formula && (
                      <div className="flex items-center space-x-2 mt-1">
                        <Calculator className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-600">
                          Формула: {item.category_link.formula}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium">
                        {((item.calculated_price || item.product.price) * item.quantity).toLocaleString()} ₽
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × {(item.calculated_price || item.product.price).toLocaleString()} ₽
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        ))}
      </div>

      {/* Итого и действия */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Итого</h3>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {totalPrice.toLocaleString()} ₽
          </div>
        </div>
        
        <div className="space-y-3">
          {/* Кнопки экспорта */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setShowExportToClient(true)}
              className="flex items-center space-x-1"
            >
              <User className="h-4 w-4" />
              <span>Сохранить в заказчика</span>
            </Button>
            <Button
              onClick={() => onExport('quote', selectedExportSettings.quote)}
              className="flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>Коммерческое предложение</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onExport('invoice', selectedExportSettings.invoice)}
              className="flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>Счет</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => onExport('order', selectedExportSettings.order)}
              className="flex items-center space-x-1"
            >
              <FileText className="h-4 w-4" />
              <span>Заказ поставщику</span>
            </Button>
          </div>

          {/* Настройки экспорта */}
          {exportSettings.length > 0 && (
            <div className="text-sm text-gray-600">
              <p className="mb-2">Настройки экспорта:</p>
              <div className="space-y-1">
                {['quote', 'invoice', 'order'].map(type => {
                  const typeSettings = exportSettings.filter(s => s.document_type === type);
                  if (typeSettings.length === 0) return null;
                  
                  return (
                    <div key={type} className="flex items-center space-x-2">
                      <span className="w-24 text-xs">
                        {type === 'quote' ? 'КП:' : type === 'invoice' ? 'Счет:' : 'Заказ:'}
                      </span>
                      <Select
                        value={selectedExportSettings[type] || ''}
                        onValueChange={(value) => 
                          setSelectedExportSettings(prev => ({
                            ...prev,
                            [type]: value
                          }))
                        }
                      >
                        <option value="">По умолчанию</option>
                        {typeSettings.map(setting => (
                          <option key={setting.id} value={setting.id}>
                            {setting.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Export to Client Modal */}
      {showExportToClient && (
        <ExportToClient
          cartItems={cartItems.map(item => ({
            id: item.id,
            name: item.product.name,
            price: item.calculated_price || item.product.price,
            quantity: item.quantity,
            productId: item.product.id
          }))}
          onSuccess={() => {
            onClearCart();
            setShowExportToClient(false);
          }}
          onClose={() => setShowExportToClient(false)}
        />
      )}
    </div>
  );
}
