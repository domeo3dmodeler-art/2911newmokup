/**
 * Типы для API конфигуратора дверей
 */

export interface DoorModel {
  id: string;
  model_name: string;
  style: string;
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
}

export interface DoorHandle {
  id: string;
  name: string;
  photo_path?: string | null;
  price_rrc?: number;
  price_opt?: number;
  series?: string;
}

export interface DoorLimiter {
  id: string;
  name: string;
  photo_path?: string | null;
  price_rrc?: number;
  price_opt?: number;
}

