'use client';

import React from 'react';

interface FeatureStatusProps {
  features: {
    name: string;
    status: 'working' | 'partial' | 'broken';
    description: string;
  }[];
}

export function FeatureStatus({ features }: FeatureStatusProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return '✅';
      case 'partial':
        return '⚠️';
      case 'broken':
        return '❌';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'working':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'broken':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧪 Статус функций конструктора
      </h3>
      
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg border ${getStatusColor(feature.status)}`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon(feature.status)}</span>
              <span className="font-medium">{feature.name}</span>
            </div>
            <p className="text-sm mt-1 opacity-75">{feature.description}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Инструкция:</strong> Откройте <code>TEST_CONNECTIONS_GUIDE.md</code> для подробного тестирования функций.
        </p>
      </div>
    </div>
  );
}

