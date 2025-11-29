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
  photo_path?: string | null;
}

export interface DoorOption {
  id: string;
  option_type: string;
  option_name: string;
  price_surcharge?: number;
  photo_path?: string | null;
}

export interface DoorHandle {
  id: string;
  name: string;
  photo_path?: string | null;
  price_rrc?: number;
  price_opt?: number;
}

export interface DoorLimiter {
  id: string;
  name: string;
  photo_path?: string | null;
  price_rrc?: number;
  price_opt?: number;
}

