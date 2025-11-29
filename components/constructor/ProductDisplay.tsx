import React from 'react';
import { useCatalogData, Product, ProductImage } from './hooks/useCatalogData';
import { Package, Image as ImageIcon } from 'lucide-react';

interface ProductDisplayProps {
  categoryId?: string;
  layout?: 'grid' | 'list' | 'masonry';
  columns?: number;
  itemsPerPage?: number;
  imageSize?: 'small' | 'medium' | 'large';
  imageAspectRatio?: 'square' | 'landscape' | 'portrait';
  showImages?: boolean;
  showPrices?: boolean;
  showDescriptions?: boolean;
  showCaptions?: boolean;
  captionProperty?: 'name' | 'description' | 'price' | 'material' | 'color';
  className?: string;
}

export const ProductDisplay: React.FC<ProductDisplayProps> = ({
  categoryId,
  layout = 'grid',
  columns = 3,
  itemsPerPage = 6,
  imageSize = 'medium',
  imageAspectRatio = 'square',
  showImages = true,
  showPrices = true,
  showDescriptions = false,
  showCaptions = true,
  captionProperty = 'name',
  className = ""
}) => {
  const { 
    products, 
    loading, 
    error, 
    loadProducts, 
    getProductsByCategory,
    getPropertyValues,
    getProductPrimaryImage 
  } = useCatalogData();

  const [displayProducts, setDisplayProducts] = React.useState<Product[]>([]);

  // Загрузка товаров при изменении категории
  React.useEffect(() => {
    if (categoryId) {
      loadProducts(categoryId, itemsPerPage);
    } else {
      // Загружаем товары по умолчанию, если категория не выбрана
      loadProducts(undefined, itemsPerPage);
    }
  }, [categoryId, itemsPerPage]);

  // Фильтрация товаров по категории
  React.useEffect(() => {
    if (categoryId) {
      const categoryProducts = getProductsByCategory(categoryId);
      setDisplayProducts(categoryProducts.slice(0, itemsPerPage));
    } else {
      setDisplayProducts(products.slice(0, itemsPerPage));
    }
  }, [products, categoryId, itemsPerPage]);

  // Получение CSS классов для изображений
  const getImageClasses = () => {
    const sizeClasses = {
      small: 'h-16 w-16',
      medium: 'h-24 w-24',
      large: 'h-32 w-32'
    };

    const aspectClasses = {
      square: 'aspect-square',
      landscape: 'aspect-video',
      portrait: 'aspect-[3/4]'
    };

    return `${sizeClasses[imageSize]} ${aspectClasses[imageAspectRatio]} rounded-lg object-cover`;
  };

  // Получение текста подписи
  const getCaptionText = (product: Product): string => {
    switch (captionProperty) {
      case 'name':
        return product.name;
      case 'description':
        return product.description || '';
      case 'price':
        return `${product.base_price.toLocaleString()} ${product.currency}`;
      case 'material':
        return getPropertyValues(product, 'material') || 'Материал не указан';
      case 'color':
        return getPropertyValues(product, 'color') || 'Цвет не указан';
      default:
        return product.name;
    }
  };

  // Обработка ошибок
  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">Ошибка загрузки товаров: {error}</p>
      </div>
    );
  }

  // Загрузка
  if (loading) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Загрузка товаров...</span>
        </div>
      </div>
    );
  }

  // Нет товаров
  if (displayProducts.length === 0) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 text-sm text-center">
          {categoryId ? 'В данной категории товары не найдены' : 'Товары не найдены'}
        </p>
      </div>
    );
  }

  // Рендеринг товара
  const renderProduct = (product: Product) => {
    const primaryImage = getProductPrimaryImage(product);
    const captionText = getCaptionText(product);

    return (
      <div key={product.id} className="space-y-2">
        {/* Изображение товара */}
        {showImages && (
          <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${getImageClasses()}`}>
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt_text || product.name}
                className={getImageClasses()}
                onError={(e) => {
                  // Fallback на иконку при ошибке загрузки изображения
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <ImageIcon className={`${imageSize === 'small' ? 'h-6 w-6' : imageSize === 'medium' ? 'h-8 w-8' : 'h-10 w-10'} text-gray-400 ${primaryImage ? 'hidden' : ''}`} />
          </div>
        )}

        {/* Подпись */}
        {showCaptions && captionText && (
          <div className="text-xs text-gray-600 text-center">
            {captionText.length > 30 ? `${captionText.substring(0, 30)}...` : captionText}
          </div>
        )}

        {/* Цена */}
        {showPrices && (
          <div className="text-xs text-blue-600 text-center font-medium">
            {product.base_price.toLocaleString()} {product.currency}
          </div>
        )}

        {/* Описание */}
        {showDescriptions && product.description && (
          <div className="text-xs text-gray-500 text-center">
            {product.description.length > 50 ? `${product.description.substring(0, 50)}...` : product.description}
          </div>
        )}
      </div>
    );
  };

  // CSS классы для сетки
  const getGridClasses = () => {
    if (layout === 'list') return 'grid-cols-1';
    if (layout === 'masonry') return 'grid-cols-2';
    
    // Для grid layout
    const columnClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
      5: 'grid-cols-5',
      6: 'grid-cols-6'
    };
    
    return columnClasses[columns as keyof typeof columnClasses] || 'grid-cols-3';
  };

  return (
    <div className={`${className}`}>
      {/* Информация о загруженных товарах */}
      <div className="text-xs text-gray-500 mb-2">
        Показано {displayProducts.length} товаров
        {categoryId && ` в категории`}
      </div>

      {/* Сетка товаров */}
      <div className={`grid gap-4 ${getGridClasses()}`}>
        {displayProducts.map(renderProduct)}
      </div>
    </div>
  );
};

// Компонент для превью товаров в конструкторе
export const ProductDisplayPreview: React.FC<ProductDisplayProps> = (props) => {
  // Для превью показываем только ограниченное количество товаров
  return (
    <ProductDisplay
      {...props}
      itemsPerPage={Math.min(props.itemsPerPage || 6, 12)}
      showDescriptions={false} // В превью не показываем описания
    />
  );
};

