/**
 * Полный набор колонок Excel для экспорта заказа дверей (как на скрине ЛК исполнителя).
 * Все колонки заполняются без исключения — из item, props или значением по умолчанию.
 */

import { getDoorFieldValue, type DoorExcelRowSource } from './excel-door-fields';
import { getItemDisplayName } from '@/lib/export/export-items';

/** Порядок колонок: как в шаблоне заказа (скрин ЛК исполнителя) */
export const EXCEL_DOOR_ORDER_FULL_HEADERS = [
  '№',
  'Наименование модели',
  'Ширина',
  'Высота',
  'Количество',
  'Цвет',
  'Заводская коробка',
  'Размер коробки',
  'Наличники 80*10 телескоп. (комплект)',
  'Доборы 100*10 (комплект)',
  'Цвет',
  'Фурнитура',
  'Петли скрытые AGB Eclipse 3.2 (комплект)',
  'Комплект ручек Colombo Design Roboquattro S (комплект)',
  'Замок AGB Polaris WC (комплект)',
  'Замок AGB Polaris под цилиндр (комплект)',
  'Цилиндр ISEO R6 60 (комплект)',
  'Замок магнитный (комплект)',
  'Магнитные доводчики (комплект)',
  'Комплект монтажный (комплект)',
  'Брус коробки 80*40*2070 (шт)',
  'Петли дверные B500 (шт)',
  'Магнитный доводчик (шт)',
  'Наличник 10*80*2200 (шт)',
  'Деревянный брус (шт)',
  'Добор 10*100*2070 (шт)',
  'Стекло',
  'Наименование',
  'Количество',
  'Примечание',
  'Цена',
  'Сумма',
  'Услуги монтажа (накладные)',
  'Деревянный брус (шт)',
  'Доставка 2000 (услуга)',
  'Замер (услуга)',
  'Подъем (услуга)',
] as const;

export type ExcelDoorOrderColumnName = (typeof EXCEL_DOOR_ORDER_FULL_HEADERS)[number];

export interface DoorOrderExcelSource extends DoorExcelRowSource {
  /** Номер строки (№) */
  rowNumber?: number;
  /** Контекст заказа: услуги монтажа, доставка, замер, подъем (на всю позицию или заказ) */
  orderContext?: {
    installationServices?: number;
    delivery?: number;
    measurement?: number;
    lift?: number;
  };
}

/**
 * Возвращает значение для одной колонки полного шаблона заказа дверей.
 * Используется для экспорта в ЛК исполнителя — все ячейки заполняются.
 */
export function getDoorOrderColumnValue(
  columnName: string,
  source: DoorOrderExcelSource
): string | number {
  const { item, props = {}, rowNumber = 1, orderContext = {} } = source;
  const isDoor = !!(item.model || item.width != null || (item.finish != null && item.finish !== ''));
  const qty = item.qty ?? item.quantity ?? 1;
  const unitPrice = item.unitPrice ?? item.price ?? 0;
  const total = qty * unitPrice;

  switch (columnName) {
    case '№':
      return rowNumber;
    case 'Наименование модели':
      return (getDoorFieldValue('Название модели', source) ?? '').toString().trim();
    case 'Ширина':
      return getDoorFieldValue('Ширина, мм', source) ?? item.width ?? '';
    case 'Высота':
      return getDoorFieldValue('Высота, мм', source) ?? item.height ?? '';
    case 'Количество':
      return qty;
    case 'Цвет':
      return (getDoorFieldValue('Цвет/Отделка', source) ?? item.color ?? '').toString().trim();
    case 'Заводская коробка':
      return isDoor ? 'ДА' : '';
    case 'Размер коробки':
      return (props['Размер коробки'] ?? props['Размер_коробки'] ?? '80*40').toString().trim();
    case 'Наличники 80*10 телескоп. (комплект)':
      if (!isDoor) return '';
      const arch = item.architraveNames ?? item.optionNames ?? [];
      return arch.length > 0 ? (props['Наличники_80_10_телескоп_комплект'] ?? 2.5) : 0;
    case 'Доборы 100*10 (комплект)':
      return (props['Доборы_100_10_комплект'] ?? 0) as number;
    case 'Фурнитура':
      return isDoor ? 'ДА' : '';
    case 'Петли скрытые AGB Eclipse 3.2 (комплект)':
      return (props['Петли_скрытые_AGB_Eclipse_комплект'] ?? (isDoor ? 2 : 0)) as number;
    case 'Комплект ручек Colombo Design Roboquattro S (комплект)':
      return (props['Комплект_ручек_Colombo_комплект'] ?? (isDoor ? 1 : 0)) as number;
    case 'Замок AGB Polaris WC (комплект)':
      return (props['Замок_AGB_Polaris_WC_комплект'] ?? (isDoor ? 1 : 0)) as number;
    case 'Замок AGB Polaris под цилиндр (комплект)':
      return (props['Замок_AGB_Polaris_цилиндр_комплект'] ?? 0) as number;
    case 'Цилиндр ISEO R6 60 (комплект)':
      return (props['Цилиндр_ISEO_комплект'] ?? 0) as number;
    case 'Замок магнитный (комплект)':
      return (props['Замок_магнитный_комплект'] ?? 0) as number;
    case 'Магнитные доводчики (комплект)':
      return (props['Магнитные_доводчики_комплект'] ?? 0) as number;
    case 'Комплект монтажный (комплект)':
      return isDoor ? 'ДА' : 'НЕТ';
    case 'Брус коробки 80*40*2070 (шт)':
      return (props['Брус_коробки_шт'] ?? (isDoor ? 3 : 0)) as number;
    case 'Петли дверные B500 (шт)':
      return (props['Петли_дверные_B500_шт'] ?? (isDoor ? 2 : 0)) as number;
    case 'Магнитный доводчик (шт)':
      return (props['Магнитный_доводчик_шт'] ?? 0) as number;
    case 'Наличник 10*80*2200 (шт)':
      if (!isDoor) return 0;
      const hasArch = (item.architraveNames ?? item.optionNames ?? []).length > 0;
      return (props['Наличник_10_80_2200_шт'] ?? (hasArch ? 2.5 : 0)) as number;
    case 'Деревянный брус (шт)':
      return (props['Деревянный_брус_шт'] ?? (isDoor ? 1 : 0)) as number;
    case 'Добор 10*100*2070 (шт)':
      return (props['Добор_10_100_2070_шт'] ?? 0) as number;
    case 'Стекло':
      return isDoor && (item.mirror || item.glassColor || item.glass_color) ? (item.glassColor ?? item.glass_color ?? '—').toString() : 'НЕТ';
    case 'Наименование':
      return getItemDisplayName(item as any) || (item.name && String(item.name).trim()) || '';
    case 'Примечание':
      return (item.notes ?? (item as any).specRows?.join('; ') ?? '').toString().trim();
    case 'Цена':
      return unitPrice;
    case 'Сумма':
      return total;
    case 'Услуги монтажа (накладные)':
      return (orderContext.installationServices ?? props['Услуги_монтажа'] ?? 0) as number;
    case 'Доставка 2000 (услуга)':
      return (orderContext.delivery ?? props['Доставка_услуга'] ?? 0) as number;
    case 'Замер (услуга)':
      return (orderContext.measurement ?? props['Замер_услуга'] ?? 0) as number;
    case 'Подъем (услуга)':
      return (orderContext.lift ?? props['Подъем_услуга'] ?? 0) as number;
    default:
      return (props[columnName] ?? '').toString().trim();
  }
}
