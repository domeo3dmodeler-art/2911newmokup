// Популярные размеры страниц для веб-разработки
export interface PageSize {
  name: string;
  width: number;
  height: number;
  description: string;
  category: 'desktop' | 'tablet' | 'mobile' | 'custom';
}

export const POPULAR_PAGE_SIZES: PageSize[] = [
  // Desktop
  {
    name: 'Desktop Full HD',
    width: 1920,
    height: 1080,
    description: 'Стандартный размер для десктопов',
    category: 'desktop'
  },
  {
    name: 'Desktop HD',
    width: 1366,
    height: 768,
    description: 'Популярный размер экранов',
    category: 'desktop'
  },
  {
    name: 'Desktop Standard',
    width: 1440,
    height: 900,
    description: 'Размер по умолчанию для конструктора',
    category: 'desktop'
  },
  {
    name: 'Desktop Large',
    width: 1600,
    height: 900,
    description: 'Большие экраны',
    category: 'desktop'
  },
  
  // Tablet
  {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    description: 'iPad Pro в портретной ориентации',
    category: 'tablet'
  },
  {
    name: 'iPad Landscape',
    width: 1366,
    height: 1024,
    description: 'iPad в альбомной ориентации',
    category: 'tablet'
  },
  {
    name: 'iPad Standard',
    width: 768,
    height: 1024,
    description: 'Стандартный iPad',
    category: 'tablet'
  },
  
  // Mobile
  {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    description: 'Самый большой iPhone',
    category: 'mobile'
  },
  {
    name: 'iPhone 14',
    width: 390,
    height: 844,
    description: 'Стандартный iPhone',
    category: 'mobile'
  },
  {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    description: 'Компактный iPhone',
    category: 'mobile'
  },
  {
    name: 'Android Large',
    width: 412,
    height: 915,
    description: 'Большие Android устройства',
    category: 'mobile'
  },
  
  // Custom sizes
  {
    name: 'Landing Page',
    width: 1200,
    height: 800,
    description: 'Оптимальный размер для лендингов',
    category: 'custom'
  },
  {
    name: 'Blog Post',
    width: 800,
    height: 1200,
    description: 'Размер для статей и блогов',
    category: 'custom'
  },
  {
    name: 'Portfolio',
    width: 1400,
    height: 900,
    description: 'Портфолио и галереи',
    category: 'custom'
  },
  {
    name: 'Dashboard',
    width: 1600,
    height: 1000,
    description: 'Панели управления',
    category: 'custom'
  }
];

export const getPageSizeByName = (name: string): PageSize | undefined => {
  return POPULAR_PAGE_SIZES.find(size => size.name === name);
};

export const getPageSizesByCategory = (category: PageSize['category']): PageSize[] => {
  return POPULAR_PAGE_SIZES.filter(size => size.category === category);
};
