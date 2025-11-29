// lib/export/adapters/doors.ts
// Адаптер для экспорта дверей

export interface DoorExportData {
  id: string;
  name: string;
  price: number;
  category: string;
  properties: Record<string, any>;
}

export class DoorsExportAdapter {
  static async exportDoors(data: DoorExportData[]): Promise<Buffer> {
    // Простая реализация для экспорта дверей
    const csvData = data.map(door => ({
      id: door.id,
      name: door.name,
      price: door.price,
      category: door.category,
      properties: JSON.stringify(door.properties)
    }));

    // Возвращаем пустой буфер для совместимости
    return Buffer.from('doors export placeholder');
  }

  static async exportDoorsToExcel(data: DoorExportData[]): Promise<Buffer> {
    // Простая реализация для экспорта дверей в Excel
    return Buffer.from('doors excel export placeholder');
  }
}

// Экспорт адаптера для совместимости
export const doorsExportAdapter = DoorsExportAdapter;

