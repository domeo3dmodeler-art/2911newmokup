'use client';

import React from 'react';

export default function ConstructorPage() {
  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Конструктор Domeo
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          NoCode платформа для создания конфигураторов
        </p>
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Доступные функции:</h2>
          <ul className="text-left space-y-2">
            <li>✅ Управление каталогом товаров</li>
            <li>✅ API для работы с данными</li>
            <li>✅ Система аутентификации</li>
            <li>✅ База данных SQLite с Prisma</li>
            <li>🔄 Конструктор страниц (в разработке)</li>
            <li>🔄 Калькулятор стоимости (в разработке)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
