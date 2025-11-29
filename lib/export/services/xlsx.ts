// lib/export/services/xlsx.ts
// Сервис генерации XLSX файлов для экспорта

import { ExportRow } from '../types';

export async function buildExportXLSX(rows: ExportRow[]): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default ?? (await import("exceljs"));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Заказ на фабрику");

  const columns = [
    { header: "SKU", key: "sku", width: 15 },
    { header: "Серия", key: "series", width: 15 },
    { header: "Материал", key: "material", width: 15 },
    { header: "Отделка", key: "finish", width: 15 },
    { header: "Ширина (мм)", key: "width_mm", width: 12 },
    { header: "Высота (мм)", key: "height_mm", width: 12 },
    { header: "Цвет", key: "color", width: 15 },
    { header: "Комплект фурнитуры", key: "hardware_set", width: 20 },
    { header: "Ручка", key: "handle", width: 20 },
    { header: "Количество", key: "quantity", width: 12 },
    { header: "Базовая цена", key: "base_price", width: 15 },
    { header: "Надбавка", key: "markup_price", width: 15 },
    { header: "Скидка", key: "discount_price", width: 15 },
    { header: "НДС", key: "vat_price", width: 15 },
    { header: "Итого", key: "total_price", width: 15 },
    { header: "Валюта", key: "currency", width: 10 },
    { header: "Дата создания", key: "created_at", width: 20 },
  ] as const;

  ws.columns = columns as any;

  // Заголовок жирным
  ws.getRow(1).font = { bold: true };

  // Данные
  for (const row of rows) {
    ws.addRow({
      sku: row.sku,
      series: row.series || '',
      material: row.material || '',
      finish: row.finish || '',
      width_mm: row.width_mm || '',
      height_mm: row.height_mm || '',
      color: row.color || '',
      hardware_set: row.hardware_set || '',
      handle: row.handle || '',
      quantity: row.quantity,
      base_price: row.base_price,
      markup_price: row.markup_price || '',
      discount_price: row.discount_price || '',
      vat_price: row.vat_price || '',
      total_price: row.total_price,
      currency: row.currency,
      created_at: row.created_at
    });
  }

  // Простая граница таблицы
  ws.eachRow((row: any, rowNumber: number) => {
    row.eachCell((cell: any) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Форматирование числовых полей
  ws.getColumn('quantity').numFmt = '0';
  ws.getColumn('base_price').numFmt = '#,##0.00';
  ws.getColumn('markup_price').numFmt = '#,##0.00';
  ws.getColumn('discount_price').numFmt = '#,##0.00';
  ws.getColumn('vat_price').numFmt = '#,##0.00';
  ws.getColumn('total_price').numFmt = '#,##0.00';

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export function getExportFilename(format: 'xlsx', kpId: string): string {
  const timestamp = new Date().toISOString().slice(0, 10);
  return `factory_order_${kpId}_${timestamp}.${format}`;
}

export function getExportMimeType(format: 'xlsx'): string {
  switch (format) {
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

