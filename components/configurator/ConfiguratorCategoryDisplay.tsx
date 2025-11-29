'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from '../ui';
import { Package, Settings, Plus, Minus, Calculator } from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

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

interface ConfiguratorCategoryDisplayProps {
  configuratorCategoryId: string;
  onAddToCart: (item: CartItem) => void;
  onUpdateCartQuantity: (itemId: string, quantity: number) => void;
  onRemoveFromCart: (itemId: string) => void;
  cartItems: CartItem[];
}

export default function ConfiguratorCategoryDisplay({
  configuratorCategoryId,
  onAddToCart,
  onUpdateCartQuantity,
  onRemoveFromCart,
  cartItems
}: ConfiguratorCategoryDisplayProps) {
  const [categoryLinks, setCategoryLinks] = useState<CategoryLink[]>([]);
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [selectedProducts, setSelectedProducts] = useState<Record<string, Product | null>>({});
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);

  const loadCategoryLinks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/configurator/category-links?configuratorCategoryId=${configuratorCategoryId}`);
      const data = await response.json();
      
      if (data.success) {
        const links = data.links || [];
        setCategoryLinks(links);
        
        // Загружаем товары для каждой категории
        const productsData: Record<string, Product[]> = {};
        for (const link of links) {
          const productsResponse = await fetch(`/api/catalog/products?categoryId=${link.catalog_category_id}`);
          const productsData_response = await productsResponse.json();
          productsData[link.id] = productsData_response.products || [];
        }
        setProducts(productsData);
      }
    } catch (error) {
      clientLogger.error('Error loading category links:', error);
    } finally {
      setLoading(false);
    }
  }, [configuratorCategoryId]);

  const calculateTotalPrice = useCallback(() => {
    let total = 0;
    
    // Считаем цену выбранных товаров
    Object.entries(selectedProducts).forEach(([linkId, product]) => {
      if (product) {
        const link = categoryLinks.find(l => l.id === linkId);
        const quantity = quantities[linkId] || 1;
        
        if (link) {
          let price = product.price;
          
          // Применяем формулу если есть
          if (link.pricing_type === 'formula' && link.formula) {
            try {
              // Простая замена переменных в формуле
              const formula = link.formula.replace('price', product.price.toString());
              price = eval(formula);
            } catch (error) {
              clientLogger.error('Error calculating formula:', error);
              price = product.price;
            }
          }
          
          total += price * quantity;
        }
      }
    });
    
    // Добавляем товары из корзины
    cartItems.forEach(item => {
      total += (item.calculated_price || item.product.price) * item.quantity;
    });
    
    setTotalPrice(total);
  }, [selectedProducts, quantities, cartItems, categoryLinks]);

  useEffect(() => {
    loadCategoryLinks();
  }, [loadCategoryLinks]);

  useEffect(() => {
    calculateTotalPrice();
  }, [calculateTotalPrice]);

  const handleProductSelect = (linkId: string, product: Product) => {
    setSelectedProducts(prev => ({
      ...prev,
      [linkId]: product
    }));
    
    if (!quantities[linkId]) {
      setQuantities(prev => ({
        ...prev,
        [linkId]: 1
      }));
    }
  };

  const handleQuantityChange = (linkId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [linkId]: Math.max(1, quantity)
    }));
  };

  const handleAddToCart = (linkId: string) => {
    const product = selectedProducts[linkId];
    const link = categoryLinks.find(l => l.id === linkId);
    const quantity = quantities[linkId] || 1;
    
    if (product && link) {
      let calculatedPrice = product.price;
      
      // Применяем формулу если есть
      if (link.pricing_type === 'formula' && link.formula) {
        try {
          const formula = link.formula.replace('price', product.price.toString());
          calculatedPrice = eval(formula);
        } catch (error) {
          clientLogger.error('Error calculating formula:', error);
          calculatedPrice = product.price;
        }
      }
      
      const cartItem: CartItem = {
        id: `${linkId}-${product.id}`,
        product,
        quantity,
        category_link: link,
        calculated_price: calculatedPrice
      };
      
      onAddToCart(cartItem);
      
      // Очищаем выбор после добавления в корзину
      setSelectedProducts(prev => ({
        ...prev,
        [linkId]: null
      }));
      setQuantities(prev => ({
        ...prev,
        [linkId]: 1
      }));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Загрузка конфигуратора...</div>
      </div>
    );
  }

  if (categoryLinks.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-lg font-medium mb-2">Категории не настроены</p>
        <p className="text-sm text-gray-400">
          Обратитесь к администратору для настройки категорий конфигуратора
        </p>
      </div>
    );
  }

  // Сортируем связи по порядку отображения
  const sortedLinks = [...categoryLinks].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-6">
      {/* Основные категории */}
      {sortedLinks
        .filter(link => link.link_type === 'main')
        .map(link => (
          <Card key={link.id} className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              {React.createElement(getLinkTypeIcon(link.link_type), {
                className: `h-6 w-6 ${getLinkTypeColor(link.link_type)}`
              })}
              <h2 className="text-xl font-semibold">{link.catalog_category.name}</h2>
              <Badge variant="default">Основная</Badge>
              {link.is_required && (
                <Badge variant="error">Обязательная</Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products[link.id]?.map(product => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedProducts[link.id]?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleProductSelect(link.id, product)}
                >
                  <h3 className="font-medium mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {product.price.toLocaleString()} ₽
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-2">{product.description}</p>
                  )}
                </div>
              ))}
            </div>

            {selectedProducts[link.id] && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Выбрано: {selectedProducts[link.id].name}</p>
                    <p className="text-sm text-gray-600">
                      Цена: {selectedProducts[link.id].price.toLocaleString()} ₽
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(link.id, (quantities[link.id] || 1) - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantities[link.id] || 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(link.id, (quantities[link.id] || 1) + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleAddToCart(link.id)}
                      className="ml-2"
                    >
                      Добавить в корзину
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}

      {/* Дополнительные категории */}
      {sortedLinks
        .filter(link => link.link_type === 'additional')
        .map(link => (
          <Card key={link.id} className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              {React.createElement(getLinkTypeIcon(link.link_type), {
                className: `h-6 w-6 ${getLinkTypeColor(link.link_type)}`
              })}
              <h3 className="text-lg font-semibold">{link.catalog_category.name}</h3>
              <Badge variant="secondary">Дополнительная</Badge>
              {link.is_required && (
                <Badge variant="error">Обязательная</Badge>
              )}
              <Badge variant="outline">
                {getPricingTypeLabel(link.pricing_type)}
              </Badge>
            </div>
            
            {link.formula && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    Формула расчета: {link.formula}
                  </span>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products[link.id]?.map(product => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedProducts[link.id]?.id === product.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleProductSelect(link.id, product)}
                >
                  <h4 className="font-medium mb-2">{product.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{product.sku}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {product.price.toLocaleString()} ₽
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-500 mt-2">{product.description}</p>
                  )}
                </div>
              ))}
            </div>

            {selectedProducts[link.id] && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Выбрано: {selectedProducts[link.id].name}</p>
                    <p className="text-sm text-gray-600">
                      Цена: {selectedProducts[link.id].price.toLocaleString()} ₽
                    </p>
                    {link.pricing_type === 'formula' && link.formula && (
                      <p className="text-sm text-yellow-600">
                        С учетом формулы: {(() => {
                          try {
                            const formula = link.formula!.replace('price', selectedProducts[link.id]!.price.toString());
                            return eval(formula).toLocaleString();
                          } catch {
                            return selectedProducts[link.id]!.price.toLocaleString();
                          }
                        })()} ₽
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(link.id, (quantities[link.id] || 1) - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{quantities[link.id] || 1}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuantityChange(link.id, (quantities[link.id] || 1) + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleAddToCart(link.id)}
                      className="ml-2"
                    >
                      Добавить в корзину
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}

      {/* Итоговая цена */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Итого</h3>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {totalPrice.toLocaleString()} ₽
          </div>
        </div>
        {cartItems.length > 0 && (
          <div className="mt-2 text-sm text-blue-700">
            В корзине: {cartItems.length} позиций
          </div>
        )}
      </Card>
    </div>
  );
}
