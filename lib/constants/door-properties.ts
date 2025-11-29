/**
 * Константы для свойств межкомнатных дверей
 * 
 * Эти константы определяют единые названия свойств, которые используются
 * как в базе данных, так и в пользовательском интерфейсе.
 * 
 * После миграции все свойства будут использовать эти названия.
 */

export const DOOR_PROPERTIES = {
  // Идентификация
  NUMBER: '№',
  ARTICLE_DOMEO: 'АРТИКУЛ_DOMEO',
  
  // Основные параметры (новые названия после миграции)
  MODEL: 'МОДЕЛЬ',
  STYLE: 'СТИЛЬ',
  COLOR: 'ЦВЕТ_DOMEO',
  COATING_TYPE: 'ТИП ПОКРЫТИЯ',
  
  // Размеры
  WIDTH_MM: 'Ширина/мм',
  HEIGHT_MM: 'Высота/мм',
  THICKNESS_MM: 'Толщина/мм',
  
  // Материалы и конструкция
  CONSTRUCTION_TYPE: 'ТИП КОНСТРУКЦИИ',
  OPENING_TYPE: 'Тип открывания',
  FACTORY_COLLECTION: 'ФАБРИКА_КОЛЛЕКЦИЯ',
  FACTORY_COLOR_FINISH: 'Фабрика_Цвет/Отделка',
  
  // Ценообразование
  RETAIL_PRICE: 'Цена РРЦ',
  WHOLESALE_PRICE: 'Цена опт',
  EDGE_COST: 'Стоимость надбавки за кромку',
  
  // Дополнительные элементы
  EDGE: 'Кромка',
  MOLDING: 'Молдинг',
  GLASS: 'Стекло',
  
  // Поставщик и склад
  SUPPLIER: 'Поставщик',
  SUPPLIER_NAME: 'Наименование поставщика',
  SUPPLIER_ARTICLE: 'Артикул поставщика',
  WAREHOUSE_ORDER: 'Склад/заказ',
  
  // Технические
  PHOTOS: 'photos',
  CATEGORY: 'Категория',
  UNIT: 'Ед.изм.'
} as const;

/**
 * Канонические названия свойств дверей
 * После миграции все свойства используют только эти названия
 */
export const CANONICAL_PROPERTY_NAMES = Object.values(DOOR_PROPERTIES) as readonly string[];

/**
 * Свойства, которые используются в калькуляторе дверей
 */
export const CALCULATOR_PROPERTIES = {
  STYLE: DOOR_PROPERTIES.STYLE,
  MODEL: DOOR_PROPERTIES.MODEL,
  COATING: DOOR_PROPERTIES.COATING_TYPE,
  COLOR: DOOR_PROPERTIES.COLOR,
  WIDTH: DOOR_PROPERTIES.WIDTH_MM,
  HEIGHT: DOOR_PROPERTIES.HEIGHT_MM,
  PRICE: DOOR_PROPERTIES.RETAIL_PRICE
} as const;

/**
 * Свойства, которые используются для экспорта в Excel
 */
export const EXPORT_PROPERTIES = {
  NUMBER: DOOR_PROPERTIES.NUMBER,
  ARTICLE: DOOR_PROPERTIES.ARTICLE_DOMEO,
  MODEL: DOOR_PROPERTIES.MODEL,
  CONSTRUCTION_TYPE: DOOR_PROPERTIES.CONSTRUCTION_TYPE,
  STYLE: DOOR_PROPERTIES.STYLE,
  FACTORY_COLLECTION: DOOR_PROPERTIES.FACTORY_COLLECTION,
  COATING: DOOR_PROPERTIES.COATING_TYPE,
  COLOR: DOOR_PROPERTIES.COLOR,
  WIDTH: DOOR_PROPERTIES.WIDTH_MM,
  HEIGHT: DOOR_PROPERTIES.HEIGHT_MM,
  THICKNESS: DOOR_PROPERTIES.THICKNESS_MM,
  PRICE: DOOR_PROPERTIES.RETAIL_PRICE
} as const;

/**
 * Свойства, которые исключаются из фильтрации (технические)
 */
export const TECHNICAL_PROPERTIES = [
  'photos',
  'Категория',
  'Ед.изм.',
  '_id',
  'url',
  'path',
  'image'
] as const;

/**
 * Типы свойств дверей
 */
export type DoorPropertyKey = keyof typeof DOOR_PROPERTIES;
export type DoorPropertyValue = typeof DOOR_PROPERTIES[DoorPropertyKey];

