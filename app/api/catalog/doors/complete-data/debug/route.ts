/**
 * Диагностика: сколько цветов (PropertyPhoto) по каждой модели дверей.
 * GET /api/catalog/doors/complete-data/debug
 * Если по каждой модели 1–2 записи — на staging нужно синхронизировать БД (PropertyPhoto).
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getDoorsCategoryId } from '@/lib/catalog-categories';
import { DOOR_COLOR_PROPERTY } from '@/lib/property-photos';

export async function GET() {
  try {
    const categoryId = await getDoorsCategoryId();
    if (!categoryId) {
      return NextResponse.json({ ok: false, error: 'Категория дверей не найдена' }, { status: 404 });
    }

    const rows = await prisma.propertyPhoto.findMany({
      where: { categoryId, propertyName: DOOR_COLOR_PROPERTY },
      select: { propertyValue: true },
    });

    const byModel = new Map<string, { total: number; colors: Set<string> }>();
    for (const r of rows) {
      const v = String(r.propertyValue ?? '').trim();
      const parts = v.split('|');
      const modelKey = parts[0]?.trim() || '—';
      const finish = parts[1]?.trim() || '';
      const color = parts[2]?.trim() || parts[1]?.trim() || '';
      const colorKey = `${finish}|${color}`;

      if (!byModel.has(modelKey)) {
        byModel.set(modelKey, { total: 0, colors: new Set() });
      }
      const entry = byModel.get(modelKey)!;
      entry.total += 1;
      if (colorKey) entry.colors.add(colorKey);
    }

    const stats = Array.from(byModel.entries())
      .map(([model, { total, colors }]) => ({ model, total, uniqueColors: colors.size }))
      .sort((a, b) => b.uniqueColors - a.uniqueColors)
      .slice(0, 30);

    const totalRows = rows.length;
    const totalModels = byModel.size;

    return NextResponse.json({
      ok: true,
      totalPropertyPhotoRows: totalRows,
      totalModelsWithColors: totalModels,
      sample: stats,
      hint: totalRows < 100 ? 'Мало записей PropertyPhoto — выполните полную синхронизацию БД на staging (sync-staging-full) или импорт привязки цветов.' : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
