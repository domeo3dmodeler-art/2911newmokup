'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { Card, Button } from '../../../components/ui';

interface SystemSettings {
  pricing: {
    defaultMargin: number;
    currency: string;
    taxRate: number;
  };
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    pricing: {
      defaultMargin: 30,
      currency: 'RUB',
      taxRate: 20
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    // Имитируем загрузку настроек
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Имитируем сохранение настроек
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveMessage('Настройки успешно сохранены');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Ошибка при сохранении настроек');
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка настроек...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Настройки системы"
      subtitle="Конфигурация параметров системы и экспорта"
    >
      {/* Save Button */}
      <div className="mb-6 flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
        {saveMessage && (
          <div className={`mb-6 p-4 rounded ${
            saveMessage.includes('успешно') 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {saveMessage}
          </div>
        )}

        <div className="space-y-8">
          {/* Ценообразование */}
          <Card variant="base">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-black mb-4">💰 Ценообразование</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Наценка по умолчанию (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.pricing.defaultMargin}
                    onChange={(e) => updateSetting('pricing', 'defaultMargin', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Валюта</label>
                  <select
                    value={settings.pricing.currency}
                    onChange={(e) => updateSetting('pricing', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="RUB">RUB (Российский рубль)</option>
                    <option value="USD">USD (Доллар США)</option>
                    <option value="EUR">EUR (Евро)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">НДС (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={settings.pricing.taxRate}
                    onChange={(e) => updateSetting('pricing', 'taxRate', Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Формулы расчета */}
          <Card variant="base">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-black mb-4">🧮 Формулы расчета</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-medium text-black mb-2">Формула цены для клиента:</h3>
                  <code className="text-sm text-gray-700">
                    Цена_клиента = Цена_закупки × (1 + Наценка_%) × (1 + НДС_%)
                  </code>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-medium text-black mb-2">Формула скидки:</h3>
                  <code className="text-sm text-gray-700">
                    Итоговая_цена = Цена_клиента × (1 - Скидка_%)
                  </code>
                </div>
                <div className="p-4 bg-gray-50 rounded">
                  <h3 className="font-medium text-black mb-2">Формула заказа на фабрику:</h3>
                  <code className="text-sm text-gray-700">
                    Заказ_фабрика = Цена_закупки × Количество × (1 + НДС_%)
                  </code>
                </div>
              </div>
            </div>
          </Card>

          {/* Поля экспорта */}
          <Card variant="base">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Поля экспорта</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-black mb-2">Поля для КП:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Наименование', 'Количество', 'Цена', 'Сумма', 'Скидка', 'Итого'].map((field) => (
                      <label key={field} className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded mr-2"
                        />
                        <span className="text-sm text-black">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-black mb-2">Поля для заказа на фабрику:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['Артикул', 'Наименование', 'Количество', 'Цена_закупки', 'Сумма', 'Примечание'].map((field) => (
                      <label key={field} className="flex items-center">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="h-4 w-4 text-black focus:ring-yellow-400 border-gray-300 rounded mr-2"
                        />
                        <span className="text-sm text-black">{field}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </AdminLayout>
  );
}
