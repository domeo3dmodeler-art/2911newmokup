import { ConstructorElement } from './types';

export const BLOCK_DEFINITIONS: Record<string, Partial<ConstructorElement>> = {
  container: {
    type: 'container',
    component: 'ContainerBlock',
    props: {
      backgroundColor: '#ffffff',
      padding: '20px',
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  text: {
    type: 'block',
    component: 'TextBlock',
    props: {
      content: 'Напишите ваш текст здесь',
      fontSize: '16px',
      color: '#333333',
    },
    size: { width: 'auto', height: 'auto' },
    responsive: {},
  },
  image: {
    type: 'block',
    component: 'ImageBlock',
    props: {
      src: '/placeholder.jpg',
      alt: 'Изображение',
      width: '100%',
      height: 'auto',
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  productGrid: {
    type: 'module',
    component: 'ProductGridBlock',
    props: {
      categoryId: '',
      columns: 3,
      showPrices: true,
      showImages: true,
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  productFilter: {
    type: 'module',
    component: 'ProductFilterBlock',
    props: {
      categoryId: '',
      filters: [],
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  productCart: {
    type: 'module',
    component: 'ProductCartBlock',
    props: {
      showTotal: true,
      showButtons: true,
    },
    size: { width: '300px', height: 'auto' },
    responsive: {},
  },
  productComparison: {
    type: 'module',
    component: 'ProductComparisonBlock',
    props: {
      maxItems: 3,
      showDifferences: true,
      showPrices: true,
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  priceCalculator: {
    type: 'module',
    component: 'PriceCalculatorBlock',
    props: {
      showBreakdown: true,
      allowDiscounts: true,
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  button: {
    type: 'block',
    component: 'ButtonBlock',
    props: {
      text: 'Кнопка',
      variant: 'primary',
      size: 'medium',
    },
    size: { width: 'auto', height: 'auto' },
    responsive: {},
  },
  form: {
    type: 'block',
    component: 'FormBlock',
    props: {
      fields: [],
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  spacer: {
    type: 'block',
    component: 'SpacerBlock',
    props: {
      height: '20px',
    },
    size: { width: '100%', height: '20px' },
    responsive: {},
  },
  divider: {
    type: 'block',
    component: 'DividerBlock',
    props: {
      style: 'solid',
      color: '#e5e7eb',
    },
    size: { width: '100%', height: '1px' },
    responsive: {},
  },
  row: {
    type: 'container',
    component: 'RowBlock',
    props: {
      columns: 2,
      gap: '20px',
    },
    size: { width: '100%', height: 'auto' },
    responsive: {},
  },
  column: {
    type: 'container',
    component: 'ColumnBlock',
    props: {
      width: '50%',
    },
    size: { width: '50%', height: 'auto' },
    responsive: {},
  },
};

export const ELEMENT_CATEGORIES = {
  layout: {
    title: 'Макет',
    elements: ['container', 'row', 'column', 'spacer']
  },
  content: {
    title: 'Контент',
    elements: ['text', 'image', 'divider']
  },
  forms: {
    title: 'Формы',
    elements: ['form', 'button']
  },
  products: {
    title: 'Товары',
    elements: ['productGrid', 'productFilter', 'productCart', 'productComparison', 'priceCalculator']
  }
};

