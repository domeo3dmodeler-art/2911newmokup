'use client';

import React, { useState, useRef } from 'react';
import { BaseElement, ElementRendererProps, Size } from '../types';
import { clientLogger } from '@/lib/logging/client-logger';
import { SelectionOverlay } from './SelectionOverlay';
import { shouldShowTechnicalInfo } from '../../../lib/display-mode';
import { ProductDisplay } from './ProductDisplay';
import { ProductConfiguratorAdvanced } from './ProductConfiguratorAdvanced';
import { Cart } from './Cart';
import { CatalogTree } from './CatalogTree';
import { StepWizard } from './StepWizard';
import { ComparisonTable } from './ComparisonTable';
import { Contact } from './Contact';
import { Accordion } from './Accordion';
import { Gallery } from './Gallery';
import { Input } from './Input';
import { Select } from './Select';
import { Checkbox } from './Checkbox';
import { Radio } from './Radio';
import { ProductFilter } from './ProductFilter';
import { PropertyFilter } from './PropertyFilter';
import { FilteredProducts } from './FilteredProducts';
import { FeatureStatus } from './FeatureStatus';
import { ProductCard } from './ProductCard';
import { ProductGallery } from './ProductGallery';
import { ProductDetails } from './ProductDetails';
import { PriceDisplay } from './PriceDisplay';
import { SummaryTable } from './SummaryTable';
import { ProductGrid } from './ProductGrid';

interface ExtendedElementRendererProps extends ElementRendererProps {
  onMouseDown: (e: React.MouseEvent) => void;
  onResize: (newSize: Size) => void;
  onConnectionData?: (sourceElementId: string, data: any) => void;
  allElements?: BaseElement[]; // Все элементы страницы для подсчета номеров
}

