// lib/templates/quote-templates.ts
// Система шаблонов КП

export type QuoteTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  template: {
    title: string;
    clientInfo: {
      company?: string;
      contact?: string;
      email?: string;
      phone?: string;
      address?: string;
    };
    notes?: string;
    items: Array<{
      sku: string;
      model: string;
      width?: number;
      height?: number;
      color?: string;
      finish?: string;
      series?: string;
      material?: string;
      rrc_price: number;
      qty: number;
      hardware_kit?: {
        name: string;
        price_rrc: number;
        group?: string;
      };
      handle?: {
        name: string;
        price_opt: number;
        price_group_multiplier: number;
      };
      price_opt?: number;
      currency?: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
};

class QuoteTemplateService {
  private templates: QuoteTemplate[] = [
    {
      id: 'template-office-premium',
      name: 'Офис Premium',
      description: 'Шаблон для офисных дверей премиум класса',
      category: 'office',
      template: {
        title: 'КП для офиса - Двери Premium',
        clientInfo: {
          company: '',
          contact: '',
          email: '',
          phone: '',
          address: ''
        },
        notes: 'Премиум качество для офисных помещений',
        items: [
          {
            sku: 'DOOR-PREM-001',
            model: 'Premium Classic',
            width: 800,
            height: 2000,
            color: 'Белый',
            finish: 'Матовый',
            series: 'Premium',
            material: 'МДФ',
            rrc_price: 15000,
            qty: 1,
            hardware_kit: {
              name: 'Комплект Premium',
              price_rrc: 3000,
              group: '1'
            },
            handle: {
              name: 'Ручка Classic',
              price_opt: 500,
              price_group_multiplier: 2.5
            },
            price_opt: 12000,
            currency: 'RUB'
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-apartment-standard',
      name: 'Квартира Standard',
      description: 'Шаблон для квартирных дверей стандартного класса',
      category: 'apartment',
      template: {
        title: 'КП для квартиры - Двери Standard',
        clientInfo: {
          company: '',
          contact: '',
          email: '',
          phone: '',
          address: ''
        },
        notes: 'Стандартное качество для квартир',
        items: [
          {
            sku: 'DOOR-STD-001',
            model: 'Standard Basic',
            width: 800,
            height: 2000,
            color: 'Белый',
            finish: 'Матовый',
            series: 'Standard',
            material: 'МДФ',
            rrc_price: 12000,
            qty: 1,
            hardware_kit: {
              name: 'Комплект Basic',
              price_rrc: 2000,
              group: '1'
            },
            handle: {
              name: 'Ручка Basic',
              price_opt: 300,
              price_group_multiplier: 2.0
            },
            price_opt: 10000,
            currency: 'RUB'
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-house-luxury',
      name: 'Дом Luxury',
      description: 'Шаблон для домов премиум класса',
      category: 'house',
      template: {
        title: 'КП для дома - Двери Luxury',
        clientInfo: {
          company: '',
          contact: '',
          email: '',
          phone: '',
          address: ''
        },
        notes: 'Премиум качество для частных домов',
        items: [
          {
            sku: 'DOOR-LUX-001',
            model: 'Luxury Elite',
            width: 1000,
            height: 2200,
            color: 'Черный',
            finish: 'Глянцевый',
            series: 'Luxury',
            material: 'Массив дуба',
            rrc_price: 25000,
            qty: 1,
            hardware_kit: {
              name: 'Комплект Elite',
              price_rrc: 5000,
              group: '3'
            },
            handle: {
              name: 'Ручка Elite',
              price_opt: 1200,
              price_group_multiplier: 3.5
            },
            price_opt: 20000,
            currency: 'RUB'
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'template-warehouse-economy',
      name: 'Склад Economy',
      description: 'Шаблон для складских помещений эконом класса',
      category: 'warehouse',
      template: {
        title: 'КП для склада - Двери Economy',
        clientInfo: {
          company: '',
          contact: '',
          email: '',
          phone: '',
          address: ''
        },
        notes: 'Экономное решение для складских помещений',
        items: [
          {
            sku: 'DOOR-ECO-001',
            model: 'Economy Basic',
            width: 800,
            height: 2000,
            color: 'Белый',
            finish: 'Матовый',
            series: 'Economy',
            material: 'ЛДСП',
            rrc_price: 8000,
            qty: 1,
            hardware_kit: {
              name: 'Комплект Economy',
              price_rrc: 1000,
              group: '1'
            },
            handle: {
              name: 'Ручка Economy',
              price_opt: 200,
              price_group_multiplier: 1.5
            },
            price_opt: 6000,
            currency: 'RUB'
          }
        ]
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Получить все шаблоны
  getAllTemplates(): QuoteTemplate[] {
    return [...this.templates];
  }

  // Получить шаблоны по категории
  getTemplatesByCategory(category: string): QuoteTemplate[] {
    return this.templates.filter(template => template.category === category);
  }

  // Получить шаблон по ID
  getTemplateById(id: string): QuoteTemplate | null {
    return this.templates.find(template => template.id === id) || null;
  }

  // Создать КП из шаблона
  createQuoteFromTemplate(templateId: string, customData?: Partial<QuoteTemplate['template']>): QuoteTemplate['template'] | null {
    const template = this.getTemplateById(templateId);
    if (!template) return null;

    const quoteData = {
      ...template.template,
      ...customData,
      items: template.template.items.map(item => ({ ...item }))
    };

    return quoteData;
  }

  // Получить категории шаблонов
  getCategories(): string[] {
    const categories = new Set(this.templates.map(template => template.category));
    return Array.from(categories);
  }

  // Добавить новый шаблон
  addTemplate(template: Omit<QuoteTemplate, 'id' | 'createdAt' | 'updatedAt'>): QuoteTemplate {
    const newTemplate: QuoteTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.templates.push(newTemplate);
    return newTemplate;
  }

  // Обновить шаблон
  updateTemplate(id: string, updates: Partial<QuoteTemplate>): QuoteTemplate | null {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return null;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    return this.templates[index];
  }

  // Удалить шаблон
  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex(template => template.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    return true;
  }

  // Получить статистику по шаблонам
  getTemplateStats(): {
    total: number;
    byCategory: Record<string, number>;
    mostUsed: string[];
  } {
    const byCategory: Record<string, number> = {};
    this.templates.forEach(template => {
      byCategory[template.category] = (byCategory[template.category] || 0) + 1;
    });

    return {
      total: this.templates.length,
      byCategory,
      mostUsed: Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])
    };
  }
}

// Экспортируем singleton instance
export const quoteTemplateService = new QuoteTemplateService();
