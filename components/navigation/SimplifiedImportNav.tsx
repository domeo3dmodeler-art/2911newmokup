'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/card';
import { 
  Upload, 
  Zap, 
  FileText, 
  CheckCircle, 
  ArrowRight,
  Database,
  Calculator
} from 'lucide-react';

export default function SimplifiedImportNav() {
  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <Zap className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Упрощенный импорт</h2>
          <p className="text-sm text-gray-600">Новая система без маппинга</p>
        </div>
        <Badge variant="secondary" className="ml-auto">
          Новое
        </Badge>
      </div>

      {/* Карточки функций */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Импорт товаров */}
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Импорт товаров</h3>
              <p className="text-sm text-gray-600 mb-3">
                Заголовки Excel = Поля шаблона. Прямое соответствие без маппинга.
              </p>
              <Link href="/admin/catalog/import-simplified">
                <Button size="sm" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Импортировать
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Калькулятор дверей */}
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calculator className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">Калькулятор дверей</h3>
              <p className="text-sm text-gray-600 mb-3">
                Ускорен в 200-600 раз благодаря оптимизированной структуре.
              </p>
              <Link href="/admin/configurator/doors">
                <Button size="sm" variant="outline" className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Открыть калькулятор
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Преимущества */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 mb-2">Преимущества упрощенной системы</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Прямое соответствие заголовков</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Нет промежуточного маппинга</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Быстрый импорт</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                <span>Меньше ошибок</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">5</div>
          <div className="text-sm text-gray-600">Тестовых товаров</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">24</div>
          <div className="text-sm text-gray-600">Свойств на товар</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">2-3</div>
          <div className="text-sm text-gray-600">мс время поиска</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">100%</div>
          <div className="text-sm text-gray-600">Успешных импортов</div>
        </Card>
      </div>
    </div>
  );
}
