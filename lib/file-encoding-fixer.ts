import * as XLSX from 'xlsx';
import { fixFieldsEncoding } from './encoding-utils';

export interface EncodingCheckResult {
  hasEncodingIssues: boolean;
  fixedHeaders: string[];
  originalHeaders: string[];
  encodingIssues: string[];
  needsReencoding: boolean;
}

/**
 * Проверяет файл на проблемы с кодировкой и исправляет их
 */
export async function checkAndFixFileEncoding(file: File): Promise<{
  fixedFile: File;
  result: EncodingCheckResult;
}> {
  try {
    // Читаем файл
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Получаем первый лист
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Получаем заголовки
    const headers = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '' 
    })[0] as string[];
    
    // Используем logger если доступен
    const log = typeof window === 'undefined' ? (() => {
      try {
        const { logger } = require('./logging/logger');
        return (msg: string, data?: any) => logger.debug(msg, 'file-encoding-fixer', data);
      } catch {
        return console.log;
      }
    })() : console.log;
    
    log('Проверка кодировки файла', {
      filename: file.name,
      originalHeaders: headers.slice(0, 5) // Показываем первые 5 заголовков
    });
    
    // Исправляем кодировку заголовков
    const fixedHeaders = fixFieldsEncoding(headers);
    
    // Проверяем, есть ли проблемы с кодировкой
    const encodingIssues: string[] = [];
    let hasEncodingIssues = false;
    
    headers.forEach((originalHeader, index) => {
      const fixedHeader = fixedHeaders[index];
      if (originalHeader !== fixedHeader) {
        hasEncodingIssues = true;
        encodingIssues.push(`"${originalHeader}" → "${fixedHeader}"`);
      }
    });
    
    log('Результат проверки кодировки', {
      hasEncodingIssues,
      issuesCount: encodingIssues.length,
      sampleIssues: encodingIssues.slice(0, 3)
    });
    
    // Если есть проблемы с кодировкой, создаем исправленный файл
    let fixedFile = file;
    
    if (hasEncodingIssues) {
      log('Создание исправленного файла', { filename: file.name });
      
      // Создаем новый workbook с исправленными заголовками
      const fixedWorkbook = XLSX.utils.book_new();
      const fixedWorksheet = XLSX.utils.aoa_to_sheet([
        fixedHeaders, // Исправленные заголовки
        ...XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '' 
        }).slice(1) // Остальные данные без изменений
      ]);
      
      XLSX.utils.book_append_sheet(fixedWorkbook, fixedWorksheet, sheetName);
      
      // Конвертируем в буфер
      const fixedBuffer = XLSX.write(fixedWorkbook, { 
        type: 'array', 
        bookType: 'xlsx' 
      });
      
      // Создаем новый файл с исправленными данными
      const fixedBlob = new Blob([fixedBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      fixedFile = new File([fixedBlob], file.name, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      log('Файл исправлен', {
        originalSize: file.size,
        fixedSize: fixedFile.size,
        filename: fixedFile.name
      });
    }
    
    const result: EncodingCheckResult = {
      hasEncodingIssues,
      fixedHeaders,
      originalHeaders: headers,
      encodingIssues,
      needsReencoding: hasEncodingIssues
    };
    
    return { fixedFile, result };
    
  } catch (error) {
    const logError = typeof window === 'undefined' ? (() => {
      try {
        const { logger } = require('./logging/logger');
        return (msg: string, data?: any) => logger.error(msg, 'file-encoding-fixer', data);
      } catch {
        return console.error;
      }
    })() : console.error;
    logError('Ошибка при проверке кодировки файла', { error: error instanceof Error ? error.message : String(error), filename: file.name });
    throw new Error(`Ошибка проверки кодировки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}

/**
 * Проверяет только кодировку без создания нового файла
 */
export async function checkFileEncoding(file: File): Promise<EncodingCheckResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const headers = XLSX.utils.sheet_to_json(worksheet, { 
      header: 1, 
      defval: '' 
    })[0] as string[];
    
    const fixedHeaders = fixFieldsEncoding(headers);
    
    const encodingIssues: string[] = [];
    let hasEncodingIssues = false;
    
    headers.forEach((originalHeader, index) => {
      const fixedHeader = fixedHeaders[index];
      if (originalHeader !== fixedHeader) {
        hasEncodingIssues = true;
        encodingIssues.push(`"${originalHeader}" → "${fixedHeader}"`);
      }
    });
    
    return {
      hasEncodingIssues,
      fixedHeaders,
      originalHeaders: headers,
      encodingIssues,
      needsReencoding: hasEncodingIssues
    };
    
  } catch (error) {
    const logError = typeof window === 'undefined' ? (() => {
      try {
        const { logger } = require('./logging/logger');
        return (msg: string, data?: any) => logger.error(msg, 'file-encoding-fixer', data);
      } catch {
        return console.error;
      }
    })() : console.error;
    logError('Ошибка при проверке кодировки', { error: error instanceof Error ? error.message : String(error) });
    throw new Error(`Ошибка проверки кодировки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
}
