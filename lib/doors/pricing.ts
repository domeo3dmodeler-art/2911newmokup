// lib/doors/pricing.ts

export type Handle = {
  name: string;
  price_opt: number;
  price_group_multiplier: number;
  sku_1c?: string;
  name_web?: string;
};

export type Kit = {
  name: string;
  price_rrc: number;
  group?: string;
};

export type PositionInput = {
  // Основные атрибуты двери
  model: string;
  width?: number;   // мм
  height?: number;  // мм
  color?: string;

  // Кромка
  edge?: "да" | "нет" | "";   // поле «Кромка»
  edge_note?: string;         // поле «Если кромка да»

  // Цена и количество
  rrc_price: number; // РРЦ из каталога (руб, округляется итогом)
  qty: number;

  // Реквизиты для таблиц/фабрики
  sku_1c?: string;
  supplier?: string;
  collection?: string;
  supplier_item_name?: string;
  supplier_color_finish?: string;
  price_opt?: number; // оптовая цена двери, если доступно

  // Выбор комплектов/ручек
  hardware_kit?: Kit | null;
  handle?: Handle | null;
};

export type PositionPriced = PositionInput & {
  // КП/Счёт
  name_kp: string;            // «Модель (Ш×В, Цвет[, Кромка: ...])»
  handle_price_rrc?: number;  // розничная для ручки = round(opt × multiplier)
  sum_rrc: number;            // (rrc + kit + handleRetail) × qty

  // Фабрика
  price_rrc_plus_kit: number; // ритейл двери+комплект (без ручки)
  sum_rrc_factory: number;    // price_rrc_plus_kit × qty
  sum_opt_factory?: number;   // price_opt × qty (если price_opt задан)
};

export function roundRUB(x: number): number {
  return Math.round(x);
}

export function buildNameKP(p: PositionInput): string {
  // Собрать строку Наименования по правилам спецификации
  const base = p.model;
  const dims = p.width && p.height ? `${p.width}×${p.height}` : "";
  const color = p.color ? p.color : "";
  let parts: string[] = [];

  if (dims && color) parts.push(`${base} (${dims}, ${color}`);
  else if (dims)     parts.push(`${base} (${dims}`);
  else if (color)    parts.push(`${base} (${color}`);
  else               parts.push(base);

  // Кромка
  const edgeOn = p.edge === "да";
  if ((dims || color) && !edgeOn) {
    // уже открывали скобку, нужно закрыть
    if (parts[0].includes("(")) parts[0] += ")";
  } else if (edgeOn) {
    const edgeSuffix = p.edge_note ? `, Кромка: ${p.edge_note}` : `, Кромка`;
    if (parts[0].includes("(")) parts[0] += edgeSuffix + ")";
    else parts[0] += ` (${edgeSuffix.slice(2)})`; // если не было скобок
  }

  return parts.join("");
}

export function priceRRCPlus(p: PositionInput): number {
  const base = p.rrc_price || 0;
  const kit = p.hardware_kit?.price_rrc || 0;
  const handleRetail = p.handle
    ? roundRUB(p.handle.price_opt * p.handle.price_group_multiplier)
    : 0;
  return base + kit + handleRetail;
}

export function priceHandleRetail(p: PositionInput): number | undefined {
  if (!p.handle) return undefined;
  return roundRUB(p.handle.price_opt * p.handle.price_group_multiplier);
}

export function applyPricingRow(p: PositionInput): PositionPriced {
  const name_kp = buildNameKP(p);
  const price_rrc_plus = priceRRCPlus(p);
  const sum_rrc = price_rrc_plus * (p.qty || 1);

  const price_rrc_plus_kit = (p.rrc_price || 0) + (p.hardware_kit?.price_rrc || 0);
  const sum_rrc_factory = price_rrc_plus_kit * (p.qty || 1);
  const sum_opt_factory = p.price_opt != null ? (p.price_opt * (p.qty || 1)) : undefined;

  const handle_price_rrc = priceHandleRetail(p);

  return {
    ...p,
    name_kp,
    handle_price_rrc,
    sum_rrc,
    price_rrc_plus_kit,
    sum_rrc_factory,
    sum_opt_factory,
  };
}

export function applyPricing(cart: PositionInput[]): PositionPriced[] {
  return cart.map(applyPricingRow);
}
