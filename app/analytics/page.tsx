// app/analytics/page.tsx
// Страница дашборда аналитики

'use client';

import AdminLayout from '../../components/layout/AdminLayout';
import { Card, Button } from '../../components/ui';

export default function AnalyticsPage() {
  return (
    <AdminLayout
      title="Аналитика"
      subtitle="Статистика и отчеты по системе"
    >
      <div className="space-y-6">
        {/* Основные метрики */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Всего заказов</p>
                  <p className="text-2xl font-bold text-black mt-1">156</p>
                </div>
                <div className="text-2xl">📋</div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Коммерческие предложения</p>
                  <p className="text-2xl font-bold text-black mt-1">89</p>
                </div>
                <div className="text-2xl">📄</div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Выставленные счета</p>
                  <p className="text-2xl font-bold text-black mt-1">67</p>
                </div>
                <div className="text-2xl">🧾</div>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Активные клиенты</p>
                  <p className="text-2xl font-bold text-black mt-1">23</p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Графики и отчеты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="base">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Продажи по месяцам</h3>
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">График продаж</p>
              </div>
            </div>
          </Card>
          
          <Card variant="base">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Популярные категории</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Двери</span>
                  <span className="text-sm font-medium text-black">45%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Смарт</span>
                  <span className="text-sm font-medium text-black">30%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Другие</span>
                  <span className="text-sm font-medium text-black">25%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Быстрые действия */}
        <Card variant="base">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-black mb-4">Быстрые действия</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">
                📊 Экспорт отчета
              </Button>
              <Button variant="secondary">
                📈 Детальная аналитика
              </Button>
              <Button variant="secondary">
                📋 Отчет по клиентам
              </Button>
              <Button variant="secondary">
                💰 Финансовый отчет
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
