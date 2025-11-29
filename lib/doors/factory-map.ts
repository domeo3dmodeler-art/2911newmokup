// lib/doors/factory-map.ts
import { PositionPriced } from "./pricing";

export type FactoryRow = {
  // 1–13 согласно спецификации «Заказ на фабрику»
  num: number;                       // 1. Номер п/п
  supplier?: string;                 // 2. Поставщик
  collection?: string;               // 3. Фабрика_Коллекция
  supplier_item_name?: string;       // 4. Наименование поставщика
  supplier_color_finish?: string;    // 5. Фабрика_Цвет/Отделка
  width?: number;                    // 6. Ширина/мм
  height?: number;                   // 7. Высота/мм
  hardware_group?: string;           // 8. Фурнитура (Ценовая группа) — "<Комплект> (гр. <Группа>)"
  price_opt?: number;                // 9. Цена опт, руб
  price_rrc_plus_kit: number;        // 10. Цена, руб (РРЦ + комплект)
  qty: number;                       // 11. Кол-во
  sum_opt?: number;                  // 12. Сумма опт, руб
  sum_rrc: number;                   // 13. Сумма РРЦ, руб
};

export function toFactoryRows(items: PositionPriced[]): FactoryRow[] {
  const rows: FactoryRow[] = [];
  let num = 1;

  for (const p of items) {
    // Основная строка по двери
    rows.push({
      num: num++,
      supplier: p.supplier,
      collection: p.collection,
      supplier_item_name: p.supplier_item_name ?? p.model,
      supplier_color_finish: p.supplier_color_finish ?? p.color,
      width: p.width,
      height: p.height,
      hardware_group: p.hardware_kit
        ? `${p.hardware_kit.name}${p.hardware_kit.group ? ` (гр. ${p.hardware_kit.group})` : ""}`
        : undefined,
      price_opt: p.price_opt,
      price_rrc_plus_kit: p.price_rrc_plus_kit,
      qty: p.qty,
      sum_opt: p.sum_opt_factory,
      sum_rrc: p.sum_rrc_factory,
    });

    // Доп. строка для ручки — если выбрана
    if (p.handle) {
      const mult = p.handle.price_group_multiplier ?? 1;
      const retail = Math.round(p.handle.price_opt * mult);
      const qty = p.qty;

      rows.push({
        num: num++,
        supplier: p.supplier,
        collection: p.collection,
        supplier_item_name: p.handle.name_web || `Ручка: ${p.handle.name}`,
        supplier_color_finish: undefined,
        width: undefined,
        height: undefined,
        hardware_group: `гр. ×${mult}`,
        price_opt: p.handle.price_opt,
        price_rrc_plus_kit: retail,   // для строки ручки — её розничная цена
        qty,
        sum_opt: p.handle.price_opt * qty,
        sum_rrc: retail * qty,
      });
    }
  }

  return rows;
}
