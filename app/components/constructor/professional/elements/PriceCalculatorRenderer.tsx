'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calculator, Package, ShoppingCart, Plus, Minus, 
  Settings, TrendingUp, Percent, Truck, Wrench,
  CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { BaseElement } from '../ProfessionalPageBuilder';

export interface PriceCalculatorElement extends BaseElement {
  props: {
    categoryId?: string;
    formula?: string;
    basePrice?: number;
    currency?: string;
    showBreakdown?: boolean;
    showDelivery?: boolean;
    showInstallation?: boolean;
    showDiscounts?: boolean;
    deliveryRate?: number;
    installationRate?: number;
    taxRate?: number;
    discountRules?: any[];
    quantity?: number;
    selectedOptions?: any[];
  };
}

interface PriceCalculatorRendererProps {
  element: PriceCalculatorElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PriceCalculatorElement>) => void;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  base_price: number;
  currency: string;
  properties_data?: any;
}

interface CalculationResult {
  basePrice: number;
  optionsPrice: number;
  quantity: number;
  subtotal: number;
  delivery: number;
  installation: number;
  tax: number;
  discount: number;
  total: number;
  breakdown: {
    item: string;
    amount: number;
    description: string;
  }[];
}

export const PriceCalculatorRenderer: React.FC<PriceCalculatorRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(element.props.quantity || 1);
  const [selectedOptions, setSelectedOptions] = useState<any[]>(element.props.selectedOptions || []);
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!element.props.categoryId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/catalog/products?categoryId=${element.props.categoryId}&limit=50`);
      const data = await response.json();
      setProducts(data.products || []);
      
      if (data.products && data.products.length > 0) {
        setSelectedProduct(data.products[0]);
      }
    } catch (error) {
      clientLogger.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }, [element.props.categoryId]);

  const calculatePrice = useCallback(() => {
    const basePrice = selectedProduct?.base_price || element.props.basePrice || 0;
    const currency = selectedProduct?.currency || element.props.currency || 'RUB';
    
    // Расчет цены опций
    const optionsPrice = selectedOptions.reduce((sum, option) => {
      return sum + (option.price || 0);
    }, 0);

    // Подсчеты
    const subtotal = (basePrice + optionsPrice) * quantity;
    const delivery = element.props.showDelivery ? subtotal * (element.props.deliveryRate || 0.05) : 0;
    const installation = element.props.showInstallation ? subtotal * (element.props.installationRate || 0.1) : 0;
    const tax = subtotal * (element.props.taxRate || 0.2);
    
    // Расчет скидки
    let discount = 0;
    if (element.props.showDiscounts && element.props.discountRules) {
      // Простая логика скидок
      if (quantity >= 10) discount = subtotal * 0.1; // 10% за 10+ штук
      else if (quantity >= 5) discount = subtotal * 0.05; // 5% за 5+ штук
    }

    const total = subtotal + delivery + installation + tax - discount;

    const breakdown = [
      {
        item: 'Базовая цена',
        amount: basePrice * quantity,
        description: `${selectedProduct?.name || 'Товар'} × ${quantity}`
      },
      ...selectedOptions.map(option => ({
        item: option.name || 'Опция',
        amount: (option.price || 0) * quantity,
        description: `${option.name || 'Опция'} × ${quantity}`
      })),
      ...(element.props.showDelivery ? [{
        item: 'Доставка',
        amount: delivery,
        description: `${(element.props.deliveryRate || 0.05) * 100}% от суммы`
      }] : []),
      ...(element.props.showInstallation ? [{
        item: 'Монтаж',
        amount: installation,
        description: `${(element.props.installationRate || 0.1) * 100}% от суммы`
      }] : []),
      {
        item: 'НДС',
        amount: tax,
        description: `${(element.props.taxRate || 0.2) * 100}%`
      },
      ...(discount > 0 ? [{
        item: 'Скидка',
        amount: -discount,
        description: 'За количество'
      }] : [])
    ];

    const result: CalculationResult = {
      basePrice,
      optionsPrice,
      quantity,
      subtotal,
      delivery,
      installation,
      tax,
      discount,
      total,
      breakdown
    };

    setCalculation(result);
    
    // Обновляем элемент
    onUpdate(element.id, {
      props: {
        ...element.props,
        quantity,
        selectedOptions
      }
    });
  }, [selectedProduct, quantity, selectedOptions, element.props, onUpdate]);

  useEffect(() => {
    if (element.props.categoryId) {
      loadProducts();
    }
  }, [element.props.categoryId, loadProducts]);

  useEffect(() => {
    if (selectedProduct || element.props.basePrice) {
      calculatePrice();
    }
  }, [selectedProduct, quantity, selectedOptions, element.props.basePrice, calculatePrice]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantity(newQuantity);
  };

  const handleOptionToggle = (option: any) => {
    const isSelected = selectedOptions.find(opt => opt.id === option.id);
    if (isSelected) {
      setSelectedOptions(selectedOptions.filter(opt => opt.id !== option.id));
    } else {
      setSelectedOptions([...selectedOptions, option]);
    }
  };

  const renderProductSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center space-x-2">
        <Package className="w-5 h-5" />
        <span>Выбор товара</span>
      </h3>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="text-gray-500">Загрузка товаров...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <div
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedProduct?.id === product.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{product.name}</h4>
                  <p className="text-sm text-gray-600">Артикул: {product.sku}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{product.base_price} {product.currency}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderQuantitySelector = () => (
    <div className="space-y-3">
      <h4 className="font-medium">Количество</h4>
      <div className="flex items-center space-x-3">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
        />
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderOptionsSelector = () => {
    const mockOptions = [
      { id: 'option1', name: 'Дополнительная обработка', price: 500 },
      { id: 'option2', name: 'Упаковка премиум', price: 200 },
      { id: 'option3', name: 'Гарантия 3 года', price: 1000 },
      { id: 'option4', name: 'Установка в выходные', price: 800 }
    ];

    return (
      <div className="space-y-3">
        <h4 className="font-medium">Дополнительные опции</h4>
        <div className="space-y-2">
          {mockOptions.map(option => {
            const isSelected = selectedOptions.find(opt => opt.id === option.id);
            return (
              <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => handleOptionToggle(option)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <span className="text-sm">{option.name}</span>
                </div>
                <span className="text-sm font-medium">+{option.price} ₽</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalculationResult = () => {
    if (!calculation) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Calculator className="w-5 h-5" />
          <span>Расчет стоимости</span>
        </h3>

        {element.props.showBreakdown && (
          <div className="space-y-2">
            {calculation.breakdown.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div>
                  <span className="text-gray-700">{item.item}</span>
                  <span className="text-gray-500 ml-2">({item.description})</span>
                </div>
                <span className={`font-medium ${item.amount < 0 ? 'text-green-600' : ''}`}>
                  {item.amount < 0 ? '' : '+'}{item.amount.toLocaleString()} ₽
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Итого:</span>
            <span className="text-blue-600">{calculation.total.toLocaleString()} ₽</span>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 flex items-center justify-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Добавить в корзину</span>
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (!element.props.categoryId && !element.props.basePrice) {
      return (
        <div className="p-4 text-center text-gray-500">
          <Calculator className="w-8 h-8 mx-auto mb-2" />
          <p>Выберите категорию товаров для расчета</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {element.props.categoryId && renderProductSelector()}
        {renderQuantitySelector()}
        {renderOptionsSelector()}
        {renderCalculationResult()}
      </div>
    );
  };

  return (
    <div
      className={`relative ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: element.style.left || 0,
        top: element.style.top || 0,
        width: element.style.width || '100%',
        height: element.style.height || 'auto',
        zIndex: element.style.zIndex || 1,
      }}
      onClick={() => onSelect(element.id)}
    >
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        {renderContent()}
      </div>
    </div>
  );
};

