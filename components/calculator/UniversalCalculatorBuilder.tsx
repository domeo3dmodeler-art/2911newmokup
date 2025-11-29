'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, 
  Settings, 
  Play, 
  Save, 
  Eye, 
  Code, 
  Calculator,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  List,
  MousePointer,
  Zap
} from 'lucide-react';
import { clientLogger } from '@/lib/logging/client-logger';

// 🧮 Типы элементов калькулятора
export type CalculatorElementType = 
  | 'input'           // Поле ввода
  | 'output'          // Поле вывода результата
  | 'formula'         // Формула
  | 'condition'       // Условная логика
  | 'button'          // Кнопка
  | 'text'            // Текст/заголовок
  | 'slider'          // Слайдер
  | 'select'          // Выпадающий список
  | 'checkbox'        // Чекбокс
  | 'radio'           // Радио кнопки
  | 'date'            // Выбор даты
  | 'table'           // Таблица
  | 'chart'           // График
  | 'group'           // Группа элементов
  | 'tabs'            // Вкладки
  | 'accordion'       // Аккордеон
  | 'progress'        // Прогресс бар
  | 'catalog_source'  // Источник данных из каталога
  | 'api_source'      // Источник данных из API
  | 'file_source';    // Источник данных из файла

export interface CalculatorElement {
  id: string;
  type: CalculatorElementType;
  name: string;
  label: string;
  
  // 📍 Позиция и размер
  position: { x: number; y: number };
  size: { width: number; height: number };
  
  // 🎨 Стили
  styles: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderRadius?: number;
    fontSize?: number;
    fontWeight?: string;
    padding?: number;
    margin?: number;
  };
  
  // ⚙️ Настройки элемента
  config: {
    // Общие настройки
    required?: boolean;
    disabled?: boolean;
    visible?: boolean;
    placeholder?: string;
    helpText?: string;
    
    // Для input
    inputType?: 'text' | 'number' | 'email' | 'tel' | 'password';
    min?: number;
    max?: number;
    step?: number;
    
    // Для select/radio
    options?: Array<{ value: string | number | boolean; label: string }>;
    
    // Для формул
    formula?: string;
    variables?: string[];
    
    // Для условий
    condition?: string;
    trueAction?: string;
    falseAction?: string;
    
    // Для источников данных
    dataSource?: {
      type: 'catalog' | 'api' | 'file';
      config: Record<string, unknown>;
    };
    
    // Для таблиц и графиков
    columns?: Array<{ key: string; label: string; type: string }>;
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    
    // События
    onChange?: string; // JavaScript код
    onClick?: string;
    onFocus?: string;
    onBlur?: string;
  };
  
  // 🔗 Связи с другими элементами
  dependencies?: string[];
  affects?: string[];
}

