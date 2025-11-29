import { useEffect, useState } from 'react';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Получаем токен из localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Функция для добавления токена к запросам
  const getAuthHeaders = () => {
    if (!token) return {};
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  return {
    token,
    setToken,
    getAuthHeaders,
    isAuthenticated: !!token
  };
}



