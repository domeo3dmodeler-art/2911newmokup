// lib/xlsx/buildWorkbook.ts
import type { FactoryRow } from "../doors/factory-map";

export async function buildFactoryXLSX(rows: FactoryRow[]): Promise<Buffer> {
  const ExcelJS = (await import("exceljs")).default ?? (await import("exceljs"));
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Заказ на фабрику");

  const columns = [
    { header: "Номер п/п", key: "num", width: 10 },
    { header: "Поставщик", key: "supplier", width: 18 },
    { header: "Фабрика_Коллекция", key: "collection", width: 22 },
    { header: "Наименование поставщика", key: "supplier_item_name", width: 28 },
    { header: "Фабрика_Цвет/Отделка", key: "supplier_color_finish", width: 22 },
    { header: "Ширина/мм", key: "width", width: 10 },
    { header: "Высота/мм", key: "height", width: 10 },
    { header: "Фурнитура (Ценовая группа)", key: "hardware_group", width: 22 },
    { header: "Цена опт, руб", key: "price_opt", width: 14 },
    { header: "Цена, руб (РРЦ + комплект)", key: "price_rrc_plus_kit", width: 20 },
    { header: "Кол-во", key: "qty", width: 8 },
    { header: "Сумма опт, руб", key: "sum_opt", width: 16 },
    { header: "Сумма РРЦ, руб", key: "sum_rrc", width: 16 },
  ] as const;

  ws.columns = columns as any;

  // Заголовок жирным
  ws.getRow(1).font = { bold: true };

  // Данные
  for (const r of rows) ws.addRow(r);

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

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
