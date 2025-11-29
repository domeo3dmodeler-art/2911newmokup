import React from 'react';
import { Select } from '@/components/ui';
import { useCatalogData, CatalogCategory } from './hooks/useCatalogData';

interface CategorySelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  level?: number; // Уровень категории для фильтрации
  showCount?: boolean; // Показывать количество товаров
  disabled?: boolean;
  className?: string;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  value,
  onValueChange,
  placeholder = "Выберите категорию",
  level,
  showCount = false,
  disabled = false,
  className = ""
}) => {
  const { categories, loading, error } = useCatalogData();

  // Фильтрация категорий по уровню
  const filteredCategories = React.useMemo(() => {
    if (!level) return categories;
    
    const filterByLevel = (cats: CatalogCategory[]): CatalogCategory[] => {
      return cats.filter(cat => {
        if (cat.level === level) return true;
        if (cat.subcategories && cat.subcategories.length > 0) {
          return filterByLevel(cat.subcategories).length > 0;
        }
        return false;
      });
    };
    
    return filterByLevel(categories);
  }, [categories, level]);

  // Рекурсивное построение опций для вложенных категорий
  const renderCategoryOptions = (cats: CatalogCategory[], depth: number = 0): React.ReactNode[] => {
    const options: React.ReactNode[] = [];
    
    cats.forEach(category => {
      const indent = '— '.repeat(depth);
      const countText = showCount && category.products_count ? ` (${category.products_count})` : '';
      const label = `${indent}${category.name}${countText}`;
      
      options.push(
        <option key={category.id} value={category.id}>
          {label}
        </option>
      );
      
      // Добавляем подкатегории
      if (category.subcategories && category.subcategories.length > 0) {
        options.push(...renderCategoryOptions(category.subcategories, depth + 1));
      }
    });
    
    return options;
  };

  // Обработка ошибок
  if (error) {
    return (
      <Select disabled className={className}>
        <option value="">Ошибка загрузки категорий</option>
      </Select>
    );
  }

  // Загрузка
  if (loading) {
    return (
      <Select disabled className={className}>
        <option value="">Загрузка категорий...</option>
      </Select>
    );
  }

  // Отладочная информация
  clientLogger.debug('CategorySelector:', { 
    categories: categories.length, 
    filteredCategories: filteredCategories.length, 
    level, 
    showCount 
  });

  // Нет категорий
  if (filteredCategories.length === 0) {
    return (
      <Select disabled className={className}>
        <option value="">Категории не найдены ({categories.length} всего)</option>
      </Select>
    );
  }

  return (
    <Select
      value={value || ""}
      onValueChange={onValueChange}
      disabled={disabled}
      className={className}
    >
      <option value="">{placeholder}</option>
      {renderCategoryOptions(filteredCategories)}
    </Select>
  );
};

// Компонент для выбора основной категории (уровень 0 или 1)
export const MainCategorySelector: React.FC<Omit<CategorySelectorProps, 'level'>> = (props) => {
  return <CategorySelector {...props} showCount={true} />;
};

// Компонент для выбора подкатегории (уровень 2+)
export const SubCategorySelector: React.FC<Omit<CategorySelectorProps, 'level'>> = (props) => {
  return <CategorySelector {...props} level={2} showCount={true} />;
};

// Компонент для выбора любой категории с количеством товаров
export const AnyCategorySelector: React.FC<Omit<CategorySelectorProps, 'level'>> = (props) => {
  return <CategorySelector {...props} showCount={true} />;
};

