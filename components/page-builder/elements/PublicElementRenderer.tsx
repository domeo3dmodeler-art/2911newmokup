'use client';

import React from 'react';
import { RealProductGrid } from './RealProductGrid';
import { PriceCalculator } from './PriceCalculator';
import { DoorCalculator } from './DoorCalculator';

interface PublicElement {
  id: string;
  type: string;
  props: Record<string, any>;
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
}

interface PublicElementRendererProps {
  element: PublicElement;
}

export function PublicElementRenderer({ element }: PublicElementRendererProps) {
  // Простой рендеринг компонентов без сложных импортов
  const renderContent = () => {
    switch (element.type) {
      case 'heading':
        return (
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {element.props.title || element.props.text || 'Заголовок'}
          </h1>
        );

      case 'text':
        return (
          <p className="text-gray-700 leading-relaxed">
            {element.props.text || element.props.content || 'Текст'}
          </p>
        );

      case 'button':
        return (
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            {element.props.text || element.props.title || 'Кнопка'}
          </button>
        );

      case 'image':
        return (
          <img 
            src={element.props.src || '/placeholder-image.jpg'} 
            alt={element.props.alt || 'Изображение'}
            className="w-full h-auto rounded-lg"
          />
        );

      case 'section':
        return (
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-semibold mb-3">
              {element.props.title || 'Секция'}
            </h2>
            <p className="text-gray-600">
              {element.props.description || 'Описание секции'}
            </p>
          </div>
        );

      case 'productGrid':
        return (
          <RealProductGrid 
            categoryIds={element.props.categoryIds}
            limit={element.props.limit || 6}
            title={element.props.title || "Товары из каталога"}
          />
        );

      case 'productCard':
        return (
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <img 
              src={element.props.image || '/placeholder-product.jpg'} 
              alt="Товар"
              className="w-full h-48 object-cover rounded-lg mb-3"
            />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {element.props.title || 'Название товара'}
            </h3>
            <p className="text-gray-600 mb-3">
              {element.props.description || 'Описание товара'}
            </p>
            <div className="text-xl font-bold text-blue-600">
              {element.props.price || 'Цена'} ₽
            </div>
          </div>
        );

      case 'input':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {element.props.label || 'Поле ввода'}
            </label>
            <input 
              type={element.props.type || 'text'}
              placeholder={element.props.placeholder || 'Введите значение'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        );

      case 'select':
        return (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {element.props.label || 'Выберите опцию'}
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>{element.props.placeholder || 'Выберите...'}</option>
            </select>
          </div>
        );

      case 'checkbox':
        return (
          <div className="flex items-center mb-4">
            <input 
              type="checkbox" 
              className="mr-2"
            />
            <label className="text-sm text-gray-700">
              {element.props.label || 'Опция'}
            </label>
          </div>
        );

             case 'radio':
               return (
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     {element.props.label || 'Выберите один вариант'}
                   </label>
                   <div className="space-y-2">
                     <label className="flex items-center">
                       <input type="radio" name={element.props.name || 'option'} className="mr-2" />
                       <span className="text-sm text-gray-700">Вариант 1</span>
                     </label>
                     <label className="flex items-center">
                       <input type="radio" name={element.props.name || 'option'} className="mr-2" />
                       <span className="text-sm text-gray-700">Вариант 2</span>
                     </label>
                   </div>
                 </div>
               );

             case 'productFilter':
               return (
                 <div className="bg-white p-6 rounded-lg shadow-sm border">
                   <h3 className="text-lg font-semibold mb-4">{element.props.title || 'Фильтры товаров'}</h3>
                   <div className="space-y-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Цена</label>
                       <div className="flex items-center space-x-2">
                         <input type="number" placeholder="От" className="px-3 py-2 border border-gray-300 rounded-lg w-24" />
                         <span className="text-gray-500">—</span>
                         <input type="number" placeholder="До" className="px-3 py-2 border border-gray-300 rounded-lg w-24" />
                       </div>
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-2">Бренд</label>
                       <div className="space-y-2">
                         <label className="flex items-center">
                           <input type="checkbox" className="mr-2" />
                           <span className="text-sm text-gray-700">Domeo</span>
                         </label>
                         <label className="flex items-center">
                           <input type="checkbox" className="mr-2" />
                           <span className="text-sm text-gray-700">Premium</span>
                         </label>
                       </div>
                     </div>
                     <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                       Применить фильтры
                     </button>
                   </div>
                 </div>
               );

      case 'priceCalculator':
        return (
          <PriceCalculator 
            categoryIds={element.props.categoryIds}
            basePrice={element.props.basePrice || 15000}
            title={element.props.title || "Калькулятор цен"}
            showDimensions={element.props.showDimensions !== false}
            showStyle={element.props.showStyle !== false}
          />
        );

      case 'doorCalculator':
        return (
          <DoorCalculator 
            title={element.props.title || "Калькулятор дверей Domeo"}
            showDimensions={element.props.showDimensions !== false}
            showStyle={element.props.showStyle !== false}
            showSystem={element.props.showSystem !== false}
            showFinish={element.props.showFinish !== false}
          />
        );

      default:
        return (
          <div className="p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <div className="text-gray-500 text-sm">
              Компонент: {element.type}
            </div>
            <div className="text-gray-400 text-xs mt-1">
              ID: {element.id}
            </div>
          </div>
        );
    }
  };

  return (
    <div 
      style={{ 
        width: element.size.width, 
        height: element.size.height,
        minHeight: '60px'
      }}
      className="flex items-center justify-center"
    >
      {renderContent()}
    </div>
  );
}