export function ElementRenderer({
  element,
  isSelected,
  isMultiSelected,
  zoom,
  onSelect,
  onMultiSelect,
  onUpdate,
  onDelete,
  onMouseDown,
  onResize,
  onConnectionData,
  allElements = []
}: ExtendedElementRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const elementRef = useRef<HTMLDivElement>(null);

  // Обработчик клика для выделения
  const handleClick = (e: React.MouseEvent) => {
    clientLogger.debug('🖱️ ElementRenderer: handleClick НАЧАЛО - событие получено!', {
      elementId: element.id,
      elementType: element.type,
      ctrlKey: e.ctrlKey,
      target: e.target,
      currentTarget: e.currentTarget,
      hasOnMultiSelect: !!onMultiSelect,
      hasOnSelect: !!onSelect
    });
    
    e.stopPropagation();
    
    clientLogger.debug('🖱️ ElementRenderer: handleClick ПРОДОЛЖЕНИЕ - после stopPropagation', {
      elementId: element.id,
      elementType: element.type,
      ctrlKey: e.ctrlKey
    });
    
    if (e.ctrlKey) {
      clientLogger.debug('🖱️ ElementRenderer: Ctrl+click - множественное выделение');
      onMultiSelect(e);
    } else {
      clientLogger.debug('🖱️ ElementRenderer: Обычный клик - одиночное выделение');
      onSelect();
    }
    
    clientLogger.debug('🖱️ ElementRenderer: handleClick КОНЕЦ');
  };

  // Обработчик двойного клика для редактирования
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (element.type === 'text' || element.type === 'heading') {
      e.stopPropagation();
      setIsEditing(true);
      setEditValue(element.props.content || '');
    }
  };

  // Обработчик завершения редактирования
  const handleEditComplete = () => {
    if (isEditing) {
      onUpdate({
        props: {
          ...element.props,
          content: editValue
        }
      });
      setIsEditing(false);
    }
  };

  // Обработчик изменения размера
  const handleResize = (direction: string, deltaX: number, deltaY: number) => {
    const newSize = { ...element.size };
    
    switch (direction) {
      case 'nw':
        newSize.width = Math.max(element.constraints.minWidth, element.size.width - deltaX);
        newSize.height = Math.max(element.constraints.minHeight, element.size.height - deltaY);
        break;
      case 'ne':
        newSize.width = Math.max(element.constraints.minWidth, element.size.width + deltaX);
        newSize.height = Math.max(element.constraints.minHeight, element.size.height - deltaY);
        break;
      case 'sw':
        newSize.width = Math.max(element.constraints.minWidth, element.size.width - deltaX);
        newSize.height = Math.max(element.constraints.minHeight, element.size.height + deltaY);
        break;
      case 'se':
        newSize.width = Math.max(element.constraints.minWidth, element.size.width + deltaX);
        newSize.height = Math.max(element.constraints.minHeight, element.size.height + deltaY);
        break;
      case 'n':
        newSize.height = Math.max(element.constraints.minHeight, element.size.height - deltaY);
        break;
      case 's':
        newSize.height = Math.max(element.constraints.minHeight, element.size.height + deltaY);
        break;
      case 'w':
        newSize.width = Math.max(element.constraints.minWidth, element.size.width - deltaX);
        break;
      case 'e':
        newSize.width = Math.max(element.constraints.minWidth, element.size.width + deltaX);
        break;
    }

    onResize(newSize);
  };

  // Рендеринг содержимого элемента
  const renderContent = () => {
    switch (element.type) {
      case 'text':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditComplete();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditValue(element.props.content || '');
                }
              }}
              className="w-full h-full bg-transparent border-none outline-none resize-none"
              autoFocus
            />
          );
        }
        return (
          <span
            style={{
              fontSize: element.props.fontSize || 16,
              color: element.props.color || '#1f2937',
              fontWeight: element.props.fontWeight || 'normal'
            }}
          >
            {element.props.content || 'Текст'}
          </span>
        );

      case 'heading':
        if (isEditing) {
          return (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditComplete}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleEditComplete();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditValue(element.props.content || '');
                }
              }}
              className="w-full h-full bg-transparent border-none outline-none resize-none"
              autoFocus
            />
          );
        }
        const HeadingTag = `h${element.props.level || 1}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag
            style={{
              fontSize: element.props.fontSize || 24,
              color: element.props.color || '#1f2937',
              fontWeight: element.props.fontWeight || 'bold',
              margin: 0,
              padding: 0
            }}
          >
            {element.props.content || 'Заголовок'}
          </HeadingTag>
        );

      case 'image':
        return (
          <img
            src={element.props.src || '/placeholder-image.jpg'}
            alt={element.props.alt || 'Изображение'}
            className="w-full h-full object-cover"
            style={{ borderRadius: element.style.borderRadius || 0 }}
          />
        );

      case 'button':
        return (
          <button
            className={`px-4 py-2 rounded ${
              element.props.variant === 'primary'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
            style={{
              fontSize: element.props.size === 'small' ? 14 : element.props.size === 'large' ? 18 : 16
            }}
          >
            {element.props.text || 'Кнопка'}
          </button>
        );

      case 'container':
        return (
          <div className="w-full h-full">
            {element.props.children?.map((child: BaseElement) => (
              <ElementRenderer
                key={child.id}
                element={child}
                isSelected={false}
                zoom={zoom}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
                onMouseDown={() => {}}
                onResize={() => {}}
              />
            )) || (
              <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-2">📦</div>
                  <div className="text-sm">Контейнер</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Перетащите элементы сюда
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'section':
        return (
          <div className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg">
            <div className="p-4">
              <div className="text-center text-gray-600">
                <div className="text-2xl mb-2">📋</div>
                <div className="text-sm font-medium">Секция</div>
                <div className="text-xs text-gray-400 mt-1">
                  Основная секция страницы
                </div>
              </div>
            </div>
          </div>
        );

      case 'row':
        return (
          <div className="w-full h-full bg-blue-50 border border-blue-200 rounded-lg">
            <div className="p-4">
              <div className="text-center text-blue-600">
                <div className="text-2xl mb-2">↔️</div>
                <div className="text-sm font-medium">Строка</div>
                <div className="text-xs text-blue-400 mt-1">
                  Горизонтальная строка элементов
                </div>
              </div>
            </div>
          </div>
        );

      case 'column':
        return (
          <div className="w-full h-full bg-green-50 border border-green-200 rounded-lg">
            <div className="p-4">
              <div className="text-center text-green-600">
                <div className="text-2xl mb-2">↕️</div>
                <div className="text-sm font-medium">Колонка</div>
                <div className="text-xs text-green-400 mt-1">
                  Вертикальная колонка элементов
                </div>
              </div>
            </div>
          </div>
        );

      case 'grid':
        return (
          <div className="w-full h-full bg-purple-50 border border-purple-200 rounded-lg">
            <div className="p-4">
              <div className="text-center text-purple-600">
                <div className="text-2xl mb-2">⊞</div>
                <div className="text-sm font-medium">Сетка</div>
                <div className="text-xs text-purple-400 mt-1">
                  Сетка элементов
                </div>
              </div>
            </div>
          </div>
        );

      case 'spacer':
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-lg mb-1">↔️</div>
              <div className="text-xs">Отступ</div>
            </div>
          </div>
        );

      case 'divider':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
        );

      case 'icon':
        return (
          <div className="w-full h-full bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-yellow-600">
              <div className="text-4xl mb-2">{element.props.icon || '⭐'}</div>
              <div className="text-xs">Иконка</div>
            </div>
          </div>
        );

      case 'badge':
        return (
          <div className="w-full h-full bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
            <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              {element.props.text || 'Значок'}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Contact
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'accordion':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Accordion
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'gallery':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Gallery
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'header':
        return (
          <div className="w-full h-full bg-blue-600 text-white rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm font-medium">Шапка страницы</div>
              <div className="text-xs text-blue-200 mt-1">
                Навигация и логотип
              </div>
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="w-full h-full bg-gray-800 text-white rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm font-medium">Подвал страницы</div>
              <div className="text-xs text-gray-400 mt-1">
                Контакты и ссылки
              </div>
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="w-full h-full bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-2xl mb-2">☰</div>
              <div className="text-sm font-medium">Меню</div>
              <div className="text-xs text-gray-400 mt-1">
                Навигационное меню
              </div>
            </div>
          </div>
        );

      case 'breadcrumb':
        return (
          <div className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-2xl mb-2">🍞</div>
              <div className="text-sm font-medium">Хлебные крошки</div>
              <div className="text-xs text-gray-400 mt-1">
                Навигация по сайту
              </div>
            </div>
          </div>
        );

      case 'tabs':
        return (
          <div className="w-full h-full bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-indigo-600">
              <div className="text-2xl mb-2">📑</div>
              <div className="text-sm font-medium">Вкладки</div>
              <div className="text-xs text-indigo-400 mt-1">
                Переключение контента
              </div>
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <div className="text-xl font-bold mb-2">Hero секция</div>
              <div className="text-sm text-blue-100">
                Главная секция страницы
              </div>
            </div>
          </div>
        );

      case 'card':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="p-4">
              <div className="text-center text-gray-600">
                <div className="text-2xl mb-2">🃏</div>
                <div className="text-sm font-medium">Карточка</div>
                <div className="text-xs text-gray-400 mt-1">
                  Блок с контентом
                </div>
              </div>
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="w-full h-full bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="text-2xl mb-2">🖼️</div>
              <div className="text-sm font-medium">Галерея</div>
              <div className="text-xs text-gray-400 mt-1">
                Изображения
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="w-full h-full bg-black border border-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-4xl mb-2">🎥</div>
              <div className="text-sm font-medium">Видео</div>
              <div className="text-xs text-gray-300 mt-1">
                Видео контент
              </div>
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="w-full h-full bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-yellow-700">
              <div className="text-2xl mb-2">💬</div>
              <div className="text-sm font-medium">Отзыв</div>
              <div className="text-xs text-yellow-600 mt-1">
                Отзыв клиента
              </div>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="w-full h-full bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
            <div className="text-center text-green-600">
              <div className="text-2xl mb-2">❓</div>
              <div className="text-sm font-medium">FAQ</div>
              <div className="text-xs text-green-500 mt-1">
                Часто задаваемые вопросы
              </div>
            </div>
          </div>
        );

      case 'productConfigurator':
             return (
               <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                 <ProductConfiguratorAdvanced
                   element={element}
                   onUpdate={onUpdate}
                 />
               </div>
             );

      case 'productGrid':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ProductGrid
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );


      case 'cart':
        return (
          <div className="w-full h-full flex items-center justify-center">
            <Cart
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'catalogTree':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <CatalogTree
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'stepWizard':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <StepWizard
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'comparisonTable':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ComparisonTable
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );


      // Новые компоненты форм
      case 'input':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4">
            <Input
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'select':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4">
            <Select
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'checkbox':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4">
            <Checkbox
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'radio':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4">
            <Radio
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'productFilter':
        return (
          <div className="w-full h-full">
            <ProductFilter
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'propertyFilter':
        clientLogger.debug('🚨 ElementRenderer: Рендерим PropertyFilter', {
          elementId: element.id,
          elementProps: element.props,
          propertyName: element.props.propertyName
        });
        
        return (
          <div className="w-full h-full">
            <PropertyFilter
              element={element}
              onUpdate={onUpdate}
              onConnectionData={onConnectionData}
            />
          </div>
        );

      case 'filteredProducts':
        return (
          <div className="w-full h-full">
            <FilteredProducts
              element={element}
              onUpdate={onUpdate}
              filters={element.props.filters || {}}
            />
          </div>
        );

      case 'featureStatus':
        return (
          <div className="w-full h-full">
            <FeatureStatus
              features={element.props.features || []}
            />
          </div>
        );

      // Товарные компоненты
      case 'productCard':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ProductCard
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'productGallery':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden p-4">
            <ProductGallery
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'productDetails':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ProductDetails
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      // Компоненты отображения результатов
      case 'priceDisplay':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden p-4">
            <PriceDisplay
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      case 'summaryTable':
        return (
          <div className="w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <SummaryTable
              element={element}
              onUpdate={onUpdate}
            />
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-2">📄</div>
              <div className="text-sm">{element.type}</div>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      ref={elementRef}
      className={`absolute select-none ${isSelected ? 'z-10' : 'z-0'}`}
      style={{
        left: element.position.x,
        top: element.position.y,
        width: element.size.width,
        height: element.size.height,
        backgroundColor: element.style.backgroundColor || 'transparent',
        borderColor: element.style.borderColor || 'transparent',
        borderWidth: element.style.borderWidth || 0,
        borderStyle: 'solid',
        borderRadius: element.style.borderRadius || 0,
        padding: `${element.style.padding?.top || 8}px ${element.style.padding?.right || 8}px ${element.style.padding?.bottom || 8}px ${element.style.padding?.left || 8}px`,
        margin: `${element.style.margin?.top || 0}px ${element.style.margin?.right || 0}px ${element.style.margin?.bottom || 0}px ${element.style.margin?.left || 0}px`,
        opacity: element.style.opacity || 1,
        zIndex: element.style.zIndex || 1,
        cursor: isSelected ? 'move' : 'pointer'
      }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onDoubleClick={handleDoubleClick}
    >
      {renderContent()}

      {/* Selection Overlay */}
      {(isSelected || isMultiSelected) && (
        <SelectionOverlay
          element={element}
          isSelected={isSelected}
          isMultiSelected={isMultiSelected}
          allElements={allElements}
          onDelete={onDelete}
          onResize={handleResize}
        />
      )}
    </div>
  );
}
