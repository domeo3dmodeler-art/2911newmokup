'use client';

import React, { useState } from 'react';
import { Card, Button } from '../ui';

interface CategoryBuilderProps {
  categoryData: any;
  onComplete: () => void;
}

export default function CategoryBuilder({ 
  categoryData, 
  onComplete 
}: CategoryBuilderProps) {
  const [currentStep, setCurrentStep] = useState<'info' | 'builder' | 'complete'>('info');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [components, setComponents] = useState([]);

  const handleInfoComplete = async () => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setCurrentStep('builder');
      }
    } catch (error) {
      clientLogger.error('Error creating category:', error);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/categories/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: categoryData?.id,
          template: { 
            name: 'Professional Template', 
            components: components,
            layout: { type: 'grid', columns: 4, gap: 6, responsive: true }
          }
        }),
      });

      if (response.ok) {
        setCurrentStep('complete');
        setTimeout(() => {
          onComplete();
        }, 2000);
      }
    } catch (error) {
      clientLogger.error('Error saving template:', error);
    }
  };

  const addComponent = (type: string) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type,
      title: getComponentTitle(type),
      position: { x: 100, y: 100 },
      size: { width: 300, height: 200 },
      config: getDefaultConfig(type)
    };
    setComponents([...components, newComponent]);
  };

  const getComponentTitle = (type: string) => {
    const titles = {
      'product-grid': '����� �������',
      'filter-panel': '������ ��������',
      'search-bar': '�����',
      'cart-summary': '�������',
      'price-calculator': '����������� ���',
      'image-gallery': '������� �����������'
    };
    return titles[type] || '���������';
  };

  const getDefaultConfig = (type: string) => {
    const configs = {
      'product-grid': { columns: 3, showPrices: true, showImages: true },
      'filter-panel': { categories: [], priceRange: true, brands: [] },
      'search-bar': { placeholder: '����� �������...', showSuggestions: true },
      'cart-summary': { showTotal: true, allowEdit: true },
      'price-calculator': { showBreakdown: true, allowDiscounts: true },
      'image-gallery': { showThumbnails: true, allowZoom: true }
    };
    return configs[type] || {};
  };

  if (currentStep === 'info') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">���������� � ���������</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  �������� ���������
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ��������
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ������
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder=""
                />
              </div>

              <Button onClick={handleInfoComplete} className="w-full">
                ������� ���������
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (currentStep === 'builder') {
    return (
      <div className="flex h-full">
        {/* Component Palette */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">����������</h3>
            <p className="text-sm text-gray-600">�������� ���������� �� ��������</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              {[
                { type: 'product-grid', icon: '', title: '����� �������', desc: '����������� ������� � �����' },
                { type: 'filter-panel', icon: '', title: '�������', desc: '������ ���������� �������' },
                { type: 'search-bar', icon: '', title: '�����', desc: '������ ������ �������' },
                { type: 'cart-summary', icon: '', title: '�������', desc: '������ �������' },
                { type: 'price-calculator', icon: '', title: '�����������', desc: '������ ���������' },
                { type: 'image-gallery', icon: '', title: '�������', desc: '������� �����������' }
              ].map((component) => (
                <div
                  key={component.type}
                  onClick={() => addComponent(component.type)}
                  className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                      {component.icon}
                    </span>
                    <div className="flex-1">
                      <h5 className="font-medium text-gray-900 group-hover:text-blue-700">
                        {component.title}
                      </h5>
                      <p className="text-sm text-gray-600 group-hover:text-blue-600">
                        {component.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">����������� ��������</h3>
                <span className="text-sm text-gray-500">�����������: {components.length}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={handleSave} variant="primary" size="sm">
                   ���������
                </Button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 p-6 bg-gray-100">
            <div className="h-full bg-white rounded-lg shadow-sm border border-gray-200 relative">
              {components.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-6xl mb-4"></div>
                    <h3 className="text-xl font-medium mb-2">������� ���������</h3>
                    <p className="text-sm">�������� ���������� �� ������� �����</p>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {components.map((component) => (
                      <div
                        key={component.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg"></span>
                          <h4 className="font-medium text-gray-900">{component.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{component.type}</p>
                        <div className="mt-2 flex space-x-1">
                          <button
                            onClick={() => setComponents(components.filter(c => c.id !== component.id))}
                            className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200"
                          >
                            �������
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === 'complete') {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <div className="text-6xl mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">��������� �������!</h2>
            <p className="text-gray-600 mb-6">
              ���� ��������� ������� ������� � ���������.
            </p>
            <Button onClick={onComplete} className="w-full">
              ������� � ����������
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
}
