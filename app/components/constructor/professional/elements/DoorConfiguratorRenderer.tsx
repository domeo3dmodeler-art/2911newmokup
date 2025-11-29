'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DoorOpen, Palette, Settings, Eye, Package, Star, 
  Check, ChevronRight, ChevronDown, Info, AlertCircle
} from 'lucide-react';
import { BaseElement } from '../ProfessionalPageBuilder';

export interface DoorConfiguratorElement extends BaseElement {
  props: {
    categoryId?: string;
    showStyleSelector?: boolean;
    showColorSelector?: boolean;
    showMaterialSelector?: boolean;
    showSizeSelector?: boolean;
    showPriceDisplay?: boolean;
    showProductDetails?: boolean;
    showRecommendations?: boolean;
    selectedStyle?: string;
    selectedColor?: string;
    selectedMaterial?: string;
    selectedSize?: string;
    currentStep?: number;
    totalSteps?: number;
    showProgress?: boolean;
    configuratorType?: 'step-by-step' | 'all-at-once' | 'guided';
  };
}

interface DoorConfiguratorRendererProps {
  element: DoorConfiguratorElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DoorConfiguratorElement>) => void;
}

interface DoorStyle {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  popular?: boolean;
}

interface DoorColor {
  id: string;
  name: string;
  hex: string;
  image: string;
  price: number;
}

interface DoorMaterial {
  id: string;
  name: string;
  description: string;
  durability: number;
  price: number;
}

interface DoorSize {
  id: string;
  width: number;
  height: number;
  name: string;
  price: number;
}

interface ConfiguratorState {
  style: DoorStyle | null;
  color: DoorColor | null;
  material: DoorMaterial | null;
  size: DoorSize | null;
  currentStep: number;
  totalSteps: number;
}

