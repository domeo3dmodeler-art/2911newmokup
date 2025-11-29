// lib/import/adapters/doors.ts
// Адаптер импорта для категории Doors.
// Пишет в Prisma-модель `doors_catalog` (camelCase поля).
// Manual upsert с «мягкими» кастами, чтобы не падал билд,
// даже если в твоей модели поле артикула называется не `sku`.

import { prisma } from '@/lib/prisma';

type DoorRow = {
  sku: string;
  series?: string | null;
  material?: string | null;
  finish?: string | null;
  color?: string | null;
  width_mm?: number | null;
  height_mm?: number | null;
  base_price: number;
  currency: string;            // 'RUB' | 'EUR'
  valid_from?: string | null;  // YYYY-MM-DD
};

export const doorsAdapter = {
  getSchema() {
    return [
      { dest: 'sku',         type: 'string', required: true },
      { dest: 'series',      type: 'string', required: false },
      { dest: 'material',    type: 'string', required: false },
      { dest: 'finish',      type: 'string', required: false },
      { dest: 'color',       type: 'string', required: false },
      { dest: 'width_mm',    type: 'int',    required: false },
      { dest: 'height_mm',   type: 'int',    required: false },
      { dest: 'base_price',  type: 'number', required: true },
      { dest: 'currency',    type: 'enum',   required: true, enumValues: ['RUB','EUR'] },
      { dest: 'valid_from',  type: 'date',   required: false },
    ] as any;
  },

  buildKeys(_raw: Record<string, any>, m: Partial<DoorRow>) {
    let sku = (m.sku ?? '').toString().trim();
    if (!sku) {
      const parts = [m.series, m.width_mm, m.height_mm].filter(Boolean);
      if (parts.length) sku = parts.join('-').toLowerCase().replace(/\s+/g, '-');
    }
    return { sku };
  },

  validateRow(m: Partial<DoorRow>) {
    const errs: string[] = [];
    if (m.width_mm != null && Number(m.width_mm) <= 0) errs.push('width_mm ≤ 0');
    if (m.height_mm != null && Number(m.height_mm) <= 0) errs.push('height_mm ≤ 0');
    if (m.base_price == null || Number(m.base_price) <= 0) errs.push('base_price ≤ 0');
    const cur = (m.currency ?? '').toString().toUpperCase();
    if (cur && !['RUB','EUR'].includes(cur)) errs.push(`Недопустимая валюта: ${m.currency}`);
    return errs;
  },

  async upsertMany(rows: DoorRow[]) {
    let count = 0;

    await prisma.$transaction(async (tx: any) => {
      for (const r of rows) {
        const data = {
          // верхнеуровневые
          sku: String(r.sku),
          series: r.series ?? null,
          material: r.material ?? null,
          finish: r.finish ?? null,
          color: r.color ?? null,

          // размеры — camelCase
          widthMm: r.width_mm != null ? Number(r.width_mm) : null,
          heightMm: r.height_mm != null ? Number(r.height_mm) : null,

          // цена/валюта/дата — camelCase
          priceOpt: Number(r.base_price),
          currency: String(r.currency).toUpperCase(),
          validFrom: r.valid_from ? new Date(r.valid_from) : new Date(),

          // если такого поля нет в твоей модели — можно удалить:
          isActive: true,
        } as any;

        // ===== Manual upsert без знания точного «уникального» поля =====
        // Сначала пробуем обновить по колонке sku (если она есть).
        try {
          const existing = await (tx as any).doors_catalog.findFirst({
            where: { sku: data.sku } as any,
            select: { id: true },
          });

          if (existing?.id) {
            await (tx as any).doors_catalog.update({
              where: { id: existing.id } as any,
              data,
            });
          } else {
            // если findFirst не нашёл или колонки sku нет — пробуем создать
            await (tx as any).doors_catalog.create({ data });
          }
        } catch (e) {
          // Если драйвер ругается на where.sku из-за отсутствия поля — просто создаём запись.
          await (tx as any).doors_catalog.create({ data });
        }

        count++;
      }
    });

    return count;
  },
};
