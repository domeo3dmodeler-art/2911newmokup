// lib/documents/pdf-generator.ts
// Генератор PDF документов для КП, Счетов и других документов

export interface DocumentData {
  // Общие данные
  documentNumber: string;
  documentDate: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  
  // Данные компании
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyINN: string;
  companyKPP: string;
  companyBank: string;
  companyAccount: string;
  companyBIC: string;
  
  // Товары/услуги
  items: DocumentItem[];
  
  // Итоги
  subtotal: number;
  tax: number;
  total: number;
  
  // Дополнительные поля
  notes?: string;
  validUntil?: string;
  paymentTerms?: string;
}

export interface DocumentItem {
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
  sku?: string;
}

export class PDFGenerator {
  private static instance: PDFGenerator;
  
  public static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator();
    }
    return PDFGenerator.instance;
  }

  // Генерация Коммерческого предложения (КП)
  async generateCommercialProposal(data: DocumentData): Promise<Buffer> {
    const html = this.generateKPHTML(data);
    return this.convertHTMLToPDF(html);
  }

  // Генерация Счета
  async generateInvoice(data: DocumentData): Promise<Buffer> {
    const html = this.generateInvoiceHTML(data);
    return this.convertHTMLToPDF(html);
  }

  // Генерация Заказа поставщику
  async generateSupplierOrder(data: DocumentData): Promise<Buffer> {
    const html = this.generateOrderHTML(data);
    return this.convertHTMLToPDF(html);
  }

  private generateKPHTML(data: DocumentData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Коммерческое предложение ${data.documentNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .client-info { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .totals { text-align: right; margin-top: 20px; }
        .notes { margin-top: 30px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
        <p>№ ${data.documentNumber} от ${data.documentDate}</p>
    </div>
    
    <div class="company-info">
        <h3>Поставщик:</h3>
        <p><strong>${data.companyName}</strong></p>
        <p>Адрес: ${data.companyAddress}</p>
        <p>Телефон: ${data.companyPhone} | Email: ${data.companyEmail}</p>
        <p>ИНН: ${data.companyINN} | КПП: ${data.companyKPP}</p>
        <p>Банк: ${data.companyBank}</p>
        <p>Р/с: ${data.companyAccount} | БИК: ${data.companyBIC}</p>
    </div>
    
    <div class="client-info">
        <h3>Покупатель:</h3>
        <p><strong>${data.clientName}</strong></p>
        ${data.clientAddress ? `<p>Адрес: ${data.clientAddress}</p>` : ''}
        ${data.clientPhone ? `<p>Телефон: ${data.clientPhone}</p>` : ''}
        ${data.clientEmail ? `<p>Email: ${data.clientEmail}</p>` : ''}
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>№</th>
                <th>Наименование</th>
                <th>Описание</th>
                <th>Кол-во</th>
                <th>Ед.</th>
                <th>Цена</th>
                <th>Сумма</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${item.price.toLocaleString('ru-RU')} ₽</td>
                    <td>${item.total.toLocaleString('ru-RU')} ₽</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <p><strong>Итого: ${data.total.toLocaleString('ru-RU')} ₽</strong></p>
    </div>
    
    ${data.validUntil ? `<div class="notes"><p><strong>Действительно до: ${data.validUntil}</strong></p></div>` : ''}
    
    ${data.notes ? `<div class="notes"><p><strong>Примечания:</strong> ${data.notes}</p></div>` : ''}
    
    <div class="footer">
        <p>Документ сформирован автоматически системой Domeo</p>
    </div>
</body>
</html>`;
  }

  private generateInvoiceHTML(data: DocumentData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Счет ${data.documentNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-info { margin-bottom: 20px; }
        .client-info { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .totals { text-align: right; margin-top: 20px; }
        .payment-info { margin-top: 30px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>СЧЕТ НА ОПЛАТУ</h1>
        <p>№ ${data.documentNumber} от ${data.documentDate}</p>
    </div>
    
    <div class="company-info">
        <h3>Поставщик:</h3>
        <p><strong>${data.companyName}</strong></p>
        <p>Адрес: ${data.companyAddress}</p>
        <p>Телефон: ${data.companyPhone} | Email: ${data.companyEmail}</p>
        <p>ИНН: ${data.companyINN} | КПП: ${data.companyKPP}</p>
        <p>Банк: ${data.companyBank}</p>
        <p>Р/с: ${data.companyAccount} | БИК: ${data.companyBIC}</p>
    </div>
    
    <div class="client-info">
        <h3>Покупатель:</h3>
        <p><strong>${data.clientName}</strong></p>
        ${data.clientAddress ? `<p>Адрес: ${data.clientAddress}</p>` : ''}
        ${data.clientPhone ? `<p>Телефон: ${data.clientPhone}</p>` : ''}
        ${data.clientEmail ? `<p>Email: ${data.clientEmail}</p>` : ''}
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>№</th>
                <th>Наименование</th>
                <th>Описание</th>
                <th>Кол-во</th>
                <th>Ед.</th>
                <th>Цена</th>
                <th>Сумма</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${item.price.toLocaleString('ru-RU')} ₽</td>
                    <td>${item.total.toLocaleString('ru-RU')} ₽</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <p>Сумма без НДС: ${data.subtotal.toLocaleString('ru-RU')} ₽</p>
        <p>НДС: ${data.tax.toLocaleString('ru-RU')} ₽</p>
        <p><strong>Всего к доплате: ${data.total.toLocaleString('ru-RU')} ₽</strong></p>
    </div>
    
    <div class="payment-info">
        <h3>Реквизиты для оплаты:</h3>
        <p>Получатель: ${data.companyName}</p>
        <p>ИНН: ${data.companyINN} | КПП: ${data.companyKPP}</p>
        <p>Банк: ${data.companyBank}</p>
        <p>Р/с: ${data.companyAccount} | БИК: ${data.companyBIC}</p>
        <p>Назначение платежа: Оплата по счету № ${data.documentNumber}</p>
    </div>
    
    ${data.paymentTerms ? `<div class="notes"><p><strong>Условия оплаты:</strong> ${data.paymentTerms}</p></div>` : ''}
    
    <div class="footer">
        <p>Документ сформирован автоматически системой Domeo</p>
    </div>
</body>
</html>`;
  }

  private generateOrderHTML(data: DocumentData): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Заказ поставщику ${data.documentNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .supplier-info { margin-bottom: 20px; }
        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .items-table th { background-color: #f2f2f2; }
        .totals { text-align: right; margin-top: 20px; }
        .delivery-info { margin-top: 30px; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>ЗАКАЗ ПОСТАВЩИКУ</h1>
        <p>№ ${data.documentNumber} от ${data.documentDate}</p>
    </div>
    
    <div class="supplier-info">
        <h3>Поставщик:</h3>
        <p><strong>${data.clientName}</strong></p>
        ${data.clientAddress ? `<p>Адрес: ${data.clientAddress}</p>` : ''}
        ${data.clientPhone ? `<p>Телефон: ${data.clientPhone}</p>` : ''}
        ${data.clientEmail ? `<p>Email: ${data.clientEmail}</p>` : ''}
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>№</th>
                <th>Артикул</th>
                <th>Наименование</th>
                <th>Описание</th>
                <th>Кол-во</th>
                <th>Ед.</th>
                <th>Цена</th>
                <th>Сумма</th>
            </tr>
        </thead>
        <tbody>
            ${data.items.map((item, index) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.sku || ''}</td>
                    <td>${item.name}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit}</td>
                    <td>${item.price.toLocaleString('ru-RU')} ₽</td>
                    <td>${item.total.toLocaleString('ru-RU')} ₽</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <p><strong>Итого: ${data.total.toLocaleString('ru-RU')} ₽</strong></p>
    </div>
    
    <div class="delivery-info">
        <h3>Условия поставки:</h3>
        <p>Адрес доставки: ${data.companyAddress}</p>
        <p>Контактное лицо: ${data.companyPhone}</p>
        ${data.paymentTerms ? `<p>Условия оплаты: ${data.paymentTerms}</p>` : ''}
    </div>
    
    ${data.notes ? `<div class="notes"><p><strong>Примечания:</strong> ${data.notes}</p></div>` : ''}
    
    <div class="footer">
        <p>Документ сформирован автоматически системой Domeo</p>
    </div>
</body>
</html>`;
  }

  private async convertHTMLToPDF(html: string): Promise<Buffer> {
    // В реальной реализации здесь будет использоваться puppeteer или аналогичная библиотека
    // Пока возвращаем заглушку
    return Buffer.from('PDF content would be here');
  }
}



