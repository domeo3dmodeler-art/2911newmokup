import React, { useState, useEffect } from 'react';

interface PropertyValueSelectorProps {
  propertyKey: string;
  values: string[];
  selectedValue?: string;
  displayMode: 'chips' | 'list' | 'grid' | 'radio';
  onValueChange: (value: string | undefined) => void;
  productsCount?: number;
}

const PropertyValueSelector: React.FC<PropertyValueSelectorProps> = ({
  propertyKey,
  values,
  selectedValue,
  displayMode,
  onValueChange,
  productsCount = 0
}) => {
  const [localSelected, setLocalSelected] = useState<string | undefined>(selectedValue);

  useEffect(() => {
    setLocalSelected(selectedValue);
  }, [selectedValue]);

  const handleValueSelect = (value: string) => {
    const newValue = localSelected === value ? undefined : value;
    setLocalSelected(newValue);
    onValueChange(newValue);
  };

  if (displayMode === 'chips') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Выберите {propertyKey.toLowerCase()}:
        </h3>
        <div className="flex flex-wrap gap-3">
          {values.map((value) => (
            <button
              key={value}
              onClick={() => handleValueSelect(value)}
              className={`
                px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105
                ${localSelected === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {value}
              {localSelected === value && (
                <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
        {selectedValue && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Выбрано: <strong>{selectedValue}</strong>
            </p>
          </div>
        )}
      </div>
    );
  }

  if (displayMode === 'grid') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Выберите {propertyKey.toLowerCase()}:
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {values.map((value) => (
            <button
              key={value}
              onClick={() => handleValueSelect(value)}
              className={`
                p-4 text-center font-medium rounded-xl border-2 transition-all duration-200 hover:scale-105
                ${localSelected === value
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {value}
            </button>
          ))}
        </div>
        {selectedValue && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
            <p className="text-sm text-gray-700">
              Выбран: <span className="font-semibold text-green-700">{selectedValue}</span>
            </p>
          </div>
        )}
      </div>
    );
  }

  if (displayMode === 'radio') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Выберите {propertyKey.toLowerCase()}:
        </h3>
        <div className="space-y-3">
          {values.map((value) => (
            <label key={value} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="radio"
                name={propertyKey}
                value={value}
                checked={localSelected === value}
                onChange={() => handleValueSelect(value)}
                className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-gray-700 font-medium">{value}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  // Default: list mode
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Выберите {propertyKey.toLowerCase()}:
      </h3>
      <div className="space-y-2">
        {values.map((value) => (
          <button
            key={value}
            onClick={() => handleValueSelect(value)}
            className={`
              w-full text-left p-3 rounded-lg border transition-all duration-200 hover:bg-gray-50
              ${localSelected === value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{value}</span>
              {localSelected === value && (
                <span className="text-blue-600">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PropertyValueSelector;

