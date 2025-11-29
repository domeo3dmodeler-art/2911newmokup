/**
 * Утилита для выполнения fetch запросов с автоматической передачей токенов авторизации
 */

/**
 * Очищает данные авторизации из localStorage и cookies
 */
function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Очищаем localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userFirstName');
  localStorage.removeItem('userLastName');
  localStorage.removeItem('userMiddleName');
  localStorage.removeItem('userPermissions');
  
  // Очищаем cookies
  if (typeof document !== 'undefined') {
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'domeo-auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}

/**
 * Перенаправляет на страницу логина с сохранением текущего URL для редиректа
 */
function redirectToLogin(): void {
  if (typeof window === 'undefined') return;
  
  const currentPath = window.location.pathname + window.location.search;
  const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
  window.location.href = loginUrl;
}

/**
 * Выполняет fetch запрос с автоматической передачей токенов авторизации
 * Автоматически обрабатывает 401 ошибки - очищает токен и перенаправляет на логин
 * @param url - URL для запроса
 * @param options - Опции для fetch (headers будут дополнены токенами)
 * @param skip401Redirect - Если true, не перенаправляет на логин при 401 (по умолчанию false)
 * @returns Promise<Response>
 */
export async function fetchWithAuth(
  url: string,
  options?: RequestInit,
  skip401Redirect: boolean = false
): Promise<Response> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  // Если body является FormData, не устанавливаем Content-Type,
  // чтобы браузер мог автоматически установить multipart/form-data с boundary
  const isFormData = options?.body instanceof FormData;
  
  const headers: HeadersInit = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as HeadersInit),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-auth-token'] = token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Обрабатываем 401 ошибки
  if (response.status === 401 && !skip401Redirect) {
    // Очищаем данные авторизации
    clearAuthData();
    
    // Перенаправляем на логин только если это не запрос к /api/auth/login
    if (!url.includes('/api/auth/login')) {
      redirectToLogin();
    }
  }

  return response;
}

/**
 * Выполняет fetch запрос с автоматической передачей токенов и парсингом JSON
 * Автоматически обрабатывает 401 ошибки - очищает токен и перенаправляет на логин
 * @param url - URL для запроса
 * @param options - Опции для fetch
 * @param skip401Redirect - Если true, не перенаправляет на логин при 401 (по умолчанию false)
 * @returns Promise с распарсенными данными
 */
export async function fetchWithAuthJson<T = unknown>(
  url: string,
  options?: RequestInit,
  skip401Redirect: boolean = false
): Promise<T> {
  const response = await fetchWithAuth(url, options, skip401Redirect);
  
  // Если 401 и был редирект, выбрасываем ошибку чтобы не парсить JSON
  if (response.status === 401 && !skip401Redirect) {
    throw new Error('Unauthorized');
  }
  
  return response.json() as Promise<T>;
}

