'use client';

import { useState, useEffect } from 'react';

export default function CheckAuthPage() {
  const [authData, setAuthData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = {
      token: token ? token.substring(0, 20) + '...' : 'Нет токена',
      userId: localStorage.getItem('userId'),
      userEmail: localStorage.getItem('userEmail'),
      userRole: localStorage.getItem('userRole'),
      cookies: document.cookie
    };
    setAuthData(userData);
  }, []);

  const testAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(token ? { 'x-auth-token': token } : {})
        },
        credentials: 'include'
      });
      const data = await response.json();
      alert(`API Response: ${JSON.stringify(data)}`);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Проверка авторизации</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Данные из localStorage:</h2>
        <pre className="text-sm">{JSON.stringify(authData, null, 2)}</pre>
      </div>

      <button 
        onClick={testAuth}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Тест API /api/users/me
      </button>

      <div className="mt-4">
        <a href="/dashboard" className="text-blue-500 hover:underline">
          Перейти на Dashboard
        </a>
      </div>
    </div>
  );
}



