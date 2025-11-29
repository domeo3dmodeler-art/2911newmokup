/**
 * Утилита для парсинга ответов API в формате apiSuccess
 * apiSuccess возвращает: { success: true, data: T, message?: string }
 */

/**
 * Парсит ответ API, извлекая данные из формата apiSuccess
 * @param data - Ответ от API (может быть в формате apiSuccess или прямым ответом)
 * @returns Извлеченные данные
 */
export function parseApiResponse<T = unknown>(data: unknown): T {
  if (!data || typeof data !== 'object') {
    return data as T;
  }

  // apiSuccess возвращает { success: true, data: T }
  if ('data' in data && 'success' in data) {
    return (data as { success: boolean; data: T }).data;
  }

  // Прямой ответ (для обратной совместимости)
  return data as T;
}

/**
 * Парсит ответ API и проверяет успешность операции
 * @param data - Ответ от API
 * @returns Объект с данными и флагом успешности
 */
export function parseApiResponseWithStatus<T = unknown>(data: unknown): {
  success: boolean;
  data: T | null;
  message?: string;
} {
  if (!data || typeof data !== 'object') {
    return { success: false, data: null };
  }

  // apiSuccess формат
  if ('success' in data && 'data' in data) {
    const response = data as {
      success: boolean;
      data: T;
      message?: string;
    };
    return {
      success: response.success,
      data: response.data,
      message: response.message,
    };
  }

  // Прямой ответ (для обратной совместимости)
  return { success: true, data: data as T };
}

/**
 * Комбинированная функция: fetch с авторизацией + парсинг ответа
 * @param url - URL для запроса
 * @param options - Опции для fetch
 * @returns Promise с распарсенными данными
 */
export async function fetchAndParse<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const { fetchWithAuth } = await import('./fetch-with-auth');
  const response = await fetchWithAuth(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return parseApiResponse<T>(data);
}