export interface CalculatorConfig {
  id: string;
  name: string;
  description: string;
  elements: CalculatorElement[];
  variables: Array<{
    id: string;
    name: string;
    type: string;
    defaultValue: string | number | boolean | null;
  }>;
  formulas: Array<{
    id: string;
    name: string;
    expression: string;
  }>;
  styles: {
    theme: 'light' | 'dark' | 'custom';
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
  layout: {
    type: 'grid' | 'flex' | 'absolute';
    columns?: number;
    gap?: number;
    responsive?: boolean;
  };
}

// 🎨 Палитра элементов
const ELEMENT_PALETTE: Array<{
  type: CalculatorElementType;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
}> = [
  // 📝 Ввод данных
  { type: 'input', name: 'Поле ввода', icon: <Type />, category: 'input', description: 'Текстовое поле для ввода данных' },
  { type: 'slider', name: 'Слайдер', icon: <ToggleLeft />, category: 'input', description: 'Слайдер для выбора числового значения' },
  { type: 'select', name: 'Выпадающий список', icon: <List />, category: 'input', description: 'Список для выбора одного варианта' },
  { type: 'checkbox', name: 'Чекбокс', icon: <MousePointer />, category: 'input', description: 'Флажок для выбора да/нет' },
  { type: 'date', name: 'Выбор даты', icon: <Calendar />, category: 'input', description: 'Календарь для выбора даты' },
  
  // 🧮 Вычисления
  { type: 'formula', name: 'Формула', icon: <Calculator />, category: 'logic', description: 'Математическая формула' },
  { type: 'condition', name: 'Условие', icon: <Zap />, category: 'logic', description: 'Условная логика if-then-else' },
  { type: 'output', name: 'Результат', icon: <Hash />, category: 'logic', description: 'Поле для отображения результата' },
  
  // 🎨 Интерфейс
  { type: 'text', name: 'Текст', icon: <Type />, category: 'ui', description: 'Заголовок или описание' },
  { type: 'button', name: 'Кнопка', icon: <MousePointer />, category: 'ui', description: 'Кнопка для действий' },
  { type: 'group', name: 'Группа', icon: <List />, category: 'ui', description: 'Группировка элементов' },
  { type: 'tabs', name: 'Вкладки', icon: <List />, category: 'ui', description: 'Организация в вкладки' },
  
  // 📊 Данные
  { type: 'table', name: 'Таблица', icon: <List />, category: 'data', description: 'Таблица с данными' },
  { type: 'chart', name: 'График', icon: <List />, category: 'data', description: 'Визуализация данных' },
  { type: 'catalog_source', name: 'Каталог', icon: <List />, category: 'data', description: 'Данные из каталога товаров' },
  { type: 'api_source', name: 'API', icon: <Zap />, category: 'data', description: 'Внешний источник данных' },
];

const CATEGORIES = {
  input: { name: 'Ввод данных', color: 'bg-blue-100 text-blue-800' },
  logic: { name: 'Вычисления', color: 'bg-green-100 text-green-800' },
  ui: { name: 'Интерфейс', color: 'bg-purple-100 text-purple-800' },
  data: { name: 'Данные', color: 'bg-orange-100 text-orange-800' },
};

export default function UniversalCalculatorBuilder() {
  const [config, setConfig] = useState<CalculatorConfig>({
    id: 'calc_' + Date.now(),
    name: 'Новый калькулятор',
    description: '',
    elements: [],
    variables: [],
    formulas: [],
    styles: {
      theme: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      fontFamily: 'Inter, sans-serif'
    },
    layout: {
      type: 'grid',
      columns: 12,
      gap: 16,
      responsive: true
    }
  });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [mode, setMode] = useState<'design' | 'preview' | 'code'>('design');
  const [draggedElementType, setDraggedElementType] = useState<CalculatorElementType | null>(null);

  // 🎨 Добавить элемент на холст
  const addElement = useCallback((type: CalculatorElementType, position?: { x: number; y: number }) => {
    const newElement: CalculatorElement = {
      id: `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: ELEMENT_PALETTE.find(p => p.type === type)?.name || type,
      label: ELEMENT_PALETTE.find(p => p.type === type)?.name || type,
      position: position || { x: 100, y: 100 },
      size: { width: 200, height: 40 },
      styles: {
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#d1d5db',
        borderRadius: 4,
        fontSize: 14,
        padding: 8
      },
      config: {
        visible: true,
        required: false,
        disabled: false
      },
      dependencies: [],
      affects: []
    };

    // Настройки по умолчанию для разных типов
    switch (type) {
      case 'input':
        newElement.config.inputType = 'text';
        newElement.config.placeholder = 'Введите значение';
        break;
      case 'slider':
        newElement.config.min = 0;
        newElement.config.max = 100;
        newElement.config.step = 1;
        newElement.size.height = 60;
        break;
      case 'select':
        newElement.config.options = [
          { value: 'option1', label: 'Вариант 1' },
          { value: 'option2', label: 'Вариант 2' }
        ];
        break;
      case 'formula':
        newElement.config.formula = '0';
        newElement.config.variables = [];
        break;
      case 'output':
        newElement.size.height = 60;
        newElement.styles.backgroundColor = '#f3f4f6';
        break;
      case 'button':
        newElement.size.width = 120;
        newElement.styles.backgroundColor = config.styles.primaryColor;
        newElement.styles.textColor = '#ffffff';
        break;
      case 'text':
        newElement.config.placeholder = 'Введите текст';
        newElement.size.height = 30;
        break;
    }

    setConfig(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));

    setSelectedElement(newElement.id);
  }, [config.styles.primaryColor]);

  // 🗑️ Удалить элемент
  const removeElement = useCallback((elementId: string) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    
    if (selectedElement === elementId) {
      setSelectedElement(null);
    }
  }, [selectedElement]);

  // ✏️ Обновить элемент
  const updateElement = useCallback((elementId: string, updates: Partial<CalculatorElement>) => {
    setConfig(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === elementId ? { ...el, ...updates } : el
      )
    }));
  }, []);

  // 💾 Сохранить конфигурацию
  const saveConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/calculator/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        alert('Калькулятор сохранен!');
      } else {
        alert('Ошибка при сохранении');
      }
    } catch (error) {
      clientLogger.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении');
    }
  }, [config]);

  // 🎮 Обработка drag & drop
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Перетаскивание из палитры на холст
    if (source.droppableId === 'palette' && destination.droppableId === 'canvas') {
      const elementType = ELEMENT_PALETTE[source.index].type;
      addElement(elementType, { x: destination.x || 100, y: destination.y || 100 });
    }
  }, [addElement]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 🔝 Заголовок и панель инструментов */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calculator className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Конструктор калькуляторов
              </h1>
              <p className="text-sm text-gray-500">
                Создайте любой калькулятор без программирования
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Режимы */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('design')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  mode === 'design' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" />
                Дизайн
              </button>
              <button
                onClick={() => setMode('preview')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  mode === 'preview' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                Превью
              </button>
              <button
                onClick={() => setMode('code')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  mode === 'code' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code className="w-4 h-4 inline mr-1" />
                Код
              </button>
            </div>

            {/* Действия */}
            <button
              onClick={saveConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4 inline mr-2" />
              Сохранить
            </button>
          </div>
        </div>
      </header>

      {/* 📱 Основная область */}
      <div className="flex-1 flex overflow-hidden">
        {mode === 'design' && (
          <>
            {/* 🎨 Палитра элементов */}
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Элементы калькулятора
                </h3>
                
                {Object.entries(CATEGORIES).map(([categoryKey, category]) => (
                  <div key={categoryKey} className="mb-6">
                    <h4 className={`text-xs font-medium px-2 py-1 rounded-full inline-block mb-3 ${category.color}`}>
                      {category.name}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {ELEMENT_PALETTE
                        .filter(element => element.category === categoryKey)
                        .map((element, index) => (
                          <button
                            key={element.type}
                            onClick={() => addElement(element.type)}
                            className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left group"
                            title={element.description}
                          >
                            <div className="flex items-center space-x-2">
                              <div className="text-gray-600 group-hover:text-blue-600">
                                {element.icon}
                              </div>
                              <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
                                {element.name}
                              </span>
                            </div>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🖼️ Холст для дизайна */}
            <div className="flex-1 bg-gray-100 overflow-auto">
              <div className="p-8">
                <div 
                  className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-96 relative"
                  style={{ minWidth: '800px' }}
                >
                  {config.elements.map((element) => (
                    <div
                      key={element.id}
                      className={`absolute border-2 transition-all cursor-pointer ${
                        selectedElement === element.id 
                          ? 'border-blue-500 shadow-lg' 
                          : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        left: element.position.x,
                        top: element.position.y,
                        width: element.size.width,
                        height: element.size.height,
                        backgroundColor: element.styles.backgroundColor,
                        color: element.styles.textColor,
                        borderRadius: element.styles.borderRadius,
                        fontSize: element.styles.fontSize,
                        padding: element.styles.padding
                      }}
                      onClick={() => setSelectedElement(element.id)}
                    >
                      {/* Рендер элемента в зависимости от типа */}
                      <ElementRenderer element={element} />
                      
                      {/* Кнопка удаления */}
                      {selectedElement === element.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeElement(element.id);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hover:bg-red-600"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {config.elements.length === 0 && (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                      <div className="text-center">
                        <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">Начните создание калькулятора</p>
                        <p className="text-sm">Перетащите элементы из палитры слева</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ⚙️ Панель свойств */}
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <ElementPropertiesPanel
                element={selectedElement ? config.elements.find(el => el.id === selectedElement) : null}
                onUpdate={(updates) => selectedElement && updateElement(selectedElement, updates)}
              />
            </div>
          </>
        )}

        {mode === 'preview' && (
          <div className="flex-1 bg-gray-100 p-8">
            <CalculatorPreview config={config} />
          </div>
        )}

        {mode === 'code' && (
          <div className="flex-1 bg-gray-900 text-gray-100 p-8">
            <CodeViewer config={config} />
          </div>
        )}
      </div>
    </div>
  );
}

