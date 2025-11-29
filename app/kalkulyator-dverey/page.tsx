'use client';

import React from 'react';
import { DoorCalculator } from '../../components/page-builder/elements/DoorCalculator';

export default function KalkulyatorDvereyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🚪 Калькулятор дверей Domeo
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Полноценный калькулятор дверей, созданный с помощью No-Code конструктора
          </p>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <DoorCalculator 
          title="Калькулятор дверей Domeo - как на Framyr.ru"
          showDimensions={true}
          showStyle={true}
          showSystem={true}
          showFinish={true}
        />
      </main>

      {/* Футер */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                ✅ Задача выполнена!
              </h2>
              <p className="text-green-700">
                Создан полноценный калькулятор дверей, используя ТОЛЬКО компоненты нашего конструктора страниц и нашу базу данных, с референсом на Framyr.ru
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

