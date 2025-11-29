// lib/documents/deduplication-client.ts
// Клиентские функции дедубликации (без Prisma)

// Нормализация items для сравнения
export function normalizeItems(items: any[]): any[] {
  return items.map(item => {
    const normalized: any = {
      type: String(item.type || 'door').toLowerCase(),
      style: String(item.style || '').toLowerCase().trim(),
      model: String(item.model || item.name || '').toLowerCase().trim(),
      finish: String(item.finish || '').toLowerCase().trim(),
      color: String(item.color || '').toLowerCase().trim(),
      width: Number(item.width || 0),
      height: Number(item.height || 0),
      quantity: Number(item.qty || item.quantity || 1),
      unitPrice: Number(item.unitPrice || item.price || 0),
      hardwareKitId: String(item.hardwareKitId || '').trim(),
      handleId: String(item.handleId || '').trim(),
      sku_1c: String(item.sku_1c || '').trim()
    };
    
    // Для ручек - сравниваем только handleId и quantity
    if (normalized.type === 'handle' || item.handleId) {
      return {
        type: 'handle',
        handleId: normalized.handleId,
        quantity: normalized.quantity,
        unitPrice: normalized.unitPrice
      };
    }
    
    return normalized;
  }).sort((a, b) => {
    const keyA = `${a.type}:${(a.handleId || a.model || '')}:${a.finish}:${a.color}:${a.width}:${a.height}:${a.hardwareKitId}`;
    const keyB = `${b.type}:${(b.handleId || b.model || '')}:${b.finish}:${b.color}:${b.width}:${b.height}:${b.hardwareKitId}`;
    return keyA.localeCompare(keyB);
  });
}

// Сравнение содержимого корзины (клиентская версия)
export function compareCartContent(items1: any[], items2String: string | null): boolean {
  try {
    if (!items2String) return false;
    
    const normalized1 = normalizeItems(items1);
    const parsed2 = JSON.parse(items2String);
    
    // cart_data может быть объектом { items: [...], total_amount: ... } или массивом
    const items2 = Array.isArray(parsed2) ? parsed2 : (parsed2.items || []);
    const normalized2 = normalizeItems(items2);
    
    if (normalized1.length !== normalized2.length) {
      return false;
    }
    
    for (let i = 0; i < normalized1.length; i++) {
      const item1 = normalized1[i];
      const item2 = normalized2[i];
      
      if (item1.type === 'handle' || item2.type === 'handle') {
        if (item1.type !== item2.type ||
            item1.handleId !== item2.handleId ||
            item1.quantity !== item2.quantity ||
            Math.abs(item1.unitPrice - item2.unitPrice) > 0.01) {
          return false;
        }
        continue;
      }
      
      if (item1.type !== item2.type || 
          item1.style !== item2.style ||
          item1.model !== item2.model ||
          item1.finish !== item2.finish ||
          item1.color !== item2.color ||
          item1.width !== item2.width ||
          item1.height !== item2.height ||
          item1.hardwareKitId !== item2.hardwareKitId ||
          item1.handleId !== item2.handleId ||
          item1.quantity !== item2.quantity ||
          Math.abs(item1.unitPrice - item2.unitPrice) > 0.01) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

