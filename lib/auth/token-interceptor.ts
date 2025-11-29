// Клиентский интерцептор для добавления токена к запросам
export function addAuthTokenToRequest() {
  if (typeof window === 'undefined') {
    return {};
  }
  const token = localStorage.getItem('authToken');
  if (token) {
    return {
      'x-auth-token': token,
      'Authorization': `Bearer ${token}`
    };
  }
  return {};
}

// Функция для проверки авторизации на клиенте
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const token = localStorage.getItem('authToken');
  return !!token;
}

// Функция для получения данных пользователя
export function getCurrentUser() {
  // Проверяем, что мы на клиенте (браузер)
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userData = {
    id: localStorage.getItem('userId'),
    email: localStorage.getItem('userEmail'),
    role: localStorage.getItem('userRole'),
    firstName: localStorage.getItem('userFirstName'),
    lastName: localStorage.getItem('userLastName'),
    middleName: localStorage.getItem('userMiddleName')
  };
  
  // Проверяем, что все основные поля заполнены
  return userData.id && userData.email && userData.role ? userData : null;
}



