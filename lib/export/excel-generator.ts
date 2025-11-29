import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  filename?: string;
  sheetName?: string;
  headers?: string[];
  data: any[];
}

export interface ExcelColumn {
  key: string;
  header: string;
  width?: number;
  format?: string;
}

/**
 * Экспортирует данные в Excel файл
 */
export function exportToExcel(options: ExcelExportOptions): Buffer {
  const { filename = 'export.xlsx', sheetName = 'Sheet1', data } = options;
  
  // Создаем рабочую книгу
  const workbook = XLSX.utils.book_new();
  
  // Конвертируем данные в рабочий лист
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Генерируем буфер
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}

/**
 * Экспортирует данные в CSV файл
 */
export function exportToCSV(data: any[], filename: string = 'export.csv'): string {
  if (!data || data.length === 0) {
    return '';
  }
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Экранируем значения с запятыми
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

/**
 * Создает Excel файл с форматированием
 */
export function createFormattedExcel(
  data: any[],
  columns: ExcelColumn[],
  filename: string = 'export.xlsx'
): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Подготавливаем данные с правильными заголовками
  const formattedData = data.map(row => {
    const formattedRow: any = {};
    columns.forEach(column => {
      formattedRow[column.header] = row[column.key];
    });
    return formattedRow;
  });
  
  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  
  // Устанавливаем ширину колонок
  const colWidths = columns.map(col => ({ wch: col.width || 15 }));
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Экспортирует документ в Excel
 */
export function exportDocumentToExcel(document: any): Buffer {
  const data = [
    {
      'ID документа': document.id,
      'Название': document.name,
      'Тип': document.type,
      'Статус': document.status,
      'Дата создания': document.createdAt,
      'Дата обновления': document.updatedAt,
      'Клиент': document.client?.name || 'Не указан',
      'Комментарии': document.comments || 'Нет комментариев'
    }
  ];
  
  return exportToExcel({
    filename: `document_${document.id}.xlsx`,
    sheetName: 'Документ',
    data
  });
}

/**
 * Генерирует Excel файл для документа (совместимость с существующим кодом)
 */
export function generateExcel(document: any): Buffer {
  return exportDocumentToExcel(document);
}

const excelGenerator = {
  exportToExcel,
  exportToCSV,
  createFormattedExcel,
  exportDocumentToExcel
};

export default excelGenerator;
