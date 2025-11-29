// Типы для компонентов дверей

export type BasicState = {
  // Уровень 1: Основные характеристики
  style?: string;        // Стиль двери (влияет на модели)
  model?: string;        // Модель двери (влияет на покрытия)
  
  // Уровень 2: Материалы и отделка
  finish?: string;       // Покрытие (влияет на цвета)
  color?: string;        // Цвет (влияет на размеры)
  
  // Уровень 3: Размеры
  width?: number;        // Ширина (влияет на кромку)
  height?: number;       // Высота (влияет на кромку)
  
  // Уровень 4: Дополнительные элементы
  // edge?: string;         // Кромка (временно отключена)
  // edge_note?: string;    // Примечание к кромке
  // edge_cost?: string;    // Стоимость надбавки за кромку
  
  // Уровень 5: Фурнитура
  hardware_kit?: { id: string };  // Комплект фурнитуры
  handle?: { id: string };        // Ручка
  
  // Технические параметры (не влияют на другие)
  type?: string;         // Тип конструкции (обычно всегда "Распашная")
};

export type ProductLike = {
  sku_1c?: string | number | null;
  model?: string | null;
};

export type CartItem = {
  id: string;
  style?: string;
  model?: string;
  finish?: string;
  type?: string;
  width?: number;
  height?: number;
  color?: string;
  qty: number;
  unitPrice: number;
  handleId?: string;
  handleName?: string; // Добавляем название ручки
  sku_1c?: string | number | null;
  // edge?: string;
  // edge_note?: string;
  hardwareKitId?: string;
  hardwareKitName?: string; // Добавляем название комплекта фурнитуры
  baseAtAdd: number;
};

export type DomainKits = { id: string; name: string; group?: number; price_rrc?: number }[];

export type DomainHandles = {
  id: string;
  name: string;
  supplier_name?: string;
  supplier_sku?: string;
  price_opt?: number;
  price_rrc?: number;
  price_group_multiplier?: number;
}[];

export type HardwareKit = {
  id: string;
  name: string;
  description: string;
  price: number;
  priceGroup: string;
  isBasic: boolean;
};

export type Handle = {
  id: string;
  name: string;
  group: string;
  price: number;
  isBasic: boolean;
  showroom: boolean;
  supplier?: string;
  article?: string;
  factoryName?: string;
  photos?: string[];
};

export type Domain =
  | {
      style?: string[];
      model?: string[];
      finish?: string[];
      color?: string[];
      type?: string[];
      width?: number[];
      height?: number[];
      // edge?: string[];
      kits?: DomainKits;
      handles?: DomainHandles;
    }
  | null;

export type ModelItem = {
  model: string;
  modelKey?: string;
  style: string;
  photo?: string | null;
  photos?: { cover: string | null; gallery: string[] };
  hasGallery?: boolean;
};