// 🎨 Компонент для рендера элементов
function ElementRenderer({ element }: { element: CalculatorElement }) {
  switch (element.type) {
    case 'input':
      return (
        <input
          type={element.config.inputType || 'text'}
          placeholder={element.config.placeholder}
          className="w-full h-full border-0 outline-none bg-transparent"
          disabled
        />
      );
      
    case 'output':
      return (
        <div className="w-full h-full flex items-center px-2 bg-gray-50 border rounded">
          <span className="text-gray-500">Результат</span>
        </div>
      );
      
    case 'button':
      return (
        <button className="w-full h-full rounded transition-colors">
          {element.label}
        </button>
      );
      
    case 'text':
      return (
        <div className="w-full h-full flex items-center">
          {element.label}
        </div>
      );
      
    case 'formula':
      return (
        <div className="w-full h-full flex items-center px-2 bg-green-50 border border-green-200 rounded">
          <Calculator className="w-4 h-4 mr-2 text-green-600" />
          <span className="text-green-700 text-sm">
            {element.config.formula || 'Формула'}
          </span>
        </div>
      );
      
    default:
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
          {element.name}
        </div>
      );
  }
}

// ⚙️ Панель свойств элемента
function ElementPropertiesPanel({ 
  element, 
  onUpdate 
}: { 
  element: CalculatorElement | null;
  onUpdate: (updates: Partial<CalculatorElement>) => void;
}) {
  if (!element) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-center">
          Выберите элемент для настройки
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Свойства элемента
      </h3>
      
      {/* Основные настройки */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название
          </label>
          <input
            type="text"
            value={element.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Специфичные настройки для разных типов */}
        {element.type === 'input' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Тип поля
              </label>
              <select
                value={element.config.inputType || 'text'}
                onChange={(e) => onUpdate({ 
                  config: { ...element.config, inputType: e.target.value as any }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="text">Текст</option>
                <option value="number">Число</option>
                <option value="email">Email</option>
                <option value="tel">Телефон</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Подсказка
              </label>
              <input
                type="text"
                value={element.config.placeholder || ''}
                onChange={(e) => onUpdate({ 
                  config: { ...element.config, placeholder: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </>
        )}

        {element.type === 'formula' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Формула
            </label>
            <textarea
              value={element.config.formula || ''}
              onChange={(e) => onUpdate({ 
                config: { ...element.config, formula: e.target.value }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md h-24"
              placeholder="Например: price * quantity * (1 + tax/100)"
            />
          </div>
        )}

        {/* Стили */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Стили</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ширина</label>
              <input
                type="number"
                value={element.size.width}
                onChange={(e) => onUpdate({ 
                  size: { ...element.size, width: parseInt(e.target.value) }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            
            <div>
              <label className="block text-xs text-gray-600 mb-1">Высота</label>
              <input
                type="number"
                value={element.size.height}
                onChange={(e) => onUpdate({ 
                  size: { ...element.size, height: parseInt(e.target.value) }
                })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 👁️ Компонент предварительного просмотра
function CalculatorPreview({ config }: { config: CalculatorConfig }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {config.name}
      </h2>
      
      <div className="relative" style={{ minHeight: '400px' }}>
        {config.elements.map((element) => (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: element.position.x,
              top: element.position.y,
              width: element.size.width,
              height: element.size.height
            }}
          >
            <ElementRenderer element={element} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 💻 Компонент просмотра кода
function CodeViewer({ config }: { config: CalculatorConfig }) {
  const generatedCode = JSON.stringify(config, null, 2);
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">
        Конфигурация калькулятора
      </h3>
      
      <pre className="bg-gray-800 p-4 rounded-lg overflow-auto text-sm">
        <code>{generatedCode}</code>
      </pre>
    </div>
  );
}
