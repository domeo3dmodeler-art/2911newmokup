/**
 * Русские названия блоков и их описания
 */

export interface BlockNameMapping {
  name: string;
  description: string;
  category: string;
}

export const BLOCK_NAMES: Record<string, BlockNameMapping> = {
  // Основные компоненты
  heading: {
    name: 'Заголовок',
    description: 'Заголовок страницы или секции',
    category: 'Основные компоненты'
  },
  text: {
    name: 'Текст',
    description: 'Описательный текст',
    category: 'Основные компоненты'
  },
  image: {
    name: 'Изображение',
    description: 'Фото или иллюстрация',
    category: 'Основные компоненты'
  },
  button: {
    name: 'Кнопка',
    description: 'Кнопка действия',
    category: 'Основные компоненты'
  },

  // Товарные блоки
  productConfigurator: {
    name: 'Конфигуратор товаров',
    description: 'Полный конфигуратор с фильтрами и настройкой',
    category: 'Товарные блоки'
  },
  productGrid: {
    name: 'Каталог товаров',
    description: 'Сетка товаров с фото и свойствами',
    category: 'Товарные блоки'
  },
  catalogTree: {
    name: 'Дерево каталога',
    description: 'Навигация по категориям товаров',
    category: 'Товарные блоки'
  },
  cart: {
    name: 'Корзина',
    description: 'Корзина для добавленных товаров',
    category: 'Товарные блоки'
  },

  // Фильтры
  propertyFilter: {
    name: 'Фильтр свойств',
    description: 'Фильтрация товаров по выбранному свойству',
    category: 'Фильтры'
  },
  productFilter: {
    name: 'Фильтр товаров',
    description: 'Универсальный фильтр для товаров',
    category: 'Фильтры'
  },
  filteredProducts: {
    name: 'Отфильтрованные товары',
    description: 'Отображение товаров по результатам фильтрации',
    category: 'Фильтры'
  },

  // Продвинутые конфигураторы
  stepWizard: {
    name: 'Пошаговый мастер',
    description: 'Пошаговая конфигурация товара с прогрессом',
    category: 'Продвинутые конфигураторы'
  },
  comparisonTable: {
    name: 'Сравнение товаров',
    description: 'Таблица для сравнения характеристик товаров',
    category: 'Продвинутые конфигураторы'
  },
  priceCalculator: {
    name: 'Калькулятор цены',
    description: 'Расчет стоимости товара с учетом параметров',
    category: 'Продвинутые конфигураторы'
  },
  doorCalculator: {
    name: 'Калькулятор дверей',
    description: 'Специализированный калькулятор для дверей',
    category: 'Продвинутые конфигураторы'
  },

  // Формы и поля
  input: {
    name: 'Поле ввода',
    description: 'Текстовое поле для ввода данных',
    category: 'Формы и поля'
  },
  select: {
    name: 'Выпадающий список',
    description: 'Список для выбора из вариантов',
    category: 'Формы и поля'
  },
  checkbox: {
    name: 'Чекбокс',
    description: 'Флажок для выбора опций',
    category: 'Формы и поля'
  },
  radio: {
    name: 'Радиокнопка',
    description: 'Кнопка для выбора одного варианта',
    category: 'Формы и поля'
  },

  // Детали товаров
  productCard: {
    name: 'Карточка товара',
    description: 'Карточка с информацией о товаре',
    category: 'Детали товаров'
  },
  productGallery: {
    name: 'Галерея товара',
    description: 'Галерея изображений товара',
    category: 'Детали товаров'
  },
  productDetails: {
    name: 'Детали товара',
    description: 'Подробная информация о товаре',
    category: 'Детали товаров'
  },
  priceDisplay: {
    name: 'Отображение цены',
    description: 'Блок для показа цены товара',
    category: 'Детали товаров'
  },
  summaryTable: {
    name: 'Сводная таблица',
    description: 'Таблица с итоговой информацией',
    category: 'Детали товаров'
  },

  // Контентные блоки
  contact: {
    name: 'Контактная форма',
    description: 'Форма обратной связи с контактной информацией',
    category: 'Контентные блоки'
  },
  accordion: {
    name: 'Аккордеон',
    description: 'Раскрывающиеся секции с контентом',
    category: 'Контентные блоки'
  },
  gallery: {
    name: 'Галерея',
    description: 'Галерея изображений с lightbox',
    category: 'Контентные блоки'
  },

  // Структура страницы
  section: {
    name: 'Секция',
    description: 'Основная секция страницы',
    category: 'Структура страницы'
  },
  spacer: {
    name: 'Отступ',
    description: 'Пространство между блоками',
    category: 'Структура страницы'
  },

};

/**
 * Получить русское название блока
 */
export function getBlockName(type: string): string {
  return BLOCK_NAMES[type]?.name || type;
}

/**
 * Получить описание блока
 */
export function getBlockDescription(type: string): string {
  return BLOCK_NAMES[type]?.description || '';
}

/**
 * Получить категорию блока
 */
export function getBlockCategory(type: string): string {
  return BLOCK_NAMES[type]?.category || 'Другие';
}

/**
 * Получить полную информацию о блоке
 */
export function getBlockInfo(type: string): BlockNameMapping {
  return BLOCK_NAMES[type] || {
    name: type,
    description: '',
    category: 'Другие'
  };
}

/**
 * Получить русское название блока с номером для повторяющихся
 */
export function getBlockNameWithNumber(type: string, existingElements: any[] = [], currentElementId?: string): string {
  const baseName = getBlockName(type);
  
  // Находим все элементы этого типа
  const sameTypeElements = existingElements.filter(el => el.type === type);
  
  // Если это единственный элемент такого типа, возвращаем без номера
  if (sameTypeElements.length <= 1) {
    return baseName;
  }
  
  // Находим позицию текущего элемента среди элементов этого типа
  const currentIndex = sameTypeElements.findIndex(el => el.id === currentElementId);
  
  // Если элемент не найден или это первый, возвращаем без номера
  if (currentIndex <= 0) {
    return baseName;
  }
  
  // Добавляем номер (позиция + 1)
  return `${baseName} ${currentIndex + 1}`;
}

/**
 * Получить русское название блока для отображения в интерфейсе
 */
export function getDisplayName(type: string, existingElements: any[] = [], currentElementId?: string): string {
  const baseName = getBlockName(type);
  
  // Для некоторых типов добавляем номера
  const typesWithNumbers = [
    'propertyFilter',
    'productFilter', 
    'filteredProducts',
    'productCard',
    'productGallery',
    'productDetails',
    'priceDisplay',
    'summaryTable'
  ];
  
  if (typesWithNumbers.includes(type)) {
    return getBlockNameWithNumber(type, existingElements, currentElementId);
  }
  
  return baseName;
}
