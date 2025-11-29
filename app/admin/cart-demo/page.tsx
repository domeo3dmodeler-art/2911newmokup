'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui';
import MultiCategoryCart from '../../../components/cart/MultiCategoryCart';

const CartDemoPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛒 Демонстрация мультикатегорийной корзины
        </h1>
        <p className="text-gray-600">
          Тестирование системы корзины с поддержкой товаров из разных категорий.
          Добавляйте товары, изменяйте количества и генерируйте документы.
        </p>
      </div>

      <div className="space-y-6">
        {/* Основная корзина */}
        <Card>
          <CardHeader>
            <CardTitle>Мультикатегорийная корзина</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiCategoryCart />
          </CardContent>
        </Card>

        {/* Инструкции */}
        <Card>
          <CardHeader>
            <CardTitle>Как использовать</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Добавление товаров</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Нажмите кнопку "Добавить товары"</li>
                  <li>Выберите категорию или используйте поиск</li>
                  <li>Выберите товары и укажите количество</li>
                  <li>Добавьте товары в корзину</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Управление корзиной</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Товары группируются по категориям</li>
                  <li>Используйте фильтр по категориям</li>
                  <li>Изменяйте количество товаров</li>
                  <li>Удаляйте ненужные позиции</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Расчет стоимости</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Автоматический расчет по каждой категории</li>
                  <li>Общий итог по всем товарам</li>
                  <li>Учет НДС и дополнительных услуг</li>
                  <li>Возможность применения скидок</li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">4. Генерация документов</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Создание коммерческих предложений (КП)</li>
                  <li>Генерация счетов на оплату</li>
                  <li>Формирование заказов поставщику</li>
                  <li>Экспорт в PDF и Excel форматы</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Техническая информация */}
        <Card>
          <CardHeader>
            <CardTitle>Техническая информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Компоненты</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• MultiCategoryCart - основная корзина</li>
                  <li>• ProductSelector - выбор товаров</li>
                  <li>• CartService - управление состоянием</li>
                  <li>• CartBlock - блок для конструктора</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">API Endpoints</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• /api/catalog/products - товары</li>
                  <li>• /api/catalog/categories - категории</li>
                  <li>• /api/cart/* - операции с корзиной</li>
                  <li>• /api/documents/* - генерация документов</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CartDemoPage;



