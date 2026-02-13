/**
 * Типы для API конфигуратора дверей
 */

export interface DoorModel {
  id: string;
  model_name: string;
  style: string;
  /** Поставщики по коду модели (несколько вариантов двери у разных поставщиков) — для фильтра наличников и выбора варианта для заказа */
  suppliers?: string[];
  photo?: string | null;
  photos?: {
    cover?: string | null;
    gallery?: string[];
  };
  sizes?: Array<{
    width: number;
    height: number;
  }>;
  /** Варианты цвета стекла (лист Стекло_доступность); пусто — стекло не доступно. На цену не влияет. */
  glassColors?: string[];
  /** Реверс доступен для модели (лист «Опции»: Реверс доступен Да/Нет). */
  revers_available?: boolean;
  /** Кромка включена в базовую цену (Да) — нельзя убрать, только выбрать цвет. Иначе — без кромки или опция. */
  edge_in_base?: boolean;
}

export interface DoorCoating {
  id: string;
  coating_type: string;
  color_name: string;
  photo_path?: string | null;
}

export interface DoorEdge {
  id: string;
  edge_color_name: string;
  /** Наценка за выбор этого цвета кромки (0 = базовая кромка входит в цену) */
  surcharge?: number;
  photo_path?: string | null;
}

export interface DoorOption {
  id: string;
  option_type: string;
  option_name: string;
  /** Для отображения в UI (часто равно option_name) */
  name?: string;
  price_surcharge?: number;
  photo_path?: string | null;
  /** Поставщик наличника — фильтрует вариант двери для заказа (модель по коду может быть у нескольких поставщиков) */
  supplier?: string;
}

export interface DoorHandle {
  id: string;
  name: string;
  photo_path?: string | null;
  /** Первое фото — ручка, второе — завертка (если есть) */
  photos?: string[];
  price_rrc?: number;
  price_opt?: number;
  series?: string;
  /** Цвет для фильтра (из БД, properties_data.Цвет) */
  color?: string | null;
  /** Описание ручки (из БД) */
  description?: string | null;
  /** Цена завертки РРЦ (из БД, properties_data['Завертка, цена РРЦ']) */
  backplate_price_rrc?: number;
}

export interface DoorLimiter {
  id: string;
  name: string;
  photo_path?: string | null;
  price_rrc?: number;
  price_opt?: number;
}

