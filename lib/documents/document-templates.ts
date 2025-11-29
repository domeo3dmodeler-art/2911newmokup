// lib/documents/document-templates.ts
// Шаблоны документов для калькулятора стоимости товаров

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'quote' | 'invoice' | 'supplier_order';
  description: string;
  icon: string;
  role: string; // Кто может генерировать
  format: 'pdf' | 'excel';
  sections: DocumentSection[];
}

export interface DocumentSection {
  id: string;
  name: string;
  type: 'header' | 'client_info' | 'products' | 'pricing' | 'footer' | 'custom';
  required: boolean;
  fields: DocumentField[];
  layout: {
    position: 'top' | 'middle' | 'bottom';
    width: 'full' | 'half' | 'quarter';
    align: 'left' | 'center' | 'right';
  };
}

export interface DocumentField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'image' | 'table' | 'calculated';
  value: string | number | object;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// ШАБЛОН: КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ (КП)
export const QUOTE_TEMPLATE: DocumentTemplate = {
  id: 'quote',
  name: 'Коммерческое предложение',
  type: 'quote',
  description: 'Документ с предложением товаров и услуг клиенту',
  icon: '📄',
  role: 'complectator',
  format: 'pdf',
  sections: [
    {
      id: 'header',
      name: 'Шапка документа',
      type: 'header',
      required: true,
      fields: [
        {
          id: 'company_logo',
          name: 'Логотип компании',
          type: 'image',
          value: '',
          required: true
        },
        {
          id: 'company_name',
          name: 'Название компании',
          type: 'text',
          value: 'ООО "Домео"',
          required: true
        },
        {
          id: 'company_address',
          name: 'Адрес компании',
          type: 'text',
          value: 'г. Москва, ул. Примерная, д. 1',
          required: true
        },
        {
          id: 'company_phone',
          name: 'Телефон',
          type: 'text',
          value: '+7 (495) 123-45-67',
          required: true
        },
        {
          id: 'company_email',
          name: 'Email',
          type: 'text',
          value: 'info@domeo.ru',
          required: true
        },
        {
          id: 'document_title',
          name: 'Заголовок документа',
          type: 'text',
          value: 'КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ',
          required: true
        },
        {
          id: 'document_number',
          name: 'Номер документа',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'document_date',
          name: 'Дата документа',
          type: 'date',
          value: new Date().toISOString().split('T')[0],
          required: true
        }
      ],
      layout: {
        position: 'top',
        width: 'full',
        align: 'center'
      }
    },
    {
      id: 'client_info',
      name: 'Информация о клиенте',
      type: 'client_info',
      required: true,
      fields: [
        {
          id: 'client_name',
          name: 'Название клиента',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'client_contact',
          name: 'Контактное лицо',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'client_phone',
          name: 'Телефон клиента',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'client_email',
          name: 'Email клиента',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'client_address',
          name: 'Адрес доставки',
          type: 'text',
          value: '',
          required: true
        }
      ],
      layout: {
        position: 'top',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'products',
      name: 'Список товаров',
      type: 'products',
      required: true,
      fields: [
        {
          id: 'products_table',
          name: 'Таблица товаров',
          type: 'table',
          value: {
            columns: [
              { id: 'name', name: 'Наименование', width: '40%' },
              { id: 'sku', name: 'Артикул', width: '15%' },
              { id: 'quantity', name: 'Количество', width: '10%' },
              { id: 'price', name: 'Цена за ед.', width: '15%' },
              { id: 'total', name: 'Сумма', width: '20%' }
            ],
            data: [] // Заполняется из корзины
          },
          required: true
        }
      ],
      layout: {
        position: 'middle',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'pricing',
      name: 'Расчет стоимости',
      type: 'pricing',
      required: true,
      fields: [
        {
          id: 'subtotal',
          name: 'Стоимость товаров',
          type: 'calculated',
          value: 0,
          required: true
        },
        {
          id: 'discount',
          name: 'Скидка',
          type: 'number',
          value: 0,
          required: false
        },
        {
          id: 'delivery',
          name: 'Доставка',
          type: 'number',
          value: 0,
          required: false
        },
        {
          id: 'installation',
          name: 'Установка',
          type: 'number',
          value: 0,
          required: false
        },
        {
          id: 'tax',
          name: 'НДС',
          type: 'calculated',
          value: 0,
          required: true
        },
        {
          id: 'total',
          name: 'Итого',
          type: 'calculated',
          value: 0,
          required: true
        }
      ],
      layout: {
        position: 'middle',
        width: 'half',
        align: 'right'
      }
    },
    {
      id: 'terms',
      name: 'Условия поставки',
      type: 'custom',
      required: false,
      fields: [
        {
          id: 'delivery_terms',
          name: 'Срок поставки',
          type: 'text',
          value: '30 рабочих дней',
          required: false
        },
        {
          id: 'payment_terms',
          name: 'Условия оплаты',
          type: 'text',
          value: '50% предоплата, 50% при получении',
          required: false
        },
        {
          id: 'warranty',
          name: 'Гарантия',
          type: 'text',
          value: '24 месяца',
          required: false
        }
      ],
      layout: {
        position: 'bottom',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'footer',
      name: 'Подпись',
      type: 'footer',
      required: true,
      fields: [
        {
          id: 'manager_signature',
          name: 'Подпись менеджера',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'manager_name',
          name: 'ФИО менеджера',
          type: 'text',
          value: '',
          required: true
        }
      ],
      layout: {
        position: 'bottom',
        width: 'half',
        align: 'left'
      }
    }
  ]
};

// ШАБЛОН: СЧЕТ НА ОПЛАТУ
export const INVOICE_TEMPLATE: DocumentTemplate = {
  id: 'invoice',
  name: 'Счет на оплату',
  type: 'invoice',
  description: 'Счет для оплаты товаров и услуг',
  icon: '💰',
  role: 'complectator',
  format: 'pdf',
  sections: [
    {
      id: 'header',
      name: 'Шапка документа',
      type: 'header',
      required: true,
      fields: [
        {
          id: 'company_logo',
          name: 'Логотип компании',
          type: 'image',
          value: '',
          required: true
        },
        {
          id: 'company_name',
          name: 'Название компании',
          type: 'text',
          value: 'ООО "Домео"',
          required: true
        },
        {
          id: 'company_details',
          name: 'Реквизиты компании',
          type: 'text',
          value: 'ИНН: 1234567890, КПП: 123456789, ОГРН: 1234567890123',
          required: true
        },
        {
          id: 'bank_details',
          name: 'Банковские реквизиты',
          type: 'text',
          value: 'Банк: ПАО "Сбербанк", БИК: 044525225, р/с: 40702810123456789012',
          required: true
        },
        {
          id: 'document_title',
          name: 'Заголовок документа',
          type: 'text',
          value: 'СЧЕТ НА ОПЛАТУ',
          required: true
        },
        {
          id: 'document_number',
          name: 'Номер счета',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'document_date',
          name: 'Дата счета',
          type: 'date',
          value: new Date().toISOString().split('T')[0],
          required: true
        },
        {
          id: 'payment_due',
          name: 'Срок оплаты',
          type: 'date',
          value: '',
          required: true
        }
      ],
      layout: {
        position: 'top',
        width: 'full',
        align: 'center'
      }
    },
    {
      id: 'client_info',
      name: 'Информация о клиенте',
      type: 'client_info',
      required: true,
      fields: [
        {
          id: 'client_name',
          name: 'Название клиента',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'client_inn',
          name: 'ИНН клиента',
          type: 'text',
          value: '',
          required: false
        },
        {
          id: 'client_address',
          name: 'Адрес клиента',
          type: 'text',
          value: '',
          required: true
        }
      ],
      layout: {
        position: 'top',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'products',
      name: 'Список товаров',
      type: 'products',
      required: true,
      fields: [
        {
          id: 'products_table',
          name: 'Таблица товаров',
          type: 'table',
          value: {
            columns: [
              { id: 'name', name: 'Наименование', width: '40%' },
              { id: 'sku', name: 'Артикул', width: '15%' },
              { id: 'quantity', name: 'Кол-во', width: '10%' },
              { id: 'unit', name: 'Ед.', width: '5%' },
              { id: 'price', name: 'Цена', width: '15%' },
              { id: 'total', name: 'Сумма', width: '15%' }
            ],
            data: []
          },
          required: true
        }
      ],
      layout: {
        position: 'middle',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'pricing',
      name: 'Расчет стоимости',
      type: 'pricing',
      required: true,
      fields: [
        {
          id: 'subtotal',
          name: 'Стоимость товаров',
          type: 'calculated',
          value: 0,
          required: true
        },
        {
          id: 'tax_rate',
          name: 'Ставка НДС',
          type: 'number',
          value: 20,
          required: true
        },
        {
          id: 'tax_amount',
          name: 'Сумма НДС',
          type: 'calculated',
          value: 0,
          required: true
        },
        {
          id: 'total',
          name: 'К оплате',
          type: 'calculated',
          value: 0,
          required: true
        }
      ],
      layout: {
        position: 'middle',
        width: 'half',
        align: 'right'
      }
    },
    {
      id: 'payment_info',
      name: 'Информация об оплате',
      type: 'custom',
      required: true,
      fields: [
        {
          id: 'payment_purpose',
          name: 'Назначение платежа',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'payment_method',
          name: 'Способ оплаты',
          type: 'text',
          value: 'Банковский перевод',
          required: true
        }
      ],
      layout: {
        position: 'bottom',
        width: 'full',
        align: 'left'
      }
    }
  ]
};

// ШАБЛОН: ЗАКАЗ ПОСТАВЩИКУ
export const SUPPLIER_ORDER_TEMPLATE: DocumentTemplate = {
  id: 'supplier_order',
  name: 'Заказ поставщику',
  type: 'supplier_order',
  description: 'Заказ на производство товаров для поставщика',
  icon: '🏭',
  role: 'executor',
  format: 'excel',
  sections: [
    {
      id: 'header',
      name: 'Информация о заказе',
      type: 'header',
      required: true,
      fields: [
        {
          id: 'order_number',
          name: 'Номер заказа',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'order_date',
          name: 'Дата заказа',
          type: 'date',
          value: new Date().toISOString().split('T')[0],
          required: true
        },
        {
          id: 'delivery_date',
          name: 'Дата поставки',
          type: 'date',
          value: '',
          required: true
        },
        {
          id: 'supplier_name',
          name: 'Поставщик',
          type: 'text',
          value: '',
          required: true
        },
        {
          id: 'supplier_contact',
          name: 'Контакт поставщика',
          type: 'text',
          value: '',
          required: true
        }
      ],
      layout: {
        position: 'top',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'products',
      name: 'Список товаров для производства',
      type: 'products',
      required: true,
      fields: [
        {
          id: 'products_table',
          name: 'Таблица товаров',
          type: 'table',
          value: {
            columns: [
              { id: 'name', name: 'Наименование', width: '30%' },
              { id: 'sku', name: 'Артикул', width: '15%' },
              { id: 'specifications', name: 'Технические характеристики', width: '25%' },
              { id: 'quantity', name: 'Количество', width: '10%' },
              { id: 'material', name: 'Материал', width: '10%' },
              { id: 'color', name: 'Цвет', width: '10%' }
            ],
            data: []
          },
          required: true
        }
      ],
      layout: {
        position: 'middle',
        width: 'full',
        align: 'left'
      }
    },
    {
      id: 'production_requirements',
      name: 'Требования к производству',
      type: 'custom',
      required: true,
      fields: [
        {
          id: 'quality_standards',
          name: 'Стандарты качества',
          type: 'text',
          value: 'ГОСТ, ТУ',
          required: true
        },
        {
          id: 'packaging_requirements',
          name: 'Требования к упаковке',
          type: 'text',
          value: 'Защитная упаковка',
          required: true
        },
        {
          id: 'delivery_requirements',
          name: 'Требования к доставке',
          type: 'text',
          value: 'Аккуратная транспортировка',
          required: true
        }
      ],
      layout: {
        position: 'bottom',
        width: 'full',
        align: 'left'
      }
    }
  ]
};

// Все шаблоны документов
export const DOCUMENT_TEMPLATES = [
  QUOTE_TEMPLATE,
  INVOICE_TEMPLATE,
  SUPPLIER_ORDER_TEMPLATE
];

// Получение шаблона по типу
export function getTemplateByType(type: string): DocumentTemplate | undefined {
  return DOCUMENT_TEMPLATES.find(template => template.type === type);
}

// Получение шаблонов по роли
export function getTemplatesByRole(role: string): DocumentTemplate[] {
  return DOCUMENT_TEMPLATES.filter(template => template.role === role);
}