export const DoorConfiguratorRenderer: React.FC<DoorConfiguratorRendererProps> = ({
  element,
  isSelected,
  onSelect,
  onUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const [configuratorState, setConfiguratorState] = useState<ConfiguratorState>({
    style: null,
    color: null,
    material: null,
    size: null,
    currentStep: element.props.currentStep || 1,
    totalSteps: element.props.totalSteps || 4
  });

  // Mock data for demonstration
  const mockStyles: DoorStyle[] = [
    { id: 'classic', name: 'Классика', description: 'Традиционный стиль с филенками', image: '/doors/classic.jpg', price: 0, popular: true },
    { id: 'modern', name: 'Модерн', description: 'Современный минималистичный дизайн', image: '/doors/modern.jpg', price: 500 },
    { id: 'scandinavian', name: 'Скандинавский', description: 'Светлые тона и натуральные материалы', image: '/doors/scandinavian.jpg', price: 300 },
    { id: 'loft', name: 'Лофт', description: 'Индустриальный стиль с металлическими элементами', image: '/doors/loft.jpg', price: 800 }
  ];

  const mockColors: DoorColor[] = [
    { id: 'white', name: 'Белый', hex: '#FFFFFF', image: '/colors/white.jpg', price: 0 },
    { id: 'oak', name: 'Дуб', hex: '#8B4513', image: '/colors/oak.jpg', price: 200 },
    { id: 'walnut', name: 'Орех', hex: '#654321', image: '/colors/walnut.jpg', price: 300 },
    { id: 'black', name: 'Черный', hex: '#000000', image: '/colors/black.jpg', price: 400 }
  ];

  const mockMaterials: DoorMaterial[] = [
    { id: 'mdf', name: 'МДФ', description: 'Экологичный материал средней прочности', durability: 7, price: 0 },
    { id: 'solid-wood', name: 'Массив дерева', description: 'Высокая прочность и долговечность', durability: 10, price: 1000 },
    { id: 'veneer', name: 'Шпон', description: 'Натуральное дерево на основе МДФ', durability: 8, price: 500 }
  ];

  const mockSizes: DoorSize[] = [
    { id: 'standard', width: 80, height: 200, name: 'Стандарт (80x200)', price: 0 },
    { id: 'wide', width: 90, height: 200, name: 'Широкая (90x200)', price: 200 },
    { id: 'tall', width: 80, height: 210, name: 'Высокая (80x210)', price: 300 },
    { id: 'custom', width: 100, height: 220, name: 'Нестандарт (100x220)', price: 500 }
  ];

  useEffect(() => {
    // Обновляем элемент при изменении состояния
    onUpdate(element.id, {
      props: {
        ...element.props,
        selectedStyle: configuratorState.style?.id,
        selectedColor: configuratorState.color?.id,
        selectedMaterial: configuratorState.material?.id,
        selectedSize: configuratorState.size?.id,
        currentStep: configuratorState.currentStep,
        totalSteps: configuratorState.totalSteps
      }
    });
  }, [configuratorState, element.id, element.props, onUpdate]);

  const handleStyleSelect = (style: DoorStyle) => {
    setConfiguratorState(prev => ({ ...prev, style, currentStep: 2 }));
  };

  const handleColorSelect = (color: DoorColor) => {
    setConfiguratorState(prev => ({ ...prev, color, currentStep: 3 }));
  };

  const handleMaterialSelect = (material: DoorMaterial) => {
    setConfiguratorState(prev => ({ ...prev, material, currentStep: 4 }));
  };

  const handleSizeSelect = (size: DoorSize) => {
    setConfiguratorState(prev => ({ ...prev, size, currentStep: 5 }));
  };

  const calculateTotalPrice = useMemo(() => {
    const basePrice = configuratorState.style?.price || 0;
    const colorPrice = configuratorState.color?.price || 0;
    const materialPrice = configuratorState.material?.price || 0;
    const sizePrice = configuratorState.size?.price || 0;
    return basePrice + colorPrice + materialPrice + sizePrice;
  }, [configuratorState.style?.price, configuratorState.color?.price, configuratorState.material?.price, configuratorState.size?.price]);

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Шаг {configuratorState.currentStep} из {configuratorState.totalSteps}
        </span>
        <span className="text-sm text-gray-500">
          {Math.round((configuratorState.currentStep / configuratorState.totalSteps) * 100)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(configuratorState.currentStep / configuratorState.totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStyleSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <DoorOpen className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Выберите стиль двери</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {mockStyles.map(style => (
          <div
            key={style.id}
            onClick={() => handleStyleSelect(style)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              configuratorState.style?.id === style.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="aspect-video bg-gray-100 rounded-md mb-3 flex items-center justify-center">
              <DoorOpen className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{style.name}</h4>
              {style.popular && (
                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                  <Star className="w-3 h-3 mr-1" />
                  Популярно
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-2">{style.description}</p>
            <div className="text-sm font-medium text-blue-600">
              {style.price > 0 ? `+${style.price} ₽` : 'Базовый вариант'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderColorSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Palette className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Выберите цвет</h3>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        {mockColors.map(color => (
          <div
            key={color.id}
            onClick={() => handleColorSelect(color)}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              configuratorState.color?.id === color.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div 
              className="w-full h-16 rounded-md mb-2 border"
              style={{ backgroundColor: color.hex }}
            />
            <div className="text-center">
              <div className="text-sm font-medium">{color.name}</div>
              <div className="text-xs text-gray-500">
                {color.price > 0 ? `+${color.price} ₽` : 'Базовый'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMaterialSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Settings className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Выберите материал</h3>
      </div>
      
      <div className="space-y-3">
        {mockMaterials.map(material => (
          <div
            key={material.id}
            onClick={() => handleMaterialSelect(material)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              configuratorState.material?.id === material.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{material.name}</h4>
                <p className="text-sm text-gray-600">{material.description}</p>
                <div className="flex items-center mt-2">
                  <span className="text-xs text-gray-500 mr-2">Прочность:</span>
                  <div className="flex space-x-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i < material.durability ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-blue-600">
                  {material.price > 0 ? `+${material.price} ₽` : 'Базовый'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSizeSelector = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Package className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Выберите размер</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {mockSizes.map(size => (
          <div
            key={size.id}
            onClick={() => handleSizeSelect(size)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              configuratorState.size?.id === size.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-center">
              <div className="text-lg font-medium mb-2">{size.name}</div>
              <div className="text-sm text-gray-600 mb-3">
                {size.width} × {size.height} см
              </div>
              <div className="text-sm font-medium text-blue-600">
                {size.price > 0 ? `+${size.price} ₽` : 'Стандарт'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPriceDisplay = () => {
    const totalPrice = calculateTotalPrice;
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-blue-800">Итоговая стоимость</h4>
          <div className="text-2xl font-bold text-blue-600">
            {totalPrice.toLocaleString()} ₽
          </div>
        </div>
        <div className="text-sm text-blue-700">
          {configuratorState.style && (
            <div className="flex justify-between">
              <span>Стиль: {configuratorState.style.name}</span>
              <span>{configuratorState.style.price} ₽</span>
            </div>
          )}
          {configuratorState.color && (
            <div className="flex justify-between">
              <span>Цвет: {configuratorState.color.name}</span>
              <span>{configuratorState.color.price} ₽</span>
            </div>
          )}
          {configuratorState.material && (
            <div className="flex justify-between">
              <span>Материал: {configuratorState.material.name}</span>
              <span>{configuratorState.material.price} ₽</span>
            </div>
          )}
          {configuratorState.size && (
            <div className="flex justify-between">
              <span>Размер: {configuratorState.size.name}</span>
              <span>{configuratorState.size.price} ₽</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCurrentStep = () => {
    switch (configuratorState.currentStep) {
      case 1:
        return renderStyleSelector();
      case 2:
        return renderColorSelector();
      case 3:
        return renderMaterialSelector();
      case 4:
        return renderSizeSelector();
      default:
        return (
          <div className="text-center py-8">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Конфигурация завершена!</h3>
            <p className="text-gray-600 mb-4">Ваша дверь готова к заказу</p>
            {renderPriceDisplay()}
          </div>
        );
    }
  };

  const renderContent = () => {
    if (!element.props.categoryId) {
      return (
        <div className="p-4 text-center text-gray-500">
          <DoorOpen className="w-8 h-8 mx-auto mb-2" />
          <p>Выберите категорию дверей для конфигурации</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Прогресс-бар */}
        {element.props.showProgress && renderProgressBar()}

        {/* Текущий шаг */}
        {renderCurrentStep()}

        {/* Отображение цены */}
        {element.props.showPriceDisplay && configuratorState.currentStep > 1 && renderPriceDisplay()}
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
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {renderContent()}
      </div>
    </div>
  );
};

