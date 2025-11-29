/**
 * Утилиты для работы с сессиями корзины
 */

/**
 * Генерирует уникальный ID сессии корзины
 * @param prefix - префикс для ID (по умолчанию 'cart')
 * @returns уникальный ID сессии корзины
 */
export function generateCartSessionId(prefix: string = 'cart'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Проверяет, является ли строка валидным cart_session_id
 * @param sessionId - строка для проверки
 * @returns true если строка является валидным cart_session_id
 */
export function isValidCartSessionId(sessionId: string): boolean {
  if (!sessionId || typeof sessionId !== 'string') {
    return false;
  }
  
  // Проверяем формат: prefix_timestamp_random
  const pattern = /^[a-zA-Z_]+_\d+_[a-z0-9]+$/;
  return pattern.test(sessionId);
}

/**
 * Извлекает timestamp из cart_session_id
 * @param sessionId - ID сессии корзины
 * @returns timestamp или null если не удалось извлечь
 */
export function extractTimestampFromCartSessionId(sessionId: string): number | null {
  if (!isValidCartSessionId(sessionId)) {
    return null;
  }
  
  const parts = sessionId.split('_');
  if (parts.length >= 3) {
    const timestamp = parseInt(parts[1], 10);
    return isNaN(timestamp) ? null : timestamp;
  }
  
  return null;
}

/**
 * Проверяет, не истекла ли сессия корзины
 * @param sessionId - ID сессии корзины
 * @param maxAgeMinutes - максимальный возраст сессии в минутах (по умолчанию 30)
 * @returns true если сессия не истекла
 */
export function isCartSessionValid(sessionId: string, maxAgeMinutes: number = 30): boolean {
  const timestamp = extractTimestampFromCartSessionId(sessionId);
  if (!timestamp) {
    return false;
  }
  
  const now = Date.now();
  const maxAge = maxAgeMinutes * 60 * 1000; // конвертируем в миллисекунды
  
  return (now - timestamp) <= maxAge;
}
