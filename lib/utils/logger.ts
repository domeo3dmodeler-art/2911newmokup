/**
 * Утилиты для корректного логирования с поддержкой кириллицы
 */

// Функция для безопасного логирования кириллицы
export function safeLog(message: string, ...args: any[]): void {
  try {
    // Проверяем, что сообщение содержит кириллицу
    const hasCyrillic = /[а-яё]/i.test(message);
    
    if (hasCyrillic) {
      // Для кириллицы используем console.log с явным указанием кодировки
      console.log(Buffer.from(message, 'utf8').toString('utf8'), ...args);
    } else {
      // Для латиницы используем обычный console.log
      console.log(message, ...args);
    }
  } catch (error) {
    // Fallback на обычный console.log
    console.log(message, ...args);
  }
}

// Функция для безопасного логирования объектов с кириллицей
export function safeLogObject(obj: any, label?: string): void {
  try {
    const jsonString = JSON.stringify(obj, null, 2);
    const hasCyrillic = /[а-яё]/i.test(jsonString);
    
    if (hasCyrillic) {
      if (label) {
        console.log(Buffer.from(label, 'utf8').toString('utf8'));
      }
      console.log(Buffer.from(jsonString, 'utf8').toString('utf8'));
    } else {
      if (label) {
        console.log(label);
      }
      console.log(jsonString);
    }
  } catch (error) {
    // Fallback на обычный console.log
    if (label) {
      console.log(label);
    }
    console.log(obj);
  }
}

// Функция для логирования с эмодзи и кириллицей
export function logWithEmoji(emoji: string, message: string, ...args: any[]): void {
  safeLog(`${emoji} ${message}`, ...args);
}

// Функция для логирования ошибок с кириллицей
export function safeLogError(message: string, error?: any): void {
  try {
    const hasCyrillic = /[а-яё]/i.test(message);
    
    if (hasCyrillic) {
      console.error(Buffer.from(message, 'utf8').toString('utf8'));
    } else {
      console.error(message);
    }
    
    if (error) {
      console.error(error);
    }
  } catch (e) {
    console.error(message, error);
  }
}

// Функция для логирования успешных операций
export function logSuccess(message: string, ...args: any[]): void {
  logWithEmoji('✅', message, ...args);
}

// Функция для логирования предупреждений
export function logWarning(message: string, ...args: any[]): void {
  logWithEmoji('⚠️', message, ...args);
}

// Функция для логирования информации
export function logInfo(message: string, ...args: any[]): void {
  logWithEmoji('ℹ️', message, ...args);
}

// Функция для логирования отладки
export function logDebug(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV === 'development') {
    logWithEmoji('🔍', message, ...args);
  }
}
