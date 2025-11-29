// Mock data for development without database
export const mockDoorsData = {
  models: [
    { model: "Современная", style: "Современная", photo: null },
    { model: "Классика", style: "Классика", photo: null },
    { model: "Неоклассика", style: "Неоклассика", photo: null },
    { model: "Скрытая", style: "Скрытая", photo: null },
  ],
  options: [
    { name: "Ручка золотая", type: "handle", price: 1500 },
    { name: "Ручка серебряная", type: "handle", price: 1200 },
    { name: "Замок врезной", type: "lock", price: 2500 },
    { name: "Петли скрытые", type: "hinge", price: 800 },
  ],
  catalog: [
    { sku: "DOOR-001", series: "Современная", material: "Нанотекс", finish: "Нанотекс", width_mm: 800, height_mm: 2000, color: "Белый", price_rrc: 15000 },
    { sku: "DOOR-002", series: "Классика", material: "Эмаль", finish: "Эмаль", width_mm: 800, height_mm: 2000, color: "Дуб", price_rrc: 18000 },
    { sku: "DOOR-003", series: "Неоклассика", material: "Эмаль", finish: "Эмаль", width_mm: 900, height_mm: 2000, color: "Слоновая кость", price_rrc: 20000 },
    { sku: "DOOR-004", series: "Скрытая", material: "Нанотекс", finish: "Нанотекс", width_mm: 800, height_mm: 2000, color: "Черный", price_rrc: 16000 },
  ],
  kits: [
    { id: "KIT_STD", name: "Базовый комплект", group: 1, price_rrc: 5000 },
    { id: "KIT_SOFT", name: "SoftClose", group: 2, price_rrc: 2400 },
  ],
  handles: [
    { id: "HNDL_PRO", name: "Pro", supplier_name: "HandleCo", supplier_sku: "H-PRO", price_opt: 900, price_rrc: 1200, price_group_multiplier: 1.15 },
    { id: "HNDL_SIL", name: "Silver", supplier_name: "HandleCo", supplier_sku: "H-SIL", price_opt: 1100, price_rrc: 1400, price_group_multiplier: 1.15 },
  ]
};
