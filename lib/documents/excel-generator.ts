// lib/documents/excel-generator.ts
// Генератор Excel файлов для заказов поставщикам

import * as XLSX from 'xlsx';

export interface ExcelOrderData {
  orderNumber: string;
  orderDate: string;
  supplierName: string;
  supplierContact?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  items: ExcelOrderItem[];
  totalAmount: number;
  notes?: string;
  deliveryAddress: string;
  deliveryContact: string;
}

export interface ExcelOrderItem {
  sku: string;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  category?: string;
}

export class ExcelGenerator {
  private static instance: ExcelGenerator;
  
  public static getInstance(): ExcelGenerator {
    if (!ExcelGenerator.instance) {
      ExcelGenerator.instance = new ExcelGenerator();
    }
    return ExcelGenerator.instance;
  }

  // Генерация заказа поставщику в Excel
  async generateSupplierOrder(data: ExcelOrderData): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Создаем лист с заказом
    const orderSheet = this.createOrderSheet(data);
    XLSX.utils.book_append_sheet(workbook, orderSheet, 'Заказ');

    // Создаем лист с детализацией товаров
    const itemsSheet = this.createItemsSheet(data);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, 'Товары');

    // Конвертируем в буфер
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  private createOrderSheet(data: ExcelOrderData) {
    const orderData = [
      ['ЗАКАЗ ПОСТАВЩИКУ', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Номер заказа:', data.orderNumber, '', '', '', '', ''],
      ['Дата заказа:', data.orderDate, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['ПОСТАВЩИК:', '', '', '', '', '', ''],
      ['Название:', data.supplierName, '', '', '', '', ''],
      ['Контактное лицо:', data.supplierContact || '', '', '', '', '', ''],
      ['Телефон:', data.supplierPhone || '', '', '', '', '', ''],
      ['Email:', data.supplierEmail || '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['ДОСТАВКА:', '', '', '', '', '', ''],
      ['Адрес доставки:', data.deliveryAddress, '', '', '', '', ''],
      ['Контакт для доставки:', data.deliveryContact, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['ИТОГО К ОПЛАТЕ:', data.totalAmount.toLocaleString('ru-RU') + ' ₽', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['ПРИМЕЧАНИЯ:', data.notes || '', '', '', '', '', '']
    ];

    return XLSX.utils.aoa_to_sheet(orderData);
  }

  private createItemsSheet(data: ExcelOrderData) {
    const headers = [
      '№',
      'Артикул',
      'Наименование',
      'Описание',
      'Категория',
      'Количество',
      'Единица',
      'Цена за единицу',
      'Общая стоимость'
    ];

    const itemsData = data.items.map((item, index) => [
      index + 1,
      item.sku,
      item.name,
      item.description || '',
      item.category || '',
      item.quantity,
      item.unit,
      item.price,
      item.total
    ]);

    const allData = [headers, ...itemsData];

    // Добавляем итоговую строку
    allData.push([
      '', '', '', '', '', '', 'ИТОГО:', '', data.totalAmount
    ]);

    return XLSX.utils.aoa_to_sheet(allData);
  }

  // Генерация шаблона для импорта товаров
  async generateImportTemplate(): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    const templateData = [
      ['Артикул*', 'Наименование*', 'Описание', 'Категория', 'Цена*', 'Единица', 'Остаток', 'Фото'],
      ['SKU001', 'Пример товара 1', 'Описание товара', 'Категория 1', '1000', 'шт', '10', 'photo1.jpg'],
      ['SKU002', 'Пример товара 2', 'Описание товара', 'Категория 2', '2000', 'шт', '5', 'photo2.jpg'],
      ['', '', '', '', '', '', '', ''],
      ['Примечания:', '', '', '', '', '', '', ''],
      ['* - обязательные поля', '', '', '', '', '', '', ''],
      ['Артикул должен быть уникальным', '', '', '', '', '', '', ''],
      ['Цена указывается в рублях', '', '', '', '', '', '', ''],
      ['Для фото используйте названия файлов', '', '', '', '', '', '', '']
    ];

    const sheet = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Шаблон импорта');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // Генерация отчета по продажам
  async generateSalesReport(data: any[]): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();
    
    const headers = [
      'Дата',
      'Номер заказа',
      'Клиент',
      'Товар',
      'Количество',
      'Цена',
      'Сумма',
      'Статус'
    ];

    const reportData = data.map(item => [
      item.date,
      item.orderNumber,
      item.client,
      item.product,
      item.quantity,
      item.price,
      item.amount,
      item.status
    ]);

    const allData = [headers, ...reportData];
    const sheet = XLSX.utils.aoa_to_sheet(allData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Отчет по продажам');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}



