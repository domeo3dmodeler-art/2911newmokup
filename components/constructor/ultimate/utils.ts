// Утилиты для UltimateConstructorFixed
import type { BlockSettings } from './types';

export const snapToGrid = (x: number, y: number, width: number, height: number) => {
  const gridSize = 16;
  const snapX = Math.round(x / gridSize) * gridSize;
  const snapY = Math.round(y / gridSize) * gridSize;
  const snapWidth = Math.round(width / gridSize) * gridSize;
  const snapHeight = Math.round(height / gridSize) * gridSize;
  return { x: snapX, y: snapY, width: snapWidth, height: snapHeight };
};

export const createBlock = (type: BlockSettings['type'], x: number, y: number, blocksCount: number): BlockSettings => {
  const blockNames: Record<BlockSettings['type'], string> = {
    'category-title': 'Наименование категории',
    'main-category': 'Основная категория товаров',
    'subcategory': 'Подкатегории товаров',
    'additional-category': 'Дополнительные категории',
    'product-selector': 'Конструктор подбора товара',
    'filter-constructor': 'Конструктор фильтров',
    'product-image': 'Блок изображения товара',
    'cart-export': 'Корзина с экспортами',
    'text': 'Текстовый блок',
    'document-generator': 'Генератор документов',
    'cart': 'Корзина покупок'
  };
  
  const baseBlock: BlockSettings = {
    id: Date.now().toString(),
    name: blockNames[type] || `Блок ${blocksCount + 1}`,
    type,
    x,
    y,
    width: 400,
    height: 300,
    displayWidth: '100%',
    alignment: 'left',
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    padding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: '8px',
    zIndex: blocksCount + 1,
  };

  // Добавляем специфичные настройки для каждого типа блока
  switch (type) {
    case 'category-title':
      return {
        ...baseBlock,
        categoryTitleSettings: {
          title: 'Межкомнатные двери',
          subtitle: 'Широкий выбор дверей для любого интерьера',
          showBreadcrumbs: true,
          showProductCount: true
        }
      };

    case 'main-category':
      return {
        ...baseBlock,
        mainCategorySettings: {
          categoryId: 'doors',
          layout: 'grid',
          columns: 3,
          itemsPerPage: 6,
          showImages: true,
          showPrices: true,
          showDescriptions: false,
          imageSize: 'medium',
          imageAspectRatio: 'square',
          showCaptions: true,
          captionProperty: 'name'
        }
      };

    case 'subcategory':
      return {
        ...baseBlock,
        subcategorySettings: {
          parentCategoryId: 'doors',
          layout: 'horizontal',
          maxSubcategories: 6,
          showProductCount: true,
          showImages: true,
          showDescriptions: false,
          imageSize: 'small',
          imageAspectRatio: 'square'
        }
      };

    case 'additional-category':
      return {
        ...baseBlock,
        additionalCategorySettings: {
          categoryId: 'handles',
          pricingStrategy: 'combined',
          targetMainCategory: 'doors',
          showImages: true,
          showPrices: true,
          showDescriptions: false,
          imageSize: 'small',
          imageAspectRatio: 'square',
          showCaptions: true,
          captionProperty: 'name'
        }
      };

    case 'product-selector':
      return {
        ...baseBlock,
        productSelectorSettings: {
          categoryId: 'doors',
          selectedProperties: ['material', 'color', 'size'],
          layout: 'vertical',
          showPrice: true,
          showImage: true,
          showDescription: false
        }
      };

    case 'filter-constructor':
      return {
        ...baseBlock,
        filterConstructorSettings: {
          categoryId: 'doors',
          selectedFilters: ['price', 'color', 'material'],
          layout: 'horizontal',
          showApplyButton: true,
          showClearButton: true,
          autoApply: false,
          showResultCount: true
        }
      };

    case 'product-image':
      return {
        ...baseBlock,
        productImageSettings: {
          size: 'large',
          aspectRatio: 'square',
          showGallery: true,
          showZoom: true,
          showThumbnails: true,
          zoomLevel: 2
        }
      };

    case 'cart-export':
      return {
        ...baseBlock,
        cartExportSettings: {
          quote: {
            enabled: true,
            showPrices: true,
            showTotals: true
          },
          invoice: {
            enabled: true,
            showPrices: true,
            showTaxes: true,
            showTotals: true
          },
          order: {
            enabled: true,
            showPrices: true,
            showDelivery: true,
            showTotals: true
          },
          combineAdditionalCategories: true,
          showSeparateLines: false,
          calculateTotal: true
        }
      };

    case 'text':
      return {
        ...baseBlock,
        textSettings: {
          content: 'Пример текстового содержимого',
          fontSize: '16px',
          fontFamily: 'system-ui',
          fontWeight: 'normal',
          textAlign: 'left',
          color: '#333333',
          backgroundColor: 'transparent'
        }
      };

    case 'document-generator':
      return {
        ...baseBlock,
        documentGeneratorSettings: {
          enabledDocuments: ['quote', 'invoice', 'supplier_order'],
          defaultTemplate: 'quote',
          showPreview: true,
          allowCustomFields: true
        }
      };

    case 'cart':
      return {
        ...baseBlock,
        cartSettings: {
          showItemList: true,
          showCalculation: true,
          showActions: true,
          allowQuantityChange: true,
          allowItemRemoval: true,
          showClientForm: false,
          autoCalculate: true,
          showTax: true,
          showDiscount: true,
          maxItems: 50
        }
      };

    default:
      return baseBlock;
  }
};

